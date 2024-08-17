import { isMainThread, parentPort, Worker } from "worker_threads";
import { DirTree, FNode } from "../types";
import { readFileSync } from "fs";
import { deflateSync } from "zlib";

/**
 * Compressed block header format:
 * uint32 num_files
 * uint32 file1_start
 * uint32 file2_start
 * ...
 * uint32 fileN_start
 */

/**
 * Chunk header format:
 * uint32 num_hashes
 * 
 * (40 bytes per hash)
 * byte[32] hash1
 * uint32 bundle1
 * uint32 index1
 */

/**
 * Dir Tree format:
 * 
 * uint32 numNodes
 * uint32 tableSize
 * 
 * (41+ bytes per node)
 * uint8 isFile
 * char[32] hash
 * uint32 nameLen
 * char[nameLen] name
 * uint32 numChildren
 * uint32 children[numChildren]
 */


type WatcherMessage = {
  paths: string[];
  id: number;
}

type WorkerMessage = {
  result: Buffer;
  id: number;
}


const WORKER_THREAD_MAX = 16;
const CHUNK_SIZE_MB = 1;

/**
 * Compresses ALL files in a directory tree into a single binary blob
 * @param {DirTree} tree tree to compress
 * @returns {Promise<Buffer>} compressed files
 */
export async function compressFileNodes(tree: DirTree): Promise<Buffer> {
  const seenHashes = new Map<string, string>();

  //create chunks
  const toCompress: FNode[] = [];

  for (const node of tree) {
    if (node.isFile) {
      //if the file is already in the set, skip it
      if (seenHashes.has(node.hash!)) {
        //double check the discriminator. The chance of this is astronomically low, but it's better to be safe than sorry
        if (seenHashes.get(node.hash!) !== node.discriminator) {
          throw new Error(`Hash collision detected! ${node.hash}`);
        }

        continue;
      }
      seenHashes.set(node.hash!, node.discriminator!);
      toCompress.push(node);
    }
  }

  return packFiles(toCompress);
}

/**
 * Encodes a directory tree into a binary blob
 * @param {DirTree} tree tree to encode
 * @returns {Buffer} encoded tree
 */
function encodeDirTree(tree: DirTree): Buffer {
  //first pass: calculate the size of each node
  const nodeSizes: number[] = [];

  for (const node of tree) {
    const { name, children } = node;

    //size of the name
    const nameSize = Buffer.byteLength(name, 'utf-8');

    //each node is 41 bytes + name size + 4 * numChildren
    nodeSizes.push(41 + nameSize + 4 * children.length);
  }

  //second pass: compute offsets for each node
  let currentOffset = 8; //skip the first 8 bytes for the header
  const nodeOffsets: number[] = [currentOffset];
  for (let i = 0; i < nodeSizes.length; i++) {
    currentOffset += nodeSizes[i];
    nodeOffsets.push(currentOffset);
  }

  //third pass: start writing the nodes
  const buffer = Buffer.allocUnsafe(currentOffset); //now currentOffset is the size of the buffer

  //write the number of nodes
  buffer.writeUInt32LE(tree.length, 0);

  //write the table size
  buffer.writeUInt32LE(nodeOffsets.length, 4);

  //write the nodes
  let offset = 8;
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    const { isFile, hash, name, children } = node;

    //write the file flag
    buffer.writeUInt8(isFile ? 1 : 0, offset);
    offset += 1;

    //write the hash
    Buffer.from(hash!, "hex").copy(buffer, offset);
    offset += 32;

    //write the name
    buffer.writeUInt32LE(name.length, offset);
    offset += 4;
    buffer.write(name, offset, name.length, "utf-8");
    offset += name.length;

    //write the number of children
    buffer.writeUInt32LE(children.length, offset);
    offset += 4;

    //write the children
    for (const child of children) {
      buffer.writeUInt32LE(nodeOffsets[child], offset);
      offset += 4;
    }
  }

  return buffer;
}

/**
 * Packs provided files into a binary blob
 * @param {FNode[]} files files to pack
 * @returns {Promise<Buffer>} compressed files
 */
async function packFiles(files: FNode[]): Promise<Buffer> {

  //create chunks
  const chunks: string[][] = [];
  let chunk: string[] = [];
  const chunkHashes: string[][] = [];
  let chunkHash: string[] = [];
  let currentChunkSize = 0;

  for (const node of files) {
    //if the file is bigger than one chunk, it is its own chunk
    if (node.size! > CHUNK_SIZE_MB * 1024 * 1024) {
      chunks.push([node.fsPath!]);
      chunkHashes.push([node.hash!]);
      continue;
    }

    //if the file fits in the chunk, add it
    if (currentChunkSize + node.size! <= CHUNK_SIZE_MB * 1024 * 1024) {
      chunk.push(node.fsPath!);
      chunkHash.push(node.hash!);
      currentChunkSize += node.size!;
    } else {
      //otherwise, start a new chunk
      chunks.push(chunk);
      chunkHashes.push(chunkHash);
      chunkHash = [node.hash!];
      chunk = [node.fsPath!];
      currentChunkSize = node.size!;
    }
  }

  //flush the last chunk
  chunks.push(chunk);
  chunkHashes.push(chunkHash);

  //spin up workers
  const workers: Worker[] = [];
  for (let i = 0; i < WORKER_THREAD_MAX; i++) {
    workers.push(new Worker(__filename));
  }

  //work through the chunks using worker pool
  const compressedChunks: Buffer[] = [];
  let nextId = 0;

  //assign the initial batch
  for (const worker of workers) {
    const message: WatcherMessage = { paths: chunks[nextId], id: nextId++ };
    worker.postMessage(message);
  }

  //when a worker finishes, assign it a new chunk
  for (const worker of workers) {
    worker.on("message", (msg: WorkerMessage) => {
      compressedChunks[msg.id] = msg.result;

      if (nextId < chunks.length) {
        const message: WatcherMessage = { paths: chunks[nextId], id: nextId++ };
        worker.postMessage(message);
      } else {
        worker.terminate();
      }
    });
  }

  //wait for all workers to finish
  await Promise.all(workers.map(worker => new Promise<void>((resolve) => { worker.on("exit", resolve); })));

  const treeHeader = encodeDirTree(files);

  const header = createChunkHeader(chunkHashes);

  return Buffer.concat([treeHeader, header, ...compressedChunks]);
}

/**
 * Generates a chunk header for a set of chunk hashes
 * @param {string[][]} chunkHashes hashes of the chunks
 * @returns {Buffer} chunk header
 */
function createChunkHeader(chunkHashes: string[][]): Buffer {
  //to enable binary searching, we need to sort the hashes

  //transform the hashes into different forms and note thier positions
  const hashData: { hash: string, index: number, bundle: number }[] = [];
  for (let i = 0; i < chunkHashes.length; i++) {
    for (let j = 0; j < chunkHashes[i].length; j++) {
      hashData.push({ hash: chunkHashes[i][j], index: j, bundle: i });
    }
  }

  //sort the hashes (these are hex strings, so we can just use the default sort)
  hashData.sort((a, b) => a.hash < b.hash ? -1 : 1);

  const bufferSize = (32 + 4 + 4) * hashData.length + 4;
  const buffer = Buffer.allocUnsafe(bufferSize);

  //write the number of hashes
  buffer.writeUInt32LE(hashData.length, 0);

  //write the hashes
  let offset = 4;
  for (const hash of hashData) {
    //write the raw hash data (convert hex to binary)
    const hashBuffer = Buffer.from(hash.hash, "hex");
    hashBuffer.copy(buffer, offset);
    offset += 32;
    buffer.writeUInt32LE(hash.bundle, offset);
    offset += 4;
    buffer.writeUInt32LE(hash.index, offset);
    offset += 4;
  }

  return buffer;
}


/**
 * Compresses an array of files into separate blobs
 * @param {string[]} paths paths to file  s
 * @returns {Buffer} compressed files
 */
function _compressFiles(paths: string[]): Buffer {
  const contents = paths.map(path => readFileSync(path));
  const compressed = contents.map(contents => deflateSync(contents));

  //write chunk header
  const headerSize = 4 * paths.length + 4;
  const outbuffer = Buffer.allocUnsafe(headerSize);
  outbuffer.writeUInt32LE(paths.length, 0);
  let offset = 4;
  let fileOffset = headerSize;
  for (const file of compressed) {
    outbuffer.writeUInt32LE(fileOffset, offset);
    offset += 4;
    fileOffset += file.length;
  }

  //write chunks
  return Buffer.concat([outbuffer, ...compressed]);
}

if (!isMainThread) {
  parentPort!.on("message", (msg: WatcherMessage) => {
    parentPort!.postMessage({ result: _compressFiles(msg.paths), id: msg.id });
  });
}
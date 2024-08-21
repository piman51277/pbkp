import { inflateSync } from "zlib";
import { DirTree, FNode } from "../types";

type DecodedHashEntry = {
  hash: string;
  bundle: number;
  index: number;
}

type BlockEntry = {
  decoded: boolean;
  data: Buffer;
  header: Buffer;
}

class DecodedBuffers {
  dirTree: DirTree;
  hashTable: DecodedHashEntry[];
  blocks: BlockEntry[];

  constructor(dirTree: DirTree, hashTable: DecodedHashEntry[], blocks: BlockEntry[]) {
    this.dirTree = dirTree;
    this.hashTable = hashTable;
    this.blocks = blocks;
  }

  getFileByHash(hash: string): Buffer | null {
    //binary search the hash table
    let left = 0;
    let right = this.hashTable.length - 1;
    let block = -1;
    let index = -1;
    while (left <= right) {
      const mid = left + Math.floor((right - left) / 2);
      const midHash = this.hashTable[mid].hash;
      if (midHash === hash) {
        block = this.hashTable[mid].bundle;
        index = this.hashTable[mid].index;
        break;
      } else if (midHash < hash) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    //if we didn't find the hash, return null
    if (block === -1) {
      return null;
    }

    //get the block
    const blockEntry = this.blocks[block];

    //if not already decoded, decode it
    if (!blockEntry.decoded) {
      blockEntry.data = inflateSync(blockEntry.data);
      blockEntry.decoded = true;
    }

    const numFilesInBlock = blockEntry.header.readUInt32LE(0);
    const fileStart = blockEntry.header.readUInt32LE(4 + index * 4);
    const fileEnd = index === numFilesInBlock - 1 ? blockEntry.header.length : blockEntry.header.readUInt32LE(4 + (index + 1) * 4);

    return blockEntry.data.subarray(fileStart, fileEnd);
  }
}

/**
 * Interprets a directory tree node from a buffer
 * @param {Buffer} buf source buffer
 * @param {number} offset offset to start reading from
 * @returns {FNode} directory tree node
 */
function processDirTreeNode(buf: Buffer, offset: number): FNode {
  const node: FNode = {
    id: offset,
    isFile: false,
    relPath: null,
    hash: "",
    name: "",
    children: []
  };
  node.isFile = buf.readUInt8(offset) === 1;
  offset += 1;
  node.hash = buf.subarray(offset, offset + 32).toString("hex");
  offset += 32;
  const nameLength = buf.readUInt32LE(offset);
  offset += 4;
  node.name = buf.subarray(offset, offset + nameLength).toString();
  offset += nameLength;
  const numChildren = buf.readUInt32LE(offset);
  offset += 4;
  node.children = [];
  for (let i = 0; i < numChildren; i++) {
    node.children.push(buf.readUInt32LE(offset));
    offset += 4;
  }

  return node;
}


/**
 * Parses a directory tree from a buffer
 * @param {Buffer} buf source buffer
 * @returns {DirTree} directory tree
 */
function parseDirTree(buf: Buffer): DirTree {
  let lastID = 0;
  const idMapping: Record<number, number> = {};
  const numEntries = buf.readUInt32LE(0);

  const processed: DirTree = [];
  const queue: FNode[] = [processDirTreeNode(buf, 8)];

  while (queue.length > 0) {
    const current = queue.shift()!;

    //assign a numerical ID to the node for later replacement
    idMapping[current.id] = lastID;
    lastID++;

    //read the children and push them to the queue
    for (const childID of current.children) {
      const child = processDirTreeNode(buf, childID);
      queue.push(child);
    }

    //push parent to the processed list
    processed.push(current);
  }

  //replace IDs with numerical IDs
  for (const node of processed) {
    node.id = idMapping[node.id];
    node.children = node.children.map((id) => idMapping[id]);
  }

  //double check, do we have the right number of entries?
  if (processed.length !== numEntries) {
    throw new Error(`Expected ${numEntries} entries, got ${processed.length}`);
  }

  return processed;
}


/**
 * Parses a hash table from a buffer
 * @param {Buffer} buf source buffer
 * @returns {DecodedHashEntry[]} hash table
 */
function parseHashTable(buf: Buffer): DecodedHashEntry[] {
  const numEntries = buf.readUInt32LE(0);
  const entries: DecodedHashEntry[] = [];

  for (let i = 0; i < numEntries; i++) {
    const offset = 4 + i * 40;
    const hash = buf.subarray(offset, offset + 32).toString("hex");
    const bundle = buf.readUInt32LE(offset + 32);
    const index = buf.readUInt32LE(offset + 36);
    entries.push({ hash, bundle, index });
  }

  return entries;
}

/**
 * Parses a bundle table from a buffer
 * @param {Buffer} buf source buffer
 * @returns {number[]} bundle table
 */
function parseBundleTable(buf: Buffer): number[] {
  const numEntries = buf.readUInt32LE(0);
  const entries: number[] = [];

  for (let i = 0; i < numEntries; i++) {
    entries.push(buf.readUInt32LE(4 + i * 4));
  }

  return entries;
}


/**
 * Parses a packed file into its components
 * @param {Buffer} buf packed file
 * @returns {DecodedBuffers} unpacked buffers
 */
export function unpackFiles(buf: Buffer): DecodedBuffers {
  //the second uint32 tells us how big the tree is
  const treeBytes = buf.readUInt32LE(4);

  //after that, we get the # of hashes
  const hashTableHeaderOffset = treeBytes;
  const hashCount = buf.readUInt32LE(hashTableHeaderOffset);

  //each hash is 40 bytes long, after the bundle header starts
  const bundleHeaderOffset = hashTableHeaderOffset + 4 + hashCount * 40;
  const numBundles = buf.readUInt32LE(bundleHeaderOffset);

  //each bundle header is 4 bytes long
  const blobsOffset = bundleHeaderOffset + 4 + numBundles * 4;

  const dirTreeBlob = buf.subarray(0, treeBytes);
  const hashTableBlob = buf.subarray(hashTableHeaderOffset, bundleHeaderOffset);
  const bundleTableBlob = buf.subarray(bundleHeaderOffset, blobsOffset);
  const blobs = buf.subarray(blobsOffset);

  const dirTree = parseDirTree(dirTreeBlob);
  const hashTable = parseHashTable(hashTableBlob);
  const bundleTable = parseBundleTable(bundleTableBlob);

  //use the bundle table to split the blobs
  const blocks: BlockEntry[] = [];
  for (let i = 0; i < bundleTable.length; i++) {
    const start = bundleTable[i];
    const end = i === bundleTable.length - 1 ? blobs.length : bundleTable[i + 1];

    //get the header size
    const headerEntries = blobs.readUInt32LE(start);
    const headerSize = 4 + headerEntries * 4;
    const header = blobs.subarray(start, start + headerSize);
    const data = blobs.subarray(start + headerSize, end);

    blocks.push({ decoded: false, header, data });
  }

  return new DecodedBuffers(dirTree, hashTable, blocks);
}
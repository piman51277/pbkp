import { readFileSync } from "fs";
import { DirTree, FNode } from "../types";
import { createHash } from "crypto";
import { isMainThread, parentPort, Worker, workerData } from "worker_threads";

/**
 * Hashes the contents of a file
 * @param {string} path path to file
 * @returns {[string, string]} [hash of file, first 32 bytes, utf-8]
 */
function hashFile(path: string): [string, string] {
  const contents = readFileSync(path);
  const hash = createHash("sha256");
  hash.update(contents);
  return [hash.digest("base64"), contents.toString("utf8", 0, 32)];
}

/**
 * Hashes the contents of a directory
 * @param {FNode} node node to hash
 * @param {DirTree} tree tree to reference
 * @returns {string} hash of directory
 */
function hashDirectory(node: FNode, tree: DirTree): string {
  const hash = createHash("sha256");
  for (const child of node.children) {
    hash.update(tree[child].hash as string);
  }
  return hash.digest("base64");
}

/**
 * Populates the hash field of all nodes in the tree
 * @param {DirTree} tree tree to hash
 * @returns {DirTree} tree with hash field populated
 */
export async function hashNodes(tree: DirTree): Promise<DirTree> {
  //first pass: populate only files

  //multithreading 4x so we are constrained by disk IO
  let chunks: DirTree[] = [];
  const chunkSize = Math.ceil(tree.length / 4);
  for (let i = 0; i < 4; i++) {
    chunks.push(tree.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  //hash all files in parallel
  if (isMainThread) {
    //spawn 4 workers
    const promises = chunks.map((chunk) => {
      return new Promise<DirTree>((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: chunk,
        });
        worker.on("message", resolve);
        worker.on("error", reject);
      });
    });
    chunks = await Promise.all(promises);
  }

  //recombine the chunks
  tree = chunks.reduce((acc, chunk) => acc.concat(chunk), []);

  //second pass: populate directories

  //navigate the tree and find nodes by depth (BFS)
  const hashQueue: number[] = [0]; //0 is root
  const searchQueue: number[] = [0];

  while (searchQueue.length > 0) {
    const { children } = tree[searchQueue.shift() as number];

    for (const child of children) {
      if (!tree[child].isFile) {
        hashQueue.push(child);
        searchQueue.push(child);
      }
    }
  }

  /**
   * Start hashing nodes in hashQueue, back -> front
   *
   * Since BFS was used to generate this arr, this arr is in depth order,
   * so if we traverse it backwards we'll never have dependency problems.
   */
  for (let i = hashQueue.length - 1; i >= 0; i--) {
    const node = tree[hashQueue[i]];
    node.hash = hashDirectory(node, tree);
  }

  return tree;
}

//worker thread
if (!isMainThread) {
  const tree = workerData as DirTree;
  for (const node of tree) {
    if (node.isFile) {
      const [fileHash, discriminator] = hashFile(node.fsPath!);
      node.hash = fileHash;
      node.discriminator = discriminator;
    }
  }
  parentPort?.postMessage(tree);
}

import { readFileSync } from "fs";
import { DirTree } from "../../types";
import { createHash } from "crypto";
import { isMainThread, parentPort, Worker, workerData } from "worker_threads";
import { join } from "path";

const WORKER_THREAD_MAX = 8;

/**
 * Populates the hash field of file nodes in the tree
 * @param {DirTree} tree tree to hash
 * @param {string} root root of the tree
 * @returns {DirTree} tree with hash field populated
 */
export async function hashFileNodes(tree: DirTree, root: string): Promise<DirTree> {
  //multithreading so we are constrained by disk IO
  let chunks: DirTree[] = [];
  const chunkSize = Math.ceil(tree.length / WORKER_THREAD_MAX);
  for (let i = 0; i < WORKER_THREAD_MAX; i++) {
    chunks.push(tree.slice(i * chunkSize, (i + 1) * chunkSize));
  }

  //hash all files in parallel
  if (isMainThread) {
    //spawn workers
    const promises = chunks.map((chunk) => {
      return new Promise<DirTree>((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { chunk, root },
        });
        worker.on("message", resolve);
        worker.on("error", reject);
      });
    });
    chunks = await Promise.all(promises);
  }

  //recombine the chunks
  tree = chunks.reduce((acc, chunk) => acc.concat(chunk), []);

  return tree;
}

/**
 * Hashes the contents of a file
 * @param {string} path path to file
 * @returns {[string, string]} [hash of file, first 32 bytes (utf-8), size (bytes)]
 */
function hashFile(path: string): [string, string, number] {
  const contents = readFileSync(path);
  const hash = createHash("sha256");
  hash.update(contents);
  return [
    hash.digest("hex"),
    contents.toString("utf8", 0, 32),
    contents.length,
  ];
}

/**
 * Worker thread function to hash file nodes
 */
async function hashFileNodesWorker(): Promise<void> {
  const tree = workerData.chunk as DirTree;
  const root = workerData.root as string;
  for (const node of tree) {
    if (node.isFile) {
      const [fileHash, discriminator, size] = hashFile(join(root, node.relPath!));
      node.hash = fileHash;
      node.discriminator = discriminator;
      node.size = size;
    }
  }
  parentPort?.postMessage(tree);
}

//worker thread
if (!isMainThread) {
  hashFileNodesWorker();
}

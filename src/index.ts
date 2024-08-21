import { compressFileNodes } from "./routines/encode";
import { unpackFiles } from "./routines/decode";
import { indexDir } from "./routines/indexDir";
import { createHash } from "crypto";

const root = "/home/piman/data/testfold";


/**   
 * main func
 */
async function run(): Promise<void> {

  console.log("Indexing directories");
  const hashed = await indexDir(root);

  console.log("Starting compression");
  const compressed = await compressFileNodes(hashed, root);

  console.log("Attemping Decompression");
  const decompressed = await unpackFiles(compressed);

  //check validity of decompressed
  const tree = decompressed.dirTree;

  //dual BFS to check if the trees are the same
  const queue1 = [hashed[0]];
  const queue2 = [tree[0]];

  while (queue1.length > 0) {
    const node1 = queue1.shift()!;
    const node2 = queue2.shift()!;

    if (node1.name !== node2.name || node1.hash !== node2.hash || node1.children.length !== node2.children.length) {
      console.log(`Tree Decompression failed. Hash mismatch at ${node1.name}`);
      return;
    }

    //add children to the queue
    for (let i = 0; i < node1.children.length; i++) {
      queue1.push(hashed[node1.children[i]]);
    }

    for (let i = 0; i < node2.children.length; i++) {
      queue2.push(tree[node2.children[i]]);
    }
  }

  console.log("Tree Decompression successful");

  //start checking if files are the same
  for (const { hash } of decompressed.hashTable) {
    const file = decompressed.getFileByHash(hash);

    if (file === null) {
      console.log(`File ${hash} failed to decompress. File not found`);
      return;
    }

    const newHash = createHash("sha256").update(file).digest("hex");

    if (newHash !== hash) {
      console.log(`File ${hash} failed to decompress. Hash mismatch`);
      return;
    }

  }
  console.log("All files decompressed successfully");
}

run();
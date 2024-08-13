import { discoverFiles } from "./routines/discoverFiles";
import { hashNodes } from "./routines/hashNodes";

const root = "/home/piman/data/programming";

/**
 * main func
 */
async function run(): Promise<void> {
  console.log("Starting discovery");
  const nodes = discoverFiles(root);

  console.log("Starting hashing");
  const startTimestamp = Date.now();

  const hashed = await hashNodes(nodes);

  const endTimestamp = Date.now();
  const duration = endTimestamp - startTimestamp;
  console.log(`Duration: ${duration}ms`);

  //count how many instances have hashes
  let count = 0;
  for (const node of hashed) {
    if (node.hash) {
      count++;
    }
  }
  console.log(`Hashed ${count} nodes, ${hashed.length} total`);
}

run();
console.log("Done");

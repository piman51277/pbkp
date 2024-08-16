import { discoverFiles } from "./routines/discoverFiles";
import { hashNodes } from "./routines/hashing";
import { compressFileNodes } from "./routines/encode";

const root = "/home/piman/data/programming";

/**
 * main func
 */
async function run(): Promise<void> {

  const t0 = Date.now();

  console.log("Starting discovery");
  const nodes = discoverFiles(root);

  console.log("Starting hashing");
  const hashed = await hashNodes(nodes);


  console.log("Starting compression");
  const compressed = await compressFileNodes(hashed);

  const t1 = Date.now();

  console.log(`Compression took ${t1 - t0}ms`);
  console.log(`Compressed size: ${compressed.length} bytes`);
}

run();

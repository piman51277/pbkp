import { discoverFiles } from "./routines/discoverFiles";
import { hashNodes } from "./routines/hashing";
import { compressFileNodes } from "./routines/encode";
import { unpackFiles } from "./routines/decode";

const root = "/home/piman/data/programming";

/**   
 * main func
 */
async function run(): Promise<void> {

  console.log("Starting discovery");
  const nodes = discoverFiles(root);

  console.log("Starting hashing");
  const hashed = await hashNodes(nodes);

  console.log("Starting compression");
  const compressed = await compressFileNodes(hashed);

  console.log("Attemping Decompression");
  const decompressed = await unpackFiles(compressed);

  console.log("Attempting to get file");
  const file = decompressed.getFileByHash("...");

  console.log(file!.toString());
}

run();
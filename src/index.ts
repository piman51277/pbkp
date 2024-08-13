import { readFileSync } from "fs";
import { discoverFiles } from "./routines/discoverFiles";
import { hashNodes } from "./routines/hashing";
import { brotliCompressSync, constants as zlibConst } from "zlib";

const root = "/home/piman/data/programming";

/**
 * main func
 */
async function run(): Promise<void> {
  console.log("Starting discovery");
  const nodes = discoverFiles(root);

  console.log("Starting hashing");
  const hashed = await hashNodes(nodes);

  //count how many instances have hashes
  let count = 0;
  for (const node of hashed) {
    if (node.hash) {
      count++;
    }
  }
  console.log(`Hashed ${count} nodes, ${hashed.length} total`);
}

async function zipTest(): Promise<void> {
  const largeFile = "";

  const t0 = Date.now();

  const contents = readFileSync(largeFile);

  const t1 = Date.now();
  console.log(`Read file in ${t1 - t0}ms`);

  const compressed: Buffer = brotliCompressSync(contents, {
    params: {
      [zlibConst.BROTLI_PARAM_QUALITY]: 8,
    },
  });

  const t2 = Date.now();

  console.log(`Compressed file in ${t2 - t1}ms`);

  const reduction = (compressed.length / contents.length) * 100;
  console.log(`Compressed file to ${reduction.toFixed(2)}% of original size`);
  console.log(`Compressed size: ${compressed.length} bytes`);
  console.log(`Original size:   ${contents.length} bytes`);
}

zipTest();

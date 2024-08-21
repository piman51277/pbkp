import { join } from "path";
import { FNode } from "../../types";
import { DecodedBuffers } from "../decode";
import { mkdirSync, writeFileSync } from "fs";

/**
 * Writes the contents of a node to the file system
 * @param {FNode} node Node to write
 * @param {DecodedBuffers} bundle Decoded buffers
 * @param {string} target Target directory to write to
 * @param {boolean} asRoot Whether to write contents directly to the target directory. Only relevant for directories.
 */
export function createNode(node: FNode, bundle: DecodedBuffers, target: string, asRoot = false): void {
  //is this a file?
  if (node.isFile) {

    //get the file data
    const data = bundle.getFileByHash(node.hash!);
    if (data === null) {
      throw new Error(`File not found: ${node.hash}`);
    }

    //write the file
    const filePath = join(target, node.name);
    writeFileSync(filePath, data);
    return;
  }

  //make the directory
  const dirPath = asRoot ? target : join(target, node.name);
  if (!asRoot) {
    mkdirSync(dirPath);
  }


  //recurse into the children
  for (const child of node.children) {
    createNode(bundle.dirTree[child], bundle, dirPath);
  }
}
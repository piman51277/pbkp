import { DirTree } from "../../types";
import { FileOpEnum, FileOperation } from "./compareTrees";

/**
 * Gets a list of FNode ids that are required to perform a list of file operations
 * @param {FileOperation[]} ops list of file operations
 * @param {DirTree} tree directory tree
 * @returns {number[]} list of FNode ids
 */
export function getRequiredFiles(ops: FileOperation[], tree: DirTree): number[] {
  const hashes = new Set<number>();
  const toResolve: number[] = [];

  //look for simple file adds
  for (const op of ops) {
    if (op.type == FileOpEnum.CREATE) {
      if (op.content.isFile) {
        hashes.add(op.content.id);
      }
      else {
        toResolve.push(...op.content.children);
      }
    }
  }

  //resolve directories
  while (toResolve.length > 0) {
    const index = toResolve.shift() as number;
    const node = tree[index];
    if (node.isFile) {
      hashes.add(node.id);
    }
    else {
      toResolve.push(...node.children);
    }
  }


  return Array.from(hashes);
}
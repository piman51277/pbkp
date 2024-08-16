import { DirTree } from "../../types";
import { hashDirNodes } from "./hashDirNodes";
import { hashFileNodes } from "./hashFileNodes";

/**
 * Populates the hash field of all nodes in the tree
 * @param {DirTree} tree tree to hash
 * @returns {DirTree} tree with hash field populated
 */
export async function hashNodes(tree: DirTree): Promise<DirTree> {
  tree = await hashFileNodes(tree);
  tree = await hashDirNodes(tree);

  return tree;
}

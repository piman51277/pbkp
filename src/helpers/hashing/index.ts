import { DirTree } from "../../types";
import { hashDirNodes } from "./hashDirNodes";
import { hashFileNodes } from "./hashFileNodes";

/**
 * Populates the hash field of all nodes in the tree
 * @param {DirTree} tree tree to hash
 * @param {string} root root of the tree
 * @returns {DirTree} tree with hash field populated
 */
export async function hashNodes(tree: DirTree, root: string): Promise<DirTree> {
  tree = await hashFileNodes(tree, root);
  tree = await hashDirNodes(tree);

  return tree;
}

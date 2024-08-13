import { DirTree } from "../../types";
import { hashDirNodes } from "./hashDirNodes";
import { hashFileNodes } from "./hashFileNodes";

/**
 * Populates the hash field of all nodes in the tree
 * @param {DirTree} tree tree to hash
 * @returns {DirTree} tree with hash field populated
 */
export async function hashNodes(tree: DirTree): Promise<DirTree> {
  const t0 = Date.now();

  tree = await hashFileNodes(tree);

  const t1 = Date.now();

  tree = await hashDirNodes(tree);

  const t2 = Date.now();

  console.log(`Hashed files in ${t1 - t0}ms`);
  console.log(`Hashed dirs in ${t2 - t1}ms`);
  console.log(`Total time: ${t2 - t0}ms`);

  return tree;
}

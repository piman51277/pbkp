import { DirTree, FNode } from "../../types";
import { createHash } from "crypto";

/**
 * Hashes the contents of a directory
 * @param {FNode} node node to hash
 * @param {DirTree} tree tree to reference
 * @returns {string} hash of directory
 */
function hashDirectory(node: FNode, tree: DirTree): string {
  const hash = createHash("sha256");
  for (const child of node.children) {
    hash.update(tree[child].hash as string);

    //include the child name in the hash
    hash.update(tree[child].name);
  }
  return hash.digest("hex");
}

/**
 * Populates the hash field of all dir nodes in the tree.
 * Must be called after hashFileNodes.
 * @param {DirTree} tree tree to hash
 * @returns {DirTree} tree with hash field populated
 */
export async function hashDirNodes(tree: DirTree): Promise<DirTree> {
  //navigate the tree and find nodes by depth (BFS)
  const hashQueue: number[] = [0]; //0 is root
  const searchQueue: number[] = [0];

  while (searchQueue.length > 0) {
    const { children } = tree[searchQueue.shift() as number];

    //sort children by name
    children.sort((a, b) => tree[a].name < tree[b].name ? -1 : 1);

    for (const child of children) {
      if (!tree[child].isFile) {
        hashQueue.push(child);
        searchQueue.push(child);
      }
    }
  }

  /**
   * Start hashing nodes in hashQueue, back -> front
   *
   * Since BFS was used to generate this arr, this arr is in depth order,
   * so if we traverse it backwards we'll never have dependency problems.
   */
  for (let i = hashQueue.length - 1; i >= 0; i--) {
    const node = tree[hashQueue[i]];
    node.hash = hashDirectory(node, tree);
  }

  return tree;
}

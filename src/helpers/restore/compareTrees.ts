import { DirTree, FNode } from "../../types";

export enum FileOpEnum {
  DELETE,
  CREATE,
  RENAME
}

export type FileOperation = {
  type: FileOpEnum.DELETE,
  target: string //relative path to file
} | {
  type: FileOpEnum.CREATE,
  target: string, //relative path to parent dir
  content: FNode
} | {
  type: FileOpEnum.RENAME,
  target: string, //relative path to file
  content: string
}

enum ReqActionEnum {
  NONE,
  DELETE,
  PUSHQUEUE,
  RENAME,
  REPLACE
}

/**
 * Compares two directory trees and returns a list of operations to transform the old tree into the new tree
 * @param {DirTree} oldTree tree representing current state
 * @param {DirTree} newTree tree representing desired state
 * @returns {FileOperation[]} list of operations
 */
export function compareTrees(oldTree: DirTree, newTree: DirTree): FileOperation[] {
  const queue: [number, number][] = [[0, 0]]; //root nodes, [old, new]

  const operations: FileOperation[] = [];
  while (queue.length > 0) {
    const [oldIndex, newIndex] = queue.shift() as [number, number];
    const { children: oldChildren } = oldTree[oldIndex];
    const { children: newChildren } = newTree[newIndex];

    //make a "seen" array to track which children are new
    const seen = new Array(newChildren.length).fill(false);

    //look for children that were changed or deleted
    for (let i = 0; i < oldChildren.length; i++) {
      const oldChild = oldTree[oldChildren[i]];

      //start scanning the new children
      let foundIndex = -1;
      //default to delete, since we haven't found a match
      let nextAction: ReqActionEnum = ReqActionEnum.DELETE;
      for (let j = 0; j < newChildren.length; j++) {

        //skip if we've already seen this child
        if (seen[j]) {
          continue;
        }

        const newChild = newTree[newChildren[j]];

        const doesNameMatch = oldChild.name === newChild.name;
        const doesHashMatch = oldChild.hash === newChild.hash;

        //if both match, do nothing
        if (doesNameMatch && doesHashMatch) {
          seen[j] = true;
          nextAction = ReqActionEnum.NONE;
          break;
        }

        //if the name matches but the hash does not, add to queue
        if (doesNameMatch) {
          foundIndex = j;
          seen[j] = true;

          //if it's a dir, add to queue
          if (!oldChild.isFile) {
            nextAction = ReqActionEnum.PUSHQUEUE;
          }
          //if it's a file, replace
          else {
            nextAction = ReqActionEnum.REPLACE;
          }
          break;
        }

        //if the hash matches but the name does not, rename
        if (doesHashMatch) {
          foundIndex = j;
          seen[j] = true;
          nextAction = ReqActionEnum.RENAME;
          break;
        }
      }

      //perform the action nessesary
      switch (nextAction) {
        case ReqActionEnum.DELETE:
          operations.push({
            type: FileOpEnum.DELETE,
            target: oldChild.relPath!
          });
          break;
        case ReqActionEnum.PUSHQUEUE:
          queue.push([oldChildren[i], newChildren[foundIndex]]);
          break;
        case ReqActionEnum.RENAME:
          operations.push({
            type: FileOpEnum.RENAME,
            target: oldChild.relPath!,
            content: newTree[newChildren[foundIndex]].name
          });
          break;
        case ReqActionEnum.REPLACE:
          //replacement can be done by overwriting the old file
          operations.push({
            type: FileOpEnum.CREATE,
            target: oldChild.relPath!,
            content: newTree[newChildren[foundIndex]]
          });
      }
    }

    //new children
    for (let i = 0; i < newChildren.length; i++) {
      if (!seen[i]) {
        operations.push({
          type: FileOpEnum.CREATE,
          target: oldTree[oldIndex].relPath!,
          content: newTree[newChildren[i]]
        });
      }
    }

  }

  return operations;
}
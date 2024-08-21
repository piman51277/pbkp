import { readdirSync } from "fs";
import { DirTree, FNode } from "../types";
import { join, basename, relative } from "path";
import { config } from "../env/config";

type QueueEntry = {
  path: string;
  parentID: number;
};

/**
 * Discovers all files in a directory
 * @param {string} root dir to consider as root
 * @returns {DirTree} list of nodes
 */
export function discoverFiles(root: string): DirTree {
  let nextId = 0;
  const nodes: FNode[] = [];

  const queue: QueueEntry[] = [{ path: root, parentID: -1 }];

  while (queue.length > 0) {
    const { path, parentID } = queue.shift() as QueueEntry;

    const children = readdirSync(path, { withFileTypes: true });

    let relPath = relative(config.targetPath, path);
    if (relPath === "") {
      relPath = ".";
    }

    const parentNode: FNode = {
      id: nextId++,
      name: basename(path),
      relPath,
      isFile: false,
      children: [],
    };
    nodes.push(parentNode);

    if (parentID >= 0) {
      //do the deffered add to parent node
      nodes[parentID].children.push(parentNode.id);
    }

    for (const child of children) {
      //ignore symlinks
      if (child.isSymbolicLink()) {
        continue;
      }

      const childPath = join(path, child.name);

      //check if the path includes a banned pattern
      if (config.bans.patterns.some((pattern) => childPath.includes(pattern))) {
        continue;
      }

      if (child.isFile()) {
        //check if the file matches an ignore pattern
        if (config.bans.files.some((ban) => child.name.includes(ban))) {
          continue;
        }

        let relPath = relative(config.targetPath, childPath);
        if (relPath === "") {
          relPath = ".";
        }

        const childNode: FNode = {
          id: nextId++,
          name: child.name,
          relPath,
          isFile: true,
          children: [],
        };
        nodes.push(childNode);
        parentNode.children.push(childNode.id);
      }

      //adding to parent node for dirs is deffered to when the dir is processed
      if (child.isDirectory()) {
        //check if the directory matches an ignore pattern
        if (config.bans.directories.includes(child.name)) {
          continue;
        }

        queue.push({ path: childPath, parentID: parentNode.id });
      }
    }
  }

  return nodes;
}

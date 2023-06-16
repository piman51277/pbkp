import { FileDescriptor } from "../types/FileDescriptor.js";

export type CompareResult = {
  added: FileDescriptor[];
  removed: FileDescriptor[];
  modified: FileDescriptor[];
};

export function compare(
  old: FileDescriptor[],
  incoming: FileDescriptor[]
): CompareResult {
  //transform to maps to speed up lookups
  const oldMap = new Map(old.map((f) => [f.path, f]));
  const incomingMap = new Map(incoming.map((f) => [f.path, f]));

  const added: FileDescriptor[] = [];
  const removed: FileDescriptor[] = [];
  const modified: FileDescriptor[] = [];

  for (const [path, file] of oldMap) {
    if (!incomingMap.has(path)) {
      removed.push(file);
    }
  }

  for (const [path, file] of incomingMap) {
    if (!oldMap.has(path)) {
      added.push(file);
    } else {
      const oldFile = oldMap.get(path)!;
      if (oldFile.hash != file.hash) {
        modified.push(file);
      }
    }
  }

  return {
    added,
    removed,
    modified,
  };
}

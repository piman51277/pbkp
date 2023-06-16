import { FileDescriptor } from "../types/FileDescriptor.js";
import { CompareResult } from "./compare.js";

export type MergeResult = {
  fromOld: FileDescriptor[];
  fromIncoming: FileDescriptor[];
};

export function resolveMerge(
  old: FileDescriptor[],
  diff: CompareResult
): MergeResult {
  const bannedFiles = new Set<string>();

  for (const entry of [...diff.added, ...diff.modified]) {
    bannedFiles.add(entry.path);
  }

  const fromOld = old.filter((entry) => !bannedFiles.has(entry.path));
  const fromIncoming = [...diff.added, ...diff.modified];

  return { fromOld, fromIncoming };
}

import { applyDiffs } from "../routines/applyDiffs.js";
import { confirmChanges } from "../routines/confirmChanges.js";
import { confirmLoad } from "../routines/confirmLoad.js";
import { discoverFiles } from "../routines/discover.js";
import { fetchBundle } from "../routines/fetchBundle.js";
import { findParent } from "../routines/findParent.js";
import { loadBundle } from "../routines/loadBundle.js";
import { loadFiles } from "../routines/loadFiles.js";
import { FileDescriptor } from "../types/FileDescriptor.js";
import { CompareResult, compare } from "../util/compare.js";
import { initCache } from "../util/initCache.js";
import { resolveMerge } from "../util/resolveMerge.js";

function intersect(source: FileDescriptor[], target: FileDescriptor[]) {
  //map the target files by hash
  const targetMap = new Set(target.map((file) => file.hash!));

  //filter the source files by hash
  return source.filter((file) => targetMap.has(file.hash!));
}

export async function load(cli = false) {
  const backup = await fetchBundle();
  if (!cli) await confirmLoad(backup);

  let currentFiles = await discoverFiles();
  currentFiles = (await loadFiles(currentFiles))[0];

  //load relevant files into cache

  initCache();
  //we use a separate routine for relative backups
  let diff: CompareResult;
  if (backup.isRelative) {
    console.log("Loading files from chain...");
    const parent = await findParent(backup.relative!);
    if (!cli) await confirmLoad(parent);

    const relDiff = compare(parent.contents, backup.contents);
    const { fromIncoming, fromOld } = resolveMerge(parent.contents, relDiff);

    const backupFile = [...fromIncoming, ...fromOld];

    diff = compare(currentFiles, backupFile);
    const toLoad = [...diff.added, ...diff.modified];

    //load files from bundles separately
    await loadBundle(parent.zip, intersect(toLoad, fromOld));
    await loadBundle(backup.zip, intersect(toLoad, fromIncoming));
  } else {
    diff = compare(currentFiles, backup.contents);
    const toLoad = [...diff.added, ...diff.modified];

    await loadBundle(backup.zip, toLoad);
  }

  if (!cli) await confirmChanges(diff);

  await applyDiffs(diff);
}

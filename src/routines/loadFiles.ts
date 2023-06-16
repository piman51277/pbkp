import ora from "ora";
import { readFile } from "fs/promises";
import { writeFileSync } from "fs";
import { createHash } from "crypto";
import { FileDescriptor } from "../types/FileDescriptor.js";
import { initCache } from "../util/initCache.js";
import { config } from "../env/config.js";

type LoadStats = {
  totalBytes: number;
  savedBytes: number;
  skippedBytes: number;
  totalFiles: number;
  savedFiles: number;
  skippedFiles: number;
};
export type FileLoadResult = [FileDescriptor[], LoadStats];

/**
 * Copies files into cache, and adds hash/size metadata
 * @param files
 */
export async function loadFiles(
  files: FileDescriptor[]
): Promise<FileLoadResult> {
  initCache();

  const spinner = ora("Loading files...").start();

  const hydratedFiles: FileDescriptor[] = [];
  const stats: LoadStats = {
    totalBytes: 0,
    savedBytes: 0,
    skippedBytes: 0,
    totalFiles: 0,
    savedFiles: 0,
    skippedFiles: 0,
  };

  const cachedFiles = new Set<string>();

  for (const file of files) {
    spinner.text = `Loaded ${stats.savedFiles} files (${stats.skippedFiles} skipped)`;
    const contents = await readFile(file.path);
    const size = contents.byteLength;

    const hash = createHash("sha256").update(contents).digest("hex");

    const alreadyCached = cachedFiles.has(hash);

    if (!alreadyCached) {
      writeFileSync(`${config.cachePath}/old/${hash}`, contents);
      cachedFiles.add(hash);
      stats.savedBytes += size;
      stats.savedFiles++;
    } else {
      stats.skippedBytes += size;
      stats.skippedFiles++;
    }
    stats.totalBytes += size;
    stats.totalFiles++;

    const cachedFile: FileDescriptor = {
      ...file,
      hash,
      size: alreadyCached ? 0 : size,
    };
    hydratedFiles.push(cachedFile);
  }

  spinner.succeed(`Loaded ${stats.savedFiles} files`);
  return [hydratedFiles, stats];
}

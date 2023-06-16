import ora from "ora";
import { config } from "../env/config.js";
import { FileDescriptor } from "../types/FileDescriptor.js";
import { readdir } from "fs/promises";
import { Dirent } from "fs";

const directoryBans = config.bans?.directories ?? [];
const fileBans = config.bans?.files ?? [];
const patternBans = config.bans?.patterns ?? [];

function isFileBanned(path: string, file: Dirent): boolean {
  for (const ban of fileBans) {
    if (file.name.includes(ban)) {
      return true;
    }
  }

  for (const ban of patternBans) {
    if (path.includes(ban)) {
      return true;
    }
  }

  return false;
}

function isDirectoryBanned(path: string): boolean {
  for (const ban of directoryBans) {
    if (path.includes(ban)) {
      return true;
    }
  }
  return false;
}

/**
 * Scans target directory for files
 * @returns
 */
export async function discoverFiles(): Promise<FileDescriptor[]> {
  const files: FileDescriptor[] = [];
  const stack: string[] = [config.targetPath];

  // spinner
  const spinner = ora("Starting scan...").start();

  // stats tracking
  let foundFiles = 0;

  // DFS search
  while (stack.length > 0) {
    spinner.text = `Found ${foundFiles} files`;

    const node = stack.pop()!;
    const children = await readdir(node, { withFileTypes: true });

    for (const child of children) {
      const childPath = `${node}/${child.name}`;

      if (child.isFile() && !isFileBanned(childPath, child)) {
        foundFiles++;

        files.push({
          name: child.name,
          path: childPath,
        });
      }

      if (child.isDirectory() && !isDirectoryBanned(childPath)) {
        stack.push(childPath);
      }
    }
  }

  spinner.succeed(`Found ${foundFiles} files`);

  return files;
}

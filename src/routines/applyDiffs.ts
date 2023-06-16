import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { CompareResult } from "../util/compare.js";
import { config } from "../env/config.js";
import ora from "ora";

function createDirs(path: string) {
  const dirs = path.split("/");
  dirs.pop();
  let currentPath = "";
  for (const dir of dirs) {
    currentPath += dir + "/";
    if (!existsSync(currentPath)) {
      mkdirSync(currentPath);
    }
  }
}

export async function applyDiffs(diffs: CompareResult) {
  const spinner = ora("Applying changes...").start();
  const { added, modified, removed } = diffs;

  //remove files in the removed and modified arrays
  const toRemove = [...removed, ...modified];

  spinner.text = `Removing files...`;
  for (const file of toRemove) {
    await rmSync(file.path);
  }

  //add files in the added and modified arrays
  const toAdd = [...added, ...modified];

  spinner.text = `Adding files...`;
  for (const file of toAdd) {
    const contents = readFileSync(`${config.cachePath}/incoming/${file.hash}`);

    createDirs(file.path);
    await writeFileSync(file.path, contents);
  }

  spinner.succeed(`Applied changes`);
}

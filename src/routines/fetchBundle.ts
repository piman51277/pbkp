import inquirer from "inquirer";
import { FileDescriptor } from "../types/FileDescriptor.js";
import Zip from "adm-zip";
import { getBackups } from "../util/getBackups.js";
import { config } from "../env/config.js";
import { existsSync } from "fs";
import { BundleMeta } from "../types/BundleMeta.js";
import { parseContents } from "../util/parseContents.js";
import { parsePrevdiff } from "../util/parsePrevdiff.js";
import { CompareResult } from "../util/compare.js";

export type FetchBundleResult = {
  zip: Zip;
  contents: FileDescriptor[];
  meta: BundleMeta;
  relative?: string;
  prevdiff?: CompareResult;
  isRelative: boolean;
};

export async function fetchBundle(): Promise<FetchBundleResult> {
  const previousBackups = await getBackups();

  const choices = previousBackups.map((backup) => ({
    name: backup.includes("_rel") ? `${backup} (relative)` : backup,
    value: backup,
  }));

  choices.unshift({
    name: "Custom path...",
    value: "other",
  });

  const { backup } = await inquirer.prompt<{ backup: string }>([
    {
      type: "list",
      name: "backup",
      message: "Which backup would you like to restore?",
      choices,
      default: 1,
    },
  ]);

  let backupPath: string = `${config.backupsPath}/${backup}`;
  if (backup == "other") {
    const { path } = await inquirer.prompt<{ path: string }>([
      {
        type: "input",
        name: "path",
        message: "Enter the path to the backup you would like to restore:",
      },
    ]);
    backupPath = path;
  }

  if (!existsSync(backupPath)) {
    console.log("Backup does not exist!");
    process.exit(1);
  }

  let bundle: Zip | null;
  try {
    bundle = new Zip(backupPath);
  } catch (e) {
    console.log("Failed to open backup!");
    process.exit(1);
  }

  const meta = bundle.getEntry("metadata");
  const contents = bundle.getEntry("contents");

  if (!meta || !contents) {
    console.log("Invalid backup!");
    process.exit(1);
  }

  const diff = bundle.getEntry("prevdiff");
  const isRelative = diff ? true : false;
  const [parent, prevdiff] = diff
    ? parsePrevdiff(diff.getData().toString("utf-8"))
    : [undefined, undefined];

  return {
    zip: bundle,
    contents: parseContents(contents.getData().toString("utf-8")),
    meta: JSON.parse(meta.getData().toString("utf-8")),
    isRelative,
    relative: parent,
    prevdiff,
  };
}

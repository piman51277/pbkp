import inquirer from "inquirer";
import Zip from "adm-zip";
import { confirmBundle } from "../routines/confirmBundle.js";
import { discoverFiles } from "../routines/discover.js";
import { loadFiles } from "../routines/loadFiles.js";
import { packFiles } from "../routines/pack.js";
import { zipBundle } from "../routines/zip.js";
import { addContents } from "../util/addContents.js";
import { addMetadata } from "../util/addMetadata.js";
import { getBackups } from "../util/getBackups.js";
import { config } from "../env/config.js";
import { parseContents } from "../util/parseContents.js";
import { FileDescriptor } from "../types/FileDescriptor.js";
import { compare } from "../util/compare.js";
import { confirmChanges } from "../routines/confirmChanges.js";
import { addDiff } from "../util/addDiff.js";

function loadParent(path: string): [FileDescriptor[], string] {
  const bundle = new Zip(`${config.backupsPath}/${path}`);

  //double check that this bundle is not relative
  //By design, relative chains should be no longer than 2 backups
  const diff = bundle.getEntry("diff");
  if (diff) {
    console.log("Cannot set a relative backup as a parent.");
    process.exit(1);
  }

  const contents = bundle.getEntry("contents");
  const files = parseContents(contents!.getData().toString("utf-8"));

  const hash = bundle.getEntry("version")?.getData().toString("utf-8");

  return [files, hash!];
}

export async function backupRelative(cli = false) {
  const previousBackups = await getBackups();

  const choices = previousBackups
    .filter((n) => !n.includes("_rel"))
    .map((backup) => ({
      name: backup,
      value: backup,
    }));

  const { backup } = await inquirer.prompt<{ backup: string }>([
    {
      type: "list",
      name: "backup",
      message: "Select a parent backup:",
      choices,
    },
  ]);

  const [parent, prevVersion] = loadParent(backup);
  const files = await discoverFiles();
  const [hydrated] = await loadFiles(files);

  const diff = compare(parent, hydrated);

  const toBundle = [...diff.added, ...diff.modified];

  if (!cli) await confirmChanges(diff);
  let bundle = await packFiles(toBundle);
  bundle = addContents(bundle, toBundle);
  bundle = addMetadata(bundle);
  bundle = addDiff(bundle, diff, prevVersion);

  zipBundle(bundle, true);
}

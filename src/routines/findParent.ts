import ora from "ora";
import Zip from "adm-zip";
import { getBackups } from "../util/getBackups.js";
import { FetchBundleResult } from "./fetchBundle.js";
import { config } from "../env/config.js";
import { parseContents } from "../util/parseContents.js";

async function getVersion(path: string) {
  const bundle = new Zip(path);
  const version = bundle.readAsText("version", "utf-8");
  return version;
}

export async function findParent(parentid: string): Promise<FetchBundleResult> {
  const spinner = ora("Searching for parent backup...").start();

  const candidates = getBackups();

  for (const candidate of candidates) {
    spinner.text = `Checking ${candidate}...`;
    const candidatePath = `${config.backupsPath}/${candidate}`;
    const version = await getVersion(candidatePath);
    if (version == parentid) {
      spinner.succeed(`Found parent backup: ${candidate}`);

      const bundle = new Zip(candidatePath);

      //double check that this bundle is not relative
      //By design, relative chains should be no longer than 2 backups
      const diff = bundle.getEntry("diff");
      if (diff) {
        spinner.fail("Invalid backup: relative parent");
        process.exit(1);
      }

      const meta = bundle.getEntry("metadata");
      const contents = bundle.getEntry("contents");

      return {
        zip: bundle,
        contents: parseContents(contents!.getData().toString("utf-8")),
        meta: JSON.parse(meta!.getData().toString("utf-8")),
        isRelative: false,
        relative: undefined,
        prevdiff: undefined,
      };
    }
  }

  spinner.fail("Could not find parent backup.");
  process.exit(1);
}

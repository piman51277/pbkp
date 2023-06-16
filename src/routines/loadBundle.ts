import { writeFileSync } from "fs";
import { config } from "../env/config.js";
import { FileDescriptor } from "../types/FileDescriptor.js";
import Zip from "adm-zip";
import ora from "ora";

export async function loadBundle(
  bundle: Zip,
  files: FileDescriptor[]
): Promise<void> {
  const spinner = ora("Loading from bundle...").start();
  const destination = `${config.cachePath}/incoming`;

  for (const file of files) {
    spinner.text = `Loading ${file.hash?.slice(0, 10)}...`;
    const path = `obj/${file.hash}`;
    const contents = bundle.getEntry(path)?.getData();
    if (!contents) {
      spinner.fail(`Could not find ${path} in bundle.`);
      process.exit(1);
    }

    await writeFileSync(`${destination}/${file.hash}`, contents);
  }

  spinner.succeed("All files loaded.");
}

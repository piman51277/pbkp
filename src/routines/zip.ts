import { config } from "../env/config.js";
import Zip from "adm-zip";
import { writeFileSync } from "fs";
import ora from "ora";
import { sizeString } from "../util/sizeString.js";
export async function zipBundle(
  bundle: Zip,
  isRelative = false
): Promise<void> {
  const spinner = ora("Zipping bundle...").start();
  const buf = bundle.toBuffer();
  const date = new Date();
  //do year-month-day
  const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${
    date.getDate() + 1
  }`;
  const bundleName = `${config.backupName}${dateString}${
    isRelative ? "_rel" : ""
  }.pmbk`;
  writeFileSync(`${config.backupsPath}/${bundleName}`, buf);
  spinner.succeed(`Wrote bundle to ${config.backupsPath}/${bundleName}`);
  console.log(`Bundle size: ${sizeString(buf.length)}`);
}

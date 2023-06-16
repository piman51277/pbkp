import Zip from "adm-zip";
import ora from "ora";
import { FileDescriptor } from "../types/FileDescriptor.js";
import { config } from "../env/config.js";

export async function packFiles(files: FileDescriptor[]): Promise<Zip> {
  const zip = new Zip();
  const spinner = ora("Packing files...").start();

  const basePath = `${config.cachePath}/old/`;

  let count = 0;

  for (const file of files) {
    spinner.text = `Packed ${count} files`;
    const filePath = basePath + file.hash;
    zip.addLocalFile(filePath, `obj/`);

    count++;

    //wait 0 ms to allow other processes to run (otherwise we can't even control-c out of this loop)
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  spinner.succeed(`Packed ${count} files`);
  return zip;
}

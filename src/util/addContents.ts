import Zip from "adm-zip";
import { FileDescriptor } from "../types/FileDescriptor.js";
import { createHash } from "crypto";
import { truncatePath } from "./truncatePath.js";
export function addContents(bundle: Zip, file: FileDescriptor[]): Zip {
  //construct contents file
  const contents = file
    .map((file) => {
      return `${file.hash} ${truncatePath(file.path)}`;
    })
    .join("\n");

  bundle.addFile("contents", Buffer.from(contents));

  //get version hash
  const versionHash = createHash("sha256").update(contents).digest("hex");

  bundle.addFile("version", Buffer.from(versionHash));

  return bundle;
}

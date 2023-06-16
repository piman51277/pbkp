import { config } from "../env/config.js";
import { FileDescriptor } from "../types/FileDescriptor.js";

export function parseContents(file: string): FileDescriptor[] {
  const lines = file.split("\n");
  const files: FileDescriptor[] = [];

  for (const line of lines) {
    const delimIndex = line.indexOf(" ");
    const hash = line.slice(0, delimIndex);
    const path = line.slice(delimIndex + 1);
    const name = path.split("/").pop() as string;
    files.push({ hash, path: `${config.targetPath}${path}`, name });
  }

  return files;
}

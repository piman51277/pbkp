import { FileDescriptor } from "../types/FileDescriptor.js";
import { CompareResult } from "./compare.js";

export function parsePrevdiff(file: string): [string, CompareResult] {
  const lines = file.split("\n");
  const result: CompareResult = {
    added: [],
    removed: [],
    modified: [],
  };

  const parent = lines.shift() as string;

  for (const line of lines) {
    const [type, hash, path] = line.split(" ");
    const name = path.split("/").pop() as string;
    const file: FileDescriptor = { hash, path, name };

    switch (type) {
      case "+":
        result.added.push(file);
        break;
      case "-":
        result.removed.push(file);
        break;
      case "~":
        result.modified.push(file);
        break;
    }
  }

  return [parent, result];
}

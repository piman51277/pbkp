import Zip from "adm-zip";
import { CompareResult } from "./compare.js";
export function addDiff(
  bundle: Zip,
  diff: CompareResult,
  parent: string
): Zip {
  //construct diff file

  let prevdiff = `${parent}`;

  for (const added of diff.added) {
    prevdiff += `\n+ ${added.hash} ${added.path}`;
  }

  for (const modified of diff.modified) {
    prevdiff += `\n~ ${modified.hash} ${modified.path}`;
  }

  for (const deleted of diff.removed) {
    prevdiff += `\n- ${deleted.hash} ${deleted.path}`;
  }

  bundle.addFile("prevdiff", Buffer.from(prevdiff));

  return bundle;
}

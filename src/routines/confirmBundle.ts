import inquirer from "inquirer";
import { FileLoadResult } from "./loadFiles.js";
import { sizeString } from "../util/sizeString.js";
import { truncatePath } from "../util/truncatePath.js";

export async function confirmBundle(loadResult: FileLoadResult): Promise<void> {
  const files = [...loadResult[0]];
  const { savedBytes, skippedBytes, savedFiles, skippedFiles } = loadResult[1];

  const filesBySize = files.sort((a, b) => b.size! - a.size!);
  const top20 = filesBySize
    .filter((a) => !a.path.includes(".git"))
    .slice(0, 20);

  console.log("\nBundle info:");
  console.log(`  Files in bundle: ${savedFiles} (${skippedFiles} duplicates)`);
  console.log(
    `  Total size: ${sizeString(savedBytes)} (${sizeString(
      skippedBytes
    )} saved)`
  );

  console.log("\nTop 20 files by size:");
  for (const file of top20) {
    console.log(
      `  [${sizeString(file.size!).padStart(10)}] - ${truncatePath(file.path)}`
    );
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Continue?",
    },
  ]);

  if (!confirm) {
    console.log("Aborting.");
    process.exit(0);
  }
}

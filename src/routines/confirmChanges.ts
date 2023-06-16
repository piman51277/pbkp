import { CompareResult } from "../util/compare.js";
import inquirer from "inquirer";

export async function confirmChanges(diff: CompareResult): Promise<void> {
  const { added, modified, removed } = diff;

  console.log("\nChanges:");
  console.log(`  ${added.length} files added`);
  console.log(`  ${modified.length} files modified`);
  console.log(`  ${removed.length} files removed`);

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Are you sure you want to continue?",
    },
  ]);

  if (!confirm) {
    console.log("Aborting...");
    process.exit(0);
  }
}

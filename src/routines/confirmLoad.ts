import { FetchBundleResult } from "./fetchBundle.js";
import inquirer from "inquirer";

export async function confirmLoad(
  fetchResult: FetchBundleResult
): Promise<void> {
  const { meta, isRelative, relative } = fetchResult;

  const { packed, version, system } = meta;

  console.log("\nBundle info:");
  console.log(`  Packed: ${new Date(packed).toLocaleString()}`);
  console.log(`  Version: ${version}`);
  console.log(`  System: ${system}`);

  if (isRelative) {
    console.log(`  Parent bundle: ${relative?.slice(0, 10)}...`);
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

import { select } from "@inquirer/prompts";
import { indexDirs } from "../routines/analysis/indexDirs";
import { compareTo } from "../routines/analysis/compareTo";
import { simRestore } from "../routines/analysis/simRestore";
import { restoreAlt } from "../routines/analysis/restoreAlt";

/**
 * Analysis menu dialog
 */
export async function analysisDialog(): Promise<void> {
  try {
    const answer = await select({
      message: "Select tool to run",
      choices: [
        { name: "Index Directories", value: "indexdir" },
        { name: "Compare to Backup", value: "compare" },
        { name: "Simulate Restore", value: "simres" },
        { name: "Restore to alt. Directory", value: "resaltdir" },
        { name: "Exit", value: "exit" }
      ],
    });

    switch (answer) {
      case "indexdir":
        indexDirs();
        break;
      case "compare":
        compareTo();
        break;
      case "simres":
        simRestore();
        break;
      case "resaltdir":
        restoreAlt();
        break;
      case "exit":
        process.exit(0);
        break;
    }
  } catch (err: any) {
    //allow control-c to exit without throwing an error
    if (err.message == "User force closed the prompt with 0 null") {
      process.exit(0);
      return;
    }

    throw err;
  }
};
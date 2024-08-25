import { select } from "@inquirer/prompts";
import { loadBackup } from "../routines/loadBackup";
import { createPinned } from "../routines/createPinned";
import { createRelative } from "../routines/createRelative";
import { analysisDialog } from "./analysis";

/**
 * Main menu dialog
 */
export async function homeDialog(): Promise<void> {
  try {
    const answer = await select({
      message: "What would you like to do?",
      choices: [
        { name: "Load a backup", value: "load" },
        { name: "Create a backup (pin)", value: "create" },
        { name: "Create a backup (relative)", value: "create-rel" },
        { name: "Analysis tools", value: "analysis" },
        { name: "Exit", value: "exit" }
      ],
    });

    switch (answer) {
      case "load":
        loadBackup();
        break;
      case "create":
        createPinned();
        break;
      case "create-rel":
        createRelative();
        break;
      case "analysis":
        analysisDialog();
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
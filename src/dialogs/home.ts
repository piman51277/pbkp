import { select } from "@inquirer/prompts";

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

    //TODO: implement
    switch (answer) {
      case "load":
        console.log("Loading a backup");
        break;
      case "create":
        console.log("Creating a backup (pin)");
        break;
      case "create-rel":
        console.log("Creating a backup (relative)");
        break;
      case "analysis":
        console.log("Analysis tools");
        break;
      case "exit":
        console.log("Goodbye!");
        break;
    }
  } catch (err: any) {
    //allow control-c to exit without throwing an error
    if (err.message == "User force closed the prompt with 0 null") {
      console.log("Goodbye!");
      return;
    }

    throw err;
  }
};
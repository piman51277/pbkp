import "./env/config.js";
import inquirer from "inquirer";
import { load } from "./stories/load.js";
import { backup } from "./stories/backup.js";
import { backupRelative } from "./stories/backupRelative.js";

async function main() {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        {
          name: "Load a backup",
          value: "load",
        },
        {
          name: "Create a backup",
          value: "backup",
        },
        {
          name: "Create a relative backup",
          value: "relative",
        },
      ],
    },
  ]);

  switch (action) {
    case "load":
      load();
      break;
    case "backup":
      backup();
      break;
    case "relative":
      backupRelative();
      break;
  }
}

main();

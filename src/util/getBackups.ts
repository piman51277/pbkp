import { readdirSync, statSync } from "fs";
import { config } from "../env/config.js";

export function getBackups(): string[] {
  const children = readdirSync(config.backupsPath, { withFileTypes: true });

  return children
    .filter((child) => child.isFile())
    .filter((child) => child.name.includes(".pmbk"))
    .map((child) => child.name)
    .sort((a, b) => {
      //pattern is name-YYYY-MM-DD_rel.pmbk
      //it loosely follows the ISO 8601 date format, so Date() can parse it
      const regex = /(\d{4}-\d{1,2}-\d{1,2})/;
      const dateStringA = a.match(regex)![1];
      const dateStringB = b.match(regex)![1];
      if (!dateStringA || !dateStringB) return 0;

      const dateA = new Date(dateStringA);
      const dateB = new Date(dateStringB);
      return dateA > dateB ? -1 : 1;
    });
}

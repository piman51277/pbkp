import { readdirSync } from "fs";
import { config } from "../env/config.js";

export function getBackups(): string[] {
  const children = readdirSync(config.backupsPath, { withFileTypes: true });

  return children
    .filter((child) => child.isFile())
    .map((child) => child.name)
    .filter((name) => name.includes(".pmbk"))
    .sort((a, b) => b.localeCompare(a));
}

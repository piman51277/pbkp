import { config } from "../env/config.js";

export function truncatePath(path: string): string {
  return path.replace(config.targetPath, "");
}

import { existsSync, rmSync, mkdirSync } from "fs";
import { config } from "../env/config.js";

export function initCache(): void {
  if (existsSync(config.cachePath)) {
    rmSync(config.cachePath, { recursive: true });
  }

  mkdirSync(config.cachePath);

  //create folders
  mkdirSync(`${config.cachePath}/old`);
  mkdirSync(`${config.cachePath}/incoming`);
}

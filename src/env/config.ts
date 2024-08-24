export type GlobalConfig = {
  targetPath: string;
  backupsPath: string;
  backupName?: string;
  bans?: {
    directories: string[];
    files: string[];
    patterns: string[];
  };
};

import { existsSync, readFileSync } from "fs";

let configFile: any = {};

// Attempt to load the config file
try {
  const rawFile = readFileSync("./config.json", "utf-8");
  configFile = JSON.parse(rawFile);
} catch (err: any) {
  throw new Error(`Failed to load config.json: ${err.message}`);
}

// Input validation
import Joi from "joi";
const schema = Joi.object({
  targetPath: Joi.string().required(),
  backupsPath: Joi.string().required(),
  backupName: Joi.string(),
  bans: Joi.object({
    directories: Joi.array().items(Joi.string()),
    files: Joi.array().items(Joi.string()),
    patterns: Joi.array().items(Joi.string()),
  }),
});

const { error, value: sanitized } = schema.validate(configFile);

if (error) {
  throw new Error(`Invalid config.json: ${error.message}`);
}

const configPaths = ["targetPath", "backupsPath"];

for (const path of configPaths) {
  if (!existsSync(sanitized[path])) {
    throw new Error(`Path ${sanitized[path]} does not exist`);
  }
}

const forbiddenChars = '/\\?%*:|"<>';

if (sanitized.backupName) {
  for (const char of forbiddenChars) {
    if (sanitized.backupName.includes(char)) {
      throw new Error(
        `backupName cannot contain ${char}`
      );
    }
  }
}

export const config: Required<GlobalConfig> = {
  targetPath: sanitized.targetPath,
  backupsPath: sanitized.backupsPath,
  backupName: sanitized.backupName ?? "backup",
  bans: {
    directories: sanitized.bans?.directories ?? [],
    files: sanitized.bans?.files ?? [],
    patterns: sanitized.bans?.patterns ?? [],
  },
};

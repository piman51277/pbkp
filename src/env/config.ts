export type GlobalConfig = {
  targetPath: string;
  cachePath: string;
  backupsPath: string;
  backupName?: string;
  bans?: {
    directories?: string[];
    files?: string[];
    patterns?: string[];
  };
};

import { existsSync, readFileSync } from "fs";
import { ErrorType, createError } from "../util/errors.js";

let configFile: any = {};

// Attempt to load the config file
try {
  let rawFile = readFileSync("./config.json", "utf-8");
  configFile = JSON.parse(rawFile);
} catch (err: any) {
  throw createError(ErrorType.ConfigError, "Cannot find or parse config.json");
}

// Input validation
import Joi from "joi";
const schema = Joi.object({
  targetPath: Joi.string().required(),
  cachePath: Joi.string().required(),
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
  throw createError(
    ErrorType.ConfigError,
    `config.json is not valid:\n${error}`
  );
}

const configPaths = ["targetPath", "cachePath", "backupsPath"];

for (const path of configPaths) {
  if (!existsSync(sanitized[path])) {
    createError(ErrorType.ConfigError, `${sanitized[path]} does not exist.`);
  }
}

const forbiddenChars = '/\\?%*:|"<>';

if (sanitized.backupName) {
  for (const char of forbiddenChars) {
    if (sanitized.backupName.includes(char)) {
      throw createError(
        ErrorType.ConfigError,
        `backupName cannot contain ${char}`
      );
    }
  }
}

export const config: GlobalConfig = {
  targetPath: sanitized.targetPath,
  cachePath: sanitized.cachePath,
  backupsPath: sanitized.backupsPath,
  backupName: sanitized.backupName ?? "backup",
  bans: {
    directories: sanitized.bans?.directories ?? [],
    files: sanitized.bans?.files ?? [],
    patterns: sanitized.bans?.patterns ?? [],
  },
};

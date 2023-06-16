export enum ErrorType {
  ConfigError = "ConfigError",
}

export function createError(type: ErrorType, message: string): Error {
  return new Error(`${ErrorType[type]}: ${message}`);
}

import { config } from "../env/config";

/**
 * Generate a name for a backup bundle
 * @param {boolean} isRelative whether the backup is relative
 * @returns {string} generated name
 */
export function generateName(isRelative: boolean): string {
  const base = config.backupName ?? "backup";

  const date = new Date();
  //do year-month-day
  const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate() + 1}`;

  //add a 4 char string for current time
  const timeString = date.toTimeString().slice(0, 5).replace(":", "");

  const bundleName = `${base}-${dateString}-${timeString}${isRelative ? "-rel" : ""}.pmbk4`;
  return bundleName;
}
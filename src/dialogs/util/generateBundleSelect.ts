import { findSavedBundles } from "../../helpers/restore/findSavedBundles";

type ChoiceCompat = {
  name: string;
  value: string;
}

/**
 * Utility function to cap string length
 * @param {string} str input string
 * @param {number} len desired length
 * @returns {string} capped string
 */
function capString(str: string, len: number): string {
  if (str.length > len) {
    return str.slice(0, len - 3) + "...";
  }
  return str.padEnd(len, " ");
}

/**
 * Utility function to convert time into relative time
 * @param {number} time time in seconds
 * @returns {string} relative time
 */
function relativeTime(time: number): string {
  const diff = Date.now() / 1000 - time;
  if (diff < 60) { //60 seconds
    return `${Math.floor(diff)} seconds ago`;
  } else if (diff < 3600) { //60 minutes
    return `${Math.floor(diff / 60)} minutes ago`;
  } else if (diff < 86400) { //24 hours
    return `${Math.floor(diff / 3600)} hours ago`;
  } else if (diff < 604800) { //7 days
    return `${Math.floor(diff / 86400)} days ago`;
  } else if (diff < 2592000) { //30 days
    return `${Math.floor(diff / 604800)} weeks ago`;
  }
  return `${Math.floor(diff / 2592000)} months ago`;
}

/**
 * Generate a list of choices for the bundle selection
 * @param {boolean} onlyPin only show pinned bundles. Optional, default false
 * @returns {ChoiceCompat[]} formatted list of choices
 */
export async function generateBundleSelect(onlyPin = false): Promise<ChoiceCompat[]> {
  const bundles = await findSavedBundles();

  const choices: ChoiceCompat[] = [];
  for (const [name, meta] of bundles) {
    if (onlyPin && meta.isRelative) {
      continue;
    }

    choices.push({
      name: `${capString(name, 40)} (${relativeTime(meta.created)})`,
      value: name,
    });
  }

  return choices;
}
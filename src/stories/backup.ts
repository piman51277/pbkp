import { confirmBundle } from "../routines/confirmBundle.js";
import { discoverFiles } from "../routines/discover.js";
import { loadFiles } from "../routines/loadFiles.js";
import { packFiles } from "../routines/pack.js";
import { zipBundle } from "../routines/zip.js";
import { addContents } from "../util/addContents.js";
import { addMetadata } from "../util/addMetadata.js";

export async function backup(cli = false) {
  const files = await discoverFiles();
  const [hydrated, stats] = await loadFiles(files);
  if (!cli) await confirmBundle([hydrated, stats]);
  let bundle = await packFiles(hydrated);
  bundle = addContents(bundle, hydrated);
  bundle = addMetadata(bundle);
  zipBundle(bundle);
}

import Zip from "adm-zip";
import os from "os";
import { BundleMeta } from "../types/BundleMeta.js";
export function addMetadata(bundle: Zip): Zip {
  const metadata: BundleMeta = {
    version: "v3",
    packed: Date.now(),
    system: os.hostname(),
  };

  bundle.addFile("metadata", Buffer.from(JSON.stringify(metadata)));

  return bundle;
}

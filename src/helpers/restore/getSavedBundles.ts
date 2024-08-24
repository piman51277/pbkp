import { createReadStream, readdirSync } from "fs";
import { config } from "../../env/config";
import { join } from "path";
import { extractMeta } from "../meta";
import { BundleMetadata } from "../../types";


/**
 * Finds all valid saved bundles
 * @returns {Promise<string[]>} paths to the bundles
 */
export async function findSavedBundles(): Promise<[string, BundleMetadata][]> {
  //first get everything in the backups directory
  const candidates = readdirSync(config.backupsPath, { withFileTypes: true });
  const paths: [string, BundleMetadata][] = [];

  //iterate over the candidates
  for (const candidate of candidates) {
    //if the candidate is a file
    if (candidate.isFile()) {

      //check if it has the .pmbk4 extension
      if (!candidate.name.endsWith(".pmbk4")) continue;

      //create a read stream for the candidate
      const candidateStream = createReadStream(join(config.backupsPath, candidate.name));

      //start reading data until we have at least 74 bytes
      const header = await new Promise<Buffer>((resolve, reject) => {
        let data = Buffer.alloc(0);
        candidateStream.on("data", (chunk) => {
          data = Buffer.concat([data, chunk as Buffer]);
          if (data.length >= 74) {
            candidateStream.close();
            resolve(data);
          }
        });
        candidateStream.on("error", reject);
      });

      //parse the header
      try {
        paths.push([candidate.name, extractMeta(header)[0]]);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      catch (err: any) {
        //if the header is invalid, skip this candidate
        continue;
      }
    }
  }

  //sort the paths by date
  paths.sort((a, b) => a[1].created - b[1].created);

  return paths;
}
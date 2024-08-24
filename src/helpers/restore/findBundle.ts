import { createReadStream, readdirSync } from "fs";
import { config } from "../../env/config";
import { join } from "path";
import { extractMeta } from "../meta";


/**
 * Finds the path of a bundle with a given hash
 * @param {string} targetHash hash to search for
 * @returns {Promise<string | null>} path to the bundle, or null if not found
 */
export async function findBundle(targetHash: string): Promise<string | null> {
  //first get everything in the backups directory
  const candidates = readdirSync(config.backupsPath, { withFileTypes: true });

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
        const meta = extractMeta(header)[0];

        //check hash
        if (meta.hash === targetHash) {
          return join(config.backupsPath, candidate.name);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      catch (err: any) {
        //if the header is invalid, skip this candidate
        continue;
      }
    }
  }

  return null;
}
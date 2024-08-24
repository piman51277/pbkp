import { BundleMetadata } from "../types";

/**
 * Metadata header format
 * uint32   0x50424b50 (PBKP) Magic number indicating a pmkp file
 * uint8    0x04       (4) Version number
 * uint8    0x00       (0) Flags. 0x01 = relative backup
 * byte[32] --         SHA-256 hash of the bundle
 * uint32   --         Creation timestamp
 * byte[32] --         SHA-256 hash of the parent bundle (undef if pinned)
 */

/**
 * Appends metadata to a buffer
 * @param {Buffer} raw source buffer
 * @param {BundleMetadata} meta metadata to attach
 * @returns {Buffer} buffer with metadata attached
 */
export function attachMeta(raw: Buffer, meta: BundleMetadata): Buffer {
  const buf = Buffer.alloc(72);
  buf.write("PBKP", 0, 4, "utf8");
  buf.writeUInt8(4, 4);
  buf.writeUInt8(meta.isRelative ? 1 : 0, 5);
  buf.write(meta.hash, 6, 32, "hex");
  buf.writeUInt32LE(meta.created, 38);
  if (meta.parent) buf.write(meta.parent, 42, 32, "hex");
  return Buffer.concat([buf, raw]);
}

/**
 * Extracts metadata from a buffer
 * @param {Buffer} raw source buffer
 * @returns {[BundleMetadata, Buffer]} metadata and buffer without metadata
 * @throws {Error} if the buffer is not a valid pmkp file
 */
export function extractMeta(raw: Buffer): [BundleMetadata, Buffer] {
  if (raw.toString("utf8", 0, 4) !== "PBKP") {
    throw new Error("Not a valid pmkp file");
  }

  const isRelative = raw.readUInt8(5) === 1;
  const hash = raw.toString("hex", 6, 38);
  const created = raw.readUInt32LE(38);
  const parent = isRelative ? raw.toString("hex", 42, 74) : null;
  const buf = raw.subarray(74);

  return [{ hash, created, isRelative, parent }, buf];
}
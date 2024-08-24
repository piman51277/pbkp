type HydratedFNode = {
  hash: string;
  size: number;
  discriminator: string;
};

export type FNode = Partial<HydratedFNode> & {
  name: string;
  relPath: string | null; //for use when evaluating existing files
  isFile: boolean;
  children: number[];
  id: number; //must be unique
};

export type DirTree = FNode[];

export type BundleMetadata = {
  hash: string;
  created: number;
  isRelative: boolean;
  parent: string | null;
}
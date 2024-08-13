type HydratedFNode = {
  hash: string;
  size: number;
  discriminator: string;
};

export type FNode = Partial<HydratedFNode> & {
  name: string;
  fsPath: string | null; //for use when evaluating existing files
  isFile: boolean;
  children: number[];
  id: number; //must be unique
};

export type DirTree = FNode[];

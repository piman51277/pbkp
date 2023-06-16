const units = [
  { unit: "B", size: 1 },
  { unit: "KB", size: 1024 },
  { unit: "MB", size: 1024 ** 2 },
  { unit: "GB", size: 1024 ** 3 },
  { unit: "TB", size: 1024 ** 4 },
];

export function sizeString(size: number): string {
  for (const { unit, size: unitSize } of units) {
    if (size < unitSize * 1024) {
      return `${(size / unitSize).toFixed(2)} ${unit}`;
    }
  }
  return `${size} B`;
}

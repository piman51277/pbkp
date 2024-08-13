export const config = {
  targetPath: "/home/piman/data/programming",
  cachePath: "/home/piman/data/.pbkpcache",
  backupsPath: "/home/piman/backup/programming",
  backupName: "programming-",
  bans: {
    directories: ["node_modules", ".venv", "view"],
    files: [
      "bundle.js",
      ".elf",
      ".pkl",
      ".csv",
      ".bindat",
      "perf.data",
      "perf.data.old",
    ],
    patterns: ["pbkp/config.json", "t2radar/data"],
  },
};

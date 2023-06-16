# PBKP - Piman's BacKuP

## Description

This is my personal backup utility, used to store the contents of my projects folder in a compressed archive.

This utility produces two kinds of backups: `pinned`, and `relative`.

> TL;DR Always use pinned backups, unless you want to quickly transfer files.

### Pinned

Pinned backups contain all of the files in the target directory. They are meant to be taken regularly, and should be prioritized for restoration.

### Relative

Relative backups contain only the files that have changed since a certain pinned backup. They are meant for quick transfer of files between machines, and should not be prioritized for restoration.

*NOTE: Relative backups cannot be made with a relative backup as the parent.*

> **WARNING: Relative backups cannot be restored without the parent pinned backup.**

## Configuration

The configuration file is located at `./config.json`. It uses the format:

```json
{
  "targetPath": "", // The path to the folder to be backed up
  "cachePath": "", // The path to the cache folder
  "backupsPath": "", // The path to the backups folder
  "backupName": "", // What to prepend to the backup name
  "bans": {
    "directories": [""], // directories to ignore
    "files": [""], // files to ignore
    "patterns": [""] //patterns (directory/file or directory/directory) to ignore
  }
}
```

## Usage

Requires NodeJS 18.0.0 or higher.

```bash
git clone https://github.com/piman51277/pbkp.git
cd pbkp
npm install
npm run build
node out/index.js
```

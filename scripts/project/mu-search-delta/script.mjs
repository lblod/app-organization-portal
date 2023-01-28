import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

const CONFIG_PATH = process.env.SEARCH_CONFIG_PATH || '/data/app/config/search-migrations';
const HISTORY_PATH = process.env.HISTORY_PATH || CONFIG_PATH + '/.migration_history';
const MU_SEARCH_DELTA_URL = process.env.MU_SEARCH_DELTA_URL || 'http://search/update';
const SEARCH_MIGRATIONS_DIR = process.env.SEARCH_MIGRATIONS_DIR || CONFIG_PATH;
const CONTENT_TYPE_JSON_API = { 'Content-Type': 'application/vnd.api+json' };

function read(fd, len) {
  const buff = Buffer.alloc(len),
    pos = 0, offset = 0;
  fs.readSync(fd, buff, offset, len, pos);
  return buff.toString();
}

function readDirRecursive(dir, filterHistory = [], filterExtensions = ["json"]) {
  const files = fs.readdirSync(dir);

  const resultFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      resultFiles.push(...(readDirRecursive(`${dir}/${file}`)));
    } else if (filterExtensions.some((ext) => filePath.endsWith(ext)) && !filterHistory.includes(filePath)) {
      resultFiles.push({
        time: stat.atimeMs,
        file: filePath,
      });
    } else {
      console.log(`filter file ${filePath}`);
    }
  }

  return resultFiles.sort((a, b) => a.time - b.time);
}

// main

async function main() {
  const historyFileDescriptor = fs.openSync(HISTORY_PATH, 'a+');
  const historyFileLen = fs.statSync(HISTORY_PATH).size;

  const history = read(historyFileDescriptor, historyFileLen)
    .split(/\r?\n/)
    .map((f) => f.trim())
    .filter((f) => f?.length);

  const fileNames = readDirRecursive(SEARCH_MIGRATIONS_DIR, history);
  console.log(`processing ${fileNames.length} migration(s)`);
  for (const { file } of fileNames) {
    console.log(`Current file: ${file}`);
    const payload = JSON.parse(fs.readFileSync(file));

    const r = await fetch(MU_SEARCH_DELTA_URL, {
      method: "post",
      body: payload,
      headers: CONTENT_TYPE_JSON_API,
    });
    console.log(`"[Delta]=> Status: ${r.status} `);
    if (r.status == 200) {
      const responseBody = await r.json();
      console.log(`response ${JSON.stringify(responseBody)}`);
      fs.appendFileSync(HISTORY_PATH, file + '\n');
    } else {
      console.error("an error occurred. check your migration, make sure mu search is running.");
      process.exit(1);
    }
  }
}

main().then(() => console.log("Done."));

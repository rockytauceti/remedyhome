/**
 * Downloads all 285 Kent Repertory HTML files from the MIT-licensed
 * kent_repertory_etl GitHub repo into scripts/kent/raw/
 *
 * Usage: npm run kent:download
 */
import * as fs from "fs";
import * as path from "path";

const BASE_URL =
  "https://raw.githubusercontent.com/aadjones/kent_repertory_etl/main/data/raw/";
const OUT_DIR = path.join(__dirname, "raw");
const CONCURRENCY = 8;

// Files follow the pattern kent{XXXX}_P{XXXX+1}.html
// where XXXX goes 0000, 0005, 0010 ... 1420 (steps of 5, 285 files total)
function buildFileList(): string[] {
  const files: string[] = [];
  for (let n = 0; n <= 1420; n += 5) {
    const num = n.toString().padStart(4, "0");
    const page = (n + 1).toString();
    files.push(`kent${num}_P${page}.html`);
  }
  return files;
}

async function downloadFile(filename: string): Promise<void> {
  const dest = path.join(OUT_DIR, filename);
  if (fs.existsSync(dest)) return; // skip if already downloaded

  const url = BASE_URL + filename;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  SKIP ${filename} (HTTP ${res.status})`);
    return;
  }
  const text = await res.text();
  fs.writeFileSync(dest, text, "latin1"); // Kent files use windows-1252 encoding
}

async function runPool(tasks: (() => Promise<void>)[], concurrency: number) {
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < tasks.length) {
      const task = tasks[i++];
      await task();
    }
  });
  await Promise.all(workers);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = buildFileList();
  console.log(`Downloading ${files.length} HTML files (${CONCURRENCY} concurrent)...`);

  let done = 0;
  const tasks = files.map((f) => async () => {
    await downloadFile(f);
    done++;
    if (done % 50 === 0 || done === files.length) {
      console.log(`  ${done}/${files.length}`);
    }
  });

  await runPool(tasks, CONCURRENCY);
  console.log("Done. Files saved to scripts/kent/raw/");
}

main().catch((e) => { console.error(e); process.exit(1); });

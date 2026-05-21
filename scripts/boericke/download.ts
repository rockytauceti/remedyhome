/**
 * Phase 5 (Boericke): Download all per-remedy HTML pages from homeoint.org.
 *
 * Source list: shubhamoy/bmm-search gh-pages app.js (688 remedies)
 * Output:      scripts/boericke/raw/{abbrev}.html
 *
 * Usage: npm run boericke:download
 */
import * as fs from "fs";
import * as path from "path";

const APP_JS_URL =
  "https://raw.githubusercontent.com/shubhamoy/bmm-search/gh-pages/js/app.js";
const OUT_DIR = path.join(__dirname, "raw");
const CONCURRENCY = 6;
const RETRY = 3;

interface BoerickeEntry {
  url: string;
  abbrev: string; // e.g. "acon", "nat-m"
}

async function fetchAppJs(): Promise<BoerickeEntry[]> {
  const res = await fetch(APP_JS_URL);
  const text = await res.text();
  // Extract all 'link':'http://homeoint.org/books/boericmm/X/Y.htm' values
  const re = /'link':'(http:\/\/homeoint\.org\/books\/boericmm\/[^']+\.htm)'/g;
  const entries: BoerickeEntry[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const url = m[1];
    const abbrev = path.basename(url, ".htm"); // e.g. "acon", "nat-m"
    entries.push({ url, abbrev });
  }
  return entries;
}

async function downloadFile(entry: BoerickeEntry, attempt = 1): Promise<void> {
  const dest = path.join(OUT_DIR, `${entry.abbrev}.html`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 200) return; // already downloaded

  try {
    const res = await fetch(entry.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; homeopathy-app-ETL/1.0)" },
    });
    if (!res.ok) {
      console.warn(`  SKIP ${entry.abbrev} (HTTP ${res.status})`);
      return;
    }
    const html = await res.text();
    fs.writeFileSync(dest, html, "latin1");
  } catch (err) {
    if (attempt < RETRY) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      return downloadFile(entry, attempt + 1);
    }
    console.warn(`  FAIL ${entry.abbrev}: ${err}`);
  }
}

async function runPool(entries: BoerickeEntry[]): Promise<void> {
  let idx = 0;
  let done = 0;

  async function worker() {
    while (idx < entries.length) {
      const entry = entries[idx++];
      await downloadFile(entry);
      done++;
      if (done % 50 === 0) {
        process.stdout.write(`  ${done}/${entries.length} downloaded\r`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("Fetching remedy list from bmm-search...");
  const entries = await fetchAppJs();
  console.log(`  ${entries.length} remedies found`);
  console.log("Downloading Boericke pages from homeoint.org...");
  await runPool(entries);
  console.log(`\nDone. Files in ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

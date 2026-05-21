/**
 * Phase 5 (Boericke): Parse downloaded HTML pages into structured JSON.
 *
 * Input:  scripts/boericke/raw/{abbrev}.html
 * Output: prisma/seeds/data/boericke.json
 *
 * Extraction logic:
 *   - Full text: all readable text, whitespace-normalized
 *   - Keynotes: blue italic text (<font color="#0000ff"><i>…</i></font>)
 *     concatenated as a summary
 *   - Name: title heading from the page (e.g. "ACONITUM NAPELLUS")
 *
 * Abbreviation normalisation (homeoint slug → our DB convention):
 *   "acon"    → "Acon"      (capitalize first letter)
 *   "nat-m"   → "Nat-m"
 *   "kali-bi" → "Kali-bi"
 *
 * Usage: npm run boericke:parse
 */
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

const RAW_DIR = path.join(__dirname, "raw");
const OUT_FILE = path.join(__dirname, "../../prisma/seeds/data/boericke.json");

export interface BoerickeRecord {
  abbreviation: string; // normalised, e.g. "Nat-m"
  slug: string;         // raw slug from URL, e.g. "nat-m"
  name: string;         // full name from page, e.g. "NATRUM MURIATICUM"
  fullText: string;     // all text, whitespace-cleaned
  keynotes: string;     // blue-italic keynote phrases joined by "; "
}

/** Convert homeoint slug to our DB abbreviation convention */
function normalizeAbbrev(slug: string): string {
  // Capitalize the first letter only; keep hyphens and rest as-is
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function parseFile(filePath: string): BoerickeRecord | null {
  const slug = path.basename(filePath, ".html");
  let html: string;
  try {
    html = fs.readFileSync(filePath, "latin1");
  } catch {
    return null;
  }

  const $ = cheerio.load(html);

  // ── Name: look for the large coloured heading (e.g. <font size="5" color="#800000">)
  let name = "";
  $("font[color='#800000']").each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 2 && !t.includes("HOMOEOPATHIC") && !t.includes("MATERIA")) {
      name = t.split("\n")[0].trim();
      return false; // break
    }
  });
  if (!name) {
    // Fallback: first <b> with all-caps content
    $("b").each((_, el) => {
      const t = $(el).text().trim();
      if (t === t.toUpperCase() && t.length > 3 && /^[A-Z\s]+$/.test(t)) {
        name = t;
        return false;
      }
    });
  }
  if (!name) name = slug.toUpperCase();

  // ── Keynotes: blue italic text (<font color="#0000ff"><i>…</i></font>)
  const keynoteFragments: string[] = [];
  $("font[color='#0000ff'] i, i font[color='#0000ff']").each((_, el) => {
    const t = collapseWhitespace($(el).text());
    if (t.length > 3) keynoteFragments.push(t);
  });
  const keynotes = keynoteFragments.join("; ");

  // ── Full text: strip all tags, normalise whitespace
  // Remove script/style noise first
  $("script, style, a[href]").remove();
  const rawText = $.root().text();
  const fullText = collapseWhitespace(rawText);

  // Skip very short pages (likely 404s or empty stubs)
  if (fullText.length < 100) return null;

  return {
    abbreviation: normalizeAbbrev(slug),
    slug,
    name,
    fullText,
    keynotes,
  };
}

function main() {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith(".html"));
  console.log(`Parsing ${files.length} Boericke HTML files...`);

  const records: BoerickeRecord[] = [];
  let skipped = 0;

  for (const file of files) {
    const record = parseFile(path.join(RAW_DIR, file));
    if (!record) {
      skipped++;
      continue;
    }
    records.push(record);
  }

  records.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));

  fs.writeFileSync(OUT_FILE, JSON.stringify(records, null, 2));
  console.log(`  ${records.length} records written to ${OUT_FILE}`);
  if (skipped) console.log(`  ${skipped} files skipped (empty/error)`);
}

main();

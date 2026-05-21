/**
 * Parses the 285 downloaded Kent Repertory HTML files into a flat JSON array
 * of rubric records with remedy grades.
 *
 * Grade encoding in HTML:
 *   <b><font COLOR="#ff0000">Acon.</font></b>  →  grade 3 (keynote)
 *   <i><font COLOR="#0000ff">Bell.</font></i>  →  grade 2 (notable)
 *   plain text                                 →  grade 1 (minor)
 *
 * Output: prisma/seeds/data/kent.json
 * Usage:  npm run kent:parse
 */
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import type { RubricRecord, RemedyGrade } from "./types";

const RAW_DIR = path.join(__dirname, "raw");
const OUT_FILE = path.join(__dirname, "../../prisma/seeds/data/kent.json");

// ─── Abbreviation normalisation ──────────────────────────────────────────────

function normalizeAbbr(raw: string): string {
  const s = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "") // strip trailing period
    .trim();
  if (s.length < 2) return "";
  // Discard anything that looks like a cross-reference or page marker
  if (/^(see|refer|p\.|page|\d)/i.test(s)) return "";
  // Capitalise first character; preserve hyphens (e.g. "kali-c" → "Kali-c")
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Remedy list parser ───────────────────────────────────────────────────────

/**
 * Walks the HTML tree of the remedy section and returns a list of
 * { abbreviation, grade } entries. When the same abbreviation appears
 * more than once, keeps the highest grade.
 */
function parseRemedyHtml(html: string): RemedyGrade[] {
  const $ = cheerio.load("<div>" + html + "</div>");
  const seen = new Map<string, 1 | 2 | 3>();

  function walk(node: cheerio.AnyNode, grade: 1 | 2 | 3) {
    if (node.type === "text") {
      for (const part of node.data.split(",")) {
        const abbr = normalizeAbbr(part);
        if (!abbr) continue;
        const prev = seen.get(abbr) ?? 0;
        if (grade > prev) seen.set(abbr, grade);
      }
    } else if (node.type === "tag") {
      let g: 1 | 2 | 3 = grade;
      if (node.name === "b") g = 3;
      else if (node.name === "i" && grade < 2) g = 2;
      for (const child of node.children ?? []) walk(child as cheerio.AnyNode, g);
    }
  }

  const div = $("div")[0];
  for (const child of div.children) walk(child as cheerio.AnyNode, 1);

  return Array.from(seen.entries()).map(([abbreviation, grade]) => ({
    abbreviation,
    grade,
  }));
}

// ─── Chapter detection ────────────────────────────────────────────────────────

const KNOWN_CHAPTERS = new Set([
  "MIND", "HEAD", "EYE", "VISION", "EAR", "HEARING", "NOSE", "FACE",
  "MOUTH", "TEETH", "THROAT", "EXTERNAL THROAT", "STOMACH", "ABDOMEN",
  "RECTUM", "STOOL", "BLADDER", "KIDNEYS", "PROSTATE GLAND", "URETHRA",
  "URINE", "MALE GENITALIA/SEX", "FEMALE GENITALIA/SEX",
  "LARYNX AND TRACHEA", "RESPIRATION", "COUGH", "EXPECTORATION",
  "CHEST", "BACK", "EXTREMITIES", "SLEEP", "CHILL", "FEVER",
  "PERSPIRATION", "SKIN", "GENERALS",
]);

function detectChapter($: cheerio.CheerioAPI): string {
  // Primary: look for <a href="kent[letters].htm"> (e.g. kentmind.htm → MIND)
  let chapter = "";
  $("a").each((_, el) => {
    if (chapter) return;
    const href = ($(el).attr("href") ?? "").toLowerCase();
    // Matches both "kentmind.htm" and "../kentrep/kentmind.htm"
    if (/(?:^|\/)kent[a-z]+\.htm/.test(href)) {
      const text = $(el).text().trim().toUpperCase();
      if (text && text !== "KENT") chapter = text;
    }
  });
  if (chapter) return chapter;

  // Fallback: first <p> whose trimmed text matches a known chapter name
  $("p").each((_, el) => {
    if (chapter) return;
    const text = $(el).text().trim().toUpperCase().replace(/\s+/g, " ");
    if (KNOWN_CHAPTERS.has(text)) chapter = text;
  });

  return chapter || "UNKNOWN";
}

// ─── Recursive rubric parser ──────────────────────────────────────────────────

/**
 * Iterates sibling children of a <dir> element in document order.
 * A <p> containing " : " is a rubric — it sets `lastPath`.
 * The <dir> immediately following inherits `lastPath` as its parent.
 */
function parseDir(
  $: cheerio.CheerioAPI,
  dirEl: cheerio.Element,
  parentPath: string,
  category: string,
  out: RubricRecord[]
) {
  let lastPath: string | null = null;

  for (const child of dirEl.children) {
    if ((child as cheerio.Element).type !== "tag") continue;
    const el = child as cheerio.Element;

    if (el.name === "p") {
      const pHtml = $(el).html() ?? "";
      const sep = pHtml.indexOf(" : ");

      if (sep === -1) {
        // No remedy separator — may be a section header (cross-page continuation
        // or parent rubric without direct remedies). Use it to set parent context.
        const text = cheerio
          .load(pHtml)
          .text()
          .replace(/\(.*?\)/g, "")
          .replace(/[-─=]+/g, "")
          .replace(/\s+/g, " ")
          .trim();
        if (text.length > 1 && !/^(see|refer|p\.|page)/i.test(text)) {
          lastPath = parentPath
            ? `${parentPath} > ${text}`
            : `${category} > ${text}`;
        }
        continue;
      }

      // Label: everything before " : ", stripped of HTML and cross-references
      const labelHtml = pHtml.slice(0, sep);
      const label = cheerio
        .load(labelHtml)
        .text()
        .replace(/\(.*?\)/g, "")   // strip "(See X)" cross-references
        .replace(/\s+/g, " ")
        .trim();

      if (!label) continue;

      // Remedy section: everything after " : "
      const remedyHtml = pHtml.slice(sep + 3);
      const remedies = parseRemedyHtml(remedyHtml);

      const rubricPath = parentPath
        ? `${parentPath} > ${label}`
        : `${category} > ${label}`;

      lastPath = rubricPath;

      if (remedies.length > 0) {
        out.push({ path: rubricPath, label, category, remedies });
      }
    }

    if (el.name === "dir") {
      // Fall back to parentPath for double-nested <dir><dir> wrappers with no preceding <p>
      parseDir($, el, lastPath ?? parentPath, category, out);
    }
  }
}

// ─── Per-file parser ──────────────────────────────────────────────────────────

function parseFile(html: string): RubricRecord[] {
  const $ = cheerio.load(html);
  const category = detectChapter($);
  const out: RubricRecord[] = [];

  // The content lives in the second-level <dir>: body > dir > dir
  // We call parseDir exactly once from the top; recursion handles sub-rubrics.
  // Calling it on every matching dir would re-process nested dirs as top-level.
  let contentDir = $("body > dir > dir").first();
  if (contentDir.length === 0) {
    // Some pages have a single level: body > dir
    contentDir = $("body > dir").first();
  }
  if (contentDir.length > 0) {
    parseDir($, contentDir[0] as cheerio.Element, "", category, out);
  }

  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error("Raw HTML directory not found. Run: npm run kent:download");
    process.exit(1);
  }

  const files = fs
    .readdirSync(RAW_DIR)
    .filter((f) => f.endsWith(".html"))
    .sort(); // kent0000_P1 < kent0005_P6 < ...

  console.log(`Parsing ${files.length} HTML files...`);

  const allRubrics: RubricRecord[] = [];
  const pathsSeen = new Set<string>();
  let skippedDupes = 0;

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(RAW_DIR, files[i]);
    const html = fs.readFileSync(filePath, "latin1");

    const records = parseFile(html);

    for (const rec of records) {
      if (pathsSeen.has(rec.path)) {
        skippedDupes++;
        continue;
      }
      pathsSeen.add(rec.path);
      allRubrics.push(rec);
    }

    if ((i + 1) % 50 === 0 || i + 1 === files.length) {
      console.log(`  ${i + 1}/${files.length} files — ${allRubrics.length} rubrics so far`);
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(allRubrics, null, 2));

  const byChapter: Record<string, number> = {};
  for (const r of allRubrics) {
    byChapter[r.category] = (byChapter[r.category] ?? 0) + 1;
  }

  console.log(`\nDone! ${allRubrics.length} rubrics extracted (${skippedDupes} dupes skipped)`);
  console.log("\nRubrics per chapter:");
  for (const [ch, count] of Object.entries(byChapter).sort()) {
    console.log(`  ${ch.padEnd(30)} ${count}`);
  }
  console.log(`\nOutput: ${OUT_FILE}`);
}

main();

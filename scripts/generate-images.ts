/**
 * Generate botanical images for RemedyHome using Google Gemini (Imagen 3).
 *
 * Usage:
 *   GEMINI_API_KEY=your_key_here npx tsx scripts/generate-images.ts
 *
 * Outputs PNG files to public/
 */

import fs from "fs";
import path from "path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌  GEMINI_API_KEY is not set. Add it to .env.local and export it, or prefix the command.");
  process.exit(1);
}

const IMAGES: Array<{ name: string; prompt: string }> = [
  {
    name: "botanical-hero.png",
    prompt:
      "A soft watercolor painting of medicinal herbs and botanicals: chamomile, arnica, calendula, and belladonna berries arranged naturally on a warm cream parchment background. Painterly, botanical illustration style, muted earthy greens and warm golds, no text, no labels, square format, high quality.",
  },
  {
    name: "botanical-profiles.png",
    prompt:
      "A delicate botanical watercolor illustration of a small family of plant silhouettes — tall, medium, and small herbs side by side, representing different family members. Warm sage green tones on cream background. Minimal, elegant, no text.",
  },
  {
    name: "botanical-research.png",
    prompt:
      "A soft watercolor botanical illustration of an open vintage herbalism book surrounded by loose dried herbs and flowers — chamomile, lavender, echinacea. Warm parchment tones with forest green accents. No text, elegant, square format.",
  },
  {
    name: "botanical-journal.png",
    prompt:
      "A delicate watercolor illustration of a small leather-bound journal with pressed botanical flowers and leaves tucked between its pages. Soft cream and forest green palette. Minimal, peaceful, no text.",
  },
];

async function generateImage(name: string, prompt: string): Promise<void> {
  console.log(`\n→ Generating ${name}…`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          outputMimeType: "image/png",
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error for ${name}: ${response.status} — ${err}`);
  }

  const data = await response.json() as {
    predictions: Array<{ bytesBase64Encoded: string }>;
  };

  const b64 = data.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error(`No image returned for ${name}`);

  const outPath = path.join(process.cwd(), "public", name);
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  console.log(`  ✓ Saved → public/${name}`);
}

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

  for (const img of IMAGES) {
    await generateImage(img.name, img.prompt);
  }

  console.log("\n✅  All images generated. Run `npx next build` to verify.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

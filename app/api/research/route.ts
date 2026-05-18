import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symptoms } = await req.json();
  if (!symptoms?.trim()) return NextResponse.json({ error: "Symptoms required" }, { status: 400 });

  // Fetch all remedies from DB to give Claude context
  const remedies = await prisma.remedy.findMany({
    select: { abbreviation: true, name: true, commonName: true, kingdom: true, description: true },
    orderBy: { name: "asc" },
  });

  const remedyList = remedies
    .map((r) => `- ${r.name} (${r.abbreviation})${r.commonName ? ` / ${r.commonName}` : ""}: ${r.description}`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an expert classical homeopath. A patient presents with the following symptoms:

"${symptoms}"

Based on these symptoms, recommend the top 3-5 homeopathic remedies from the list below. For each remedy, explain specifically why it matches the symptoms described, what keynote symptoms make it a good fit, and suggest a typical potency for an acute situation.

Available remedies:
${remedyList}

Respond in valid JSON only — no markdown, no explanation outside the JSON. Format:
{
  "matches": [
    {
      "abbreviation": "Ars",
      "name": "Arsenicum Album",
      "matchScore": 95,
      "whyItMatches": "...",
      "keySymptoms": ["...", "..."],
      "suggestedPotency": "30C",
      "notes": "..."
    }
  ]
}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON object from response regardless of surrounding text or code fences
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "No JSON found in AI response", raw }, { status: 500 });
  }

  try {
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
  }
}

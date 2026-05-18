import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/user";

const client = new Anthropic();

const DEFAULT_SOURCE_SLUGS = ["kent", "boericke", "boericke-new", "castro-handbook", "ullman-children", "hershoff-remedies"];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { symptoms } = await req.json();
  if (!symptoms?.trim()) return NextResponse.json({ error: "Symptoms required" }, { status: 400 });

  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's source preferences, fall back to defaults
  const prefs = await prisma.sourcePreference.findMany({
    where: { userId: user.id, enabled: true },
    include: { source: true },
  });

  let activeSources;
  if (prefs.length > 0) {
    activeSources = prefs.map((p) => p.source);
  } else {
    activeSources = await prisma.source.findMany({
      where: { slug: { in: DEFAULT_SOURCE_SLUGS } },
    });
  }

  const sourceNames = activeSources.map((s) => s.name);

  // Fetch all remedies from DB
  const remedies = await prisma.remedy.findMany({
    select: { abbreviation: true, name: true, commonName: true, kingdom: true, description: true },
    orderBy: { name: "asc" },
  });

  const remedyList = remedies
    .map((r) => `- ${r.name} (${r.abbreviation})${r.commonName ? ` / ${r.commonName}` : ""}: ${r.description}`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    tools: [
      {
        name: "recommend_remedies",
        description: "Return the top homeopathic remedy matches for the given symptoms",
        input_schema: {
          type: "object" as const,
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  abbreviation: { type: "string" },
                  name: { type: "string" },
                  matchScore: { type: "number" },
                  whyItMatches: { type: "string" },
                  keySymptoms: { type: "array", items: { type: "string" } },
                  suggestedPotency: { type: "string" },
                  notes: { type: "string" },
                  sources: {
                    type: "array",
                    items: { type: "string" },
                    description: "Which of the active source books support this recommendation",
                  },
                },
                required: ["abbreviation", "name", "matchScore", "whyItMatches", "keySymptoms", "suggestedPotency", "sources"],
              },
            },
          },
          required: ["matches"],
        },
      },
    ],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: `You are an expert classical homeopath. A patient presents with the following symptoms:

"${symptoms}"

Based on these symptoms, use the recommend_remedies tool to return the top 3-5 homeopathic remedies from the list below. For each remedy:
- Explain specifically why it matches the symptoms
- List the key symptom indicators
- Suggest a typical potency for an acute situation
- List which of the following active reference sources would support this recommendation: ${sourceNames.join(", ")}

Available remedies:
${remedyList}`,
      },
    ],
  });

  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "No tool response from AI" }, { status: 500 });
  }

  return NextResponse.json(toolUse.input);
}

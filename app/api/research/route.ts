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

  // Use tool_use to guarantee structured JSON output
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
                },
                required: ["abbreviation", "name", "matchScore", "whyItMatches", "keySymptoms", "suggestedPotency"],
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

Based on these symptoms, use the recommend_remedies tool to return the top 3-5 homeopathic remedies from the list below. For each remedy, explain specifically why it matches the symptoms described, what keynote symptoms make it a good fit, and suggest a typical potency for an acute situation.

Available remedies:
${remedyList}`,
      },
    ],
  });

  // Extract the tool use result
  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return NextResponse.json({ error: "No tool response from AI" }, { status: 500 });
  }

  return NextResponse.json(toolUse.input);
}

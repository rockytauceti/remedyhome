import { NextRequest, NextResponse } from "next/server";
import { updateOutcome } from "@/app/actions/testing";

export async function POST(req: NextRequest) {
  const { entryId, outcome } = await req.json();
  const result = await updateOutcome(entryId, outcome);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

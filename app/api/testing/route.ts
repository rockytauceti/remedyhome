import { NextRequest, NextResponse } from "next/server";
import { addToTesting } from "@/app/actions/testing";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const result = await addToTesting(data);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

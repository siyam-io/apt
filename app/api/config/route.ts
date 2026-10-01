import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { readConfig } from "@/lib/config";

export async function GET(_request: NextRequest) {
  const config = readConfig();
  return NextResponse.json({
    configured: Boolean(getPool()),
    hosted: config.production,
    maxTimeout: 45000,
  });
}

export const dynamic = "force-dynamic";

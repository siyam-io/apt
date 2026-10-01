import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return echo(request);
}

export async function POST(request: NextRequest) {
  return echo(request);
}

export async function PUT(request: NextRequest) {
  return echo(request);
}

export async function PATCH(request: NextRequest) {
  return echo(request);
}

export async function DELETE(request: NextRequest) {
  return echo(request);
}

export async function HEAD(request: NextRequest) {
  return echo(request);
}

export async function OPTIONS(request: NextRequest) {
  return echo(request);
}

async function echo(request: NextRequest) {
  let body: unknown = null;
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    try {
      body =
        request.headers.get("content-type")?.includes("application/json")
          ? await request.json()
          : await request.text();
    } catch {
      body = null;
    }
  }
  const url = new URL(request.url);
  return NextResponse.json({
    message: "Your API workbench is ready.",
    method,
    query: Object.fromEntries(url.searchParams),
    body:
      body === null
        ? null
        : body instanceof Object && !Array.isArray(body) && !(body instanceof FormData)
          ? body
          : body,
  });
}

export const dynamic = "force-dynamic";

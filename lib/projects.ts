export function nameOf(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100) {
    const err = new Error("Name must contain 1–100 characters.") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  return value.trim();
}

const secretRe = /authorization|cookie|token|secret|password|api[-_]?key/i;

function cleanRows(rows: unknown, maxLength = 256): { key: string; value: string; enabled: boolean }[] {
  if (!Array.isArray(rows) || rows.length > 100) {
    const err = new Error("Use at most 100 headers or parameters.") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  return rows
    .map((row) => {
      if (
        !row ||
        typeof row !== "object" ||
        !("key" in row) ||
        typeof (row as any).key !== "string" ||
        typeof (row as any).value !== "string" ||
        (row as any).key.length > 256 ||
        (row as any).value.length > 8192
      ) {
        const err = new Error("Invalid header or parameter.") as Error & { status: number };
        err.status = 400;
        throw err;
      }
      return {
        key: (row as any).key.trim(),
        value: (row as any).value,
        enabled: (row as any).enabled !== false,
      };
    })
    .filter((row) => row.key && !secretRe.test(row.key));
}

export interface CleanRequestData {
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  params: { key: string; value: string; enabled: boolean }[];
  body: string;
  timeout: number;
}

export interface CleanRequestResult {
  name: string;
  data: CleanRequestData;
}

export function cleanRequest(input: unknown, history = false): CleanRequestResult {
  const name = nameOf(input && (input as any).name);
  let url: URL;
  try {
    url = new URL((input as any).url);
  } catch {
    const err = new Error("Enter a valid HTTP(S) URL.") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    const err = new Error("Only HTTP(S) URLs are supported.") as Error & { status: number };
    err.status = 400;
    throw err;
  }
  url.username = "";
  url.password = "";
  [...url.searchParams.keys()]
    .filter((key) => secretRe.test(key))
    .forEach((key) => url.searchParams.delete(key));

  const method = (input as any).method || "GET";
  if (
    !["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(method)
  ) {
    const err = new Error("Invalid method.") as Error & { status: number };
    err.status = 400;
    throw err;
  }

  const headers = cleanRows((input as any).headers);
  const params = cleanRows((input as any).params);

  const timeout = (input as any).timeout ?? 30000;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 45000) {
    const err = new Error("Timeout must be 1–45000 ms.") as Error & { status: number };
    err.status = 400;
    throw err;
  }

  if (typeof (input as any).body !== "string") {
    const err = new Error("Request body must be text.") as Error & { status: number };
    err.status = 400;
    throw err;
  }

  const data: CleanRequestData = {
    method,
    url: url.href,
    headers,
    params,
    body: history ? "" : (input as any).body || "",
    timeout,
  };

  if (Buffer.byteLength(JSON.stringify(data)) > 256 * 1024) {
    const err = new Error("Saved request exceeds 256 KB.") as Error & { status: number };
    err.status = 400;
    throw err;
  }

  return { name, data };
}

export function serialize(row: any): CleanRequestData & { id: string; name: string; updatedAt: Date } {
  return {
    ...row.data,
    id: row.id,
    name: row.name,
    updatedAt: row.updated_at,
  };
}

export const SUPPORTED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

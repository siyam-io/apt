export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type ApiOptions = Omit<RequestInit, "body"> & {
  /** Serialized as JSON with an application/json content type. */
  json?: unknown;
  body?: BodyInit | null;
};

let onUnauthorized: (() => void) | null = null;

/** Registered by the workspace store so expired sessions drop back to sign-in. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { json, body, headers, ...rest } = options;
  let response: Response;
  try {
    response = await fetch(path, {
      ...rest,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-APT-Client": "web",
        ...headers,
      },
      body: json === undefined ? body : JSON.stringify(json),
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(
      "Cannot reach server. Check connection and try again.",
      0,
    );
  }

  const data: unknown =
    response.status === 204
      ? {}
      : await response.json().catch(() => ({
          error: `Server returned ${response.status}. Please try again.`,
        }));

  if (!response.ok) {
    const message =
      (data as { error?: string })?.error || "Request failed. Try again.";
    if (response.status === 401 && !path.includes("/auth/login")) {
      onUnauthorized?.();
    }
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

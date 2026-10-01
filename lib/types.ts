export type User = { id: string; name: string; email: string };

export type Project = { id: string; name: string; created_at?: string };

export type KeyValueRow = { key: string; value: string; enabled: boolean };

export const emptyRow = (): KeyValueRow => ({
  key: "",
  value: "",
  enabled: true,
});

export type HttpMethod =
  "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

export type SavedRequest = {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValueRow[];
  params: KeyValueRow[];
  body: string;
  timeout: number;
  updatedAt?: string;
};

/** Shape sent to the API when creating or updating a request. */
export type RequestDraft = Omit<SavedRequest, "id" | "updatedAt">;

/** A stored entry for a project the user owns. */
export type RequestCollection = "requests" | "history";

export type ProxyResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  duration: number;
};

export type ServerConfig = {
  configured: boolean;
  hosted: boolean;
  maxTimeout: number;
};

export type AuthType = "none" | "bearer" | "key";

export const LIST_MODES = ["saved", "history"] as const;
export type ListMode = (typeof LIST_MODES)[number];

export const RESPONSE_TABS = ["body", "headers"] as const;
export type ResponseTab = (typeof RESPONSE_TABS)[number];

export type EnvironmentVariable = {
  key: string;
  value: string;
  enabled: boolean;
};

/**
 * Interpolates variables formatted as {var} or {{var}} in a given string.
 * Example: "{baseUrl}/api/users" with baseUrl="http://localhost:3001" -> "http://localhost:3001/api/users"
 */
export function interpolateVariables(
  text: string,
  variables: EnvironmentVariable[] | Record<string, string>,
): string {
  if (!text) return text;
  const lookup: Record<string, string> = Array.isArray(variables)
    ? Object.fromEntries(
        variables
          .filter((v) => v.enabled && v.key.trim().length > 0)
          .map((v) => [v.key.trim(), v.value]),
      )
    : variables;

  return text.replace(
    /\{\{([a-zA-Z0-9_.-]+)\}\}|\{([a-zA-Z0-9_.-]+)\}/g,
    (match, doubleKey, singleKey) => {
      const key = doubleKey || singleKey;
      if (Object.prototype.hasOwnProperty.call(lookup, key)) {
        return lookup[key];
      }
      return match;
    },
  );
}

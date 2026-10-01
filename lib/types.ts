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

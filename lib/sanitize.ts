import type { RequestDraft } from "./types";

/** Mirrors the server-side classifier so secrets never leave the browser. */
export const SENSITIVE_KEY =
  /authorization|cookie|token|secret|password|api[-_]?key/i;

export function sanitize(draft: RequestDraft): RequestDraft {
  const clean: RequestDraft = {
    ...draft,
    headers: draft.headers.filter((row) => !SENSITIVE_KEY.test(row.key)),
    params: draft.params.filter((row) => !SENSITIVE_KEY.test(row.key)),
  };

  try {
    const url = new URL(clean.url);
    [...url.searchParams.keys()]
      .filter((key) => SENSITIVE_KEY.test(key))
      .forEach((key) => url.searchParams.delete(key));
    url.username = "";
    url.password = "";
    clean.url = url.href;
  } catch {
    /* Invalid URLs can still be saved so they remain editable. */
  }

  return clean;
}

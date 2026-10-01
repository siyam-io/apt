import dns from "node:dns/promises";
import net from "node:net";
import ipaddr from "ipaddr.js";
import { Agent } from "undici";

export function isPublicAddress(address: string): boolean {
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}

export interface DispatcherOptions {
  signal?: AbortSignal;
  lookup?: (hostname: string, options?: any) => Promise<any>;
}

export async function publicDispatcher(
  url: URL,
  { signal, lookup = dns.lookup }: DispatcherOptions = {},
) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  signal?.throwIfAborted();
  let abort: (() => void) | undefined;
  let addresses: Array<{ address: string; family: number }>;
  try {
    const resolving = net.isIP(host)
      ? Promise.resolve([{ address: host, family: net.isIP(host) }])
      : lookup(host, { all: true });
    addresses = signal
      ? await Promise.race([
          resolving,
          new Promise<never>((_, reject) => {
            abort = () => reject(signal.reason);
            signal.addEventListener("abort", abort, { once: true });
          }),
        ])
      : await resolving;
    signal?.throwIfAborted();
  } finally {
    if (abort && signal) signal.removeEventListener("abort", abort);
  }
  if (
    !addresses.length ||
    addresses.some((item) => !isPublicAddress(item.address))
  ) {
    const error = new Error(
      "Hosted requests can only target public internet APIs. Run locally to test localhost or private networks.",
    ) as Error & { status: number };
    error.status = 400;
    throw error;
  }
  return new Agent({
    connect: {
      lookup: (hostname, options, callback) => {
        const selected = addresses.filter(
          (item) => !options.family || item.family === options.family,
        );
        if (!selected.length)
          return (callback as any)(new Error("No compatible public address."));
        return options.all
          ? callback(null, selected as any)
          : callback(null, selected[0].address, selected[0].family);
      },
    },
  });
}

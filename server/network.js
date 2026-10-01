import dns from "node:dns/promises";
import net from "node:net";
import ipaddr from "ipaddr.js";
import { Agent } from "undici";

export function isPublicAddress(address) {
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}
export async function publicDispatcher(
  url,
  { signal, lookup = dns.lookup } = {},
) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  signal?.throwIfAborted();
  let abort;
  let addresses;
  try {
    const resolving = net.isIP(host)
      ? Promise.resolve([{ address: host, family: net.isIP(host) }])
      : lookup(host, { all: true });
    addresses = signal
      ? await Promise.race([
          resolving,
          new Promise((resolve, reject) => {
            abort = () => reject(signal.reason);
            signal.addEventListener("abort", abort, { once: true });
          }),
        ])
      : await resolving;
    signal?.throwIfAborted();
  } finally {
    if (abort) signal.removeEventListener("abort", abort);
  }
  if (
    !addresses.length ||
    addresses.some((item) => !isPublicAddress(item.address))
  )
    throw Object.assign(
      new Error(
        "Hosted requests can only target public internet APIs. Run locally to test localhost or private networks.",
      ),
      { status: 400 },
    );
  return new Agent({
    connect: {
      lookup: (hostname, options, callback) => {
        const selected = addresses.filter(
          (item) => !options.family || item.family === options.family,
        );
        if (!selected.length)
          return callback(new Error("No compatible public address."));
        return options.all
          ? callback(null, selected)
          : callback(null, selected[0].address, selected[0].family);
      },
    },
  });
}

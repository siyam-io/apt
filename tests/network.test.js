import { isPublicAddress, publicDispatcher } from "../server/network.js";

test("DNS lookup respects request cancellation", async () => {
  const controller = new AbortController();
  const pending = publicDispatcher(new URL("https://slow.example"), {
    signal: controller.signal,
    lookup: () => new Promise(() => {}),
  });
  controller.abort();
  await expect(pending).rejects.toHaveProperty("name", "AbortError");
});

test.each([
  "127.0.0.1",
  "10.0.0.1",
  "192.168.1.1",
  "169.254.169.254",
  "0.0.0.0",
  "::1",
  "::ffff:127.0.0.1",
  "fc00::1",
  "fe80::1",
  "100.64.0.1",
  "224.0.0.1",
])("blocks private/reserved %s", (address) =>
  expect(isPublicAddress(address)).toBe(false),
);
test.each(["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"])(
  "allows public %s",
  (address) => expect(isPublicAddress(address)).toBe(true),
);

"use client";

import { useState } from "react";
import { Play, Copy, Check, Terminal, Clock, Database, ArrowRight } from "lucide-react";
import Link from "next/link";

export function QuickTester() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts/1");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>({
    status: 200,
    statusText: "OK",
    duration: 38,
    size: 292,
    body: JSON.stringify(
      {
        userId: 1,
        id: 1,
        title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
        body: "quia et suscipit suscipit recusandae consequuntur expedita et cum reprehenderit molestiae ut ut quas totam nostrum rerum est autem sunt rem eveniet architecto",
      },
      null,
      2,
    ),
  });
  const [copied, setCopied] = useState(false);

  const sampleEndpoints = [
    { name: "JSONPlaceholder Post #1", method: "GET", url: "https://jsonplaceholder.typicode.com/posts/1" },
    { name: "JSONPlaceholder Users", method: "GET", url: "https://jsonplaceholder.typicode.com/users/1" },
    { name: "JSONPlaceholder Comments", method: "GET", url: "https://jsonplaceholder.typicode.com/comments?postId=1" },
    { name: "Local Echo Probe", method: "GET", url: "/api/echo?demo=instant-test" },
  ];

  async function handleSend() {
    setLoading(true);
    const start = performance.now();
    try {
      const fullUrl = url.startsWith("http")
        ? url
        : `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;

      const res = await fetch("/api/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-APT-Client": "web",
        },
        body: JSON.stringify({
          url: fullUrl,
          method,
          headers: {},
          body: "",
          timeout: 10000,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResponse({
          status: res.status,
          statusText: "Error",
          duration: Math.round(performance.now() - start),
          size: 0,
          body: JSON.stringify(data, null, 2),
        });
      } else {
        setResponse(data);
      }
    } catch (err: any) {
      setResponse({
        status: 500,
        statusText: "Network Error",
        duration: Math.round(performance.now() - start),
        size: 0,
        body: JSON.stringify({ error: err.message || "Failed to dispatch request" }, null, 2),
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (response?.body) {
      navigator.clipboard.writeText(
        typeof response.body === "string" ? response.body : JSON.stringify(response.body, null, 2),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="chamfer w-full border border-border bg-card/80 p-6 glow-accent-sm backdrop-blur-md md:p-8">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="size-4 text-accent" />
          <span className="font-accent text-xs uppercase tracking-[0.25em] text-foreground">
            Live Interactive Console // Guest Ready
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sampleEndpoints.map((ep, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setMethod(ep.method);
                setUrl(ep.url);
              }}
              className="chamfer-xs bg-muted/70 px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-accent"
            >
              {ep.name}
            </button>
          ))}
        </div>
      </div>

      {/* Request Bar */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="chamfer-xs border border-border bg-background px-3 py-2.5 font-mono text-xs font-bold text-accent outline-none focus:border-accent"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>

        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/v1/resource"
            className="chamfer-xs w-full border border-border bg-background px-4 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="chamfer-xs flex items-center justify-center gap-2 border border-accent bg-accent px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-background transition-all hover:bg-accent/90 disabled:opacity-50 glow-accent-sm"
        >
          <Play className="size-3.5 fill-current" />
          <span>{loading ? "Sending..." : "Send Request"}</span>
        </button>
      </div>

      {/* Response Panel */}
      {response ? (
        <div className="mt-6 rounded-none border border-border/80 bg-background/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 font-mono text-xs">
            <div className="flex items-center gap-4">
              <span
                className={`font-bold ${
                  response.status >= 200 && response.status < 300
                    ? "text-accent"
                    : response.status >= 400
                      ? "text-destructive"
                      : "text-accent-tertiary"
                }`}
              >
                Status: {response.status} {response.statusText}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3" />
                {response.duration || 0} ms
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Database className="size-3" />
                {response.size || 0} B
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-accent transition-colors"
            >
              {copied ? <Check className="size-3 text-accent" /> : <Copy className="size-3" />}
              <span>{copied ? "Copied!" : "Copy Body"}</span>
            </button>
          </div>

          <pre className="mt-3 max-h-64 overflow-auto font-mono text-xs leading-relaxed text-foreground/90 scrollbar-thin">
            {typeof response.body === "string"
              ? response.body
              : JSON.stringify(response.body, null, 2)}
          </pre>
        </div>
      ) : null}

      {/* CTA Footer inside card */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
        <span className="font-mono text-xs text-muted-foreground">
          Need full headers, params, body editing, and request history?
        </span>
        <Link
          href="/workbench"
          className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-accent hover:underline"
        >
          <span>Open Full Workbench</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

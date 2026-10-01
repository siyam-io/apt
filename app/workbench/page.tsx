import { App } from "@/components/app";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Workbench — APT",
  description:
    "Interactive Postman-style HTTP client with guest support, local drafts, and cloud PostgreSQL sync.",
};

export default function WorkbenchPage() {
  return <App />;
}

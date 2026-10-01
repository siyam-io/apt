"use client";

import { AccountScreen } from "@/components/account/account-screen";
import { DialogProvider } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { useWorkspace, WorkspaceProvider } from "@/lib/workspace";

function BootScreen() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="chamfer border border-border bg-card px-10 py-8 text-center glow-accent-sm">
        <p className="font-accent text-[10px] uppercase tracking-[0.4em] text-accent">
          apt://boot
        </p>
        <p className="mt-4 font-mono text-sm text-foreground/80">
          establishing link
          <span
            aria-hidden
            className="ml-1.5 inline-block h-3.5 w-2 animate-blink bg-accent align-middle"
          />
        </p>
      </div>
    </main>
  );
}

function Surface() {
  const { status, notice } = useWorkspace();

  return (
    <>
      {status === "boot" ? (
        <BootScreen />
      ) : status === "account" ? (
        <AccountScreen />
      ) : (
        <WorkspaceShell />
      )}
      <Notice message={notice} />
    </>
  );
}

export function App() {
  return (
    <DialogProvider>
      <WorkspaceProvider>
        <Surface />
      </WorkspaceProvider>
    </DialogProvider>
  );
}

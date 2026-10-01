"use client";

import {
  FolderPlus,
  LogOut,
  Pencil,
  Plus,
  Radio,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { LIST_MODES } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { RequestList } from "./request-list";

const LIST_LABEL = { saved: "Collections", history: "History" } as const;

export function Sidebar() {
  const {
    user,
    projects,
    projectId,
    selectProject,
    createProject,
    renameProject,
    deleteProject,
    newRequest,
    search,
    setSearch,
    listMode,
    setListMode,
    saved,
    history,
    hasLegacyImport,
    importLegacy,
    logout,
    sending,
    saving,
    switching,
  } = useWorkspace();

  const busy = sending || saving || switching;
  const list = listMode === "saved" ? saved : history;

  return (
    <aside className="relative z-10 flex w-full shrink-0 flex-col gap-5 border-r border-border bg-card/60 p-5 backdrop-blur-sm lg:h-dvh lg:w-[21rem] lg:sticky lg:top-0 lg:overflow-y-auto">
      <div className="flex items-center gap-3">
        <span className="chamfer-xs grid size-9 shrink-0 place-items-center bg-accent font-display text-sm font-bold text-background glow-accent-sm">
          a
        </span>
        <span className="flex flex-col">
          <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-foreground">
            apt
          </span>
          <span className="font-accent text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            api workbench
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="font-accent text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          project
        </span>
        <Select
          aria-label="Project"
          size="sm"
          value={projectId ?? ""}
          disabled={busy}
          onChange={(event) => void selectProject(event.target.value)}
        >
          {projects.length ? (
            projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))
          ) : (
            <option value="">Create your first project</option>
          )}
        </Select>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            surface="bg-card"
            disabled={busy}
            onClick={() => void createProject()}
          >
            <FolderPlus className="size-3.5" strokeWidth={1.5} />
            New
          </Button>
          <Button
            variant="outline"
            size="sm"
            surface="bg-card"
            disabled={busy || !projectId}
            onClick={() => void renameProject()}
          >
            <Pencil className="size-3.5" strokeWidth={1.5} />
            Rename
          </Button>
          <Button
            variant="destructive"
            size="sm"
            surface="bg-card"
            disabled={busy || !projectId}
            onClick={() => void deleteProject()}
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
            Delete
          </Button>
        </div>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        surface="bg-card"
        disabled={busy || !projectId}
        onClick={newRequest}
      >
        <Plus className="size-4" strokeWidth={1.5} />
        New request
        <kbd className="ml-1 hidden font-accent text-[9px] tracking-[0.2em] text-accent-secondary/70 sm:inline">
          alt n
        </kbd>
      </Button>

      <label className="chamfer-sm flex items-center gap-2 bg-border p-px transition-[background-color,filter] focus-within:bg-accent focus-within:glow-accent-sm">
        <span className="chamfer-sm flex w-full items-center gap-2 bg-input px-3">
          <Search
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground"
            strokeWidth={1.5}
          />
          <input
            aria-label="Find a request"
            placeholder="Find a request…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-h-10 w-full bg-transparent font-mono text-xs text-accent outline-none placeholder:text-muted-foreground focus-visible:shadow-none"
          />
        </span>
      </label>

      <div className="flex items-center border-b border-border">
        {LIST_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setListMode(mode)}
            className={cn(
              "-mb-px min-h-11 border-b-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
              listMode === mode
                ? "border-b-accent text-accent"
                : "border-b-transparent text-muted-foreground hover:text-accent",
            )}
          >
            {LIST_LABEL[mode]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-accent text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {listMode === "saved" ? "my collection" : "recent requests"}
        </span>
        <span className="font-accent text-[10px] tracking-[0.2em] text-accent">
          {list.length}
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <RequestList />
      </div>

      {hasLegacyImport ? (
        <Button
          variant="ghost"
          size="sm"
          surface="bg-card"
          className="w-full"
          disabled={busy || !projectId}
          onClick={() => void importLegacy()}
        >
          <Upload className="size-3.5" strokeWidth={1.5} />
          Import browser requests
        </Button>
      ) : null}

      <div className="mt-auto flex items-center gap-2.5 border-t border-border pt-4">
        <Radio
          aria-hidden
          className="size-3.5 shrink-0 text-accent animate-flicker"
          strokeWidth={1.5}
        />
        <span
          title={user?.email}
          className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground"
        >
          {user?.name}
        </span>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex min-h-11 shrink-0 items-center gap-1.5 px-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-destructive"
        >
          <LogOut className="size-3.5" strokeWidth={1.5} />
          sign out
        </button>
      </div>
    </aside>
  );
}

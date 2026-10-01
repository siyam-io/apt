"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, ApiError, messageOf, setUnauthorizedHandler } from "./api";
import { useDialog } from "@/components/ui/dialog";
import { sanitize } from "./sanitize";
import {
  emptyRow,
  type AuthType,
  type KeyValueRow,
  type ListMode,
  type Project,
  type ProxyResponse,
  type RequestDraft,
  type ResponseTab,
  type SavedRequest,
  type ServerConfig,
  type User,
  type EnvironmentVariable,
  interpolateVariables,
} from "./types";

const LEGACY_STORAGE_KEY = "apt-workspace-v1";
const MAX_TIMEOUT = 45000;

export type AuthState = { type: AuthType; key: string; token: string };

export type AccountState = {
  mode: "login" | "register";
  error: string;
  busy: boolean;
  setup: string;
};

export type ResponseState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "text"; text: string; tone: "muted" | "error" }
  | { status: "done"; data: ProxyResponse };

export type AppStatus = "boot" | "account" | "workspace";

const newDraft = (): RequestDraft => ({
  name: "Untitled request",
  method: "GET",
  url: "",
  params: [emptyRow()],
  headers: [emptyRow()],
  body: "",
  timeout: 30000,
});

const newAuth = (): AuthState => ({
  type: "none",
  key: "X-API-Key",
  token: "",
});

type Store = {
  status: AppStatus;
  config: ServerConfig | null;
  account: AccountState;
  user: User | null;
  projects: Project[];
  projectId: string | null;
  switching: boolean;
  saved: SavedRequest[];
  history: SavedRequest[];
  listMode: ListMode;
  search: string;
  activeId: string | null;
  form: RequestDraft;
  auth: AuthState;
  response: ResponseState;
  responseTab: ResponseTab;
  pretty: boolean;
  sending: boolean;
  saving: boolean;
  notice: string | null;
  notify: (message: string) => void;
  hasLegacyImport: boolean;
  focusToken: number;
  setListMode: (mode: ListMode) => void;
  setSearch: (value: string) => void;
  setResponseTab: (tab: ResponseTab) => void;
  setPretty: (value: boolean) => void;
  updateForm: (patch: Partial<RequestDraft>) => void;
  updateAuth: (patch: Partial<AuthState>) => void;
  openAccount: (mode?: "login" | "register") => void;
  closeAccount: () => void;
  isGuest: boolean;
  setAccountMode: (mode: "login" | "register") => void;
  submitAccount: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  createProject: () => Promise<void>;
  renameProject: () => Promise<void>;
  deleteProject: () => Promise<void>;
  loadRequest: (item: SavedRequest, editing: boolean) => void;
  newRequest: () => void;
  saveRequest: () => Promise<void>;
  deleteRequest: (item: SavedRequest, mode: ListMode) => Promise<void>;
  send: () => Promise<void>;
  /** Loads the echo request and sends it as one action. */
  runExample: () => Promise<void>;
  cancelSend: () => void;
  formatBody: () => void;
  importLegacy: () => Promise<void>;
  variables: EnvironmentVariable[];
  setVariables: React.Dispatch<React.SetStateAction<EnvironmentVariable[]>>;
  addVariable: (key?: string, value?: string) => void;
  updateVariable: (index: number, patch: Partial<EnvironmentVariable>) => void;
  deleteVariable: (index: number) => void;
  resolveVariables: (text: string) => string;
};

const WorkspaceContext = createContext<Store | null>(null);

export function useWorkspace() {
  const store = useContext(WorkspaceContext);
  if (!store)
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return store;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { confirmAction, requestName } = useDialog();

  const [status, setStatus] = useState<AppStatus>("boot");
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [account, setAccount] = useState<AccountState>({
    mode: "login",
    error: "",
    busy: false,
    setup: "",
  });
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [saved, setSaved] = useState<SavedRequest[]>([]);
  const [history, setHistory] = useState<SavedRequest[]>([]);
  const [listMode, setListMode] = useState<ListMode>("saved");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<RequestDraft>(newDraft);
  const [auth, setAuth] = useState<AuthState>(newAuth);
  const [response, setResponse] = useState<ResponseState>({ status: "idle" });
  const [responseTab, setResponseTab] = useState<ResponseTab>("body");
  const [pretty, setPretty] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasLegacyImport, setHasLegacyImport] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const [variables, setVariables] = useState<EnvironmentVariable[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("apt-variables");
        if (stored) return JSON.parse(stored);
      } catch { }
      return [
        {
          key: "baseUrl",
          value: window.location.origin,
          enabled: true,
        },
      ];
    }
    return [
      {
        key: "baseUrl",
        value: "http://localhost:3001",
        enabled: true,
      },
    ];
  });

  const variablesRef = useRef(variables);
  useEffect(() => {
    variablesRef.current = variables;
    try {
      localStorage.setItem("apt-variables", JSON.stringify(variables));
    } catch { }
  }, [variables]);

  const addVariable = useCallback((key = "", value = "") => {
    setVariables((prev) => [...prev, { key, value, enabled: true }]);
  }, []);

  const updateVariable = useCallback(
    (index: number, patch: Partial<EnvironmentVariable>) => {
      setVariables((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const deleteVariable = useCallback((index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resolveVariables = useCallback(
    (text: string) => interpolateVariables(text, variables),
    [variables],
  );

  const controllerRef = useRef<AbortController | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const booted = useRef(false);
  /** Read inside async flows to detect that the user moved on mid-flight. */
  const projectIdRef = useRef<string | null>(null);
  const activeIdRef = useRef<string | null>(null);

  projectIdRef.current = projectId;
  activeIdRef.current = activeId;

  const notify = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 4000);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      controllerRef.current?.abort();
    },
    [],
  );

  const resetForm = useCallback(() => {
    setActiveId(null);
    setForm(newDraft());
    setAuth(newAuth());
    setResponse({ status: "idle" });
  }, []);

  const enterGuest = useCallback(() => {
    setUser(null);
    const guestProject: Project = {
      id: "local-guest",
      name: "Guest Workspace",
      created_at: new Date().toISOString(),
    };
    setProjects([guestProject]);
    setProjectId("local-guest");
    try {
      const rawSaved = localStorage.getItem("apt-guest-saved");
      if (rawSaved) setSaved(JSON.parse(rawSaved));
      const rawHistory = localStorage.getItem("apt-guest-history");
      if (rawHistory) setHistory(JSON.parse(rawHistory));
    } catch {
      /* LocalStorage optional */
    }
    setStatus("workspace");
  }, []);

  const openAccount = useCallback((mode: "login" | "register" = "login") => {
    setAccount((current) => ({ ...current, mode, error: "" }));
    setStatus("account");
  }, []);

  const closeAccount = useCallback(() => {
    setStatus("workspace");
  }, []);

  const signOut = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setUser(null);
    resetForm();
    enterGuest();
  }, [enterGuest, resetForm]);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const refreshRequests = useCallback(async (id: string | null) => {
    setSaved([]);
    setHistory([]);
    if (!id) return;
    if (id === "local-guest") {
      try {
        const rawSaved = localStorage.getItem("apt-guest-saved");
        if (rawSaved) setSaved(JSON.parse(rawSaved));
        const rawHistory = localStorage.getItem("apt-guest-history");
        if (rawHistory) setHistory(JSON.parse(rawHistory));
      } catch { }
      return;
    }
    const [collection, recent] = await Promise.all([
      api<{ requests: SavedRequest[] }>(`/api/projects/${id}/requests`),
      api<{ requests: SavedRequest[] }>(`/api/projects/${id}/history`),
    ]);
    if (projectIdRef.current !== id) return;
    setSaved(collection.requests);
    setHistory(recent.requests);
  }, []);

  const selectProject = useCallback(
    async (id: string) => {
      setSwitching(true);
      setProjectId(id);
      setActiveId(null);
      setResponse({ status: "idle" });
      try {
        await refreshRequests(id);
      } finally {
        setSwitching(false);
      }
    },
    [refreshRequests],
  );

  const enter = useCallback(
    async (nextUser: User) => {
      setUser(nextUser);
      try {
        const data = await api<{ projects: Project[] }>("/api/projects");
        setProjects(data.projects);
        await selectProject(data.projects[0]?.id ?? null);
      } catch {
        enterGuest();
      }
      setStatus("workspace");
    },
    [enterGuest, selectProject],
  );

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      try {
        const serverConfig = await api<ServerConfig>("/api/config").catch(() => null);
        if (serverConfig) setConfig(serverConfig);
        if (serverConfig?.configured) {
          try {
            const data = await api<{ user: User }>("/api/auth/me");
            await enter(data.user);
            return;
          } catch {
            /* Not logged in -> Enter guest workspace! */
          }
        }
        enterGuest();
      } catch {
        enterGuest();
      }
    })();
  }, [enter, enterGuest]);

  useEffect(() => {
    try {
      setHasLegacyImport(Boolean(localStorage.getItem(LEGACY_STORAGE_KEY)));
    } catch {
      /* Browser storage is optional. */
    }
  }, []);

  const submitAccount = useCallback(
    async (email: string, password: string, name: string) => {
      setAccount((current) => ({ ...current, busy: true, error: "" }));
      try {
        const data = await api<{ user: User }>(
          `/api/auth/${account.mode === "register" ? "register" : "login"}`,
          { method: "POST", json: { email, password, name } },
        );
        await enter(data.user);
      } catch (error) {
        setAccount((current) => ({
          ...current,
          error: messageOf(error),
          busy: false,
        }));
        return;
      }
      setAccount((current) => ({ ...current, busy: false, error: "" }));
    },
    [account.mode, enter],
  );

  const logout = useCallback(async () => {
    if (sending || saving || switching) {
      notify("Wait for the current operation, or cancel the request.");
      return;
    }
    try {
      await api("/api/auth/logout", { method: "POST", json: {} });
      signOut();
    } catch (error) {
      notify(messageOf(error));
    }
  }, [notify, saving, sending, signOut, switching]);

  const isGuest = !user || projectId === "local-guest";

  const createProject = useCallback(async () => {
    if (isGuest) {
      notify("Sign in to create persistent cloud projects.");
      openAccount("register");
      return;
    }
    if (sending || saving || switching) {
      notify("Wait for the current operation, or cancel the request.");
      return;
    }
    const name = await requestName("Create project");
    if (!name?.trim()) return;
    setSwitching(true);
    try {
      const data = await api<{ project: Project }>("/api/projects", {
        method: "POST",
        json: { name },
      });
      setProjects((current) => [...current, data.project]);
      await selectProject(data.project.id);
    } catch (error) {
      notify(messageOf(error));
    } finally {
      setSwitching(false);
    }
  }, [isGuest, notify, openAccount, requestName, saving, selectProject, sending, switching]);

  const renameProject = useCallback(async () => {
    if (isGuest) {
      notify("Guest workspace cannot be renamed.");
      return;
    }
    if (sending || saving || switching || !projectId) {
      if (!projectId) return;
      notify("Wait for the current operation, or cancel the request.");
      return;
    }
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    const name = await requestName("Rename project", project.name);
    if (!name?.trim()) return;
    setSwitching(true);
    try {
      const data = await api<{ project: Project }>(
        `/api/projects/${project.id}`,
        { method: "PATCH", json: { name } },
      );
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id ? { ...item, ...data.project } : item,
        ),
      );
    } catch (error) {
      notify(messageOf(error));
    } finally {
      setSwitching(false);
    }
  }, [isGuest, notify, projectId, projects, requestName, saving, sending, switching]);

  const deleteProject = useCallback(async () => {
    if (isGuest) {
      notify("Guest workspace cannot be deleted.");
      return;
    }
    if (sending || saving || switching || !projectId) {
      if (!projectId) return;
      notify("Wait for the current operation, or cancel the request.");
      return;
    }
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    const confirmed = await confirmAction({
      title: "Delete project",
      description: `Delete project “${project.name}” and all its requests and history? This cannot be undone.`,
      action: "Delete",
    });
    if (!confirmed) return;
    setSwitching(true);
    try {
      await api(`/api/projects/${project.id}`, { method: "DELETE" });
      const remaining = projects.filter((item) => item.id !== project.id);
      setProjects(remaining);
      await selectProject(remaining[0]?.id ?? null);
    } catch (error) {
      notify(messageOf(error));
    } finally {
      setSwitching(false);
    }
  }, [
    confirmAction,
    isGuest,
    notify,
    projectId,
    projects,
    saving,
    selectProject,
    sending,
    switching,
  ]);

  const loadRequest = useCallback((item: SavedRequest, editing: boolean) => {
    setActiveId(editing ? item.id : null);
    setForm({
      name: item.name || "Untitled request",
      method: item.method || "GET",
      url: item.url || "",
      params: item.params?.length ? item.params : [emptyRow()],
      headers: item.headers?.length ? item.headers : [emptyRow()],
      body: item.body || "",
      timeout: item.timeout || 30000,
    });
    setAuth(newAuth());
    setResponse({ status: "idle" });
  }, []);

  const newRequest = useCallback(() => {
    loadRequest(
      {
        id: "",
        name: "Untitled request",
        method: "GET",
        url: "",
        params: [],
        headers: [],
        body: "",
        timeout: 30000,
      },
      false,
    );
    setFocusToken((token) => token + 1);
  }, [loadRequest]);

  const draft = useCallback((): RequestDraft => {
    const live = (rows: KeyValueRow[]) =>
      rows
        .map((row) => ({ ...row, key: row.key.trim() }))
        .filter((row) => row.key);
    return {
      ...form,
      name: form.name.trim() || "Untitled request",
      url: form.url.trim(),
      params: live(form.params),
      headers: live(form.headers),
      timeout: Number(form.timeout) || 30000,
    };
  }, [form]);

  const saveRequest = useCallback(async () => {
    if (!projectId) {
      notify("Create or select a project first.");
      return;
    }
    if (saving || switching || sending) {
      notify("Wait for the current operation.");
      return;
    }
    const payload = sanitize(draft());
    if (!form.name.trim() || !payload.url) {
      notify("Enter a request name and URL.");
      return;
    }

    if (isGuest) {
      const localItem: SavedRequest = {
        id: activeId || `guest-req-${Date.now()}`,
        name: form.name.trim() || "Untitled request",
        method: payload.method,
        url: payload.url,
        headers: payload.headers,
        params: payload.params,
        body: payload.body,
        timeout: payload.timeout,
        updatedAt: new Date().toISOString(),
      };
      setSaved((current) => {
        const index = current.findIndex((row) => row.id === localItem.id);
        const next =
          index >= 0
            ? current.map((r) => (r.id === localItem.id ? localItem : r))
            : [localItem, ...current];
        try {
          localStorage.setItem("apt-guest-saved", JSON.stringify(next));
        } catch { }
        return next;
      });
      setActiveId(localItem.id);
      notify("Request saved to local workspace.");
      return;
    }

    if (
      payload.body &&
      !(await confirmAction({
        title: "Save request body",
        description:
          "Save this request body to your database? Check it for passwords and other sensitive data first.",
        action: "Save",
      }))
    )
      return;

    setSaving(true);
    const editing = activeId;
    try {
      const data = await api<{ request: SavedRequest }>(
        `/api/projects/${projectId}/requests${editing ? `/${editing}` : ""}`,
        { method: editing ? "PUT" : "POST", json: payload },
      );
      setSaved((current) => {
        const index = current.findIndex((row) => row.id === data.request.id);
        if (index < 0) return [data.request, ...current];
        const next = [...current];
        next[index] = data.request;
        return next;
      });
      setActiveId(data.request.id);
      notify("Request saved to project.");
    } catch (error) {
      notify(messageOf(error));
    } finally {
      setSaving(false);
    }
  }, [
    activeId,
    confirmAction,
    draft,
    form.name,
    isGuest,
    notify,
    projectId,
    saving,
    sending,
    switching,
  ]);

  const deleteRequest = useCallback(
    async (item: SavedRequest, mode: ListMode) => {
      if (sending || saving || switching) {
        notify("Wait for the current operation.");
        return;
      }
      const confirmed = await confirmAction({
        title: "Delete request",
        description: `Delete request “${item.name}”?`,
        action: "Delete",
      });
      if (!confirmed) return;

      if (isGuest) {
        if (mode === "saved") {
          setSaved((current) => {
            const next = current.filter((row) => row.id !== item.id);
            try {
              localStorage.setItem("apt-guest-saved", JSON.stringify(next));
            } catch { }
            return next;
          });
          if (activeIdRef.current === item.id) resetForm();
        } else {
          setHistory((current) => {
            const next = current.filter((row) => row.id !== item.id);
            try {
              localStorage.setItem("apt-guest-history", JSON.stringify(next));
            } catch { }
            return next;
          });
        }
        notify("Removed from local workspace.");
        return;
      }

      setSaving(true);
      try {
        await api(
          `/api/projects/${projectId}/${mode === "saved" ? "requests" : "history"}/${item.id}`,
          { method: "DELETE" },
        );
        if (mode === "saved") {
          setSaved((current) => current.filter((row) => row.id !== item.id));
          if (activeIdRef.current === item.id) resetForm();
        } else {
          setHistory((current) => current.filter((row) => row.id !== item.id));
        }
      } catch (error) {
        notify(messageOf(error));
      } finally {
        setSaving(false);
      }
    },
    [confirmAction, isGuest, notify, projectId, resetForm, saving, sending, switching],
  );

  /**
   * The draft is passed in rather than read from state so callers that set the
   * form and send in the same tick (for example the example request) do not
   * race React's async state commit.
   */
  const performSend = useCallback(
    async (item: RequestDraft) => {
      if (!projectId) {
        notify("No workspace active.");
        return;
      }
      if (sending || saving || switching) return;

      let target: URL;
      try {
        let rawUrl = interpolateVariables(item.url.trim(), variablesRef.current);
        if (rawUrl.startsWith("/")) {
          rawUrl = `${window.location.origin}${rawUrl}`;
        } else if (!/^https?:\/\//i.test(rawUrl)) {
          rawUrl = `http://${rawUrl}`;
        }
        target = new URL(rawUrl);
        if (!["http:", "https:"].includes(target.protocol)) throw new Error();
      } catch {
        notify("Enter a valid HTTP or HTTPS URL.");
        return;
      }

      item.params
        .filter((row) => row.enabled)
        .forEach((row) => {
          const k = interpolateVariables(row.key, variablesRef.current);
          const v = interpolateVariables(row.value, variablesRef.current);
          if (k) target.searchParams.append(k, v);
        });

      const headers: Record<string, string> = {};
      item.headers
        .filter((row) => row.enabled)
        .forEach((row) => {
          const k = interpolateVariables(row.key, variablesRef.current);
          const v = interpolateVariables(row.value, variablesRef.current);
          if (k) headers[k] = v;
        });

      if (auth.type !== "none") {
        if (!auth.token.trim()) {
          notify("Enter your authentication secret.");
          return;
        }
        const key =
          auth.type === "bearer"
            ? "Authorization"
            : interpolateVariables(auth.key.trim(), variablesRef.current) || "X-API-Key";
        for (const name of Object.keys(headers)) {
          if (name.toLowerCase() === key.toLowerCase()) delete headers[name];
        }
        const resolvedToken = interpolateVariables(auth.token.trim(), variablesRef.current);
        headers[key] =
          auth.type === "bearer" ? `Bearer ${resolvedToken}` : resolvedToken;
      }

      const interpolatedBody = interpolateVariables(item.body, variablesRef.current);
      if (
        interpolatedBody &&
        !Object.keys(headers).some(
          (key) => key.toLowerCase() === "content-type",
        )
      ) {
        try {
          JSON.parse(interpolatedBody);
          headers["Content-Type"] = "application/json";
        } catch {
          /* Send raw text exactly as entered. */
        }
      }

      const controller = new AbortController();
      controllerRef.current = controller;
      setSending(true);
      setResponse({ status: "pending" });

      if (isGuest) {
        const localHist: SavedRequest = {
          id: `guest-hist-${Date.now()}`,
          name: item.name || "Untitled request",
          method: item.method,
          url: target.href,
          headers: item.headers,
          params: item.params,
          body: "",
          timeout: item.timeout,
          updatedAt: new Date().toISOString(),
        };
        setHistory((current) => {
          const next = [localHist, ...current].slice(0, 50);
          try {
            localStorage.setItem("apt-guest-history", JSON.stringify(next));
          } catch { }
          return next;
        });
      } else {
        try {
          const recorded = await api<{ request: SavedRequest }>(
            `/api/projects/${projectId}/history`,
            {
              method: "POST",
              json: { ...sanitize(item), body: "" },
              signal: controller.signal,
            },
          );
          if (projectIdRef.current === projectId) {
            setHistory((current) => [recorded.request, ...current].slice(0, 50));
          }
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            notify(`History not saved: ${messageOf(error)}`);
          }
        }
      }

      if (projectIdRef.current !== projectId) {
        setSending(false);
        return;
      }

      try {
        const data = await api<ProxyResponse>("/api/request", {
          method: "POST",
          json: {
            url: target.href,
            method: item.method,
            headers,
            body: interpolatedBody,
            timeout: item.timeout,
          },
          signal: controller.signal,
        });
        setResponse({ status: "done", data });
      } catch (error) {
        setResponse(
          (error as Error).name === "AbortError"
            ? { status: "text", text: "Request cancelled.", tone: "muted" }
            : { status: "text", text: messageOf(error), tone: "error" },
        );
      } finally {
        controllerRef.current = null;
        setSending(false);
      }
    },
    [auth, notify, projectId, saving, sending, switching, user],
  );

  const send = useCallback(() => performSend(draft()), [draft, performSend]);

  const runExample = useCallback(() => {
    const example: RequestDraft = {
      name: "Example echo",
      method: "GET",
      url: `${window.location.origin}/api/echo?hello=world`,
      params: [],
      headers: [],
      body: "",
      timeout: 30000,
    };
    loadRequest({ ...example, id: "" }, false);
    return performSend(example);
  }, [loadRequest, performSend]);

  const cancelSend = useCallback(() => controllerRef.current?.abort(), []);

  const formatBody = useCallback(() => {
    try {
      const parsed = JSON.parse(form.body);
      setForm((current) => ({
        ...current,
        body: JSON.stringify(parsed, null, 2),
      }));
    } catch {
      notify("Body is not valid JSON.");
    }
  }, [form.body, notify]);

  const importLegacy = useCallback(async () => {
    if (!projectId || saving || sending || switching) {
      notify("Select a project and finish the current operation first.");
      return;
    }
    const confirmed = await confirmAction({
      title: "Import browser requests",
      description:
        "Import old browser requests into this account and selected project? Bodies are omitted; original browser data stays on this machine.",
      action: "Import",
    });
    if (!confirmed) return;

    setSaving(true);
    let imported = 0;
    try {
      const legacy: unknown = JSON.parse(
        localStorage.getItem(LEGACY_STORAGE_KEY) || "{}",
      );
      const list = Array.isArray((legacy as { saved?: unknown }).saved)
        ? (legacy as { saved: SavedRequest[] }).saved
        : [];
      for (const item of list.slice(0, 500)) {
        const data = await api<{ request: SavedRequest }>(
          `/api/projects/${projectId}/requests`,
          {
            method: "POST",
            json: {
              ...item,
              body: "",
              timeout: Math.min(item.timeout || 30000, MAX_TIMEOUT),
            },
          },
        );
        setSaved((current) => [data.request, ...current]);
        imported += 1;
      }
      notify(`${imported} requests imported.`);
    } catch (error) {
      notify(`${imported} imported. ${messageOf(error)}`);
    } finally {
      setSaving(false);
    }
  }, [confirmAction, notify, projectId, saving, sending, switching]);

  const value = useMemo<Store>(
    () => ({
      status,
      config,
      account,
      user,
      projects,
      projectId,
      switching,
      saved,
      history,
      listMode,
      search,
      activeId,
      form,
      auth,
      response,
      responseTab,
      pretty,
      sending,
      saving,
      notice,
      notify,
      hasLegacyImport,
      focusToken,
      setListMode,
      setSearch,
      setResponseTab,
      setPretty,
      updateForm: (patch) => setForm((current) => ({ ...current, ...patch })),
      updateAuth: (patch) => setAuth((current) => ({ ...current, ...patch })),
      openAccount,
      closeAccount,
      isGuest,
      setAccountMode: (mode) =>
        setAccount((current) => ({ ...current, mode, error: "" })),
      submitAccount,
      logout,
      selectProject,
      createProject,
      renameProject,
      deleteProject,
      loadRequest,
      newRequest,
      saveRequest,
      deleteRequest,
      send,
      runExample,
      cancelSend,
      formatBody,
      importLegacy,
      variables,
      setVariables,
      addVariable,
      updateVariable,
      deleteVariable,
      resolveVariables,
    }),
    [
      openAccount,
      closeAccount,
      isGuest,
      account,
      activeId,
      auth,
      cancelSend,
      config,
      createProject,
      deleteProject,
      deleteRequest,
      focusToken,
      form,
      formatBody,
      hasLegacyImport,
      history,
      importLegacy,
      listMode,
      loadRequest,
      logout,
      newRequest,
      notice,
      notify,
      pretty,
      projectId,
      projects,
      renameProject,
      response,
      responseTab,
      runExample,
      saveRequest,
      saved,
      search,
      selectProject,
      send,
      sending,
      saving,
      status,
      submitAccount,
      switching,
      user,
      variables,
      addVariable,
      updateVariable,
      deleteVariable,
      resolveVariables,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

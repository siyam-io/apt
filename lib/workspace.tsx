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

  const signOut = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setUser(null);
    setProjectId(null);
    setProjects([]);
    setSaved([]);
    setHistory([]);
    setSending(false);
    setSaving(false);
    resetForm();
    setAccount((current) => ({ ...current, error: "", mode: "login" }));
    setStatus("account");
  }, [resetForm]);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const refreshRequests = useCallback(async (id: string | null) => {
    setSaved([]);
    setHistory([]);
    if (!id) return;
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
      const data = await api<{ projects: Project[] }>("/api/projects");
      setProjects(data.projects);
      await selectProject(data.projects[0]?.id ?? null);
      setStatus("workspace");
    },
    [selectProject],
  );

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      try {
        const serverConfig = await api<ServerConfig>("/api/config");
        setConfig(serverConfig);
        if (!serverConfig.configured) {
          setAccount((current) => ({
            ...current,
            setup:
              "Database setup needed: set DATABASE_URL, then run `npm run db:migrate`. On Vercel, also set API_URL to the deployed API address.",
          }));
          setStatus("account");
          return;
        }
        const data = await api<{ user: User }>("/api/auth/me");
        await enter(data.user);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setStatus("account");
          return;
        }
        setAccount((current) => ({ ...current, error: messageOf(error) }));
        setStatus("account");
      }
    })();
  }, [enter]);

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

  const createProject = useCallback(async () => {
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
  }, [notify, requestName, saving, selectProject, sending, switching]);

  const renameProject = useCallback(async () => {
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
  }, [notify, projectId, projects, requestName, saving, sending, switching]);

  const deleteProject = useCallback(async () => {
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
    [confirmAction, notify, projectId, resetForm, saving, sending, switching],
  );

  /**
   * The draft is passed in rather than read from state so callers that set the
   * form and send in the same tick (for example the example request) do not
   * race React's async state commit.
   */
  const performSend = useCallback(
    async (item: RequestDraft) => {
      if (!user || !projectId) {
        notify("Sign in and select a project first.");
        return;
      }
      if (sending || saving || switching) return;

      let target: URL;
      try {
        target = new URL(item.url);
        if (!["http:", "https:"].includes(target.protocol)) throw new Error();
      } catch {
        notify("Enter a valid HTTP or HTTPS URL.");
        return;
      }

      item.params
        .filter((row) => row.enabled)
        .forEach((row) => target.searchParams.append(row.key, row.value));

      const headers: Record<string, string> = {};
      item.headers
        .filter((row) => row.enabled)
        .forEach((row) => {
          headers[row.key] = row.value;
        });

      if (auth.type !== "none") {
        if (!auth.token.trim()) {
          notify("Enter your authentication secret.");
          return;
        }
        const key =
          auth.type === "bearer"
            ? "Authorization"
            : auth.key.trim() || "X-API-Key";
        for (const name of Object.keys(headers)) {
          if (name.toLowerCase() === key.toLowerCase()) delete headers[name];
        }
        headers[key] =
          auth.type === "bearer" ? `Bearer ${auth.token}` : auth.token;
      }

      if (
        item.body &&
        !Object.keys(headers).some(
          (key) => key.toLowerCase() === "content-type",
        )
      ) {
        try {
          JSON.parse(item.body);
          headers["Content-Type"] = "application/json";
        } catch {
          /* Send raw text exactly as entered. */
        }
      }

      const controller = new AbortController();
      controllerRef.current = controller;
      setSending(true);
      setResponse({ status: "pending" });

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
            body: item.body,
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
    }),
    [
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
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

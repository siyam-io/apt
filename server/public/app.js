import { api, workspace, initializeAccount } from "./account.js";
import { confirmAction } from "./dialog.js";
const $ = (id) => document.getElementById(id);
const storageKey = "apt-workspace-v1";
let saved = [];
let history = [];
let listMode = "saved";
let response = null;
let responseTab = "body";
let controller;
let activeRequestId = null;
let saving = false;
let noticeTimer;
const sensitive = /authorization|cookie|token|secret|password|api[-_]?key/i;

function notice(message) {
  $("notice").textContent = message;
  $("notice").hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    $("notice").hidden = true;
  }, 4000);
}
async function refreshRequests() {
  saved = [];
  history = [];
  load();
  renderList();
  if (!workspace.projectId) return;
  const id = workspace.projectId;
  const [collection, recent] = await Promise.all([
    api("/api/projects/" + id + "/requests"),
    api("/api/projects/" + id + "/history"),
  ]);
  if (workspace.projectId !== id || !workspace.user) return;
  saved = collection.requests;
  history = recent.requests;
  renderList();
}
function row(kind, entry = { key: "", value: "", enabled: true }) {
  const element = document.createElement("div");
  element.className = "kv-row";
  const enabled = document.createElement("input");
  enabled.type = "checkbox";
  enabled.checked = entry.enabled !== false;
  enabled.setAttribute("aria-label", "Enable row");
  const key = document.createElement("input");
  key.type = "text";
  key.placeholder = "Key";
  key.value = entry.key;
  key.setAttribute("aria-label", `${kind} key`);
  const value = document.createElement("input");
  value.type = "text";
  value.placeholder = "Value";
  value.value = entry.value;
  value.setAttribute("aria-label", `${kind} value`);
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "×";
  remove.setAttribute("aria-label", "Remove row");
  remove.onclick = () => element.remove();
  element.append(enabled, key, value, remove);
  $(`${kind}-rows`).append(element);
}
function rows(kind) {
  return [...$(`${kind}-rows`).children]
    .map((element) => {
      const [enabled, key, value] = element.querySelectorAll("input");
      return {
        enabled: enabled.checked,
        key: key.value.trim(),
        value: value.value,
      };
    })
    .filter((item) => item.key);
}
function snapshot() {
  return {
    name: $("request-name").value.trim() || "Untitled request",
    method: $("method").value,
    url: $("url").value.trim(),
    params: rows("params"),
    headers: rows("headers"),
    body: $("body").value,
    timeout: Number($("timeout").value),
  };
}
function sanitize(item) {
  const clean = {
    ...item,
    headers: item.headers.filter((entry) => !sensitive.test(entry.key)),
    params: item.params.filter((entry) => !sensitive.test(entry.key)),
  };
  try {
    const url = new URL(clean.url);
    [...url.searchParams.keys()]
      .filter((key) => sensitive.test(key))
      .forEach((key) => url.searchParams.delete(key));
    url.username = "";
    url.password = "";
    clean.url = url.href;
  } catch {
    /* Invalid URLs can still be saved for editing. */
  }
  return clean;
}
function renderList() {
  const list = listMode === "saved" ? saved : history;
  const filter = $("search").value.toLowerCase();
  $("list-title").textContent =
    listMode === "saved" ? "MY COLLECTION" : "RECENT REQUESTS";
  $("list-count").textContent = list.length;
  $("request-list").replaceChildren();
  const visible = list.filter((item) =>
    `${item.name} ${item.url}`.toLowerCase().includes(filter),
  );
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.textContent = filter
      ? "No matching requests."
      : listMode === "saved"
        ? "Save your first request to keep it close."
        : "Your sent requests will appear here.";
    $("request-list").append(empty);
  }
  visible.forEach((item) => {
    const container = document.createElement("div");
    container.className = "saved-row";
    const open = document.createElement("button");
    open.className = "saved-open";
    open.title = item.url;
    const method = document.createElement("span");
    method.className = "method-label";
    method.textContent = item.method;
    const name = document.createElement("span");
    name.textContent = item.name || item.url;
    open.append(method, name);
    open.onclick = () => {
      if (controller || saving || workspace.loading)
        return notice("Cancel current request before loading another.");
      load(item, listMode === "saved");
    };
    const remove = document.createElement("button");
    remove.className = "delete-request";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${item.name}`);
    remove.onclick = async () => {
      if (controller || saving || workspace.loading)
        return notice("Wait for the current operation.");
      if (!(await confirmAction("Delete request “" + item.name + "”?"))) return;
      saving = true;
      try {
        await api(
          "/api/projects/" +
            workspace.projectId +
            "/" +
            (listMode === "saved" ? "requests" : "history") +
            "/" +
            item.id,
          { method: "DELETE" },
        );
        if (listMode === "saved") {
          saved = saved.filter((entry) => entry.id !== item.id);
          if (activeRequestId === item.id) load();
        } else history = history.filter((entry) => entry.id !== item.id);
        renderList();
      } catch (error) {
        notice(error.message);
      } finally {
        saving = false;
      }
    };
    container.append(open, remove);
    $("request-list").append(container);
  });
}
function load(item = {}, editing = false) {
  activeRequestId = editing ? item.id : null;
  $("save").textContent = editing ? "▣ Update request" : "▣ Save request";
  $("request-name").value = item.name || "Untitled request";
  $("method").value = item.method || "GET";
  $("url").value = item.url || "";
  $("body").value = item.body || "";
  $("timeout").value = item.timeout || 30000;
  ["params", "headers"].forEach((kind) => {
    $(`${kind}-rows`).replaceChildren();
    (item[kind]?.length
      ? item[kind]
      : [{ key: "", value: "", enabled: true }]
    ).forEach((entry) => row(kind, entry));
  });
  $("auth-type").value = "none";
  $("auth-token").value = "";
  updateAuth();
  response = null;
  $("response-meta").replaceChildren();
  $("response-output").hidden = true;
  $("response-empty").hidden = false;
  $("copy").disabled = true;
}
function updateAuth() {
  $("token-label").hidden = $("auth-type").value === "none";
  $("key-label").hidden = $("auth-type").value !== "key";
}
function renderResponse() {
  if (!response) return;
  let text =
    responseTab === "headers"
      ? Object.entries(response.headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
      : response.body;
  if (responseTab === "body" && $("pretty").checked) {
    try {
      text = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      /* Plain-text responses remain readable. */
    }
  }
  $("response-output").textContent = text || "(empty response)";
  $("response-output").hidden = false;
  $("response-empty").hidden = true;
  $("copy").disabled = false;
}
async function send(event) {
  event?.preventDefault();
  if (!workspace.user || !workspace.projectId)
    return notice("Sign in and select a project first.");
  if (
    controller ||
    saving ||
    workspace.loading ||
    !$("request-form").reportValidity()
  )
    return;
  const item = snapshot();
  let url;
  try {
    url = new URL(item.url);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    return notice("Enter a valid HTTP or HTTPS URL.");
  }
  item.params
    .filter((entry) => entry.enabled)
    .forEach((entry) => url.searchParams.append(entry.key, entry.value));
  const headers = Object.fromEntries(
    item.headers
      .filter((entry) => entry.enabled)
      .map((entry) => [entry.key, entry.value]),
  );
  if ($("auth-type").value !== "none") {
    if (!$("auth-token").value.trim())
      return notice("Enter your authentication secret.");
    const key =
      $("auth-type").value === "bearer"
        ? "Authorization"
        : $("auth-key").value.trim();
    if (!key) return notice("Enter an API key header name.");
    Object.keys(headers)
      .filter((name) => name.toLowerCase() === key.toLowerCase())
      .forEach((name) => delete headers[name]);
    headers[key] =
      $("auth-type").value === "bearer"
        ? `Bearer ${$("auth-token").value}`
        : $("auth-token").value;
  }
  if (
    item.body &&
    !Object.keys(headers).some((key) => key.toLowerCase() === "content-type")
  ) {
    try {
      JSON.parse(item.body);
      headers["Content-Type"] = "application/json";
    } catch {
      /* Send raw text as entered. */
    }
  }
  controller = new AbortController();
  $("send").disabled = true;
  $("send").textContent = "Sending…";
  $("cancel").hidden = false;
  $("response-empty").hidden = true;
  $("response-output").hidden = false;
  $("response-output").textContent = "Waiting for response…";
  $("response-meta").replaceChildren();
  $("copy").disabled = true;
  response = null;
  const projectId = workspace.projectId;
  try {
    const recorded = await api("/api/projects/" + projectId + "/history", {
      method: "POST",
      body: JSON.stringify({ ...sanitize(item), body: "" }),
      signal: controller.signal,
    });
    if (workspace.projectId === projectId && workspace.user) {
      history.unshift(recorded.request);
      history = history.slice(0, 50);
      renderList();
    }
  } catch (error) {
    if (error.name !== "AbortError")
      notice("History not saved: " + error.message);
  }
  try {
    const result = await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-APT-Client": "web" },
      body: JSON.stringify({
        url: url.href,
        method: item.method,
        headers,
        body: item.body,
        timeout: item.timeout,
      }),
      signal: controller.signal,
    });
    const data = await result.json();
    if (!result.ok) throw new Error(data.error || "Request failed.");
    response = data;
    const status = document.createElement("span");
    status.className = data.status < 400 ? "good" : "bad";
    status.textContent = `${data.status} ${data.statusText}`;
    const duration = document.createElement("span");
    duration.textContent = `${data.duration} ms`;
    const size = document.createElement("span");
    size.textContent =
      data.size < 1024
        ? `${data.size} B`
        : `${(data.size / 1024).toFixed(1)} KB`;
    $("response-meta").append(status, duration, size);
    renderResponse();
  } catch (error) {
    $("response-output").textContent =
      error.name === "AbortError" ? "Request cancelled." : error.message;
  } finally {
    controller = null;
    $("send").disabled = false;
    $("send").textContent = "Send ↗";
    $("cancel").hidden = true;
  }
}
document.querySelectorAll("[data-tab]").forEach(
  (button) =>
    (button.onclick = () => {
      document.querySelectorAll("[data-tab]").forEach((tab) => {
        const active = tab === button;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active);
        $(`panel-${tab.dataset.tab}`).hidden = !active;
      });
    }),
);
document
  .querySelectorAll("[data-add]")
  .forEach((button) => (button.onclick = () => row(button.dataset.add)));
document.querySelectorAll("[data-list]").forEach(
  (button) =>
    (button.onclick = () => {
      listMode = button.dataset.list;
      document
        .querySelectorAll("[data-list]")
        .forEach((tab) => tab.classList.toggle("active", tab === button));
      renderList();
    }),
);
document.querySelectorAll("[data-response]").forEach(
  (button) =>
    (button.onclick = () => {
      responseTab = button.dataset.response;
      document
        .querySelectorAll("[data-response]")
        .forEach((tab) => tab.classList.toggle("active", tab === button));
      renderResponse();
    }),
);
$("request-form").onsubmit = send;
$("cancel").onclick = () => controller?.abort();
$("auth-type").onchange = updateAuth;
$("pretty").onchange = renderResponse;
$("search").oninput = renderList;
$("new-request").onclick = () => {
  if (controller || saving || workspace.loading)
    return notice("Finish the current operation first.");
  load();
  $("url").focus();
};
$("save").onclick = async () => {
  if (!workspace.projectId) return notice("Create or select a project first.");
  if (saving || workspace.loading || controller)
    return notice("Wait for the current operation.");
  const item = sanitize(snapshot());
  if (!$("request-name").value.trim() || !item.url)
    return notice("Enter a request name and URL.");
  if (
    item.body &&
    !(await confirmAction(
      "Save this request body to your database? Check it for passwords and other sensitive data first.",
    ))
  )
    return;
  saving = true;
  $("save").disabled = true;
  try {
    const data = await api(
      "/api/projects/" +
        workspace.projectId +
        "/requests" +
        (activeRequestId ? "/" + activeRequestId : ""),
      { method: activeRequestId ? "PUT" : "POST", body: JSON.stringify(item) },
    );
    const index = saved.findIndex((entry) => entry.id === data.request.id);
    if (index >= 0) saved[index] = data.request;
    else saved.unshift(data.request);
    activeRequestId = data.request.id;
    $("save").textContent = "▣ Update request";
    renderList();
    notice("Request saved to project.");
  } catch (error) {
    notice(error.message);
  } finally {
    saving = false;
    $("save").disabled = false;
  }
};
$("format-body").onclick = () => {
  try {
    $("body").value = JSON.stringify(JSON.parse($("body").value), null, 2);
  } catch {
    notice("Body is not valid JSON.");
  }
};
$("copy").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("response-output").textContent);
    notice("Response copied.");
  } catch {
    notice("Clipboard unavailable. Select response text to copy.");
  }
};
$("example").onclick = () => {
  if (controller || saving || workspace.loading)
    return notice("Finish the current operation first.");
  load({
    name: "Example echo",
    url: `${location.origin}/api/echo?hello=world`,
  });
  send();
};
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    send();
  }
  if (event.altKey && event.key.toLowerCase() === "n") {
    event.preventDefault();
    $("new-request").click();
  }
});
load();
renderList();
try {
  $("import-local").hidden = !localStorage.getItem(storageKey);
} catch {
  /* Browser storage is optional. */
}
$("import-local").onclick = async () => {
  if (!workspace.projectId || saving || controller || workspace.loading)
    return notice("Select a project and finish the current operation first.");
  if (
    !(await confirmAction(
      "Import old browser requests into this account and selected project? Bodies are omitted; original browser data stays on this machine.",
    ))
  )
    return;
  saving = true;
  let imported = 0;
  try {
    const old = JSON.parse(localStorage.getItem(storageKey) || "{}");
    for (const item of (Array.isArray(old.saved) ? old.saved : []).slice(
      0,
      500,
    )) {
      const result = await api(
        "/api/projects/" + workspace.projectId + "/requests",
        {
          method: "POST",
          body: JSON.stringify({
            ...item,
            body: "",
            timeout: Math.min(item.timeout || 30000, 45000),
          }),
        },
      );
      saved.unshift(result.request);
      imported++;
    }
    renderList();
    notice(imported + " requests imported.");
  } catch (error) {
    renderList();
    notice(imported + " imported. " + error.message);
  } finally {
    saving = false;
  }
};
initializeAccount({
  onProject: refreshRequests,
  onLogout: () => {
    controller?.abort();
    saved = [];
    history = [];
    load();
    renderList();
  },
  notice,
  isBusy: () => Boolean(controller || saving),
});

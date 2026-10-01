import { requestName, confirmAction } from "./dialog.js";
const $ = (id) => document.getElementById(id);
export const workspace = {
  user: null,
  projectId: null,
  projects: [],
  hosted: false,
  loading: false,
};
let hooks = {};
let registerMode = false;

export async function api(path, options = {}) {
  let result;
  try {
    result = await fetch(path, {
      ...options,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-APT-Client": "web",
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot reach server. Check connection and try again.");
  }
  const data =
    result.status === 204
      ? {}
      : await result.json().catch(() => ({
          error: `Server returned ${result.status}. Please try again.`,
        }));
  if (!result.ok) {
    if (result.status === 401 && !path.includes("/auth/login")) signOutView();
    throw Object.assign(new Error(data.error || "Request failed."), {
      status: result.status,
    });
  }
  return data;
}
function signOutView() {
  workspace.user = null;
  workspace.projectId = null;
  workspace.projects = [];
  $("workspace-main").hidden = true;
  $("workspace-sidebar").hidden = true;
  $("account-screen").hidden = false;
  $("account-password").value = "";
  hooks.onLogout?.();
}
function renderProjects() {
  $("project-select").replaceChildren();
  workspace.projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    $("project-select").append(option);
  });
  if (!workspace.projects.length) {
    const option = document.createElement("option");
    option.textContent = "Create your first project";
    option.value = "";
    $("project-select").append(option);
  }
  $("project-select").value = workspace.projectId || "";
  $("current-project").textContent =
    workspace.projects.find((project) => project.id === workspace.projectId)
      ?.name || "No project selected";
  $("project-rename").disabled = !workspace.projectId;
  $("project-delete").disabled = !workspace.projectId;
}
async function chooseProject(id) {
  workspace.loading = true;
  workspace.projectId = id || null;
  renderProjects();
  $("project-select").disabled = true;
  try {
    await hooks.onProject?.();
  } finally {
    workspace.loading = false;
    $("project-select").disabled = false;
  }
}
async function enter(user) {
  workspace.user = user;
  const data = await api("/api/projects");
  workspace.projects = data.projects;
  $("account-user").textContent = user.name;
  $("account-user").title = user.email;
  await chooseProject(workspace.projects[0]?.id);
  $("account-screen").hidden = true;
  $("workspace-main").hidden = false;
  $("workspace-sidebar").hidden = false;
  $("account-password").value = "";
}
function canChange() {
  if (hooks.isBusy?.() || workspace.loading) {
    hooks.notice?.("Wait for the current operation, or cancel the request.");
    return false;
  }
  return true;
}
export async function initializeAccount(callbacks) {
  hooks = callbacks;
  $("account-toggle").onclick = () => {
    registerMode = !registerMode;
    $("account-title").textContent = registerMode
      ? "Create your workspace"
      : "Sign in to your workspace";
    $("account-subtitle").textContent = registerMode
      ? "A fresh space for every API you build."
      : "Your projects and requests are waiting.";
    $("account-name-label").hidden = !registerMode;
    $("account-name").required = registerMode;
    $("account-password").minLength = registerMode ? 12 : 1;
    $("account-password").autocomplete = registerMode
      ? "new-password"
      : "current-password";
    $("password-help").hidden = !registerMode;
    $("account-submit").textContent = registerMode
      ? "Create account →"
      : "Sign in →";
    $("account-toggle").textContent = registerMode
      ? "Already have an account? Sign in"
      : "New here? Create an account";
    $("account-error").textContent = "";
  };
  $("account-form").onsubmit = async (event) => {
    event.preventDefault();
    $("account-error").textContent = "";
    $("account-submit").disabled = true;
    $("account-toggle").disabled = true;
    try {
      const data = await api(
        `/api/auth/${registerMode ? "register" : "login"}`,
        {
          method: "POST",
          body: JSON.stringify({
            email: $("account-email").value,
            password: $("account-password").value,
            name: $("account-name").value,
          }),
        },
      );
      await enter(data.user);
    } catch (error) {
      $("account-error").textContent = error.message;
    } finally {
      $("account-submit").disabled = false;
      $("account-toggle").disabled = false;
    }
  };
  $("logout").onclick = async () => {
    if (!canChange()) return;
    try {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
      signOutView();
    } catch (error) {
      hooks.notice(error.message);
    }
  };
  $("project-select").onchange = async () => {
    if (!canChange()) {
      $("project-select").value = workspace.projectId || "";
      return;
    }
    try {
      await chooseProject($("project-select").value);
    } catch (error) {
      hooks.notice(error.message);
    }
  };
  $("project-create").onclick = async () => {
    if (!canChange()) return;
    const name = await requestName("Create project");
    if (!name?.trim()) return;
    workspace.loading = true;
    try {
      const data = await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      workspace.projects.push(data.project);
      await chooseProject(data.project.id);
    } catch (error) {
      hooks.notice(error.message);
    } finally {
      workspace.loading = false;
    }
  };
  $("project-rename").onclick = async () => {
    if (!canChange() || !workspace.projectId) return;
    const project = workspace.projects.find(
      (item) => item.id === workspace.projectId,
    );
    const name = await requestName("Rename project", project.name);
    if (!name?.trim()) return;
    workspace.loading = true;
    try {
      const data = await api(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      Object.assign(project, data.project);
      renderProjects();
    } catch (error) {
      hooks.notice(error.message);
    } finally {
      workspace.loading = false;
    }
  };
  $("project-delete").onclick = async () => {
    if (!canChange() || !workspace.projectId) return;
    const project = workspace.projects.find(
      (item) => item.id === workspace.projectId,
    );
    if (
      !(await confirmAction(
        `Delete project “${project.name}” and all its requests and history? This cannot be undone.`,
      ))
    )
      return;
    workspace.loading = true;
    try {
      await api(`/api/projects/${project.id}`, { method: "DELETE" });
      workspace.projects = workspace.projects.filter(
        (item) => item.id !== project.id,
      );
      await chooseProject(workspace.projects[0]?.id);
    } catch (error) {
      hooks.notice(error.message);
    } finally {
      workspace.loading = false;
    }
  };
  try {
    const config = await api("/api/config");
    workspace.hosted = config.hosted;
    $("connection-badge").textContent = config.hosted
      ? "◉ Cloud workspace"
      : "◉ Local server";
    if (!config.configured) {
      $("setup-message").hidden = false;
      $("setup-message").textContent =
        "Database setup needed: set DATABASE_URL, then run npm run db:migrate. On Vercel, also set APP_URL to your HTTPS site address.";
      $("account-submit").disabled = true;
      return;
    }
    const data = await api("/api/auth/me");
    await enter(data.user);
  } catch (error) {
    if (error.status !== 401) $("account-error").textContent = error.message;
  }
}

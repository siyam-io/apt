let active = false;

function ask({ title, description = "", value, action = "Confirm" }) {
  if (active) return Promise.resolve(null);
  active = true;
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "workspace-dialog";
    const form = document.createElement("form");
    form.method = "dialog";
    const heading = document.createElement("h2");
    heading.id = "workspace-dialog-title";
    heading.textContent = title;
    dialog.setAttribute("aria-labelledby", heading.id);
    const detail = document.createElement("p");
    detail.textContent = description;
    const input = document.createElement("input");
    input.value = value ?? "";
    input.maxLength = 100;
    input.required = value !== undefined;
    input.setAttribute("aria-label", "Name");
    input.hidden = value === undefined;
    const actions = document.createElement("div");
    actions.className = "dialog-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Cancel";
    const confirm = document.createElement("button");
    confirm.type = "submit";
    confirm.textContent = action;
    confirm.className = "primary-button";
    let result = null;
    cancel.onclick = () => dialog.close();
    form.onsubmit = (event) => {
      event.preventDefault();
      if (value !== undefined && !input.value.trim()) return input.focus();
      result = value === undefined ? true : input.value.trim();
      dialog.close();
    };
    dialog.onclose = () => {
      dialog.remove();
      active = false;
      resolve(result);
    };
    actions.append(cancel, confirm);
    form.append(heading, detail, input, actions);
    dialog.append(form);
    document.body.append(dialog);
    dialog.showModal();
    (value === undefined ? cancel : input).focus();
  });
}
export const requestName = (title, value = "") =>
  ask({ title, value, action: "Save" });
export const confirmAction = (description, title = "Confirm action") =>
  ask({ title, description });

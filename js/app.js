let isEditMode = false;
let feedbackTimeout;
let pendingArchiveId = null;

const $ = (id) => document.getElementById(id);
// Escape user data before inserting it into innerHTML (prevents broken markup / XSS)
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const FIELDS = [
  { key: "studentId", input: "studentId", error: "idError" },
  { key: "fullName", input: "fullName", error: "nameError" },
  { key: "program", input: "program", error: "programError" }
];

document.addEventListener("DOMContentLoaded", () => {
  renderTable();

  $("studentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = readForm();
    const errors = StudentController.validate(payload, isEditMode);
    showErrors(errors);
    if (Object.keys(errors).length) {
      const first = FIELDS.find((f) => errors[f.key]);
      $(first.input).focus();
      return;
    }

    const response = isEditMode
      ? StudentController.updateStudent(payload.studentId, payload)
      : StudentController.createStudent(payload);

    if (response.success) {
      showFeedback("success", response.message);
      resetForm();
      renderTable();
      $("studentId").focus();
    } else {
      showFeedback("error", response.error);
    }
  });

  // Validate each field as the user leaves it
  FIELDS.forEach((f) => {
    $(f.input).addEventListener("blur", () => {
      if (f.key === "studentId" && isEditMode) return;
      setFieldError(f, StudentController.validate(readForm(), isEditMode)[f.key] || "");
    });
  });

  $("cancelBtn").addEventListener("click", resetForm);
  $("showArchived").addEventListener("change", renderTable);
  $("alertClose").addEventListener("click", hideFeedback);

  // One click listener for all row buttons (no inline onclick)
  $("studentTableBody").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === "edit") editRecord(id);
    else if (btn.dataset.action === "archive") askArchive(id);
    else if (btn.dataset.action === "restore") restoreRecord(id);
  });

  $("confirmNo").addEventListener("click", () => $("confirmDialog").close());
  $("confirmYes").addEventListener("click", () => {
    $("confirmDialog").close();
    archiveRecord(pendingArchiveId);
  });
});

function readForm() {
  return {
    studentId: $("studentId").value,
    fullName: $("fullName").value,
    program: $("program").value
  };
}

function renderTable() {
  const records = StudentController.getStudents($("showArchived").checked);
  const tbody = $("studentTableBody");

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">No records yet. Add a student using the form.</td></tr>`;
    return;
  }

  tbody.innerHTML = records.map((r) => {
    const id = esc(r.studentId);
    const actions = r.isArchived
      ? `<button type="button" class="btn-secondary" data-action="restore" data-id="${id}" aria-label="Restore ${id}">Restore</button>`
      : `<button type="button" class="btn-warning" data-action="edit" data-id="${id}" aria-label="Edit ${id}">Edit</button>
         <button type="button" class="btn-danger" data-action="archive" data-id="${id}" aria-label="Archive ${id}">Archive</button>`;
    return `<tr>
      <td><strong>${id}</strong></td>
      <td>${esc(r.fullName)}</td>
      <td>${esc(r.program)}</td>
      <td><span class="badge ${r.isArchived ? "badge-archived" : "badge-active"}">${r.isArchived ? "Archived" : "Active"}</span></td>
      <td><div class="actions">${actions}</div></td>
    </tr>`;
  }).join("");
}

function editRecord(studentId) {
  const record = DatabaseEngine.getById(studentId);
  if (!record) return;

  clearInputErrors();
  $("studentId").value = record.studentId;
  $("studentId").readOnly = true;
  $("fullName").value = record.fullName;
  $("program").value = record.program;

  $("formTitle").innerText = "Edit Student Record";
  $("submitBtn").innerText = "Update Record";
  $("cancelBtn").hidden = false;
  isEditMode = true;
  $("fullName").focus();
}

function askArchive(studentId) {
  pendingArchiveId = studentId;
  $("confirmText").textContent = `Student ${studentId} will be moved to Archived. Nothing is permanently deleted, and you can restore it anytime.`;
  $("confirmDialog").showModal();
}

function archiveRecord(studentId) {
  const res = StudentController.deleteStudent(studentId);
  showFeedback(res.success ? "success" : "error", res.success ? res.message : res.error);
  // Leave edit mode if the record being edited was just archived
  if (isEditMode && $("studentId").value === studentId) resetForm();
  renderTable();
}

function restoreRecord(studentId) {
  const res = StudentController.restoreStudent(studentId);
  showFeedback(res.success ? "success" : "error", res.success ? res.message : res.error);
  renderTable();
}

function resetForm() {
  $("studentForm").reset();
  $("studentId").readOnly = false;
  $("formTitle").innerText = "Add New Student";
  $("submitBtn").innerText = "Submit Record";
  $("cancelBtn").hidden = true;
  clearInputErrors();
  isEditMode = false;
}

function setFieldError(field, message) {
  $(field.error).innerText = message;
  $(field.input).setAttribute("aria-invalid", message ? "true" : "false");
}

function showErrors(errors) {
  FIELDS.forEach((f) => setFieldError(f, errors[f.key] || ""));
}

function clearInputErrors() {
  showErrors({});
}

function showFeedback(type, message) {
  clearTimeout(feedbackTimeout);
  $("feedbackAlert").className = `alert alert-${type}`;
  $("alertIcon").innerText = type === "success" ? "☑ " : "⚠ ";
  $("alertMessage").innerText = message;
  // Errors stay until dismissed; success messages auto-hide
  if (type === "success") feedbackTimeout = setTimeout(hideFeedback, 4000);
}

function hideFeedback() {
  $("feedbackAlert").classList.add("hidden");
}

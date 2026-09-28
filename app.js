let isEditMode = false;
let feedbackTimeout;

document.addEventListener("DOMContentLoaded", () => {
  renderTable();

  const form = document.getElementById("studentForm");
  const cancelBtn = document.getElementById("cancelBtn");
  const showArchivedCheck = document.getElementById("showArchived");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    clearInputErrors();

    const payload = {
      studentId: document.getElementById("studentId").value,
      fullName: document.getElementById("fullName").value,
      program: document.getElementById("program").value
    };

    // Client-side validation check
    let isValid = true;
    if (!payload.studentId.trim()) {
      showFieldError("idError", "Student ID is required.");
      isValid = false;
    }
    if (!payload.fullName.trim()) {
      showFieldError("nameError", "Full Name is required.");
      isValid = false;
    }
    if (!payload.program) {
      showFieldError("programError", "Please select a program.");
      isValid = false;
    }

    if (!isValid) return;

    let response;
    if (isEditMode) {
      response = StudentController.updateStudent(payload.studentId, payload);
    } else {
      response = StudentController.createStudent(payload);
    }

    if (response.success) {
      showFeedback("success", response.message);
      resetForm();
      renderTable();
    } else {
      showFeedback("error", response.error);
    }
  });

  cancelBtn.addEventListener("click", resetForm);
  showArchivedCheck.addEventListener("change", renderTable);
});

function renderTable() {
  const showArchived = document.getElementById("showArchived").checked;
  const records = StudentController.getStudents(showArchived);
  const tbody = document.getElementById("studentTableBody");

  tbody.innerHTML = "";

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748b;">No records found.</td></tr>`;
    return;
  }

  records.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${r.studentId}</strong></td>
      <td>${r.fullName}</td>
      <td>${r.program}</td>
      <td>
        <span class="badge ${r.isArchived ? 'badge-archived' : 'badge-active'}">
          ${r.isArchived ? 'Archived' : 'Active'}
        </span>
      </td>
      <td>
        ${!r.isArchived ? `
          <button class="btn-warning" onclick="editRecord('${r.studentId}')">Edit</button>
          <button class="btn-danger" onclick="archiveRecord('${r.studentId}')">Archive</button>
        ` : `
          <button class="btn-secondary" onclick="restoreRecord('${r.studentId}')">Restore</button>
        `}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.editRecord = function(studentId) {
  const record = DatabaseEngine.getById(studentId);
  if (!record) return;

  clearInputErrors();
  document.getElementById("studentId").value = record.studentId;
  document.getElementById("studentId").readOnly = true;
  document.getElementById("fullName").value = record.fullName;
  document.getElementById("program").value = record.program;

  document.getElementById("formTitle").innerText = "Edit Student Record";
  document.getElementById("submitBtn").innerText = "Update Record";
  document.getElementById("cancelBtn").style.display = "inline-block";
  isEditMode = true;
};

window.archiveRecord = function(studentId) {
  if (confirm(`Are you sure you want to ARCHIVE student ${studentId}?`)) {
    const res = StudentController.deleteStudent(studentId);
    showFeedback("success", res.message);
    renderTable();
  }
};

window.restoreRecord = function(studentId) {
  const res = StudentController.restoreStudent(studentId);
  showFeedback("success", res.message);
  renderTable();
};

function resetForm() {
  document.getElementById("studentForm").reset();
  document.getElementById("studentId").readOnly = false;
  document.getElementById("formTitle").innerText = "Add New Student";
  document.getElementById("submitBtn").innerText = "Submit Record";
  document.getElementById("cancelBtn").style.display = "none";
  clearInputErrors();
  isEditMode = false;
}

function showFieldError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) el.innerText = message;
}

function clearInputErrors() {
  document.getElementById("idError").innerText = "";
  document.getElementById("nameError").innerText = "";
  document.getElementById("programError").innerText = "";
}

function showFeedback(type, message) {
  const alertEl = document.getElementById("feedbackAlert");
  const iconEl = document.getElementById("alertIcon");
  const messageEl = document.getElementById("alertMessage");

  clearTimeout(feedbackTimeout);

  alertEl.className = `alert alert-${type}`;
  iconEl.innerText = type === "success" ? "☑ " : "⚠ ";
  messageEl.innerText = message;

  feedbackTimeout = setTimeout(() => {
    hideFeedback();
  }, 4000);
}

function hideFeedback() {
  const alertEl = document.getElementById("feedbackAlert");
  if (alertEl) {
    alertEl.classList.add("hidden");
  }
}
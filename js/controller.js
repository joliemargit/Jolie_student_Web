const StudentController = {
  // Single source of truth for validation (form + create/update)
  validate(p, isEdit = false) {
    const errors = {};
    const id = (p.studentId || "").trim();
    const name = (p.fullName || "").trim();
    if (!isEdit) {
      if (!id) errors.studentId = "Student ID is required.";
      else if (!/^\d{4}-\d{4}$/.test(id)) errors.studentId = "Use the format YYYY-NNNN with digits only, e.g. 2026-0001.";
    }
    if (!name) errors.fullName = "Full Name is required.";
    else if (!/^[A-Za-z\u00C0-\u00FF][A-Za-z\u00C0-\u00FF.'\- ]{1,59}$/.test(name)) {
      errors.fullName = "Use letters, spaces, . ' - only (2 to 60 characters). Numbers are not allowed.";
    }
    if (!p.program) errors.program = "Please select a program.";
    return errors;
  },

  createStudent(payload) {
    const errors = this.validate(payload);
    if (Object.keys(errors).length) {
      return { success: false, error: "Validation Failed: " + Object.values(errors)[0] };
    }

    try {
      const formattedData = {
        studentId: payload.studentId.trim().toUpperCase(),
        fullName: payload.fullName.trim(),
        program: payload.program.trim()
      };

      const result = DatabaseEngine.insert(formattedData);
      return { success: true, message: "Student record created successfully!", data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getStudents(includeArchived = false) {
    const all = DatabaseEngine.getAll();
    if (includeArchived) return all;
    return all.filter(r => !r.isArchived);
  },

  updateStudent(studentId, payload) {
    const errors = this.validate(payload, true);
    if (Object.keys(errors).length) {
      return { success: false, error: "Validation Failed: " + Object.values(errors)[0] };
    }

    try {
      const result = DatabaseEngine.update(studentId, {
        fullName: payload.fullName.trim(),
        program: payload.program.trim()
      });
      return { success: true, message: "Student record updated successfully!", data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  deleteStudent(studentId) {
    try {
      const result = DatabaseEngine.softDelete(studentId);
      return { success: true, message: "Record archived successfully! (Remains saved in DB)", data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  restoreStudent(studentId) {
    try {
      const result = DatabaseEngine.restore(studentId);
      return { success: true, message: "Record restored to active list!", data: result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

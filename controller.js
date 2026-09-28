const StudentController = {
  createStudent(payload) {
    if (!payload.studentId || !payload.fullName || !payload.program) {
      return { success: false, error: "Validation Failed: All fields are required." };
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
    if (!payload.fullName || !payload.program) {
      return { success: false, error: "Validation Failed: Name and Program are required for update." };
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
const DatabaseEngine = {
  STORAGE_KEY: "app_student_db",

  init() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  },

  getAll() {
    this.init();
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]");
  },

  getById(studentId) {
    const records = this.getAll();
    return records.find(r => r.studentId === studentId) || null;
  },

  insert(data) {
    const records = this.getAll();
    if (records.some(r => r.studentId === data.studentId)) {
      throw new Error(`PRIMARY KEY VIOLATION: Student ID ${data.studentId} already exists.`);
    }

    const newRecord = {
      ...data,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    records.push(newRecord);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    return newRecord;
  },

  update(studentId, updatedData) {
    const records = this.getAll();
    const index = records.findIndex(r => r.studentId === studentId);

    if (index === -1) {
      throw new Error(`NOT FOUND: Student ID ${studentId} does not exist.`);
    }

    records[index] = {
      ...records[index],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    return records[index];
  },

  softDelete(studentId) {
    return this.update(studentId, { isArchived: true });
  },

  restore(studentId) {
    return this.update(studentId, { isArchived: false });
  }
};
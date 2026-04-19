<<<<<<< HEAD
const token = localStorage.getItem("token");
const profile = JSON.parse(localStorage.getItem("profile") || "null");
const userNameNodes = document.querySelectorAll(".js-user-name");
const userRoleNodes = document.querySelectorAll(".js-user-role");
const logoutBtn = document.getElementById("logoutBtn");
const summaryArea = document.getElementById("summaryCards");
const requestsBody = document.getElementById("requestsBody");
const lecturesBody = document.getElementById("lecturesBody");
const homeworkBody = document.getElementById("homeworkBody");
const noticesWrap = document.getElementById("noticesWrap");
const materialsBody = document.getElementById("materialsBody");
const attendanceBody = document.getElementById("attendanceBody");
const attendancePercent = document.getElementById("attendancePercent");
const studentsSelect = document.getElementById("studentId");
const submitHomeworkForm = document.getElementById("submitHomeworkForm");
const lectureForm = document.getElementById("lectureForm");
const homeworkForm = document.getElementById("homeworkForm");
const noticeForm = document.getElementById("noticeForm");
const materialForm = document.getElementById("materialForm");
const attendanceForm = document.getElementById("attendanceForm");
const announcementForm = document.getElementById("announcementForm");
const announcementBody = document.getElementById("announcementBody");
const enquiriesBody = document.getElementById("enquiriesBody");
const profileForm = document.getElementById("profileForm");
const profileMedium = document.getElementById("profileMedium");
const profileStandard = document.getElementById("profileStandard");

if (!token || !profile) window.location.href = "/pages/login.html";

userNameNodes.forEach((n) => (n.textContent = profile?.name || "User"));
userRoleNodes.forEach((n) => (n.textContent = profile?.role || "role"));

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/pages/login.html";
  });
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Request failed");
  return json;
}

async function loadSummary() {
  if (!summaryArea) return;
  const { data: s } = await api("/api/dashboard/summary");
  summaryArea.innerHTML = `
    <div class="card"><h3>Total Students</h3><div class="stat">${s.totalStudents}</div></div>
    <div class="card"><h3>Total Teachers</h3><div class="stat">${s.totalTeachers}</div></div>
    <div class="card"><h3>Pending Requests</h3><div class="stat">${s.pendingRequests}</div></div>
    <div class="card"><h3>Announcements</h3><div class="stat">${s.announcements}</div></div>
  `;
}

async function loadRequests() {
  if (!requestsBody || profile?.role !== "admin") return;
  const result = await api("/api/admin/requests");

  requestsBody.innerHTML = result.data
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.role}</td>
        <td>${item.standard || "-"}</td>
        <td>${item.medium || "-"}</td>
        <td><span class="badge ${item.status}">${item.status}</span></td>
        <td>
          <button class="btn btn-success js-request-action" data-id="${item.id}" data-action="approve">Approve</button>
          <button class="btn btn-danger js-request-action" data-id="${item.id}" data-action="reject">Reject</button>
        </td>
      </tr>
    `
    )
    .join("");
}

window.handleRequest = async (uid, action) => {
  try {
    const result = await api(`/api/admin/requests/${uid}/${action}`, { method: "POST" });
    alert(result.message);
    loadRequests();
  } catch (error) {
    alert(error.message);
  }
};

if (requestsBody) {
  requestsBody.addEventListener("click", async (event) => {
    const target = event.target.closest(".js-request-action");
    if (!target) return;
    const id = target.getAttribute("data-id");
    const action = target.getAttribute("data-action");
    if (!id || !action) return;
    await window.handleRequest(id, action);
  });
}

async function verifySession() {
  try {
    const data = await api("/api/auth/me", { headers: {} });

    // End-to-end role protection: dashboard path must match logged-in role.
    const currentPath = window.location.pathname;
    if (currentPath.includes("/dashboard/admin/") && data.user.role !== "admin") throw new Error("Unauthorized dashboard");
    if (currentPath.includes("/dashboard/teacher/") && data.user.role !== "teacher") throw new Error("Unauthorized dashboard");
    if (currentPath.includes("/dashboard/student/") && data.user.role !== "student") throw new Error("Unauthorized dashboard");

    localStorage.setItem("profile", JSON.stringify(data.user));
  } catch (_error) {
    localStorage.clear();
    window.location.href = "/pages/login.html";
  }
}

async function loadCollections() {
  // Helper function to filter data for teachers based on their assigned standards and medium
  function filterDataForTeacher(data, teacherProfile) {
    if (teacherProfile.role !== "teacher") return data;
    
    return data.filter(item => {
      // Check if item matches teacher's medium
      if (item.medium && item.medium !== teacherProfile.medium) return false;
      
      // Check if item matches teacher's assigned standards
      if (item.standard) {
        const teacherStandards = Array.isArray(teacherProfile.standards) 
          ? teacherProfile.standards 
          : [teacherProfile.standard].filter(Boolean);
        
        if (!teacherStandards.includes(item.standard)) return false;
      }
      
      return true;
    });
  }

  if (lecturesBody) {
    const { data } = await api("/api/content/lectures");
    const filteredData = filterDataForTeacher(data, profile);
    lecturesBody.innerHTML = filteredData
      .map((x) => `<tr><td>${x.subject}</td><td>${x.standard}</td><td>${x.date}</td></tr>`)
      .join("") || `<tr><td colspan="3">No lectures yet.</td></tr>`;
  }

  if (homeworkBody) {
    const { data } = await api("/api/content/homework");
    const isStudent = profile.role === "student";
    const isTeacher = profile.role === "teacher";
    const filteredData = filterDataForTeacher(data, profile);
    
    homeworkBody.innerHTML =
      filteredData
        .map(
          (x) =>
            `<tr>
              <td>${x.title}</td>
              <td>${x.standard || "-"}</td>
              <td>${x.dueDate || "-"}</td>
              ${isTeacher ? `<td>${x.fileLink ? `<a href="${x.fileLink}" target="_blank">Open Link</a>` : "-"}</td>` : ""}
              <td>${
                isStudent
                  ? `<button class="btn btn-outline js-homework-submit" data-id="${x.id}" data-title="${x.title}">Submit</button>`
                  : "-"
              }</td>
            </tr>`
        )
        .join("") || `<tr><td colspan="${isTeacher ? 5 : 4}">No homework yet.</td></tr>`;
  }

  if (noticesWrap) {
    const { data } = await api("/api/content/notices");
    const filteredData = filterDataForTeacher(data, profile);
    noticesWrap.innerHTML =
      filteredData.map((x) => `<article class="notice-item"><h3>${x.title}</h3><p>${x.content}</p></article>`).join("") ||
      "<p>No notices yet.</p>";
  }

  if (materialsBody) {
    const { data } = await api("/api/content/materials");
    const filteredData = filterDataForTeacher(data, profile);
    materialsBody.innerHTML =
      filteredData.map((x) => `<tr><td>${x.title}</td><td><a href="${x.link}" target="_blank">Open</a></td></tr>`).join("") ||
      `<tr><td colspan="2">No materials yet.</td></tr>`;
  }

  if (attendanceBody) {
    const { data } = await api("/api/content/attendance");
    const filteredData = filterDataForTeacher(data, profile);
    attendanceBody.innerHTML =
      filteredData.map((x) => `<tr><td>${x.date}</td><td>${x.status}</td></tr>`).join("") ||
      `<tr><td colspan="2">No attendance yet.</td></tr>`;
    if (attendancePercent) {
      const present = filteredData.filter((x) => x.status === "present").length;
      const percent = filteredData.length ? Math.round((present / filteredData.length) * 100) : 0;
      attendancePercent.textContent = `${percent}%`;
    }
  }

  if (announcementBody) {
    const { data } = await api("/api/content/announcements");
    announcementBody.innerHTML =
      data.map((x) => `<tr><td>${x.title}</td><td>${x.content}</td><td>${x.createdBy}</td></tr>`).join("") ||
      `<tr><td colspan="3">No announcements yet.</td></tr>`;
  }

  if (enquiriesBody && profile?.role === "admin") {
    const { data } = await api("/api/admin/enquiries");
    enquiriesBody.innerHTML =
      data
        .map(
          (x) =>
            `<tr><td>${x.name}</td><td>${x.standard || "-"}</td><td>${x.medium || "-"}</td><td>${x.parentPhone || "-"}</td><td>${x.message}</td><td>${new Date(
              x.createdAt
            ).toLocaleString()}</td></tr>`
        )
        .join("") || `<tr><td colspan="6">No enquiries yet.</td></tr>`;
  }
}

if (lectureForm) {
  lectureForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      subject: document.getElementById("lectureSubject").value,
      date: document.getElementById("lectureDate").value
    };
    
    // For teachers, automatically set medium and use their assigned standards
    if (profile.role === "teacher") {
      payload.medium = profile.medium;
      const selectedStandard = document.getElementById("lectureStandard").value;
      // Only allow standards that the teacher is assigned to
      const teacherStandards = Array.isArray(profile.standards) 
        ? profile.standards 
        : [profile.standard].filter(Boolean);
      
      if (!teacherStandards.includes(selectedStandard)) {
        alert("You can only create lectures for your assigned standards.");
        return;
      }
      payload.standard = selectedStandard;
    } else {
      payload.standard = document.getElementById("lectureStandard").value;
    }
    
    await api("/api/teacher/lectures", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    lectureForm.reset();
    loadCollections();
  });
}

if (homeworkForm) {
  homeworkForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById("homeworkTitle").value,
      dueDate: document.getElementById("homeworkDueDate").value,
      fileLink: document.getElementById("homeworkFileLink")?.value || ""
    };
    
    // For teachers, automatically set medium and use their assigned standards
    if (profile.role === "teacher") {
      payload.medium = profile.medium;
      const selectedStandard = document.getElementById("homeworkStandard").value;
      // Only allow standards that the teacher is assigned to
      const teacherStandards = Array.isArray(profile.standards) 
        ? profile.standards 
        : [profile.standard].filter(Boolean);
      
      if (!teacherStandards.includes(selectedStandard)) {
        alert("You can only create homework for your assigned standards.");
        return;
      }
      payload.standard = selectedStandard;
    } else {
      payload.standard = document.getElementById("homeworkStandard").value;
    }
    
    await api("/api/teacher/homework", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    homeworkForm.reset();
    loadCollections();
  });
}

if (noticeForm) {
  noticeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById("noticeTitle").value,
      content: document.getElementById("noticeContent").value
    };
    
    // For teachers, automatically set medium and standards
    if (profile.role === "teacher") {
      payload.medium = profile.medium;
      const teacherStandards = Array.isArray(profile.standards) 
        ? profile.standards 
        : [profile.standard].filter(Boolean);
      payload.standards = teacherStandards;
    }
    
    await api("/api/teacher/notices", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    noticeForm.reset();
    loadCollections();
  });
}

if (materialForm) {
  materialForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById("materialTitle").value,
      link: document.getElementById("materialLink").value
    };
    
    // For teachers, automatically set medium and standards
    if (profile.role === "teacher") {
      payload.medium = profile.medium;
      const teacherStandards = Array.isArray(profile.standards) 
        ? profile.standards 
        : [profile.standard].filter(Boolean);
      payload.standards = teacherStandards;
    }
    
    await api("/api/teacher/materials", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    materialForm.reset();
    loadCollections();
  });
}

if (attendanceForm) {
  (async () => {
    const { data } = await api("/api/teacher/students");
    if (studentsSelect) {
      studentsSelect.innerHTML = data.map((s) => `<option value="${s.id}">${s.name} (${s.standard})</option>`).join("");
    }
  })();

  attendanceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await api("/api/teacher/attendance", {
      method: "POST",
      body: JSON.stringify({
        studentId: document.getElementById("studentId").value,
        date: document.getElementById("attendanceDate").value,
        status: document.getElementById("attendanceStatus").value
      })
    });
    attendanceForm.reset();
    loadCollections();
  });
}

if (announcementForm) {
  announcementForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await api("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify({
        title: document.getElementById("announcementTitle").value,
        content: document.getElementById("announcementContent").value
      })
    });
    announcementForm.reset();
    loadCollections();
  });
}

function prepareHomeworkSubmit(id, title) {
  if (!submitHomeworkForm) return;
  document.getElementById("submitHomeworkId").value = id;
  document.getElementById("submitHomeworkLabel").textContent = `Submit for: ${title}`;
}

if (homeworkBody) {
  homeworkBody.addEventListener("click", (event) => {
    const target = event.target.closest(".js-homework-submit");
    if (!target) return;
    prepareHomeworkSubmit(target.getAttribute("data-id"), target.getAttribute("data-title"));
  });
}

if (submitHomeworkForm) {
  submitHomeworkForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("submitHomeworkId").value;
    const answerLink = document.getElementById("answerLink").value;
    await api(`/api/student/homework/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answerLink })
    });
    submitHomeworkForm.reset();
    alert("Homework submitted.");
  });
}

verifySession().then(async () => {
  await loadSummary().catch(() => null);
  await loadRequests().catch(() => null);
  await loadCollections().catch(() => null);
});

function setProfileStandardOptions() {
  if (!profileMedium || !profileStandard) return;
  const options = profileMedium.value === "Marathi" ? ["3", "4", "5", "6", "7", "8", "9", "10"] : ["8", "9", "10"];
  profileStandard.innerHTML = options.map((x) => `<option value="${x}">${x}</option>`).join("");
}

if (profileForm) {
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileRole = document.getElementById("profileRole");

  if (profileName) profileName.value = profile?.name || "";
  if (profileEmail) profileEmail.value = profile?.email || "";
  if (profileRole) profileRole.value = profile?.role || "";
  if (profileMedium) profileMedium.value = profile?.medium || "English";

  setProfileStandardOptions();
  if (profileStandard && profile?.standard) profileStandard.value = profile.standard;

  profileMedium?.addEventListener("change", setProfileStandardOptions);

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const result = await api("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        name: document.getElementById("profileName").value.trim(),
        medium: profileMedium?.value,
        standard: profileStandard?.value
      })
    });
    localStorage.setItem("profile", JSON.stringify(result.user));
    alert(result.message || "Profile updated");
    window.location.reload();
  });
}
=======
const token = localStorage.getItem("token");
const profile = JSON.parse(localStorage.getItem("profile") || "null");
const userNameNodes = document.querySelectorAll(".js-user-name");
const userRoleNodes = document.querySelectorAll(".js-user-role");
const logoutBtn = document.getElementById("logoutBtn");
const summaryArea = document.getElementById("summaryCards");
const requestsBody = document.getElementById("requestsBody");
const lecturesBody = document.getElementById("lecturesBody");
const homeworkBody = document.getElementById("homeworkBody");
const noticesWrap = document.getElementById("noticesWrap");
const materialsBody = document.getElementById("materialsBody");
const attendanceBody = document.getElementById("attendanceBody");
const attendancePercent = document.getElementById("attendancePercent");
const studentsSelect = document.getElementById("studentId");
const submitHomeworkForm = document.getElementById("submitHomeworkForm");
const lectureForm = document.getElementById("lectureForm");
const homeworkForm = document.getElementById("homeworkForm");
const noticeForm = document.getElementById("noticeForm");
const materialForm = document.getElementById("materialForm");
const attendanceForm = document.getElementById("attendanceForm");
const announcementForm = document.getElementById("announcementForm");
const announcementBody = document.getElementById("announcementBody");
const enquiriesBody = document.getElementById("enquiriesBody");
const profileForm = document.getElementById("profileForm");
const profileMedium = document.getElementById("profileMedium");
const profileStandard = document.getElementById("profileStandard");

if (!token || !profile) window.location.href = "/pages/login.html";

userNameNodes.forEach((n) => (n.textContent = profile?.name || "User"));
userRoleNodes.forEach((n) => (n.textContent = profile?.role || "role"));

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "/pages/login.html";
  });
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Request failed");
  return json;
}

async function loadSummary() {
  if (!summaryArea) return;
  const { data: s } = await api("/api/dashboard/summary");
  summaryArea.innerHTML = `
    <div class="card"><h3>Total Students</h3><div class="stat">${s.totalStudents}</div></div>
    <div class="card"><h3>Total Teachers</h3><div class="stat">${s.totalTeachers}</div></div>
    <div class="card"><h3>Pending Requests</h3><div class="stat">${s.pendingRequests}</div></div>
    <div class="card"><h3>Announcements</h3><div class="stat">${s.announcements}</div></div>
  `;
}

async function loadRequests() {
  if (!requestsBody || profile?.role !== "admin") return;
  const result = await api("/api/admin/requests");

  requestsBody.innerHTML = result.data
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.role}</td>
        <td>${item.standard || "-"}</td>
        <td>${item.medium || "-"}</td>
        <td><span class="badge ${item.status}">${item.status}</span></td>
        <td>
          <button class="btn btn-success js-request-action" data-id="${item.id}" data-action="approve">Approve</button>
          <button class="btn btn-danger js-request-action" data-id="${item.id}" data-action="reject">Reject</button>
        </td>
      </tr>
    `
    )
    .join("");
}

window.handleRequest = async (uid, action) => {
  try {
    const result = await api(`/api/admin/requests/${uid}/${action}`, { method: "POST" });
    alert(result.message);
    loadRequests();
  } catch (error) {
    alert(error.message);
  }
};

if (requestsBody) {
  requestsBody.addEventListener("click", async (event) => {
    const target = event.target.closest(".js-request-action");
    if (!target) return;
    const id = target.getAttribute("data-id");
    const action = target.getAttribute("data-action");
    if (!id || !action) return;
    await window.handleRequest(id, action);
  });
}

async function verifySession() {
  try {
    const data = await api("/api/auth/me", { headers: {} });

    // End-to-end role protection: dashboard path must match logged-in role.
    const currentPath = window.location.pathname;
    if (currentPath.includes("/dashboard/admin/") && data.user.role !== "admin") throw new Error("Unauthorized dashboard");
    if (currentPath.includes("/dashboard/teacher/") && data.user.role !== "teacher") throw new Error("Unauthorized dashboard");
    if (currentPath.includes("/dashboard/student/") && data.user.role !== "student") throw new Error("Unauthorized dashboard");

    localStorage.setItem("profile", JSON.stringify(data.user));
  } catch (_error) {
    localStorage.clear();
    window.location.href = "/pages/login.html";
  }
}

async function loadCollections() {
  // Helper function to filter data for teachers based on their assigned standards and medium
  function filterDataForTeacher(data, teacherProfile) {
    if (teacherProfile.role !== "teacher") return data;
    
    return data.filter(item => {
      // Check if item matches teacher's medium
      if (item.medium && item.medium !== teacherProfile.medium) return false;
      
      // Check if item matches teacher's assigned standards
      if (item.standard) {
        const teacherStandards = Array.isArray(teacherProfile.standards) 
          ? teacherProfile.standards 
          : [teacherProfile.standard].filter(Boolean);
        
        if (!teacherStandards.includes(item.standard)) return false;
      }
      
      return true;
    });
  }

  if (lecturesBody) {
    const { data } = await api("/api/content/lectures");
    const filteredData = filterDataForTeacher(data, profile);
    lecturesBody.innerHTML = filteredData
      .map((x) => `<tr><td>${x.subject}</td><td>${x.standard}</td><td>${x.date}</td></tr>`)
      .join("") || `<tr><td colspan="3">No lectures yet.</td></tr>`;
  }

  if (homeworkBody) {
    const { data } = await api("/api/content/homework");
    const isStudent = profile.role === "student";
    const isTeacher = profile.role === "teacher";
    const filteredData = filterDataForTeacher(data, profile);
    
    homeworkBody.innerHTML =
      filteredData
        .map(
          (x) =>
            `<tr>
              <td>${x.title}</td>
              <td>${x.standard || "-"}</td>
              <td>${x.dueDate || "-"}</td>
              ${isTeacher ? `<td>${x.fileLink ? `<a href="${x.fileLink}" target="_blank">Open Link</a>` : "-"}</td>` : ""}
              <td>${
                isStudent
                  ? `<button class="btn btn-outline js-homework-submit" data-id="${x.id}" data-title="${x.title}">Submit</button>`
                  : "-"
              }</td>
            </tr>`
        )
        .join("") || `<tr><td colspan="${isTeacher ? 5 : 4}">No homework yet.</td></tr>`;
  }

  if (noticesWrap) {
    const { data } = await api("/api/content/notices");
    const filteredData = filterDataForTeacher(data, profile);
    noticesWrap.innerHTML =
      filteredData.map((x) => `<article class="notice-item"><h3>${x.title}</h3><p>${x.content}</p></article>`).join("") ||
      "<p>No notices yet.</p>";
  }

  if (materialsBody) {
    const { data } = await api("/api/content/materials");
    const filteredData = filterDataForTeacher(data, profile);
    materialsBody.innerHTML =
      filteredData.map((x) => `<tr><td>${x.title}</td><td><a href="${x.link}" target="_blank">Open</a></td></tr>`).join("") ||
      `<tr><td colspan="2">No materials yet.</td></tr>`;
  }

  if (attendanceBody) {
    const { data } = await api("/api/content/attendance");
    const filteredData = filterDataForTeacher(data, profile);
    attendanceBody.innerHTML =
      filteredData.map((x) => `<tr><td>${x.date}</td><td>${x.status}</td></tr>`).join("") ||
      `<tr><td colspan="2">No attendance yet.</td></tr>`;
    if (attendancePercent) {
      const present = filteredData.filter((x) => x.status === "present").length;
      const percent = filteredData.length ? Math.round((present / filteredData.length) * 100) : 0;
      attendancePercent.textContent = `${percent}%`;
    }
  }

  if (announcementBody) {
    const { data } = await api("/api/content/announcements");
    announcementBody.innerHTML =
      data.map((x) => `<tr><td>${x.title}</td><td>${x.content}</td><td>${x.createdBy}</td></tr>`).join("") ||
      `<tr><td colspan="3">No announcements yet.</td></tr>`;
  }

  if (enquiriesBody && profile?.role === "admin") {
    const { data } = await api("/api/admin/enquiries");
    enquiriesBody.innerHTML =
      data
        .map(
          (x) =>
            `<tr><td>${x.name}</td><td>${x.standard || "-"}</td><td>${x.medium || "-"}</td><td>${x.parentPhone || "-"}</td><td>${x.message}</td><td>${new Date(
              x.createdAt
            ).toLocaleString()}</td></tr>`
        )
        .join("") || `<tr><td colspan="6">No enquiries yet.</td></tr>`;
  }
}

if (lectureForm) {
  lectureForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      subject: document.getElementById("lectureSubject").value,
      date: document.getElementById("lectureDate").value
    };
    
    // For teachers, automatically set medium and use their assigned standards
    if (profile.role === "teacher") {
      payload.medium = profile.medium;
      const selectedStandard = document.getElementById("lectureStandard").value;
      // Only allow standards that the teacher is assigned to
      const teacherStandards = Array.isArray(profile.standards) 
        ? profile.standards 
        : [profile.standard].filter(Boolean);
      
      if (!teacherStandards.includes(selectedStandard)) {
        alert("You can only create lectures for your assigned standards.");
        return;
      }
      payload.standard = selectedStandard;
    } else {
      payload.standard = document.getElementById("lectureStandard").value;
    }
    
    await api("/api/teacher/lectures", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    lectureForm.reset();
    loadCollections();
  });
}

if (homeworkForm) {
  homeworkForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById("homeworkTitle").value,
      dueDate: document.getElementById("homeworkDueDate").value,
      fileLink: document.getElementById("homeworkFileLink")?.value || ""
    };
    
    // For teachers, automatically set medium and use their assigned standards
    if (profile.role === "teacher") {
      payload.medium = profile.medium;
      const selectedStandard = document.getElementById("homeworkStandard").value;
      // Only allow standards that the teacher is assigned to
      const teacherStandards = Array.isArray(profile.standards) 
        ? profile.standards 
        : [profile.standard].filter(Boolean);
      
      if (!teacherStandards.includes(selectedStandard)) {
        alert("You can only create homework for your assigned standards.");
        return;
      }
      payload.standard = selectedStandard;
    } else {
      payload.standard = document.getElementById("homeworkStandard").value;
    }
    
    await api("/api/teacher/homework", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    homeworkForm.reset();
    loadCollections();
  });
}

if (noticeForm) {
  noticeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById("noticeTitle").value,
      content: document.getElementById("noticeContent").value
    };
    
    // For teachers, automatically set medium and standards
    if (profile.role === "teacher") {
      payload.medium = profile.medium;
      const teacherStandards = Array.isArray(profile.standards) 
        ? profile.standards 
        : [profile.standard].filter(Boolean);
      payload.standards = teacherStandards;
    }
    
    await api("/api/teacher/notices", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    noticeForm.reset();
    loadCollections();
  });
}

if (materialForm) {
  materialForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById("materialTitle").value,
      link: document.getElementById("materialLink").value
    };
    
    // For teachers, automatically set medium and standards
    if (profile.role === "teacher") {
      payload.medium = profile.medium;
      const teacherStandards = Array.isArray(profile.standards) 
        ? profile.standards 
        : [profile.standard].filter(Boolean);
      payload.standards = teacherStandards;
    }
    
    await api("/api/teacher/materials", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    materialForm.reset();
    loadCollections();
  });
}

if (attendanceForm) {
  (async () => {
    const { data } = await api("/api/teacher/students");
    if (studentsSelect) {
      studentsSelect.innerHTML = data.map((s) => `<option value="${s.id}">${s.name} (${s.standard})</option>`).join("");
    }
  })();

  attendanceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await api("/api/teacher/attendance", {
      method: "POST",
      body: JSON.stringify({
        studentId: document.getElementById("studentId").value,
        date: document.getElementById("attendanceDate").value,
        status: document.getElementById("attendanceStatus").value
      })
    });
    attendanceForm.reset();
    loadCollections();
  });
}

if (announcementForm) {
  announcementForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await api("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify({
        title: document.getElementById("announcementTitle").value,
        content: document.getElementById("announcementContent").value
      })
    });
    announcementForm.reset();
    loadCollections();
  });
}

function prepareHomeworkSubmit(id, title) {
  if (!submitHomeworkForm) return;
  document.getElementById("submitHomeworkId").value = id;
  document.getElementById("submitHomeworkLabel").textContent = `Submit for: ${title}`;
}

if (homeworkBody) {
  homeworkBody.addEventListener("click", (event) => {
    const target = event.target.closest(".js-homework-submit");
    if (!target) return;
    prepareHomeworkSubmit(target.getAttribute("data-id"), target.getAttribute("data-title"));
  });
}

if (submitHomeworkForm) {
  submitHomeworkForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("submitHomeworkId").value;
    const answerLink = document.getElementById("answerLink").value;
    await api(`/api/student/homework/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answerLink })
    });
    submitHomeworkForm.reset();
    alert("Homework submitted.");
  });
}

verifySession().then(async () => {
  await loadSummary().catch(() => null);
  await loadRequests().catch(() => null);
  await loadCollections().catch(() => null);
});

function setProfileStandardOptions() {
  if (!profileMedium || !profileStandard) return;
  const options = profileMedium.value === "Marathi" ? ["3", "4", "5", "6", "7", "8", "9", "10"] : ["8", "9", "10"];
  profileStandard.innerHTML = options.map((x) => `<option value="${x}">${x}</option>`).join("");
}

if (profileForm) {
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileRole = document.getElementById("profileRole");

  if (profileName) profileName.value = profile?.name || "";
  if (profileEmail) profileEmail.value = profile?.email || "";
  if (profileRole) profileRole.value = profile?.role || "";
  if (profileMedium) profileMedium.value = profile?.medium || "English";

  setProfileStandardOptions();
  if (profileStandard && profile?.standard) profileStandard.value = profile.standard;

  profileMedium?.addEventListener("change", setProfileStandardOptions);

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const result = await api("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        name: document.getElementById("profileName").value.trim(),
        medium: profileMedium?.value,
        standard: profileStandard?.value
      })
    });
    localStorage.setItem("profile", JSON.stringify(result.user));
    alert(result.message || "Profile updated");
    window.location.reload();
  });
}
>>>>>>> 2334ae2eaa12245373b572f6a541bf9c11dec475

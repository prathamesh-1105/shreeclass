<<<<<<< HEAD
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const mediumSelect = document.getElementById("medium");
const standardSelect = document.getElementById("standard");
const roleSelect = document.getElementById("role");
const standardGroup = document.getElementById("standardGroup");

function setStandardOptions() {
  if (!mediumSelect || !standardSelect) return;
  const medium = mediumSelect.value;
  
  let options = [];
  if (medium === "Marathi") {
    options = ["3", "4", "5", "6", "7", "8", "9", "10"];
  } else {
    options = ["8", "9", "10"];
  }
  
  // Create options with better formatting
  let html = '<option value="">Select your class</option>';
  options.forEach(standard => {
    html += `<option value="${standard}">Class ${standard} (${medium} Medium)</option>`;
  });
  standardSelect.innerHTML = html;
}

function toggleFormFields() {
  if (!roleSelect || !standardGroup) return;
  
  const role = roleSelect.value;
  
  if (role === "teacher") {
    // For teachers: show standard (single) - same as students
    standardGroup.style.display = "block";
    standardSelect.multiple = false;
    standardSelect.size = 1;
    // Update label and help text for teachers
    standardGroup.querySelector('label').textContent = "Your Class/Standard *";
    standardGroup.querySelector('small').textContent = "Choose the class you want to teach";
    // Refresh options with teacher-friendly format
    setStandardOptions();
  } else if (role === "student") {
    // For students: show standard (single)
    standardGroup.style.display = "block";
    standardSelect.multiple = false;
    standardSelect.size = 1;
    // Update label and help text for students
    standardGroup.querySelector('label').textContent = "Your Class/Standard *";
    standardGroup.querySelector('small').textContent = "Choose the class you want to enroll in";
    // Refresh options with student-friendly format
    setStandardOptions();
  }
}

async function saveRequest(formData) {
  const response = await fetch("/api/auth/signup-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });
  return response.json();
}

if (mediumSelect) {
  setStandardOptions();
  mediumSelect.addEventListener("change", setStandardOptions);
}

if (roleSelect) {
  toggleFormFields();
  roleSelect.addEventListener("change", toggleFormFields);
}

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const role = document.getElementById("role").value;
    
    // Get selected standards (handle both single and multiple)
    const standardElement = document.getElementById("standard");
    let standards;
    if (standardElement.multiple) {
      standards = Array.from(standardElement.selectedOptions).map(option => option.value);
    } else {
      standards = [standardElement.value];
    }
    
    const formData = {
      name: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value,
      role: role,
      medium: document.getElementById("medium").value,
      standards: standards
    };

    if (formData.password !== formData.confirmPassword) {
      alert("Password and confirm password must match.");
      return;
    }

    try {
      const result = await saveRequest(formData);
      alert(result.message || "Request sent to admin.");
      window.location.href = "/pages/login.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("profile", JSON.stringify(data.user));

      if (data.user.role === "admin") window.location.href = "/dashboard/admin/index.html";
      if (data.user.role === "teacher") window.location.href = "/dashboard/teacher/index.html";
      if (data.user.role === "student") window.location.href = "/dashboard/student/index.html";
    } catch (error) {
      alert(error.message);
    }
  });
}
=======
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const mediumSelect = document.getElementById("medium");
const standardSelect = document.getElementById("standard");
const roleSelect = document.getElementById("role");
const standardGroup = document.getElementById("standardGroup");

function setStandardOptions() {
  if (!mediumSelect || !standardSelect) return;
  const medium = mediumSelect.value;
  
  let options = [];
  if (medium === "Marathi") {
    options = ["3", "4", "5", "6", "7", "8", "9", "10"];
  } else {
    options = ["8", "9", "10"];
  }
  
  // Create options with better formatting
  let html = '<option value="">Select your class</option>';
  options.forEach(standard => {
    html += `<option value="${standard}">Class ${standard} (${medium} Medium)</option>`;
  });
  standardSelect.innerHTML = html;
}

function toggleFormFields() {
  if (!roleSelect || !standardGroup) return;
  
  const role = roleSelect.value;
  
  if (role === "teacher") {
    // For teachers: show standard (single) - same as students
    standardGroup.style.display = "block";
    standardSelect.multiple = false;
    standardSelect.size = 1;
    // Update label and help text for teachers
    standardGroup.querySelector('label').textContent = "Your Class/Standard *";
    standardGroup.querySelector('small').textContent = "Choose the class you want to teach";
    // Refresh options with teacher-friendly format
    setStandardOptions();
  } else if (role === "student") {
    // For students: show standard (single)
    standardGroup.style.display = "block";
    standardSelect.multiple = false;
    standardSelect.size = 1;
    // Update label and help text for students
    standardGroup.querySelector('label').textContent = "Your Class/Standard *";
    standardGroup.querySelector('small').textContent = "Choose the class you want to enroll in";
    // Refresh options with student-friendly format
    setStandardOptions();
  }
}

async function saveRequest(formData) {
  const response = await fetch("/api/auth/signup-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  });
  return response.json();
}

if (mediumSelect) {
  setStandardOptions();
  mediumSelect.addEventListener("change", setStandardOptions);
}

if (roleSelect) {
  toggleFormFields();
  roleSelect.addEventListener("change", toggleFormFields);
}

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const role = document.getElementById("role").value;
    
    // Get selected standards (handle both single and multiple)
    const standardElement = document.getElementById("standard");
    let standards;
    if (standardElement.multiple) {
      standards = Array.from(standardElement.selectedOptions).map(option => option.value);
    } else {
      standards = [standardElement.value];
    }
    
    const formData = {
      name: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      confirmPassword: document.getElementById("confirmPassword").value,
      role: role,
      medium: document.getElementById("medium").value,
      standards: standards
    };

    if (formData.password !== formData.confirmPassword) {
      alert("Password and confirm password must match.");
      return;
    }

    try {
      const result = await saveRequest(formData);
      alert(result.message || "Request sent to admin.");
      window.location.href = "/pages/login.html";
    } catch (error) {
      alert(error.message);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("profile", JSON.stringify(data.user));

      if (data.user.role === "admin") window.location.href = "/dashboard/admin/index.html";
      if (data.user.role === "teacher") window.location.href = "/dashboard/teacher/index.html";
      if (data.user.role === "student") window.location.href = "/dashboard/student/index.html";
    } catch (error) {
      alert(error.message);
    }
  });
}
>>>>>>> 2334ae2eaa12245373b572f6a541bf9c11dec475

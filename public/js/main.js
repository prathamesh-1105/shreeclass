<<<<<<< HEAD
const enquiryForm = document.getElementById("enquiryForm");
const homeAnnouncements = document.getElementById("homeAnnouncements");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

// Load announcements on home page
if (homeAnnouncements) {
  loadHomeAnnouncements();
}

async function loadHomeAnnouncements() {
  try {
    const response = await fetch("/api/announcements");
    if (response.ok) {
      const announcements = await response.json();
      
      if (announcements.length === 0) {
        homeAnnouncements.innerHTML = '<p style="text-align: center; color: #6b7280;">No announcements at this time.</p>';
        return;
      }
      
      // Show only the latest 3 announcements
      const latestAnnouncements = announcements.slice(0, 3);
      
      homeAnnouncements.innerHTML = latestAnnouncements.map(announcement => `
        <article class="notice-item">
          <h3>${announcement.title}</h3>
          <p>${announcement.content}</p>
          <small style="color: #6b7280; font-size: 0.875rem;">
            Posted by ${announcement.createdBy} on ${new Date(announcement.createdAt).toLocaleDateString()}
          </small>
        </article>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading announcements:', error);
    homeAnnouncements.innerHTML = '<p style="text-align: center; color: #dc2626;">Unable to load announcements.</p>';
  }
}

// Phone number validation function
function validatePhoneNumber(phone) {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid Indian phone number (10 digits)
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return true;
  }
  
  // Check if it's a valid phone number with country code (11-12 digits starting with +91)
  if (cleaned.length === 11 && cleaned.startsWith('91') && /^[6-9]\d{9}$/.test(cleaned.substring(2))) {
    return true;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91') && /^[6-9]\d{9}$/.test(cleaned.substring(2))) {
    return true;
  }
  
  return false;
}

if (enquiryForm) {
  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById("enqName").value.trim();
    const standard = document.getElementById("enqStandard").value;
    const medium = document.getElementById("enqMedium").value;
    const message = document.getElementById("enqMessage").value.trim();
    const parentPhone = document.getElementById("enqParentPhone").value.trim();
    
    // Validate required fields
    if (!name || !standard || !medium || !message || !parentPhone) {
      alert("Please fill in all required fields.");
      return;
    }
    
    // Validate phone number
    if (!validatePhoneNumber(parentPhone)) {
      alert("Please enter a valid phone number (10 digits or with +91 country code).");
      return;
    }
    
    const payload = {
      name: name,
      standard: standard,
      medium: medium,
      message: message,
      parentPhone: parentPhone
    };

    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    alert(data.message || "Submitted");
    if (response.ok) enquiryForm.reset();
  });
}

// Mobile navigation toggle
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
  
  // Close menu when clicking on a link
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navLinks.classList.remove("active");
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove("active");
    }
  });
}
=======
const enquiryForm = document.getElementById("enquiryForm");
const homeAnnouncements = document.getElementById("homeAnnouncements");

// Load announcements on home page
if (homeAnnouncements) {
  loadHomeAnnouncements();
}

async function loadHomeAnnouncements() {
  try {
    const response = await fetch("/api/announcements");
    if (response.ok) {
      const announcements = await response.json();
      
      if (announcements.length === 0) {
        homeAnnouncements.innerHTML = '<p style="text-align: center; color: #6b7280;">No announcements at this time.</p>';
        return;
      }
      
      // Show only the latest 3 announcements
      const latestAnnouncements = announcements.slice(0, 3);
      
      homeAnnouncements.innerHTML = latestAnnouncements.map(announcement => `
        <article class="notice-item">
          <h3>${announcement.title}</h3>
          <p>${announcement.content}</p>
          <small style="color: #6b7280; font-size: 0.875rem;">
            Posted by ${announcement.createdBy} on ${new Date(announcement.createdAt).toLocaleDateString()}
          </small>
        </article>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading announcements:', error);
    homeAnnouncements.innerHTML = '<p style="text-align: center; color: #dc2626;">Unable to load announcements.</p>';
  }
}

// Phone number validation function
function validatePhoneNumber(phone) {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid Indian phone number (10 digits)
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return true;
  }
  
  // Check if it's a valid phone number with country code (11-12 digits starting with +91)
  if (cleaned.length === 11 && cleaned.startsWith('91') && /^[6-9]\d{9}$/.test(cleaned.substring(2))) {
    return true;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('91') && /^[6-9]\d{9}$/.test(cleaned.substring(2))) {
    return true;
  }
  
  return false;
}

if (enquiryForm) {
  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById("enqName").value.trim();
    const standard = document.getElementById("enqStandard").value;
    const medium = document.getElementById("enqMedium").value;
    const message = document.getElementById("enqMessage").value.trim();
    const parentPhone = document.getElementById("enqParentPhone").value.trim();
    
    // Validate required fields
    if (!name || !standard || !medium || !message || !parentPhone) {
      alert("Please fill in all required fields.");
      return;
    }
    
    // Validate phone number
    if (!validatePhoneNumber(parentPhone)) {
      alert("Please enter a valid phone number (10 digits or with +91 country code).");
      return;
    }
    
    const payload = {
      name: name,
      standard: standard,
      medium: medium,
      message: message,
      parentPhone: parentPhone
    };

    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    alert(data.message || "Submitted");
    if (response.ok) enquiryForm.reset();
  });
}
>>>>>>> 2334ae2eaa12245373b572f6a541bf9c11dec475

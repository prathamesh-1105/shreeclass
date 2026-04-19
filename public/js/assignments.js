// Assignment Management JavaScript
let currentUser = null;
let teachers = [];
let students = [];
let assignments = [];

// Initialize assignment management
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current user from localStorage
    const profile = localStorage.getItem('profile');
    if (!profile) {
      window.location.href = '/pages/login.html';
      return;
    }
    
    currentUser = JSON.parse(profile);
    
    // Load data
    await loadTeachers();
    await loadStudents();
    await loadAssignments();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update user info in topbar
    document.querySelector('.js-user-name').textContent = currentUser.name;
    document.querySelector('.js-user-role').textContent = currentUser.role;
    
  } catch (error) {
    console.error('Failed to initialize assignment management:', error);
    alert('Failed to load assignment management. Please try again.');
  }
});

// Setup event listeners
function setupEventListeners() {
  // Form submission
  document.getElementById('assignmentForm').addEventListener('submit', handleCreateAssignment);
  
  // Teacher selection change
  document.getElementById('teacherSelect').addEventListener('change', handleTeacherChange);
  
  // Student selection change
  document.getElementById('studentSelect').addEventListener('change', handleStudentChange);
  
  // Filter changes
  document.getElementById('filterTeacher').addEventListener('change', filterAssignments);
  document.getElementById('filterStandard').addEventListener('change', filterAssignments);
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    window.location.href = '/pages/login.html';
  });
}

// Load teachers
async function loadTeachers() {
  try {
    const response = await api('/api/users');
    teachers = response.data.filter(user => user.role === 'teacher' && user.status === 'approved');
    
    // Populate teacher selects
    const teacherSelect = document.getElementById('teacherSelect');
    const filterTeacher = document.getElementById('filterTeacher');
    
    teachers.forEach(teacher => {
      const option1 = new Option(`${teacher.name} (${teacher.standards.join(', ')})`, teacher.id);
      const option2 = new Option(`${teacher.name} (${teacher.standards.join(', ')})`, teacher.id);
      teacherSelect.add(option1);
      filterTeacher.add(option2);
    });
    
  } catch (error) {
    console.error('Failed to load teachers:', error);
  }
}

// Load students
async function loadStudents() {
  try {
    const response = await api('/api/users');
    students = response.data.filter(user => user.role === 'student' && user.status === 'approved');
    
    // Populate student select
    const studentSelect = document.getElementById('studentSelect');
    const filterStandard = document.getElementById('filterStandard');
    
    // Get unique standards
    const standards = [...new Set(students.map(s => s.standard))].sort();
    
    students.forEach(student => {
      const option = new Option(`${student.name} - Std ${student.standard} (${student.medium})`, student.id);
      studentSelect.add(option);
    });
    
    standards.forEach(standard => {
      const option = new Option(`Standard ${standard}`, standard);
      filterStandard.add(option);
    });
    
  } catch (error) {
    console.error('Failed to load students:', error);
  }
}

// Load assignments
async function loadAssignments() {
  try {
    const response = await api('/api/assignments');
    assignments = response.data;
    renderAssignments();
  } catch (error) {
    console.error('Failed to load assignments:', error);
    document.getElementById('assignmentsList').innerHTML = '<div class="empty-state">Failed to load assignments</div>';
  }
}

// Handle teacher selection change
function handleTeacherChange() {
  const teacherId = document.getElementById('teacherSelect').value;
  const subjectSelect = document.getElementById('subjectSelect');
  const studentSelect = document.getElementById('studentSelect');
  
  // Clear subjects
  subjectSelect.innerHTML = '<option value="">Select Subject</option>';
  
  if (!teacherId) return;
  
  const teacher = teachers.find(t => t.id === teacherId);
  if (!teacher) return;
  
  // Populate subjects
  teacher.subjects.forEach(subject => {
    const option = new Option(subject, subject);
    subjectSelect.add(option);
  });
  
  // Filter students based on teacher's standards and medium
  const teacherStudents = students.filter(student => 
    teacher.standards.includes(student.standard) && teacher.medium === student.medium
  );
  
  // Update student select
  studentSelect.innerHTML = '<option value="">Select Student</option>';
  teacherStudents.forEach(student => {
    const option = new Option(`${student.name} - Std ${student.standard} (${student.medium})`, student.id);
    studentSelect.add(option);
  });
}

// Handle student selection change
function handleStudentChange() {
  const studentId = document.getElementById('studentSelect').value;
  const teacherId = document.getElementById('teacherSelect').value;
  const subjectSelect = document.getElementById('subjectSelect');
  
  if (!studentId || !teacherId) return;
  
  const student = students.find(s => s.id === studentId);
  const teacher = teachers.find(t => t.id === teacherId);
  
  if (!student || !teacher) return;
  
  // Filter subjects based on what teacher teaches and student needs
  const availableSubjects = teacher.subjects;
  
  // Update subject select
  subjectSelect.innerHTML = '<option value="">Select Subject</option>';
  availableSubjects.forEach(subject => {
    const option = new Option(subject, subject);
    subjectSelect.add(option);
  });
}

// Handle create assignment
async function handleCreateAssignment(event) {
  event.preventDefault();
  
  const teacherId = document.getElementById('teacherSelect').value;
  const studentId = document.getElementById('studentSelect').value;
  const subject = document.getElementById('subjectSelect').value;
  
  if (!teacherId || !studentId || !subject) {
    alert('Please fill all fields');
    return;
  }
  
  try {
    const response = await api('/api/assignments', {
      method: 'POST',
      body: JSON.stringify({ teacherId, studentId, subject })
    });
    
    alert('Assignment created successfully');
    
    // Reset form
    document.getElementById('assignmentForm').reset();
    
    // Reload assignments
    await loadAssignments();
    
  } catch (error) {
    console.error('Failed to create assignment:', error);
    alert(error.message || 'Failed to create assignment');
  }
}

// Render assignments
function renderAssignments(filteredAssignments = null) {
  const assignmentsList = document.getElementById('assignmentsList');
  const assignmentsToRender = filteredAssignments || assignments;
  
  if (assignmentsToRender.length === 0) {
    assignmentsList.innerHTML = '<div class="empty-state">No assignments found</div>';
    return;
  }
  
  assignmentsList.innerHTML = assignmentsToRender.map(assignment => `
    <div class="assignment-item">
      <div class="assignment-info">
        <strong>${assignment.teacher?.name || 'Unknown Teacher'}</strong>
        <span class="badge">${assignment.subject}</span>
        teaches 
        <strong>${assignment.student?.name || 'Unknown Student'}</strong>
        <span class="badge">Std ${assignment.student?.standard || 'N/A'}</span>
        <span class="badge">${assignment.student?.medium || 'N/A'}</span>
        <br>
        <small style="color: #6b7280;">
          Created: ${new Date(assignment.createdAt).toLocaleDateString()}
        </small>
      </div>
      <div class="assignment-actions">
        <button class="btn btn-danger" onclick="deleteAssignment('${assignment.id}')">
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

// Delete assignment
async function deleteAssignment(assignmentId) {
  if (!confirm('Are you sure you want to delete this assignment?')) return;
  
  try {
    await api(`/api/assignments/${assignmentId}`, {
      method: 'DELETE'
    });
    
    alert('Assignment deleted successfully');
    await loadAssignments();
    
  } catch (error) {
    console.error('Failed to delete assignment:', error);
    alert(error.message || 'Failed to delete assignment');
  }
}

// Filter assignments
function filterAssignments() {
  const filterTeacher = document.getElementById('filterTeacher').value;
  const filterStandard = document.getElementById('filterStandard').value;
  
  let filtered = assignments;
  
  if (filterTeacher) {
    filtered = filtered.filter(a => a.teacherId === filterTeacher);
  }
  
  if (filterStandard) {
    filtered = filtered.filter(a => a.student?.standard === filterStandard);
  }
  
  renderAssignments(filtered);
}

// Clear filters
function clearFilters() {
  document.getElementById('filterTeacher').value = '';
  document.getElementById('filterStandard').value = '';
  renderAssignments();
}

// API helper function
async function api(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  const response = await fetch(endpoint, finalOptions);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

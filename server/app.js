require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createServer } = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { readDb, writeDb, createId } = require("./dataStore");
const { verifyToken, allowRoles } = require("./middlewareAuth");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "fallback-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",
  scope: ["profile", "email"]
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const db = readDb();
    
    // Check if user exists
    let user = db.users.find(u => u.email === profile.emails[0].value);
    
    if (!user) {
      // Create new user with Google profile
      user = {
        id: createId("user"),
        name: profile.displayName,
        email: profile.emails[0].value,
        role: "student", // Default role, admin can change later
        medium: "English", // Default medium
        standard: "8", // Default standard
        status: "approved", // Auto-approve Google users
        subjects: [],
        standards: ["8"],
        googleId: profile.id,
        avatar: profile.photos[0]?.value,
        createdAt: new Date().toISOString()
      };
      
      db.users.push(user);
      writeDb(db);
    } else {
      // Update Google info if not present
      if (!user.googleId) {
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value;
        writeDb(db);
      }
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize and deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  try {
    const db = readDb();
    const user = db.users.find(u => u.id === id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

// Store online users
const onlineUsers = new Map();

// Socket.IO connection handling
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = readDb();
    const user = db.users.find(u => u.id === decoded.userId);
    
    if (!user || user.status !== "approved") {
      return next(new Error('User not found or not approved'));
    }
    
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.name} (${socket.user.role})`);
  
  // Add user to online users
  onlineUsers.set(socket.user.id, {
    id: socket.user.id,
    name: socket.user.name,
    role: socket.user.role,
    socketId: socket.id
  });
  
  // Broadcast online status
  socket.broadcast.emit('user_online', {
    userId: socket.user.id,
    name: socket.user.name,
    role: socket.user.role
  });
  
  // Send current online users to the connected user
  const onlineUsersArray = Array.from(onlineUsers.values()).filter(u => u.id !== socket.user.id);
  socket.emit('online_users', onlineUsersArray);
  
  // Join user to their role-based room
  socket.join(`role_${socket.user.role}`);
  socket.join(`user_${socket.user.id}`);
  
  // Handle joining chat rooms based on assignments
  if (socket.user.role === "admin") {
    // Admin joins all chat rooms
    const db = readDb();
    const allUsers = db.users.filter(u => u.id !== socket.user.id && u.status === "approved");
    allUsers.forEach(user => {
      socket.join(`chat_${socket.user.id}_${user.id}`);
    });
  } else if (socket.user.role === "teacher") {
    // Teacher joins chat rooms with assigned students and admin
    const db = readDb();
    const teacherAssignments = db.assignments.filter(a => a.teacherId === socket.user.id);
    const assignedStudentIds = [...new Set(teacherAssignments.map(a => a.studentId))];
    
    // Join admin chat
    const admin = db.users.find(u => u.role === "admin" && u.status === "approved");
    if (admin) {
      socket.join(`chat_${socket.user.id}_${admin.id}`);
    }
    
    // Join assigned student chats
    assignedStudentIds.forEach(studentId => {
      socket.join(`chat_${socket.user.id}_${studentId}`);
    });
  } else if (socket.user.role === "student") {
    // Student joins chat rooms with assigned teachers and admin
    const db = readDb();
    const studentAssignments = db.assignments.filter(a => a.studentId === socket.user.id);
    const assignedTeacherIds = [...new Set(studentAssignments.map(a => a.teacherId))];
    
    // Join admin chat
    const admin = db.users.find(u => u.role === "admin" && u.status === "approved");
    if (admin) {
      socket.join(`chat_${socket.user.id}_${admin.id}`);
    }
    
    // Join assigned teacher chats
    assignedTeacherIds.forEach(teacherId => {
      socket.join(`chat_${socket.user.id}_${teacherId}`);
    });
  }
  
  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { chatId, content, recipientId } = data;
      
      if (!content || !content.trim()) {
        socket.emit('error', { message: 'Message content is required' });
        return;
      }
      
      // Verify chat exists and user is part of it
      const db = readDb();
      const chat = db.chats.find(c => c.id === chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }
      
      if (chat.participant1 !== socket.user.id && chat.participant2 !== socket.user.id) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }
      
      // Create message
      const message = {
        id: createId("msg"),
        chatId,
        senderId: socket.user.id,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        read: false
      };
      
      // Save message to database
      db.messages.push(message);
      
      // Update chat last message info
      const chatIndex = db.chats.findIndex(c => c.id === chatId);
      db.chats[chatIndex].lastMessage = content.trim();
      db.chats[chatIndex].lastMessageTime = new Date().toISOString();
      
      writeDb(db);
      
      // Get recipient info
      const recipient = onlineUsers.get(recipientId) || 
                       db.users.find(u => u.id === recipientId);
      
      // Send message to both participants
      const roomName = `chat_${chat.participant1}_${chat.participant2}`;
      io.to(roomName).emit('new_message', {
        ...message,
        sender: {
          id: socket.user.id,
          name: socket.user.name,
          role: socket.user.role
        }
      });
      
      // Send to recipient if they're online
      if (recipient) {
        io.to(`user_${recipientId}`).emit('new_message_notification', {
          messageId: message.id,
          chatId,
          sender: socket.user.name,
          content: content.trim()
        });
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle marking messages as read
  socket.on('mark_read', (data) => {
    try {
      const { messageId } = data;
      const db = readDb();
      
      const messageIndex = db.messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;
      
      const message = db.messages[messageIndex];
      
      // Only recipient can mark as read
      if (message.senderId === socket.user.id) return;
      
      db.messages[messageIndex].read = true;
      writeDb(db);
      
      // Notify sender that message was read
      io.to(`user_${message.senderId}`).emit('message_read', {
        messageId,
        readBy: socket.user.id
      });
      
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { chatId, recipientId } = data;
    socket.to(`user_${recipientId}`).emit('user_typing', {
      chatId,
      userId: socket.user.id,
      userName: socket.user.name
    });
  });
  
  socket.on('typing_stop', (data) => {
    const { chatId, recipientId } = data;
    socket.to(`user_${recipientId}`).emit('user_stopped_typing', {
      chatId,
      userId: socket.user.id
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name}`);
    
    // Remove from online users
    onlineUsers.delete(socket.user.id);
    
    // Broadcast offline status
    socket.broadcast.emit('user_offline', {
      userId: socket.user.id
    });
  });
});

// Google OAuth routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", 
  passport.authenticate("google", { failureRedirect: "/pages/login.html?error=google_failed" }),
  (req, res) => {
    // Generate JWT token for the authenticated user
    const token = signToken(req.user.id);
    
    // Store token and user info in localStorage via redirect
    res.redirect(`/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

// Auth success endpoint to handle token storage
app.get("/auth/success", (req, res) => {
  const { token, user } = req.query;
  
  if (!token || !user) {
    return res.redirect("/pages/login.html?error=auth_failed");
  }
  
  // Send HTML page that stores the token and redirects to dashboard
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login Successful</title>
      <script>
        localStorage.setItem('token', '${token}');
        localStorage.setItem('profile', decodeURIComponent('${user}'));
        
        const userData = JSON.parse(decodeURIComponent('${user}'));
        
        if (userData.role === "admin") {
          window.location.href = "/dashboard/admin/index.html";
        } else if (userData.role === "teacher") {
          window.location.href = "/dashboard/teacher/index.html";
        } else {
          window.location.href = "/dashboard/student/index.html";
        }
      </script>
    </head>
    <body>
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
        <div>Logging in...</div>
      </div>
    </body>
    </html>
  `);
});

// Logout route for Google users
app.get("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.redirect("/pages/login.html?error=logout_failed");
    res.redirect("/pages/login.html");
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "Shree Classes CMS" });
});

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "8h" });
}

app.post("/api/auth/signup-request", async (req, res) => {
  try {
    const { name, email, password, role, medium, standards, subjects } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role || !medium || !standards || !Array.isArray(standards)) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
        
    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const db = readDb();
    if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userData = {
      id: createId("user"),
      name,
      email,
      passwordHash,
      role,
      medium,
      standard: role === "student" ? standards[0] : null, // Single standard for students
      standards: role === "teacher" ? standards : [standards[0]], // Multiple for teachers
      subjects: role === "teacher" ? subjects : [],
      status: "pending",
      createdAt: new Date().toISOString()
    };

    db.users.push(userData);
    writeDb(db);
    return res.status(201).json({ message: "Request sent to admin", data: userData });
  } catch (error) {
    return res.status(500).json({ message: "Unable to register request", error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status !== "approved") return res.status(403).json({ message: `Your account is ${user.status}` });

    const token = signToken(user.id);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        medium: user.medium,
        standard: user.standard
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

app.get("/api/auth/me", verifyToken, async (req, res) => {
  const { id, name, email, role, status, medium, standard } = req.user;
  return res.json({ user: { id, name, email, role, status, medium, standard } });
});

app.put("/api/profile", verifyToken, async (req, res) => {
  try {
    const { name, medium, standard } = req.body || {};
    const db = readDb();
    const user = db.users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name.trim();
    if (medium) user.medium = medium;
    if (standard) user.standard = standard;
    user.updatedAt = new Date().toISOString();

    writeDb(db);
    return res.json({
      message: "Profile updated",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        medium: user.medium,
        standard: user.standard
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update profile", error: error.message });
  }
});

app.get("/api/admin/requests", verifyToken, allowRoles(["admin"]), async (_req, res) => {
  try {
    const db = readDb();
    const items = db.users.filter((u) => u.status === "pending");
    return res.json({ data: items });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load requests", error: error.message });
  }
});

app.post("/api/admin/requests/:userId/approve", verifyToken, allowRoles(["admin"]), async (req, res) => {
  try {
    const db = readDb();
    const item = db.users.find((u) => u.id === req.params.userId);
    if (!item) return res.status(404).json({ message: "Request not found" });
    item.status = "approved";
    item.approvedAt = new Date().toISOString();
    writeDb(db);
    return res.json({ message: "Request approved" });
  } catch (error) {
    return res.status(500).json({ message: "Approve failed", error: error.message });
  }
});

app.post("/api/admin/requests/:userId/reject", verifyToken, allowRoles(["admin"]), async (req, res) => {
  try {
    const db = readDb();
    const item = db.users.find((u) => u.id === req.params.userId);
    if (!item) return res.status(404).json({ message: "Request not found" });
    item.status = "rejected";
    item.rejectedAt = new Date().toISOString();
    writeDb(db);
    return res.json({ message: "Request rejected" });
  } catch (error) {
    return res.status(500).json({ message: "Reject failed", error: error.message });
  }
});

app.get("/api/dashboard/summary", verifyToken, async (req, res) => {
  try {
    const db = readDb();
    const students = db.users.filter((u) => u.role === "student" && u.status === "approved");
    const teachers = db.users.filter((u) => u.role === "teacher" && u.status === "approved");
    const pending = db.users.filter((u) => u.status === "pending");

    return res.json({
      data: {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        pendingRequests: pending.length,
        announcements: db.announcements.length,
        lectures: db.lectures.length,
        homework: db.homework.length,
        notices: db.notices.length
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load summary", error: error.message });
  }
});

app.post("/api/enquiries", async (req, res) => {
  try {
    const { name, standard, medium, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ message: "Name and message are required" });
    }

    const db = readDb();
    db.enquiries.push({
      id: createId("enquiry"),
      name,
      standard,
      medium,
      message,
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    return res.status(201).json({ message: "Enquiry submitted" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to submit enquiry", error: error.message });
  }
});

app.post("/api/admin/announcements", verifyToken, allowRoles(["admin"]), (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) return res.status(400).json({ message: "Title and content required" });
  const db = readDb();
  db.announcements.push({ id: createId("ann"), title, content, createdBy: req.user.name, createdAt: new Date().toISOString() });
  writeDb(db);
  return res.status(201).json({ message: "Announcement added" });
});

app.post("/api/teacher/lectures", verifyToken, allowRoles(["teacher"]), (req, res) => {
  const { subject, standard, date } = req.body || {};
  if (!subject || !standard || !date) return res.status(400).json({ message: "Subject, standard and date required" });
  const db = readDb();
  db.lectures.push({ id: createId("lec"), subject, standard, medium: req.user.medium, date, teacherId: req.user.id, teacher: req.user.name });
  writeDb(db);
  return res.status(201).json({ message: "Lecture added" });
});

app.post("/api/teacher/homework", verifyToken, allowRoles(["teacher"]), (req, res) => {
  const { title, standard, dueDate, fileLink } = req.body || {};
  if (!title || !standard || !dueDate) return res.status(400).json({ message: "Title, standard and due date required" });
  const db = readDb();
  db.homework.push({
    id: createId("hw"),
    title,
    standard,
    medium: req.user.medium,
    dueDate,
    fileLink: fileLink || "",
    teacherId: req.user.id,
    submissions: []
  });
  writeDb(db);
  return res.status(201).json({ message: "Homework added" });
});

app.post("/api/teacher/materials", verifyToken, allowRoles(["teacher"]), (req, res) => {
  const { title, link } = req.body || {};
  if (!title || !link) return res.status(400).json({ message: "Title and material link required" });
  const db = readDb();
  db.materials.push({ id: createId("mat"), title, link, standard: req.user.standard, medium: req.user.medium, teacher: req.user.name });
  writeDb(db);
  return res.status(201).json({ message: "Study material added" });
});

app.post("/api/teacher/notices", verifyToken, allowRoles(["teacher"]), (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) return res.status(400).json({ message: "Title and content required" });
  const db = readDb();
  db.notices.push({ id: createId("notice"), title, content, standard: req.user.standard, medium: req.user.medium, createdBy: req.user.name });
  writeDb(db);
  return res.status(201).json({ message: "Notice added" });
});

app.post("/api/teacher/attendance", verifyToken, allowRoles(["teacher"]), (req, res) => {
  const { studentId, date, status } = req.body || {};
  if (!studentId || !date || !["present", "absent"].includes((status || "").toLowerCase())) {
    return res.status(400).json({ message: "Student, date and valid status required" });
  }
  const db = readDb();
  db.attendance.push({ id: createId("att"), studentId, date, status: status.toLowerCase(), markedBy: req.user.id });
  writeDb(db);
  return res.status(201).json({ message: "Attendance marked" });
});

app.get("/api/teacher/students", verifyToken, allowRoles(["teacher"]), (req, res) => {
  const db = readDb();
  const students = db.users.filter((u) => u.role === "student" && u.status === "approved");
  return res.json({ data: students.map((s) => ({ id: s.id, name: s.name, standard: s.standard, medium: s.medium })) });
});

app.post("/api/student/homework/:homeworkId/submit", verifyToken, allowRoles(["student"]), (req, res) => {
  const { answerLink } = req.body || {};
  if (!answerLink) return res.status(400).json({ message: "Submission link required" });
  const db = readDb();
  const hw = db.homework.find((h) => h.id === req.params.homeworkId);
  if (!hw) return res.status(404).json({ message: "Homework not found" });
  hw.submissions.push({ studentId: req.user.id, studentName: req.user.name, answerLink, submittedAt: new Date().toISOString() });
  writeDb(db);
  return res.json({ message: "Homework submitted" });
});

app.get("/api/admin/view-all", verifyToken, allowRoles(["admin"]), (req, res) => {
  const db = readDb();
  return res.json({
    data: {
      users: db.users,
      announcements: db.announcements,
      notices: db.notices,
      lectures: db.lectures,
      homework: db.homework,
      materials: db.materials,
      attendance: db.attendance,
      enquiries: db.enquiries
    }
  });
});

app.get("/api/admin/enquiries", verifyToken, allowRoles(["admin"]), (req, res) => {
  const db = readDb();
  return res.json({ data: db.enquiries || [] });
});

app.get("/api/content/announcements", verifyToken, (req, res) => {
  const db = readDb();
  return res.json({ data: db.announcements });
});
app.get("/api/content/notices", verifyToken, (req, res) => {
  const db = readDb();
  return res.json({ data: db.notices });
});
app.get("/api/content/lectures", verifyToken, (req, res) => {
  const db = readDb();
  const data =
    req.user.role === "student"
      ? db.lectures.filter((l) => l.standard === req.user.standard && l.medium === req.user.medium)
      : db.lectures;
  return res.json({ data });
});
app.get("/api/content/homework", verifyToken, (req, res) => {
  const db = readDb();
  const data =
    req.user.role === "student"
      ? db.homework.filter((h) => h.standard === req.user.standard && h.medium === req.user.medium)
      : db.homework;
  return res.json({ data });
});
app.get("/api/content/materials", verifyToken, (req, res) => {
  const db = readDb();
  const data =
    req.user.role === "student"
      ? db.materials.filter((m) => m.medium === req.user.medium)
      : db.materials;
  return res.json({ data });
});
app.get("/api/content/attendance", verifyToken, (req, res) => {
  const db = readDb();
  const data = req.user.role === "student" ? db.attendance.filter((a) => a.studentId === req.user.id) : db.attendance;
  return res.json({ data });
});

// Users API endpoint for assignment management
app.get("/api/users", verifyToken, (req, res) => {
  try {
    const db = readDb();
    const users = db.users
      .filter(user => user.status === "approved")
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        medium: user.medium,
        standard: user.standard,
        standards: user.standards || [],
        subjects: user.subjects || [],
        status: user.status
      }));
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Chat API endpoints
app.get("/api/chat/users", verifyToken, (req, res) => {
  try {
    const db = readDb();
    let users = [];
    
    if (req.user.role === "admin") {
      // Admin can chat with all approved users
      users = db.users
        .filter(user => user.status === "approved" && user.id !== req.user.id)
        .map(user => ({
          id: user.id,
          name: user.name,
          role: user.role,
          isOnline: false
        }));
    } else if (req.user.role === "teacher") {
      // Teacher can chat with assigned students and admin
      const teacherAssignments = db.assignments.filter(a => a.teacherId === req.user.id);
      const assignedStudentIds = [...new Set(teacherAssignments.map(a => a.studentId))];
      
      const assignedStudents = db.users
        .filter(user => user.role === "student" && user.status === "approved" && assignedStudentIds.includes(user.id))
        .map(user => ({
          id: user.id,
          name: user.name,
          role: user.role,
          isOnline: false
        }));
      
      // Add admin
      const admin = db.users.find(user => user.role === "admin" && user.status === "approved");
      if (admin) {
        assignedStudents.push({
          id: admin.id,
          name: admin.name,
          role: admin.role,
          isOnline: false
        });
      }
      
      users = assignedStudents;
    } else if (req.user.role === "student") {
      // Student can chat with assigned teachers and admin
      const studentAssignments = db.assignments.filter(a => a.studentId === req.user.id);
      const assignedTeacherIds = [...new Set(studentAssignments.map(a => a.teacherId))];
      
      const assignedTeachers = db.users
        .filter(user => user.role === "teacher" && user.status === "approved" && assignedTeacherIds.includes(user.id))
        .map(user => ({
          id: user.id,
          name: user.name,
          role: user.role,
          isOnline: false
        }));
      
      // Add admin
      const admin = db.users.find(user => user.role === "admin" && user.status === "approved");
      if (admin) {
        assignedTeachers.push({
          id: admin.id,
          name: admin.name,
          role: admin.role,
          isOnline: false
        });
      }
      
      users = assignedTeachers;
    }
    
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.get("/api/chat/conversations/:userId", verifyToken, (req, res) => {
  try {
    const db = readDb();
    const { userId } = req.params;
    
    // Get or create chat between current user and target user
    let chat = db.chats.find(c => 
      (c.participant1 === req.user.id && c.participant2 === userId) ||
      (c.participant1 === userId && c.participant2 === req.user.id)
    );
    
    if (!chat) {
      // Create new chat
      chat = {
        id: createId("chat"),
        participant1: req.user.id,
        participant2: userId,
        createdAt: new Date().toISOString(),
        lastMessage: null,
        lastMessageTime: null
      };
      db.chats.push(chat);
      writeDb(db);
    }
    
    // Get messages for this chat
    const messages = db.messages
      .filter(m => m.chatId === chat.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    res.json({ 
      chat,
      messages,
      otherUser: db.users.find(u => u.id === userId)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
});

app.post("/api/chat/messages", verifyToken, (req, res) => {
  try {
    const db = readDb();
    const { chatId, content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }
    
    // Verify user is part of this chat
    const chat = db.chats.find(c => c.id === chatId);
    if (!chat || (chat.participant1 !== req.user.id && chat.participant2 !== req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const message = {
      id: createId("msg"),
      chatId,
      senderId: req.user.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      read: false
    };
    
    db.messages.push(message);
    
    // Update chat last message info
    const chatIndex = db.chats.findIndex(c => c.id === chatId);
    db.chats[chatIndex].lastMessage = content.trim();
    db.chats[chatIndex].lastMessageTime = new Date().toISOString();
    
    writeDb(db);
    
    res.json({ message: "Message sent successfully", data: message });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

app.get("/api/chat/conversations", verifyToken, (req, res) => {
  try {
    const db = readDb();
    const userChats = db.chats
      .filter(chat => chat.participant1 === req.user.id || chat.participant2 === req.user.id)
      .map(chat => {
        const otherUserId = chat.participant1 === req.user.id ? chat.participant2 : chat.participant1;
        const otherUser = db.users.find(u => u.id === otherUserId);
        const unreadCount = db.messages.filter(m => 
          m.chatId === chat.id && 
          m.senderId !== req.user.id && 
          !m.read
        ).length;
        
        return {
          ...chat,
          otherUser: otherUser ? {
            id: otherUser.id,
            name: otherUser.name,
            role: otherUser.role
          } : null,
          unreadCount
        };
      })
      .sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
    
    res.json({ data: userChats });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Start server
if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;

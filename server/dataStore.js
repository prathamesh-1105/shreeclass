const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// For Vercel serverless environment, use in-memory database
let inMemoryDb = null;

      id: "admin-1",
      name: "Shree Admin",
      email: "admin@shreeclasses.com",
      passwordHash: seedAdminPassword,
      role: "admin",
      status: "approved",
      medium: "",
      standard: "",
      createdAt: new Date().toISOString()
    }
  ],
  announcements: [],
  notices: [],
  lectures: [],
  homework: [],
  materials: [],
  attendance: [],
  enquiries: [],
  chats: [],
  messages: [],
  assignments: []
};

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

module.exports = { readDb, writeDb, createId };
=======
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DB_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DB_DIR, "db.json");

const seedAdminPassword = bcrypt.hashSync("shree.admin@123", 10);

const defaultDb = {
  users: [
    {
      id: "admin-1",
      name: "Shree Admin",
      email: "admin@shreeclasses.com",
      passwordHash: seedAdminPassword,
      role: "admin",
      status: "approved",
      medium: "",
      standard: "",
      createdAt: new Date().toISOString()
    }
  ],
  announcements: [],
  notices: [],
  lectures: [],
  homework: [],
  materials: [],
  attendance: [],
  enquiries: [],
  chats: [],
  messages: [],
  assignments: []
};

function ensureDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw);
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

module.exports = { readDb, writeDb, createId };
>>>>>>> 2334ae2eaa12245373b572f6a541bf9c11dec475

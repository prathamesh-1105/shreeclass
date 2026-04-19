const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// For Vercel serverless environment, use in-memory database
let inMemoryDb = null;

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
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
}

function readDb() {
  // For Vercel serverless, use in-memory database if file system fails
  try {
    if (process.env.NODE_ENV === "production") {
      // Vercel serverless environment
      if (!inMemoryDb) {
        inMemoryDb = { ...defaultDb };
      }
      return inMemoryDb;
    } else {
      // Local development
      ensureDb();
      const raw = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (error) {
    // Fallback to in-memory database
    if (!inMemoryDb) {
      inMemoryDb = { ...defaultDb };
    }
    return inMemoryDb;
  }
}

function writeDb(db) {
  try {
    if (process.env.NODE_ENV === "production") {
      // Vercel serverless environment - update in-memory
      inMemoryDb = { ...db };
    } else {
      // Local development
      ensureDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
    }
  } catch (error) {
    // Fallback to in-memory database
    inMemoryDb = { ...db };
  }
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

module.exports = { readDb, writeDb, createId };

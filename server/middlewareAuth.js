<<<<<<< HEAD
const jwt = require("jsonwebtoken");
const { readDb } = require("./dataStore");

function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret);
    const db = readDb();
    const user = db.users.find((u) => u.id === payload.userId);
    if (!user) return res.status(401).json({ message: "User no longer exists" });
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
}

function allowRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    return next();
  };
}

module.exports = { verifyToken, allowRoles };
=======
const jwt = require("jsonwebtoken");
const { readDb } = require("./dataStore");

function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }
    const secret = process.env.JWT_SECRET || "dev-secret";
    const payload = jwt.verify(token, secret);
    const db = readDb();
    const user = db.users.find((u) => u.id === payload.userId);
    if (!user) return res.status(401).json({ message: "User no longer exists" });
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
}

function allowRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    return next();
  };
}

module.exports = { verifyToken, allowRoles };
>>>>>>> 2334ae2eaa12245373b572f6a541bf9c11dec475

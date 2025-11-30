const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  try {
    // Verify token using the shared NEXTAUTH_SECRET
    // NextAuth.js uses standard JWTs, but we need to ensure the secret matches.
    // Note: NextAuth v4 might encrypt the JWE by default.
    // If using JWT strategy with a secret, it signs it.
    // We assume standard signed JWT for this MVP.
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);

    // Attach user to request
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.sendStatus(403);
  }
};

module.exports = { authenticateToken };

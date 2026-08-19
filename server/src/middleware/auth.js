import jwt from "jsonwebtoken";
import { demoStore } from "../data/demoStore.js";

const secret = () => process.env.JWT_SECRET || "autoserve-local-demo-secret";

export function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, secret(), { expiresIn: "8h" });
}

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ success: false, message: "Authentication is required", errors: [] });
  try {
    const payload = jwt.verify(token, secret());
    const user = demoStore.users.find((candidate) => candidate.id === payload.sub);
    if (!user) throw new Error("User not found");
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Your session is invalid or has expired", errors: [] });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You do not have permission to perform this action", errors: [] });
    }
    return next();
  };
}

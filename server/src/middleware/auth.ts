import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "svs_furniture_works_secret_key_2026";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    name: string;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: "Authorization header missing" });
  }
};

export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Role '${req.user.role}' is not authorized for this action.`,
      });
    }

    next();
  };
};

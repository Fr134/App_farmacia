import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "pharma-control-dev-secret";
const TOKEN_EXPIRY = "24h";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role } satisfies TokenPayload,
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

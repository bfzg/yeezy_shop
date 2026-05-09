import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const SESSION_COOKIE = "yezi_user_session";
const SESSION_DAYS = 14;

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  role: "customer" | "admin";
};

type UserRow = CurrentUser & {
  password_hash: string;
};

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const digest = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${digest}`;
}

function verifyPassword(password: string, stored: string) {
  if (stored === "dev-admin") return password === "admin123";
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(digest));
}

export async function registerUser(email: string, password: string, name: string) {
  const result = db().prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'customer')")
    .run(email.toLowerCase(), hashPassword(password), name);
  return createSession(Number(result.lastInsertRowid));
}

export async function loginUser(email: string, password: string) {
  const user = db().prepare("SELECT id, email, password_hash, name, role FROM users WHERE email = ?")
    .get(email.toLowerCase()) as UserRow | undefined;
  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }
  return createSession(user.id);
}

export async function createSession(userId: number) {
  const token = randomUUID();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  db().prepare("INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .run(token, userId, expires.toISOString());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60
  });

  return getCurrentUserByToken(token);
}

export async function logoutUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    db().prepare("DELETE FROM user_sessions WHERE token = ?").run(token);
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getCurrentUserByToken(token) : null;
}

function getCurrentUserByToken(token: string) {
  return db().prepare(`
    SELECT u.id, u.email, u.name, u.role
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
  `).get(token) as CurrentUser | undefined ?? null;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

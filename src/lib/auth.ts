import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from './db';
import type { UserPublic, UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'dnd-familiar-tamagotchi-dev-secret-change-me';
const COOKIE_NAME = 'ddt_token';
const TOKEN_TTL = '7d';

export interface TokenPayload {
  sub: string; // user id
  username: string;
  role: UserRole;
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<{ id: string; username: string; role: UserRole } | null> {
  const token = await getAuthToken();
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  // Verify user still exists
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, username: true, role: true },
  });
  if (!user) return null;
  return { id: user.id, username: user.username, role: user.role as UserRole };
}

export function toUserPublic(user: { id: string; username: string; role: string; characterName: string | null }): UserPublic {
  return {
    id: user.id,
    username: user.username,
    role: user.role as UserRole,
    characterName: user.characterName,
  };
}

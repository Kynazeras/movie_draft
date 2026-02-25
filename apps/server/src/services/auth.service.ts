import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { prisma, User } from '@movie-draft/prisma-client';
import { config } from '../config';

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  jti: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: { id: string; email: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    jti: randomUUID(),
  };

  return jwt.sign(payload, config.auth.secret, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.auth.secret) as JwtPayload;
  } catch {
    return null;
  }
}

export async function createUser(
  email: string,
  password: string,
  name?: string,
): Promise<AuthUser> {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });

  return user;
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  const { passwordHash: _, ...authUser } = user;
  return authUser;
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });
}

export async function createSession(
  userId: string,
  token: string,
): Promise<void> {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);

  await prisma.session.create({
    data: {
      userId,
      sessionToken: token,
      expires,
    },
  });
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { sessionToken: token },
  });
}

export async function validateSession(token: string): Promise<AuthUser | null> {
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!session || session.expires < new Date()) {
    return null;
  }

  return session.user;
}

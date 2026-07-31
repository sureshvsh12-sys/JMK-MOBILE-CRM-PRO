import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  AuthSession,
  AuthUser,
  CreateOwnerAccountInput,
  LoginInput,
  StoredAuthAccount,
} from "../types/auth";

const AUTH_ACCOUNT_KEY = "jmk_mobile_auth_account";
const AUTH_SESSION_KEY = "jmk_mobile_auth_session";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function withoutPassword(account: StoredAuthAccount): AuthUser {
  const { password: _password, ...user } = account;
  return user;
}

export async function hasAuthAccount(): Promise<boolean> {
  const account = await getAuthAccount();
  return Boolean(account);
}

export async function getAuthAccount(): Promise<StoredAuthAccount | null> {
  try {
    const value = await AsyncStorage.getItem(AUTH_ACCOUNT_KEY);

    if (!value) {
      return null;
    }

    const account = JSON.parse(value) as StoredAuthAccount;

    if (!account?.id || !account?.email) {
      await AsyncStorage.removeItem(AUTH_ACCOUNT_KEY);
      return null;
    }

    return account;
  } catch {
    await AsyncStorage.removeItem(AUTH_ACCOUNT_KEY);
    return null;
  }
}

export async function createOwnerAccount(
  input: CreateOwnerAccountInput
): Promise<AuthSession> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const password = input.password.trim();

  if (!name) {
    throw new Error("Owner name required hai.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Valid email address enter karein.");
  }

  if (password.length < 6) {
    throw new Error(
      "Password kam se kam 6 characters ka hona chahiye."
    );
  }

  const existing = await getAuthAccount();

  if (existing) {
    throw new Error("Admin account pehle se configured hai.");
  }

  const now = new Date().toISOString();

  const account: StoredAuthAccount = {
    id: `owner-${Date.now()}`,
    name,
    email,
    password,
    role: "owner",
    segment: "All",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const session: AuthSession = {
    user: withoutPassword(account),
    signedInAt: now,
  };

  await AsyncStorage.multiSet([
    [AUTH_ACCOUNT_KEY, JSON.stringify(account)],
    [AUTH_SESSION_KEY, JSON.stringify(session)],
  ]);

  return session;
}

export async function login(
  input: LoginInput
): Promise<AuthSession> {
  const account = await getAuthAccount();

  if (!account) {
    throw new Error("Admin account configured nahi hai.");
  }

  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!account.isActive) {
    throw new Error("Ye account inactive hai.");
  }

  if (
    normalizeEmail(account.email) !== email ||
    account.password !== password
  ) {
    throw new Error("Email ya password sahi nahi hai.");
  }

  const session: AuthSession = {
    user: withoutPassword(account),
    signedInAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify(session)
  );

  return session;
}

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const value = await AsyncStorage.getItem(AUTH_SESSION_KEY);

    if (!value) {
      return null;
    }

    const session = JSON.parse(value) as AuthSession;

    if (!session.user?.id || !session.user.isActive) {
      await AsyncStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_SESSION_KEY);
}
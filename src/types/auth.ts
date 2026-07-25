export type AuthRole = "owner" | "admin" | "manager" | "employee";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  segment: "All" | "Finance" | "Assets" | "Solar";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoredAuthAccount = AuthUser & {
  password: string;
};

export type AuthSession = {
  user: AuthUser;
  signedInAt: string;
};

export type CreateOwnerAccountInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

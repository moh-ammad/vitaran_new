import type { SchoolAccount } from "./school";

export type AdminProfile = {
  email: string;
  role: "admin";
};

export type AdminLoginResult = {
  token: string;
  expiresAt: string;
  admin: AdminProfile;
};

export type SchoolLoginResult = {
  token: string;
  expiresAt: string;
  school: SchoolAccount;
};

export type AdminProfile = {
  email: string;
  role: "admin";
};

export type AdminLoginResult = {
  token: string;
  expiresAt: string;
  admin: AdminProfile;
};

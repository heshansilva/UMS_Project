"use client";

import { useState, useEffect } from "react";

export interface AuthInfo {
  token: string | null;
  role: string | null;
  userId: string | null; // Add this
}

export const useAuth = (): AuthInfo => {
  const [auth, setAuth] = useState<AuthInfo>({ token: null, role: null, userId: null });

  useEffect(() => {
    const token = localStorage.getItem("ums_token");
    const role = localStorage.getItem("ums_role");
    const userId = localStorage.getItem("ums_userid"); // Get the ID
    setAuth({ token, role, userId });
  }, []);

  return auth;
};
"use client";

import { Profile } from "@/lib/types";
import { useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then(({ user, role }) => {
        setUser(user ?? null);
        if (user && role) {
          setProfile({ id: user.id, role, created_at: "" });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { user, profile, loading, isAdmin: profile?.role === "admin" };
}

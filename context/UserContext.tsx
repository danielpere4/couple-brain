"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export const USERS = [
  { id: 1, name: "Daniel", color: "#7C3AED" },
  { id: 2, name: "Andrea", color: "#EC4899" },
] as const;

export type User = (typeof USERS)[number];

interface UserContextType {
  activeUser: User | null;
  setActiveUser: (user: User) => void;
  clearUser: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("couple-brain-user");
    if (stored) {
      const found = USERS.find((u) => u.id === parseInt(stored));
      if (found) setActiveUserState(found);
    }
    setIsLoading(false);
  }, []);

  const setActiveUser = (user: User) => {
    localStorage.setItem("couple-brain-user", String(user.id));
    setActiveUserState(user);
  };

  const clearUser = () => {
    localStorage.removeItem("couple-brain-user");
    setActiveUserState(null);
  };

  return (
    <UserContext.Provider value={{ activeUser, setActiveUser, clearUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}

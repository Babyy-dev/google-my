import { createContext } from "react";
import type { SupabaseClient, User, Session } from "@supabase/supabase-js";

export type AuthContextType = {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

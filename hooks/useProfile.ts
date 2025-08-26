"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/database.types";

export function useProfile() {
  const { user } = useAuth();
  const supabase = createClient(); // Use the client-side client
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          setLoading(true);
          setError(null);

          const { data, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            throw profileError;
          }

          if (data) {
            setProfile(data);
          } else {
            // Profile doesn't exist, let's create it
            const newProfile = {
              id: user.id,
              full_name:
                user.user_metadata?.full_name || user.user_metadata?.name || "",
              email: user.email || "",
              avatar_url: user.user_metadata?.avatar_url || "",
            };
            const { data: insertedData, error: insertError } = await supabase
              .from("user_profiles")
              .insert(newProfile)
              .select()
              .single();

            if (insertError) throw insertError;
            setProfile(insertedData);
          }
        } catch (err: any) {
          setError(err.message);
          console.error("Error fetching/creating profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, supabase]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("User not authenticated");
    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from("user_profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { profile, loading, error, updateProfile };
}

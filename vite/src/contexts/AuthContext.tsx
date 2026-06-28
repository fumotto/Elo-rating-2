import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentProfile, ensureUserProfile, signInWithDiscord, signOut } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

export interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      let nextProfile = await fetchCurrentProfile();

      // If profile wasn't found, or saved profile lacks Discord identity, ensure it is created/updated.
      if (!nextProfile || !nextProfile.discord_id) {
        await ensureUserProfile();
        nextProfile = await fetchCurrentProfile();
      }
      setProfile(nextProfile);
    } catch (error) {
      console.error(error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      await refreshProfile();
      if (mounted) setLoading(false);
    };
    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await refreshProfile();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      loading,
      signIn: signInWithDiscord,
      signOutUser: signOut,
      refreshProfile,
    }),
    [profile, loading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

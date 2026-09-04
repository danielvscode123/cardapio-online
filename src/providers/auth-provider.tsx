import { Session } from '@supabase/supabase-js';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/domain';

type AuthResult = { error?: string; requiresEmailConfirmation?: boolean };

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  createInitialManager: (name: string, email: string, password: string) => Promise<AuthResult>;
  claimInitialManager: (name: string) => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, restaurant_id, name, email, role, active')
      .eq('id', userId)
      .single();

    if (error) {
      setProfile(null);
      setProfileError(error.message);
      return;
    }

    setProfile(data as Profile);
    setProfileError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        await loadProfile(data.session.user.id);
      }
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        return;
      }

      setTimeout(() => {
        void loadProfile(nextSession.user.id).finally(() => setLoading(false));
      }, 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const claimInitialManager = useCallback(
    async (name: string): Promise<AuthResult> => {
      const { error } = await supabase.rpc('claim_initial_manager', { p_full_name: name.trim() });
      if (error) {
        return { error: error.message };
      }

      if (session) {
        await loadProfile(session.user.id);
      }
      return {};
    },
    [loadProfile, session],
  );

  const createInitialManager = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: name.trim() } },
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.session) {
        return { requiresEmailConfirmation: true };
      }

      const { error: claimError } = await supabase.rpc('claim_initial_manager', {
        p_full_name: name.trim(),
      });

      if (claimError) {
        return { error: claimError.message };
      }

      await loadProfile(data.user!.id);
      return {};
    },
    [loadProfile],
  );

  const refreshProfile = useCallback(async () => {
    if (session) {
      await loadProfile(session.user.id);
    }
  }, [loadProfile, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      profileError,
      signIn,
      signOut,
      createInitialManager,
      claimInitialManager,
      refreshProfile,
    }),
    [
      claimInitialManager,
      createInitialManager,
      loading,
      profile,
      profileError,
      refreshProfile,
      session,
      signIn,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}

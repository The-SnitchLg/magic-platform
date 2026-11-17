import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile, AppRole } from '@/types/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  viewMode: AppRole;
  isSupervising: boolean;
  setViewMode: (mode: AppRole) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // For dev/demo switching
  setMockUserRole: (role: AppRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<AppRole>('student');

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching profile:', error.message);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.warn('Exception fetching profile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      if (p) {
        setProfile(p);
        setViewMode(p.role);
      }
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // In local mode without Supabase connection, load synthetic development profile
      const storedRole = (localStorage.getItem('magic_dev_role') as AppRole) || 'student';
      const mockProfile: Profile = {
        id: '00000000-0000-0000-0000-000000000001',
        email_display: `${storedRole}@universidad.edu`,
        display_name: storedRole === 'student' ? 'Mateo Restrepo Gaviria' : storedRole === 'tutor' ? 'Dr. Carlos Gutiérrez M.' : 'Administrador Institucional',
        role: storedRole,
        active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(mockProfile);
      setViewMode(storedRole);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
        if (p) setViewMode(p.role);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
        if (p) setViewMode(p.role);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      // Local dev simulated login
      let detectedRole: AppRole = 'student';
      if (email.includes('tutor') || email.includes('director')) detectedRole = 'tutor';
      if (email.includes('admin')) detectedRole = 'admin';

      const mockProfile: Profile = {
        id: 'mock-user-id',
        email_display: email,
        display_name: detectedRole === 'student' ? 'Mateo Restrepo Gaviria' : detectedRole === 'tutor' ? 'Dr. Carlos Gutiérrez' : 'Administrador Institucional',
        role: detectedRole,
        active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(mockProfile);
      setViewMode(detectedRole);
      localStorage.setItem('magic_dev_role', detectedRole);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured()) {
      const mockProfile: Profile = {
        id: 'new-student-id',
        email_display: email,
        display_name: fullName,
        role: 'student', // ALWAYS student
        active: true,
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(mockProfile);
      setViewMode('student');
      localStorage.setItem('magic_dev_role', 'student');
      return { error: null };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    localStorage.removeItem('magic_dev_role');
  };

  const setMockUserRole = (role: AppRole) => {
    if (profile) {
      const updated = { ...profile, role };
      setProfile(updated);
      setViewMode(role);
      localStorage.setItem('magic_dev_role', role);
    }
  };

  // An admin is inspecting another view when viewMode differs from their actual role
  const isSupervising = profile?.role === 'admin' && viewMode !== 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        viewMode,
        isSupervising,
        setViewMode,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        setMockUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

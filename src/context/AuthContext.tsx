import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut as fbSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { User, UserRole } from '../types.ts';
import { api } from '../api.ts';

// Pre-seeded demo persona users
export const DEMO_USERS: Record<UserRole, User> = {
  admin: {
    id: 1,
    uid: 'admin_default_uid',
    email: 'admin@foodcycle.org',
    fullName: 'Elena Vance',
    role: 'admin',
    organization: 'FoodCycle Central HQ',
    phone: '+1 (555) 019-2834',
    address: '100 Green Way, Metro City',
    isVerified: true,
  },
  donor: {
    id: 2,
    uid: 'donor_artisan_uid',
    email: 'baker@harvestbakery.com',
    fullName: 'Marco Rossi',
    role: 'donor',
    organization: 'Harvest Artisanal Bakery',
    phone: '+1 (555) 234-5678',
    address: '424 S Market St, Downtown',
    isVerified: true,
  },
  recipient: {
    id: 5,
    uid: 'recipient_hope_uid',
    email: 'coordinator@hopeshelter.org',
    fullName: 'David Washington',
    role: 'recipient',
    organization: 'Hope Valley Community Shelter',
    phone: '+1 (555) 789-0123',
    address: '310 Hope Ave, Eastside',
    isVerified: true,
  },
  volunteer: {
    id: 7,
    uid: 'volunteer_alex_uid',
    email: 'alex.driver@gmail.com',
    fullName: 'Alex Rivera',
    role: 'volunteer',
    organization: 'FoodCycle Active Responder',
    phone: '+1 (555) 901-2345',
    address: 'Metro Region Fleet 4',
    isVerified: true,
  },
};

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  role: UserRole;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with default donor demo persona for immediate interactivity
  const [currentUser, setCurrentUser] = useState<User | null>(DEMO_USERS.donor);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>('demo:donor');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync with Firebase Auth state if user signs in with Google
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        setIsLoading(true);
        try {
          const idToken = await fbUser.getIdToken();
          setFirebaseUser(fbUser);
          setToken(idToken);

          // Sync user to PostgreSQL backend
          const dbUser = await api.syncUser(
            {
              uid: fbUser.uid,
              email: fbUser.email || '',
              fullName: fbUser.displayName || 'FoodCycle Member',
              avatarUrl: fbUser.photoURL || undefined,
              role: 'donor', // Default to donor for newly joined Google users
            },
            idToken
          );
          setCurrentUser(dbUser);
        } catch (error) {
          console.error('Failed to sync Firebase user to database:', error);
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setFirebaseUser(result.user);
      setToken(idToken);

      const dbUser = await api.syncUser(
        {
          uid: result.user.uid,
          email: result.user.email || '',
          fullName: result.user.displayName || 'FoodCycle Member',
          avatarUrl: result.user.photoURL || undefined,
          role: 'donor',
        },
        idToken
      );
      setCurrentUser(dbUser);
    } catch (error: any) {
      console.error('Google Sign-in failed:', error);
      alert(`Google Sign-In notice: ${error.message || 'Pop-up was closed or cancelled'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = (role: UserRole) => {
    const selected = DEMO_USERS[role];
    setCurrentUser(selected);
    setToken(`demo:${role}`);
    setFirebaseUser(null);
  };

  const logout = async () => {
    if (firebaseUser) {
      await fbSignOut(auth);
    }
    setFirebaseUser(null);
    // Revert to demo donor
    setCurrentUser(DEMO_USERS.donor);
    setToken('demo:donor');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    try {
      const updated = await api.updateUser(currentUser.id, data, token || undefined);
      setCurrentUser(updated);
    } catch (err: any) {
      console.error('Update profile failed:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        token,
        role: currentUser?.role || 'donor',
        isLoading,
        signInWithGoogle,
        switchDemoRole,
        logout,
        updateProfile,
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

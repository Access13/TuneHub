import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser,
  getAdditionalUserInfo
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '../firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Sync user to Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              role: 'user',
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            });
          } else {
            await setDoc(userRef, {
              lastLogin: serverTimestamp()
            }, { merge: true });
          }
          setUser(firebaseUser);
        } else {
          setUser(null);
        }
      } catch (err: any) {
        console.error('Auth sync error:', err);
        setError(err.message || 'Failed to sync user data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for Google Sign-In. Please add your Vercel URL to the "Authorized domains" list in the Firebase Console.');
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
      throw err;
    }
  };

  const loginWithGithub = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err: any) {
      console.error('Github login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for GitHub Sign-In. Please add your Vercel URL to the "Authorized domains" list in the Firebase Console.');
      } else {
        setError(err.message || 'Failed to sign in with GitHub');
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, loginWithGoogle, loginWithGithub, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

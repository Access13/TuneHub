import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider } from '../firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  message: string | null;
  setMessage: (message: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  registerWithEmail: (email: string, password: string, username: string, phoneNumber: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  const registerWithEmail = async (email: string, password: string, username: string, phoneNumber: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile with username
      await updateProfile(firebaseUser, { displayName: username });

      // Sync to Firestore with extra fields
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        displayName: username,
        username: username,
        email: firebaseUser.email,
        phoneNumber: phoneNumber,
        photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${username}&background=random`,
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      // Send verification email
      await sendEmailVerification(firebaseUser);
      
      setUser(firebaseUser);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
      throw err;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
      throw err;
    }
  };

  const sendVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to send verification email');
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
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      setError, 
      message,
      setMessage,
      loginWithGoogle, 
      loginWithGithub, 
      registerWithEmail,
      loginWithEmail,
      sendVerification,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

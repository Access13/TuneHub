import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Phone, Loader2, Github, Chrome, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const Auth = () => {
  const { 
    user, 
    loginWithGoogle, 
    loginWithGithub, 
    registerWithEmail, 
    loginWithEmail, 
    sendVerification,
    logout 
  } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    phoneNumber: ''
  });
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await loginWithEmail(formData.email, formData.password);
      } else {
        await registerWithEmail(formData.email, formData.password, formData.username, formData.phoneNumber);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await sendVerification();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await auth.currentUser.reload();
      // The onAuthStateChanged listener in AuthContext will trigger if we manually update state or if we just wait for the next render
      // But we should probably force a state update or just rely on the fact that reload() updates the object
      window.location.reload(); // Simplest way to ensure everything is fresh
    } catch (error) {
      console.error('Reload error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user && !user.emailVerified) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-dark p-8 rounded-[2.5rem] border border-white/10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-tunehub-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={40} className="text-tunehub-accent" />
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">Verify your email</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            We've sent a verification link to <span className="text-white font-bold">{user.email}</span>. 
            Please check your inbox and click the link to activate your account.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCheckVerification}
              disabled={loading}
              className="w-full bg-tunehub-accent text-black font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
              I've Verified My Email
            </button>
            <button
              onClick={handleResendVerification}
              disabled={loading || verificationSent}
              className="w-full bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all disabled:opacity-50"
            >
              {verificationSent ? 'Verification Sent!' : 'Resend Verification Email'}
            </button>
            <button
              onClick={logout}
              className="w-full bg-white/5 text-white/60 font-bold py-4 rounded-2xl hover:bg-white/10 transition-all"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-dark p-8 md:p-12 rounded-[3rem] border border-white/10 max-w-xl w-full shadow-2xl my-8"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tunehub-accent/10 border border-tunehub-accent/20 text-tunehub-accent text-[10px] font-bold uppercase tracking-widest mb-6">
            <ShieldCheck size={12} /> Secure Authentication
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            {isLogin ? 'Welcome Back' : 'Join TuneHub'}
          </h1>
          <p className="text-white/40 text-sm font-medium">
            {isLogin ? 'Enter your details to access your music' : 'Create an account to start your musical journey'}
          </p>
        </div>

        <div className="flex p-1 bg-white/5 rounded-2xl mb-8">
          <button 
            onClick={() => setIsLogin(true)}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
              isLogin ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            Login
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
              !isLogin ? "bg-white/10 text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-tunehub-accent transition-colors" size={20} />
                <input 
                  type="text"
                  required
                  placeholder="Username"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-tunehub-accent/50 transition-all"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-tunehub-accent transition-colors" size={20} />
                <input 
                  type="tel"
                  required
                  placeholder="Phone Number"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-tunehub-accent/50 transition-all"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
            </>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-tunehub-accent transition-colors" size={20} />
            <input 
              type="email"
              required
              placeholder="Email Address"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-tunehub-accent/50 transition-all"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-tunehub-accent transition-colors" size={20} />
            <input 
              type="password"
              required
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-tunehub-accent/50 transition-all"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-tunehub-accent text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-tunehub-accent/20"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
            <span className="bg-tunehub-bg px-4 text-white/20">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={loginWithGoogle}
            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-sm font-bold transition-all"
          >
            <Chrome size={18} className="text-red-400" />
            Google
          </button>
          <button 
            onClick={loginWithGithub}
            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-sm font-bold transition-all"
          >
            <Github size={18} />
            GitHub
          </button>
        </div>

        <div className="mt-10 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
          <AlertCircle className="text-blue-400 flex-shrink-0" size={20} />
          <p className="text-[10px] text-blue-400/80 leading-relaxed font-medium">
            By continuing, you agree to TuneHub's Terms of Service and Privacy Policy. We'll send a verification email to ensure your account security.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

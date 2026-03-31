import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Music2, Github } from 'lucide-react';

export const Login = () => {
  const { loginWithGoogle, loginWithGithub } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-tunehub-bg p-4">
      <div className="max-w-md w-full glass p-8 rounded-3xl flex flex-col items-center gap-8 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tunehub-accent to-tunehub-secondary flex items-center justify-center shadow-lg shadow-tunehub-accent/20">
          <Music2 size={32} className="text-white" />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-black mb-2 tracking-tighter">Welcome to TuneHub</h1>
          <p className="text-white/60 text-sm">Sign in to start listening and organize your music library.</p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button 
            onClick={loginWithGoogle}
            className="flex items-center justify-center gap-3 w-full bg-white text-black font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
          
          <button 
            onClick={loginWithGithub}
            className="flex items-center justify-center gap-3 w-full bg-[#24292e] text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform"
          >
            <Github size={20} />
            Continue with GitHub
          </button>
        </div>
        
        <p className="text-[10px] text-white/30 uppercase tracking-widest text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

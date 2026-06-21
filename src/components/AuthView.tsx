import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User, Sparkles } from 'lucide-react';
import { auth, db, isConfigured } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthViewProps {
  onAuthSuccess: (user: { uid: string; email: string; role: 'employee' | 'manager'; name: string }) => void;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export default function AuthView({ onAuthSuccess, onClose, showToast }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'employee' | 'manager'>('employee');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter your email and password.', 'warning');
      return;
    }
    if (isSignUp && !name) {
      showToast('Please enter your full name.', 'warning');
      return;
    }

    setIsLoading(true);

    if (!isConfigured || !auth || !db) {
      // Simulation/Demo mode
      setTimeout(() => {
        setIsLoading(false);
        const mockUser = {
          uid: `mock_uid_${Date.now()}`,
          email,
          role,
          name: isSignUp ? name : (email.includes('manager') ? 'Sarah Manager' : 'Alex Cooper'),
        };
        showToast(`Logged in successfully as ${mockUser.name} (Simulated ${role.toUpperCase()})`, 'success');
        onAuthSuccess(mockUser);
        onClose();
      }, 1000);
      return;
    }

    try {
      if (isSignUp) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save role in Firestore
        const userDoc = {
          uid: user.uid,
          email: user.email,
          name,
          role,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', user.uid), userDoc);

        showToast(`Account registered successfully as ${role}!`, 'success');
        onAuthSuccess({ uid: user.uid, email: user.email || '', role, name });
      } else {
        // Log In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch role from Firestore
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          showToast(`Welcome back, ${userData.name}!`, 'success');
          onAuthSuccess({
            uid: user.uid,
            email: user.email || '',
            role: userData.role || 'employee',
            name: userData.name || 'User',
          });
        } else {
          // Fallback if document doesn't exist
          showToast(`Logged in successfully!`, 'success');
          onAuthSuccess({ uid: user.uid, email: user.email || '', role: 'employee', name: 'User' });
        }
      }
      onClose();
    } catch (error: any) {
      console.error('[Auth Error]:', error);
      showToast(error.message || 'Authentication failed. Please check credentials.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[390px] overflow-hidden border border-outline-variant/15 flex flex-col">
        {/* Banner header */}
        <div className="bg-gradient-to-r from-primary to-indigo-900 text-white p-md text-center relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white text-sm font-semibold"
          >
            ✕
          </button>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/20 animate-pulse">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <h3 className="font-bold text-md tracking-wide">
            {isSignUp ? 'Join WorkforcePro' : 'Access Your Portal'}
          </h3>
          <p className="text-[10px] text-white/70 mt-1 uppercase tracking-widest font-bold">
            {!isConfigured ? 'Demo Simulation Mode' : 'Cloud Database System'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-lg space-y-md">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-secondary dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <User size={13} /> Full Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full border border-outline-variant dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-xs focus:outline-primary outline-none" 
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-secondary dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Mail size={13} /> Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. employee@workforce.pro"
              className="w-full border border-outline-variant dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-xs focus:outline-primary outline-none" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Lock size={13} /> Account Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="w-full border border-outline-variant dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl p-3 text-xs focus:outline-primary outline-none" 
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-secondary dark:text-slate-300 mb-1.5">
                Registering Role
              </label>
              <div className="grid grid-cols-2 gap-sm">
                <button
                  type="button"
                  onClick={() => setRole('employee')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    role === 'employee'
                      ? 'bg-primary/15 border-primary text-primary'
                      : 'border-outline-variant text-on-surface-variant hover:bg-slate-50'
                  }`}
                >
                  Employee
                </button>
                <button
                  type="button"
                  onClick={() => setRole('manager')}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                    role === 'manager'
                      ? 'bg-primary/15 border-primary text-primary'
                      : 'border-outline-variant text-on-surface-variant hover:bg-slate-50'
                  }`}
                >
                  Manager / Admin
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:brightness-[1.03] text-white font-bold h-12 rounded-xl text-xs flex items-center justify-center gap-2 mt-sm transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={14} />
                {isSignUp ? 'Complete Registration' : 'Authenticate Credentials'}
              </>
            )}
          </button>

          <p className="text-center text-xs text-on-surface-variant dark:text-slate-400 mt-md">
            {isSignUp ? 'Already registered?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary font-bold hover:underline"
            >
              {isSignUp ? 'Log In' : 'Sign Up Free'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

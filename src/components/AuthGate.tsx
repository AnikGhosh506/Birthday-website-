import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, ALLOWED_EMAILS } from '../firebase';
import { Lock, ShieldAlert, LogIn, LogOut, Heart } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface AuthGateProps {
  children: (authProps: {
    userEmail: string;
    onSignOut: () => Promise<void>;
    onSwitchAccount: () => Promise<void>;
  }) => React.ReactNode;
  sisterName: string;
  senderName: string;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  children,
  sisterName,
  senderName,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsSigningIn(true);
    romanticAudio.playSoftClick();
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not complete sign-in.';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMessage('Sign-in was interrupted. Please allow popups and try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    romanticAudio.playSoftClick();
    setErrorMessage(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleSwitchAccount = async () => {
    romanticAudio.playSoftClick();
    setErrorMessage(null);
    setIsSigningIn(true);
    try {
      await signOut(auth);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        setErrorMessage('Please click "Sign In with Google Email" to choose your account.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // 1. Waiting for initial Firebase Auth check
  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#faf7f5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 mb-4">
          <Heart className="w-5 h-5 fill-rose-600" />
        </div>
        <p className="font-serif text-lg font-bold text-stone-900">
          Verifying Private Birthday Invitation...
        </p>
        <p className="text-xs text-stone-500 mt-1">
          Checking email authentication status
        </p>
      </div>
    );
  }

  // 2. Not logged in yet -> Show Private Birthday Login Gate (without displaying any email addresses)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf7f5] text-stone-900 flex flex-col items-center justify-center p-6 perspective-1200">
        <div className="w-full max-w-md bg-white border border-stone-200/90 rounded-2xl p-8 sm:p-10 text-center paper-texture card-3d-tilt">
          <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center mx-auto mb-5 shadow-xs">
            <Lock className="w-5 h-5 text-rose-300" />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
            <span>Private Keepsake</span>
            <span aria-hidden="true">·</span>
            <span>28th May Celebration</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 text-balance heading-3d">
            Reserved Exclusively for {sisterName}
          </h1>

          <p className="mt-3 text-sm text-stone-600 leading-relaxed">
            This interactive birthday website was crafted by <span className="font-semibold text-stone-800">{senderName || 'Anik'}</span> exclusively for his older sister <span className="font-semibold text-stone-800">{sisterName}</span>. Please sign in with your Google account to unlock your birthday surprise.
          </p>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="mt-7 w-full py-3.5 px-6 text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-60 rounded-xl transition-colors inline-flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap btn-3d-dark"
          >
            <LogIn className="w-4 h-4 text-rose-300" />
            <span>{isSigningIn ? 'Opening Sign-In...' : 'Sign In with Google Email'}</span>
          </button>

          <p className="mt-5 text-[11px] text-stone-400">
            Protected by Google Email Authentication · Private Sisterhood Keepsake
          </p>
        </div>
      </div>
    );
  }

  // 3. Logged in, check if email strictly matches one of the allowed emails
  const signedInEmail = (user.email || '').toLowerCase().trim();
  const isAuthorized =
    user.emailVerified &&
    ALLOWED_EMAILS.some((allowed) => allowed.toLowerCase() === signedInEmail);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#faf7f5] text-stone-900 flex flex-col items-center justify-center p-6 perspective-1200">
        <div className="w-full max-w-lg bg-white border border-rose-200 rounded-2xl p-8 sm:p-10 text-center card-3d-tilt">
          <div className="w-14 h-14 rounded-full bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-widest mb-2">
            <span>Access Restricted</span>
            <span aria-hidden="true">·</span>
            <span>Unauthorized Account</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 text-balance heading-3d">
            Private Birthday Website — Access Denied
          </h1>

          <p className="mt-3 text-sm text-stone-600 leading-relaxed">
            Sorry, this birthday keepsake is strictly private and reserved exclusively for <strong className="text-stone-900">{sisterName}</strong>. Your current account does not have permission to view this website.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-left space-y-1.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-stone-500">Currently signed in as:</span>
              <span className="font-mono font-semibold text-rose-900 truncate">
                {user.email || 'Unknown Email'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-stone-500">Access Status:</span>
              <span className="font-semibold text-rose-700">
                Restricted · Not Permitted
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMessage}
            </div>
          )}

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleSwitchAccount}
              disabled={isSigningIn}
              className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap btn-3d-dark"
            >
              <LogIn className="w-4 h-4 text-rose-300" />
              <span>Switch Google Account</span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap tile-3d-extruded"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized -> Render the website!
  return (
    <>
      {children({
        userEmail: signedInEmail,
        onSignOut: handleSignOut,
        onSwitchAccount: handleSwitchAccount,
      })}
    </>
  );
};

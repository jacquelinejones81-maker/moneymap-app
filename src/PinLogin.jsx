import React, { useState, useRef, useEffect } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 5;

export default function PinLogin({ firebaseUser, onSuccess, onNewUser }) {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [step, setStep] = useState(firebaseUser ? 'pin' : 'email');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resolvedUid, setResolvedUid] = useState(firebaseUser?.uid || null);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === 'pin') setTimeout(() => inputRefs.current[0]?.focus(), 150);
  }, [step]);

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null); setAttempts(0); setCountdown(0);
        setPin(['', '', '', '']); setError('');
        clearInterval(interval);
      } else { setCountdown(remaining); }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleEmailNext = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address.'); return;
    }
    setLoading(true);
    setError('');

    const emailKey = `mm_email_uid_${email.toLowerCase().replace(/[^a-z0-9]/g,'_')}`;
    const storedUid = localStorage.getItem(emailKey);

    if (storedUid) {
      setResolvedUid(storedUid);
      setLoading(false);
      setStep('pin');
      return;
    }

    const leads = JSON.parse(localStorage.getItem('mm_leads') || '[]');
    const lead = leads.find(l => l.email?.toLowerCase() === email.toLowerCase());
    const phone = lead?.phone?.replace(/\D/g, '') || '';

    const passwordsToTry = [
      btoa(email.toLowerCase() + phone).slice(0, 20) + 'Mm1!',
      btoa(email.toLowerCase() + phone.slice(0,10)).slice(0, 20) + 'Mm1!',
    ];

    let signedIn = false;
    for (const pw of passwordsToTry) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email.toLowerCase(), pw);
        setResolvedUid(cred.user.uid);
        localStorage.setItem(emailKey, cred.user.uid);
        signedIn = true;
        break;
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
          setError("We don't recognize that email. Are you a new user?");
          setLoading(false);
          return;
        }
      }
    }

    if (!signedIn && auth.currentUser) {
      setResolvedUid(auth.currentUser.uid);
      localStorage.setItem(emailKey, auth.currentUser.uid);
      signedIn = true;
    }

    if (!signedIn) {
      setError("We couldn't find your account. Please sign up again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep('pin');
  };

  const handleDigit = (val, idx) => {
    if (lockedUntil) return;
    if (!/^\d*$/.test(val)) return;
    const updated = [...pin]; updated[idx] = val.slice(-1); setPin(updated); setError('');
    if (val && idx < 3) inputRefs.current[idx + 1]?.focus();
    if (val && idx === 3) { const full = [...updated].join(''); if (full.length === 4) verifyPin(full); }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const verifyPin = (enteredPin) => {
    const uid = resolvedUid || firebaseUser?.uid || auth.currentUser?.uid;
    if (!uid) {
      setError('Account not found. Please sign up again.');
      return;
    }
    const stored = localStorage.getItem(`mm_pin_${uid}`);
    const expected = btoa(enteredPin + uid);
    if (stored === expected) {
      setAttempts(0);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin(['', '', '', '']);
      setShake(true);
      setTimeout(() => {
        setShake(false);
        if (newAttempts < MAX_ATTEMPTS) inputRefs.current[0]?.focus();
      }, 600);
      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
        setLockedUntil(until);
        setError(`Too many incorrect attempts. Locked for ${LOCKOUT_MINUTES} minutes.`);
      } else {
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? 's' : ''} remaining.`);
      }
    }
  };

  const isLocked = lockedUntil && Date.now() < lockedUntil;
  const fmtCountdown = () => { const m = Math.floor(countdown/60); const s = countdown%60; return `${m}:${s.toString().padStart(2,'0')}`; };
  const firstName = firebaseUser?.displayName?.split(' ')[0] || '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="slide-up" style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem 2rem', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--gold)', marginBottom: '1.75rem' }}>MoneyMap</div>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{isLocked ? '🚫' : step === 'email' ? '👋' : '🔒'}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>
          {isLocked ? 'Account Locked' : step === 'email' ? 'Welcome back!' : firstName ? `Welcome back, ${firstName}!` : 'Enter your PIN'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          {isLocked ? `Too many incorrect attempts. Try again in ${fmtCountdown()}.` : step === 'email' ? 'Enter your email to access your dashboard.' : 'Enter your 4-digit PIN to continue.'}
        </p>

        {!isLocked && step === 'email' && (
          <>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleEmailNext()}
              style={{ marginBottom: 12, textAlign: 'center' }} autoFocus />
            {error && <div className="alert-box alert-danger" style={{ marginBottom: 12, textAlign: 'left' }}>{error}</div>}
            <button className="btn-gold" style={{ width: '100%', marginBottom: 12 }} onClick={handleEmailNext} disabled={loading}>
              {loading ? 'Checking…' : 'Continue →'}
            </button>
          </>
        )}

        {!isLocked && step === 'pin' && (
          <>
            {email && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{email}</div>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: '1.25rem' }}>
              {pin.map((d, i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: d ? 'var(--gold)' : 'transparent', border: `2px solid ${d ? 'var(--gold)' : 'var(--navy-border)'}`, transition: 'all 0.15s ease' }} />
              ))}
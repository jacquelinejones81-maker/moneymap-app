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
    try {
      // Try signing in with a dummy check — if user exists Firebase will respond
      // We use a placeholder password that won't work but tells us if user exists
      const tempPassword = btoa(email.toLowerCase() + email.toLowerCase()).slice(0, 20) + 'Mm1!';
      await signInWithEmailAndPassword(auth, email.toLowerCase(), tempPassword);
      setStep('pin');
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        // User exists but password is wrong — that's fine, move to PIN
        setStep('pin');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setError("We don't recognize that email. Are you a new user?");
      } else {
        // Any other error — still try PIN step
        setStep('pin');
      }
    }
    setLoading(false);
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

  const verifyPin = async (enteredPin) => {
    const user = firebaseUser || auth.currentUser;
    if (!user) {
      // Try to find user by email and sign them in properly
      try {
        const tempPassword = btoa(email.toLowerCase() + email.toLowerCase()).slice(0, 20) + 'Mm1!';
        const phoneGuess = '0000000000';
        // Try common password patterns
        const passwords = [
          btoa(email.toLowerCase() + phoneGuess).slice(0, 20) + 'Mm1!',
        ];
        let signedIn = false;
        for (const pw of passwords) {
          try {
            await signInWithEmailAndPassword(auth, email.toLowerCase(), pw);
            signedIn = true;
            break;
          } catch {}
        }
        if (!signedIn) {
          setError("Couldn't verify your account. Please sign up again.");
          return;
        }
      } catch {}
    }

    const currentUser = firebaseUser || auth.currentUser;
    if (!currentUser) { setError('Account not found. Please sign up.'); return; }

    const stored = localStorage.getItem(`mm_pin_${currentUser.uid}`);
    const expected = btoa(enteredPin + currentUser.uid);

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
            </div>
            <div className={shake ? 'shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: '1.25rem' }}>
              {pin.map((d, i) => (
                <input key={i} ref={el => inputRefs.current[i] = el}
                  type="password" inputMode="numeric" maxLength={1} value={d}
                  style={{ width: 52, height: 58, textAlign: 'center', fontSize: 24, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${d ? 'var(--gold)' : 'var(--navy-border)'}`, borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', caretColor: 'transparent' }}
                  onChange={e => handleDigit(e.target.value, i)}
                  onKeyDown={e => handleKeyDown(e, i)}
                  disabled={isLocked} />
              ))}
            </div>
            {error && <div className="alert-box alert-danger" style={{ marginBottom: 14, textAlign: 'left' }}>{error}</div>}
            {!firebaseUser && (
              <button className="btn-outline" style={{ fontSize: 12, width: '100%' }} onClick={() => { setStep('email'); setPin(['','','','']); setError(''); }}>
                ← Use a different email
              </button>
            )}
          </>
        )}

        {isLocked && (
          <div style={{ fontSize: 48, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#f87171', margin: '1rem 0' }}>{fmtCountdown()}</div>
        )}

        <div style={{ borderTop: '1px solid var(--navy-border)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            New here?{' '}
            <button onClick={onNewUser} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              Get free access →
            </button>
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            <a href="#admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} onClick={() => window.location.reload()}>Admin login</a>
          </p>
        </div>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}.shake{animation:shake 0.5s ease}`}</style>
    </div>
  );
}
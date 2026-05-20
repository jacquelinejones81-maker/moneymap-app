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
        setLockedUntil(null);
        setAttempts(0);
        setCountdown(0);
        setPin(['', '', '', '']);
        setError('');
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleEmailNext = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');

    const emailKey = 'mm_email_uid_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const storedUid = localStorage.getItem(emailKey);

    if (storedUid) {
      setResolvedUid(storedUid);
      setLoading(false);
      setStep('pin');
      return;
    }

    const leads = JSON.parse(localStorage.getItem('mm_leads') || '[]');
    const lead = leads.find(function(l) { return l.email && l.email.toLowerCase() === email.toLowerCase(); });
    const phone = lead ? lead.phone.replace(/\D/g, '') : '';

    const passwordsToTry = [
      btoa(email.toLowerCase() + phone).slice(0, 20) + 'Mm1!',
      btoa(email.toLowerCase() + phone.slice(0, 10)).slice(0, 20) + 'Mm1!',
    ];

    let signedIn = false;
    for (let i = 0; i < passwordsToTry.length; i++) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email.toLowerCase(), passwordsToTry[i]);
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

  const handleDigit = function(val, idx) {
    if (lockedUntil) return;
    if (!/^\d*$/.test(val)) return;
    const updated = pin.slice();
    updated[idx] = val.slice(-1);
    setPin(updated);
    setError('');
    if (val && idx < 3) inputRefs.current[idx + 1].focus();
    if (val && idx === 3) {
      const full = updated.join('');
      if (full.length === 4) verifyPin(full);
    }
  };

  const handleKeyDown = function(e, idx) {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      inputRefs.current[idx - 1].focus();
    }
  };

  const verifyPin = function(enteredPin) {
    const uid = resolvedUid || (firebaseUser && firebaseUser.uid) || (auth.currentUser && auth.currentUser.uid);
    if (!uid) {
      setError('Account not found. Please sign up again.');
      return;
    }
    const stored = localStorage.getItem('mm_pin_' + uid);
    const expected = btoa(enteredPin + uid);
    if (stored === expected) {
      setAttempts(0);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin(['', '', '', '']);
      setShake(true);
      setTimeout(function() {
        setShake(false);
        if (newAttempts < MAX_ATTEMPTS) inputRefs.current[0].focus();
      }, 600);
      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
        setLockedUntil(until);
        setError('Too many incorrect attempts. Locked for ' + LOCKOUT_MINUTES + ' minutes.');
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError('Incorrect PIN. ' + remaining + ' attempt' + (remaining !== 1 ? 's' : '') + ' remaining.');
      }
    }
  };

  const isLocked = lockedUntil && Date.now() < lockedUntil;
  const fmtCountdown = function() {
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    return m + ':' + s.toString().padStart(2, '0');
  };
  const firstName = firebaseUser && firebaseUser.displayName ? firebaseUser.displayName.split(' ')[0] : '';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="slide-up" style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem 2rem', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--gold)', marginBottom: '1.75rem' }}>MoneyMap</div>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{isLocked ? '🚫' : step === 'email' ? '👋' : '🔒'}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>
          {isLocked ? 'Account Locked' : step === 'email' ? 'Welcome back!' : firstName ? 'Welcome back, ' + firstName + '!' : 'Enter your PIN'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          {isLocked ? 'Too many incorrect attempts. Try again in ' + fmtCountdown() + '.' : step === 'email' ? 'Enter your email to access your dashboard.' : 'Enter your 4-digit PIN to continue.'}
        </p>

        {!isLocked && step === 'email' && (
          <div>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={function(e) { setEmail(e.target.value); setError(''); }}
              onKeyDown={function(e) { if (e.key === 'Enter') handleEmailNext(); }}
              style={{ marginBottom: 12, textAlign: 'center' }} autoFocus />
            {error && <div className="alert-box alert-danger" style={{ marginBottom: 12, textAlign: 'left' }}>{error}</div>}
            <button className="btn-gold" style={{ width: '100%', marginBottom: 12 }} onClick={handleEmailNext} disabled={loading}>
              {loading ? 'Checking...' : 'Continue'}
            </button>
          </div>
        )}

        {!isLocked && step === 'pin' && (
          <div>
            {email && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{email}</div>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: '1.25rem' }}>
              {pin.map(function(d, i) {
                return <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: d ? 'var(--gold)' : 'transparent', border: '2px solid ' + (d ? 'var(--gold)' : 'var(--navy-border)'), transition: 'all 0.15s ease' }} />;
              })}
            </div>
            <div className={shake ? 'shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: '1.25rem' }}>
              {pin.map(function(d, i) {
                return (
                  <input key={i} ref={function(el) { inputRefs.current[i] = el; }}
                    type="password" inputMode="numeric" maxLength={1} value={d}
                    style={{ width: 52, height: 58, textAlign: 'center', fontSize: 24, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1.5px solid ' + (d ? 'var(--gold)' : 'var(--navy-border)'), borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', caretColor: 'transparent' }}
                    onChange={function(e) { handleDigit(e.target.value, i); }}
                    onKeyDown={function(e) { handleKeyDown(e, i); }}
                    disabled={!!isLocked} />
                );
              })}
            </div>
            {error && <div className="alert-box alert-danger" style={{ marginBottom: 14, textAlign: 'left' }}>{error}</div>}
            {!firebaseUser && (
              <button className="btn-outline" style={{ fontSize: 12, width: '100%' }} onClick={function() { setStep('email'); setPin(['','','','']); setError(''); setResolvedUid(null); }}>
                Use a different email
              </button>
            )}
          </div>
        )}

        {isLocked && (
          <div style={{ fontSize: 48, fontFamily: 'var(--font-display)', fontWeight: 800, color: '#f87171', margin: '1rem 0' }}>{fmtCountdown()}</div>
        )}

        <div style={{ borderTop: '1px solid var(--navy-border)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            New here?{' '}
            <button onClick={onNewUser} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              Get free access
            </button>
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            <a href="#admin" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} onClick={function() { window.location.reload(); }}>Admin login</a>
          </p>
        </div>
      </div>
      <style>{'.shake{animation:shake 0.5s ease} @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}'}</style>
    </div>
  );
}
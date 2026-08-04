import React, { useState, useEffect } from 'react';

const G = '#2a6b4a';
const GL = 'rgba(42,107,74,0.08)';
const BORDER = '#e8e4dc';

export default function PinLogin({ onSuccess, onForgot, uid, firstName, onSignOut }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [shake, setShake] = useState(false);

  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION = 5 * 60 * 1000;
  const LOCK_KEY = 'mm_pin_locked_' + uid;

  useEffect(() => {
    const stored = localStorage.getItem(LOCK_KEY);
    if (stored) {
      const until = parseInt(stored);
      if (Date.now() < until) {
        setLockedUntil(until);
      } else {
        localStorage.removeItem(LOCK_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setError('');
        localStorage.removeItem(LOCK_KEY);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const getStoredPin = () => {
    const raw = localStorage.getItem('mm_pin_' + uid);
    return raw;
  };

  const handleKey = (digit) => {
    if (lockedUntil || pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');
    if (newPin.length === 4) {
      setTimeout(() => checkPin(newPin), 80);
    }
  };

  const handleDelete = () => {
    if (lockedUntil) return;
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const checkPin = (enteredPin) => {
    const stored = getStoredPin();
    const encoded = btoa(enteredPin + uid);
    if (encoded === stored) {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_DURATION;
        setLockedUntil(until);
        localStorage.setItem(LOCK_KEY, until.toString());
        setError('Too many incorrect attempts. Try again in 5 minutes.');
      } else {
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`);
      }
    }
  };

  const initials = firstName ? firstName.slice(0, 2).toUpperCase() : '??';

  const keys = ['1','2','3','4','5','6','7','8','9'];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 20, padding: '2.5rem 2rem', width: '100%', maxWidth: 360, textAlign: 'center' }}>

        <div style={{ fontFamily: "'Georgia', serif", fontSize: 22, color: '#1a1a1a', marginBottom: 20, letterSpacing: '-0.01em' }}>
          Money<span style={{ color: G }}>Map</span>
        </div>

        <div style={{ width: 52, height: 52, borderRadius: '50%', background: GL, border: `1px solid rgba(42,107,74,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Georgia', serif", fontSize: 18, color: G, margin: '0 auto 12px' }}>
          {initials}
        </div>

        <div style={{ fontSize: 14, color: '#333', fontWeight: 500, marginBottom: 4 }}>
          Welcome back{firstName ? `, ${firstName}` : ''}
        </div>
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 24 }}>
          Enter your 4-digit PIN to continue
        </div>

        {lockedUntil ? (
          <div style={{ background: 'rgba(184,48,48,0.06)', border: '1px solid rgba(184,48,48,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#b83030' }}>
            🔒 Account locked — try again in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28, animation: shake ? 'shake 0.4s ease' : 'none' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: pin.length > i ? G : '#fff', border: `2px solid ${pin.length > i ? G : BORDER}`, transition: 'all 0.15s' }} />
              ))}
            </div>

            {error && (
              <div style={{ background: 'rgba(184,48,48,0.06)', border: '1px solid rgba(184,48,48,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#b83030' }}>
                {error}
              </div>
            )}
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
          {keys.map(k => (
            <button key={k}
              onClick={() => handleKey(k)}
              disabled={!!lockedUntil}
              style={{ background: '#fafaf8', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 0', fontSize: 20, fontFamily: "'Georgia', serif", color: '#1a1a1a', cursor: lockedUntil ? 'not-allowed' : 'pointer', opacity: lockedUntil ? 0.4 : 1, transition: 'background 0.1s' }}>
              {k}
            </button>
          ))}
          <button
            onClick={onForgot}
            style={{ background: '#fafaf8', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 0', fontSize: 12, color: G, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
            Forgot PIN
          </button>
          <button
            onClick={() => handleKey('0')}
            disabled={!!lockedUntil}
            style={{ background: '#fafaf8', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 0', fontSize: 20, fontFamily: "'Georgia', serif", color: '#1a1a1a', cursor: lockedUntil ? 'not-allowed' : 'pointer', opacity: lockedUntil ? 0.4 : 1, transition: 'background 0.1s' }}>
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={!!lockedUntil}
            style={{ background: '#fafaf8', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 0', fontSize: 18, color: '#888', cursor: lockedUntil ? 'not-allowed' : 'pointer', opacity: lockedUntil ? 0.4 : 1, fontFamily: 'inherit' }}>
            ⌫
          </button>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: '#aaa' }}>
          Not you?{' '}
          <span
            onClick={onSignOut}
            style={{ color: G, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sign in differently
          </span>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
      `}</style>
    </div>
  );
}

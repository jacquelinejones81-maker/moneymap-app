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

  // Forgot PIN states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState('verify'); // verify | newpin | success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [forgotUid, setForgotUid] = useState('');

  const inputRefs = useRef([]);
  const newPinRefs = useRef([]);
  const confirmPinRefs = useRef([]);

  useEffect(() => {
    if (step === 'pin' && !showForgot) setTimeout(() => inputRefs.current[0]?.focus(), 150);
  }, [step, showForgot]);

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
    setLoading(true); setError('');
    const emailKey = 'mm_email_uid_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const storedUid = localStorage.getItem(emailKey);
    if (storedUid) {
      setResolvedUid(storedUid); setLoading(false); setStep('pin'); return;
    }
    const leads = JSON.parse(localStorage.getItem('mm_leads') || '[]');
    const lead = leads.find(function(l) { return l.email && l.email.toLowerCase() === email.toLowerCase(); });
    const phone = lead ? lead.phone.replace(/\D/g, '') : '';
    const passwordsToTry = [
      btoa(email.toLowerCase() + phone).slice(0, 20) + 'Mm1!',
      btoa(email.toLowerCase() + phone.slice(0,10)).slice(0, 20) + 'Mm1!',
    ];
    let signedIn = false;
    for (let i = 0; i < passwordsToTry.length; i++) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email.toLowerCase(), passwordsToTry[i]);
        setResolvedUid(cred.user.uid);
        localStorage.setItem(emailKey, cred.user.uid);
        signedIn = true; break;
      } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
          setError("We don't recognize that email. Are you a new user?");
          setLoading(false); return;
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
      setLoading(false); return;
    }
    setLoading(false); setStep('pin');
  };

  const handleDigit = function(val, idx) {
    if (lockedUntil) return;
    if (!/^\d*$/.test(val)) return;
    const updated = pin.slice(); updated[idx] = val.slice(-1); setPin(updated); setError('');
    if (val && idx < 3) inputRefs.current[idx + 1]?.focus();
    if (val && idx === 3) { const full = updated.join(''); if (full.length === 4) verifyPin(full); }
  };

  const handleKeyDown = function(e, idx) {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const verifyPin = function(enteredPin) {
    const uid = resolvedUid || (firebaseUser && firebaseUser.uid) || (auth.currentUser && auth.currentUser.uid);
    if (!uid) { setError('Account not found. Please sign up again.'); return; }
    const stored = localStorage.getItem('mm_pin_' + uid);
    const expected = btoa(enteredPin + uid);
    if (stored === expected) {
      setAttempts(0); onSuccess();
    } else {
      const newAttempts = attempts + 1; setAttempts(newAttempts);
      setPin(['', '', '', '']); setShake(true);
      setTimeout(function() {
        setShake(false);
        if (newAttempts < MAX_ATTEMPTS) inputRefs.current[0]?.focus();
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

  // ── Forgot PIN ────────────────────────────────────────────────
  const handleForgotVerify = async () => {
    if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotError('Enter a valid email address.'); return;
    }
    if (!forgotPhone.trim() || forgotPhone.replace(/\D/g, '').length < 10) {
      setForgotError('Enter your phone number.'); return;
    }
    setForgotLoading(true); setForgotError('');

    const cleanPhone = forgotPhone.replace(/\D/g, '');
    const passwordsToTry = [
      btoa(forgotEmail.toLowerCase() + cleanPhone).slice(0, 20) + 'Mm1!',
      btoa(forgotEmail.toLowerCase() + cleanPhone.slice(0,10)).slice(0, 20) + 'Mm1!',
    ];

    let uid = null;
    const emailKey = 'mm_email_uid_' + forgotEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    uid = localStorage.getItem(emailKey);

    if (!uid) {
      for (let i = 0; i < passwordsToTry.length; i++) {
        try {
          const cred = await signInWithEmailAndPassword(auth, forgotEmail.toLowerCase(), passwordsToTry[i]);
          uid = cred.user.uid;
          localStorage.setItem(emailKey, uid);
          break;
        } catch (err) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
            setForgotError("We don't recognize that email. Please sign up instead.");
            setForgotLoading(false); return;
          }
        }
      }
    }

    if (!uid) {
      setForgotError("We couldn't verify your account. Check your email and phone number.");
      setForgotLoading(false); return;
    }

    setForgotUid(uid);
    setForgotLoading(false);
    setForgotStep('newpin');
    setTimeout(() => newPinRefs.current[0]?.focus(), 150);
  };

  const handleNewPinDigit = function(val, idx, pinArr, setPinArr, refs, nextRefs) {
    if (!/^\d*$/.test(val)) return;
    const updated = pinArr.slice(); updated[idx] = val.slice(-1); setPinArr(updated);
    if (val && idx < 3) refs.current[idx + 1]?.focus();
    if (val && idx === 3 && nextRefs) setTimeout(() => nextRefs.current[0]?.focus(), 100);
  };

  const handleNewPinKeyDown = function(e, idx, refs) {
    if (e.key === 'Backspace' && !newPin[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleConfirmPinKeyDown = function(e, idx) {
    if (e.key === 'Backspace' && !confirmPin[idx] && idx > 0) confirmPinRefs.current[idx - 1]?.focus();
  };

  const handleSaveNewPin = function() {
    const newFull = newPin.join('');
    const confirmFull = confirmPin.join('');
    if (newFull.length !== 4) { setForgotError('Enter a 4-digit PIN.'); return; }
    if (newFull !== confirmFull) { setForgotError("PINs don't match. Try again."); setConfirmPin(['','','','']); confirmPinRefs.current[0]?.focus(); return; }
    localStorage.setItem('mm_pin_' + forgotUid, btoa(newFull + forgotUid));
    setForgotStep('success');
    setTimeout(function() {
      setShowForgot(false);
      setForgotStep('verify');
      setForgotEmail(''); setForgotPhone('');
      setNewPin(['','','','']); setConfirmPin(['','','','']);
      setForgotError(''); setForgotUid('');
      setResolvedUid(forgotUid);
      setStep('pin');
    }, 2000);
  };

  const formatPhone = function(value) {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.slice(0,3) + '-' + digits.slice(3);
    return digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
  };

  const isLocked = lockedUntil && Date.now() < lockedUntil;
  const fmtCountdown = function() { const m = Math.floor(countdown/60); const s = countdown%60; return m + ':' + s.toString().padStart(2,'0'); };
  const firstName = firebaseUser && firebaseUser.displayName ? firebaseUser.displayName.split(' ')[0] : '';

  // ── Forgot PIN Screen ─────────────────────────────────────────
  if (showForgot) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', background:'#f0f6ff' }}>
        <div className="slide-up" style={{ background:'#fff', border:'1px solid #c7ddf7', borderRadius:'var(--radius-xl)', padding:'2.5rem 2rem', maxWidth:400, width:'100%', textAlign:'center', boxShadow:'0 4px 20px rgba(26,111,212,0.1)' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'#1a6fd4', marginBottom:'1.75rem' }}>MoneyMap</div>

          {forgotStep === 'verify' && (
            <>
              <div style={{ fontSize:40, marginBottom:12 }}>🔑</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:8, color:'#0f2a5e' }}>Reset your PIN</h2>
              <p style={{ fontSize:13, color:'#6b8dc4', lineHeight:1.6, marginBottom:'1.5rem' }}>Enter the email and phone number you signed up with to verify your identity.</p>
              <div style={{ marginBottom:12, textAlign:'left' }}>
                <label style={{ fontSize:12, color:'#6b8dc4', display:'block', marginBottom:5, fontWeight:500 }}>Email address</label>
                <input type="email" placeholder="your@email.com" value={forgotEmail}
                  onChange={function(e) { setForgotEmail(e.target.value); setForgotError(''); }}
                  onKeyDown={function(e) { if (e.key==='Enter') handleForgotVerify(); }}
                  autoFocus />
              </div>
              <div style={{ marginBottom:16, textAlign:'left' }}>
                <label style={{ fontSize:12, color:'#6b8dc4', display:'block', marginBottom:5, fontWeight:500 }}>Phone number</label>
                <input type="tel" placeholder="555-555-5555" value={forgotPhone}
                  onChange={function(e) { setForgotPhone(formatPhone(e.target.value)); setForgotError(''); }}
                  onKeyDown={function(e) { if (e.key==='Enter') handleForgotVerify(); }} />
              </div>
              {forgotError && <div className="alert-box alert-danger" style={{ marginBottom:12, textAlign:'left' }}>{forgotError}</div>}
              <button className="btn-gold" style={{ width:'100%', marginBottom:10 }} onClick={handleForgotVerify} disabled={forgotLoading}>
                {forgotLoading ? 'Verifying…' : 'Verify My Identity →'}
              </button>
              <button onClick={function() { setShowForgot(false); setForgotError(''); }} style={{ background:'none', border:'none', color:'#6b8dc4', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
                Back to login
              </button>
            </>
          )}

          {forgotStep === 'newpin' && (
            <>
              <div style={{ fontSize:40, marginBottom:12 }}>🔒</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:8, color:'#0f2a5e' }}>Create new PIN</h2>
              <p style={{ fontSize:13, color:'#6b8dc4', lineHeight:1.6, marginBottom:'1.5rem' }}>Choose a new 4-digit PIN for your account.</p>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:'#6b8dc4', marginBottom:8, fontWeight:500 }}>New PIN</div>
                <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:8 }}>
                  {newPin.map(function(d, i) {
                    return <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: d ? '#1a6fd4' : 'transparent', border:'2px solid ' + (d ? '#1a6fd4' : '#c7ddf7'), transition:'all 0.15s' }} />;
                  })}
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
                  {newPin.map(function(d, i) {
                    return (
                      <input key={i} ref={function(el) { newPinRefs.current[i] = el; }}
                        type="password" inputMode="numeric" maxLength={1} value={d}
                        style={{ width:52, height:58, textAlign:'center', fontSize:24, fontWeight:700, background:'#f8faff', border:'1.5px solid ' + (d ? '#1a6fd4' : '#c7ddf7'), borderRadius:'var(--radius-md)', color:'#0f2a5e', caretColor:'transparent' }}
                        onChange={function(e) { handleNewPinDigit(e.target.value, i, newPin, setNewPin, newPinRefs, confirmPinRefs); }}
                        onKeyDown={function(e) { if (e.key==='Backspace' && !newPin[i] && i>0) newPinRefs.current[i-1]?.focus(); }} />
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:'#6b8dc4', marginBottom:8, fontWeight:500 }}>Confirm new PIN</div>
                <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:8 }}>
                  {confirmPin.map(function(d, i) {
                    return <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: d ? '#1a6fd4' : 'transparent', border:'2px solid ' + (d ? '#1a6fd4' : '#c7ddf7'), transition:'all 0.15s' }} />;
                  })}
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
                  {confirmPin.map(function(d, i) {
                    return (
                      <input key={i} ref={function(el) { confirmPinRefs.current[i] = el; }}
                        type="password" inputMode="numeric" maxLength={1} value={d}
                        style={{ width:52, height:58, textAlign:'center', fontSize:24, fontWeight:700, background:'#f8faff', border:'1.5px solid ' + (d ? '#1a6fd4' : '#c7ddf7'), borderRadius:'var(--radius-md)', color:'#0f2a5e', caretColor:'transparent' }}
                        onChange={function(e) { handleNewPinDigit(e.target.value, i, confirmPin, setConfirmPin, confirmPinRefs, null); }}
                        onKeyDown={function(e) { handleConfirmPinKeyDown(e, i); }} />
                    );
                  })}
                </div>
              </div>

              {forgotError && <div className="alert-box alert-danger" style={{ marginBottom:12, textAlign:'left' }}>{forgotError}</div>}
              <button className="btn-gold" style={{ width:'100%', marginBottom:10 }} onClick={handleSaveNewPin}>
                Save New PIN
              </button>
              <button onClick={function() { setForgotStep('verify'); setForgotError(''); }} style={{ background:'none', border:'none', color:'#6b8dc4', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
                Back
              </button>
            </>
          )}

          {forgotStep === 'success' && (
            <>
              <div style={{ fontSize:52, marginBottom:16 }}>🎉</div>
              <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:8, color:'#0f2a5e' }}>PIN Reset!</h2>
              <p style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>Your new PIN has been saved. Taking you to login…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Normal Login Screen ───────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', background:'#f0f6ff' }}>
      <div className="slide-up" style={{ background:'#fff', border:'1px solid #c7ddf7', borderRadius:'var(--radius-xl)', padding:'2.5rem 2rem', maxWidth:400, width:'100%', textAlign:'center', boxShadow:'0 4px 20px rgba(26,111,212,0.1)' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'#1a6fd4', marginBottom:'1.75rem' }}>MoneyMap</div>
        <div style={{ fontSize:44, marginBottom:12 }}>{isLocked ? '🚫' : step==='email' ? '👋' : '🔒'}</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:8, color:'#0f2a5e' }}>
          {isLocked ? 'Account Locked' : step==='email' ? 'Welcome back!' : firstName ? 'Welcome back, ' + firstName + '!' : 'Enter your PIN'}
        </h2>
        <p style={{ fontSize:13, color:'#6b8dc4', lineHeight:1.6, marginBottom:'1.75rem' }}>
          {isLocked ? 'Too many incorrect attempts. Try again in ' + fmtCountdown() + '.' : step==='email' ? 'Enter your email to access your dashboard.' : 'Enter your 4-digit PIN to continue.'}
        </p>

        {!isLocked && step==='email' && (
          <div>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={function(e) { setEmail(e.target.value); setError(''); }}
              onKeyDown={function(e) { if (e.key==='Enter') handleEmailNext(); }}
              style={{ marginBottom:12, textAlign:'center' }} autoFocus />
            {error && <div className="alert-box alert-danger" style={{ marginBottom:12, textAlign:'left' }}>{error}</div>}
            <button className="btn-gold" style={{ width:'100%', marginBottom:12 }} onClick={handleEmailNext} disabled={loading}>
              {loading ? 'Checking…' : 'Continue →'}
            </button>
          </div>
        )}

        {!isLocked && step==='pin' && (
          <div>
            {email && <div style={{ fontSize:12, color:'#6b8dc4', marginBottom:12 }}>{email}</div>}
            <div style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:'1.25rem' }}>
              {pin.map(function(d, i) {
                return <div key={i} style={{ width:14, height:14, borderRadius:'50%', background: d ? '#1a6fd4' : 'transparent', border:'2px solid ' + (d ? '#1a6fd4' : '#c7ddf7'), transition:'all 0.15s ease' }} />;
              })}
            </div>
            <div className={shake ? 'shake' : ''} style={{ display:'flex', justifyContent:'center', gap:12, marginBottom:'1.25rem' }}>
              {pin.map(function(d, i) {
                return (
                  <input key={i} ref={function(el) { inputRefs.current[i] = el; }}
                    type="password" inputMode="numeric" maxLength={1} value={d}
                    style={{ width:52, height:58, textAlign:'center', fontSize:24, fontWeight:700, background:'#f8faff', border:'1.5px solid ' + (d ? '#1a6fd4' : '#c7ddf7'), borderRadius:'var(--radius-md)', color:'#0f2a5e', caretColor:'transparent' }}
                    onChange={function(e) { handleDigit(e.target.value, i); }}
                    onKeyDown={function(e) { handleKeyDown(e, i); }}
                    disabled={!!isLocked} />
                );
              })}
            </div>
            {error && <div className="alert-box alert-danger" style={{ marginBottom:14, textAlign:'left' }}>{error}</div>}
            <button onClick={function() { setShowForgot(true); setForgotEmail(email); }} style={{ background:'none', border:'none', color:'#1a6fd4', fontSize:12, cursor:'pointer', textDecoration:'underline', marginBottom:8, display:'block', width:'100%' }}>
              Forgot PIN?
            </button>
            {!firebaseUser && (
              <button className="btn-outline" style={{ fontSize:12, width:'100%' }} onClick={function() { setStep('email'); setPin(['','','','']); setError(''); setResolvedUid(null); }}>
                ← Use a different email
              </button>
            )}
          </div>
        )}

        {isLocked && (
          <div>
            <div style={{ fontSize:48, fontFamily:'var(--font-display)', fontWeight:800, color:'#dc2626', margin:'1rem 0' }}>{fmtCountdown()}</div>
            <button onClick={function() { setShowForgot(true); }} style={{ background:'none', border:'none', color:'#1a6fd4', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
              Reset my PIN instead
            </button>
          </div>
        )}

        <div style={{ borderTop:'1px solid #c7ddf7', marginTop:'1.5rem', paddingTop:'1.25rem' }}>
          <p style={{ fontSize:12, color:'#6b8dc4' }}>
            New here?{' '}
            <button onClick={onNewUser} style={{ background:'none', border:'none', color:'#1a6fd4', fontSize:12, cursor:'pointer', fontWeight:600 }}>
              Get free access
            </button>
          </p>
          <p style={{ fontSize:11, color:'#6b8dc4', marginTop:6 }}>
            <a href="#admin" style={{ color:'#6b8dc4', textDecoration:'none' }} onClick={function() { window.location.reload(); }}>Admin login</a>
          </p>
        </div>
      </div>
      <style>{'@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}.shake{animation:shake 0.5s ease}'}</style>
    </div>
  );
}

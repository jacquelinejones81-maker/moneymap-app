import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import LandingPage from './LandingPage';
import BudgetApp from './BudgetApp';
import AdminPanel from './AdminPanel';
import PinSetup from './PinSetup';
import PinLogin from './PinLogin';

const ADMIN_PASSWORD = 'moneymap2024';

export default function App() {
  const [view, setView] = useState('loading');
  const [currentLead, setCurrentLead] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [repName, setRepName] = useState('');

  useEffect(() => {
    // Read ?rep= from URL and save it
    const params = new URLSearchParams(window.location.search);
    const rep = params.get('rep');
    if (rep) {
      setRepName(rep);
      localStorage.setItem('mm_rep', rep);
    } else {
      const savedRep = localStorage.getItem('mm_rep');
      if (savedRep) setRepName(savedRep);
    }

    // Check for admin hash
    const hash = window.location.hash;
    if (hash === '#admin') { setView('admin-login'); return; }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setView('landing');
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(loadingTimeout);
      if (user) {
        const cancelled = localStorage.getItem(`mm_cancelled_${user.uid}`);
        if (cancelled) {
          localStorage.removeItem(`mm_cancelled_${user.uid}`);
          signOut(auth);
          setView('landing');
          return;
        }
        setFirebaseUser(user);
        const emailKey = `mm_email_uid_${user.email.toLowerCase().replace(/[^a-z0-9]/g,'_')}`;
        localStorage.setItem(emailKey, user.uid);
        const lead = JSON.parse(localStorage.getItem(`mm_lead_${user.uid}`) || 'null');
        setCurrentLead(lead);
        const pinSet = localStorage.getItem(`mm_pin_${user.uid}`);
        if (!pinSet) {
          setView('pin-setup');
        } else {
          const sessionAuth = sessionStorage.getItem(`mm_auth_${user.uid}`);
          if (sessionAuth === 'true') {
            setView('app');
          } else {
            setView('pin-login');
          }
        }
      } else {
        clearTimeout(loadingTimeout);
        setFirebaseUser(null);
        setView('landing');
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, []);

  const handleLeadSubmit = async (lead) => {
    try {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      const tempPassword = btoa(lead.email + cleanPhone).slice(0, 20) + 'Mm1!';

      const passwordsToTry = [
        btoa(lead.email + cleanPhone).slice(0, 20) + 'Mm1!',
        btoa(lead.email + lead.phone).slice(0, 20) + 'Mm1!',
      ];

      let userCredential = null;
      let signedIn = false;

      for (const pw of passwordsToTry) {
        try {
          userCredential = await signInWithEmailAndPassword(auth, lead.email, pw);
          signedIn = true;
          break;
        } catch (e) {
          if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
            continue;
          } else if (e.code === 'auth/too-many-requests') {
            throw e;
          }
        }
      }

      if (!signedIn) {
        userCredential = await createUserWithEmailAndPassword(auth, lead.email, tempPassword);
      }

      const user = userCredential.user;
      await updateProfile(user, { displayName: lead.name });

      const rep = repName || localStorage.getItem('mm_rep') || '';

      const newLead = {
        ...lead,
        uid: user.uid,
        id: Date.now(),
        submittedAt: new Date().toISOString(),
        referredBy: rep,
        crmAdded: false,
        bookSent: false,
        reviewCalled: false,
      };

      const leads = JSON.parse(localStorage.getItem('mm_leads') || '[]');
      const exists = leads.find(l => l.email === lead.email);
      if (!exists) {
        leads.unshift(newLead);
        localStorage.setItem('mm_leads', JSON.stringify(leads));
        try {
          const { setDoc, doc } = await import('firebase/firestore');
          const { db } = await import('./firebase');
          await setDoc(doc(db, 'leads', user.uid), newLead);
        } catch(e) { console.error('Lead save error:', e); }
      }

      localStorage.setItem(`mm_lead_${user.uid}`, JSON.stringify(newLead));
      const emailKey = `mm_email_uid_${user.email.toLowerCase().replace(/[^a-z0-9]/g,'_')}`;
      localStorage.setItem(emailKey, user.uid);

      setCurrentLead(newLead);
      setFirebaseUser(user);
      setView('pin-setup');
    } catch (err) {
      console.error('Error creating account:', err);
      alert('Something went wrong. Please try again.');
    }
  };

  const handlePinSetup = (pin) => {
    if (!firebaseUser) return;
    localStorage.setItem(`mm_pin_${firebaseUser.uid}`, btoa(pin + firebaseUser.uid));
    sessionStorage.setItem(`mm_auth_${firebaseUser.uid}`, 'true');
    setView('app');
  };

  const handlePinLogin = () => {
    if (!firebaseUser) return;
    sessionStorage.setItem(`mm_auth_${firebaseUser.uid}`, 'true');
    setView('app');
  };

  const handleSignOut = async () => {
    if (firebaseUser) {
      sessionStorage.removeItem(`mm_auth_${firebaseUser.uid}`);
    }
    await signOut(auth);
    setCurrentLead(null);
    setFirebaseUser(null);
    setView('landing');
  };

  const handleDeleteAccount = async () => {
    if (!firebaseUser) return;
    try {
      const uid = firebaseUser.uid;
      localStorage.setItem(`mm_cancelled_${uid}`, 'true');
      localStorage.removeItem(`mm_pin_${uid}`);
      localStorage.removeItem(`mm_lead_${uid}`);
      sessionStorage.removeItem(`mm_auth_${uid}`);
      await signOut(auth);
      setCurrentLead(null);
      setFirebaseUser(null);
      setView('landing');
    } catch (err) {
      console.error('Error deleting account:', err);
      setView('landing');
    }
  };

  if (view === 'loading') return <LoadingScreen />;
  if (view === 'admin-login') return <AdminLogin onSuccess={() => setView('admin')} />;
  if (view === 'admin') return <AdminPanel onBack={() => { window.location.hash = ''; setView('landing'); }} />;
  if (view === 'pin-setup') return <PinSetup lead={currentLead} onComplete={handlePinSetup} />;
  if (view === 'forgot-pin') return <ForgotPin firebaseUser={firebaseUser} currentLead={currentLead} onComplete={()=>{ sessionStorage.setItem(`mm_auth_${firebaseUser.uid}`,'true'); setView('app'); }} onBack={()=>setView('pin-login')} />;
  if (view === 'pin-login') return <PinLogin uid={firebaseUser?.uid} firstName={currentLead?.name?.split(' ')[0]||''} onSuccess={handlePinLogin} onForgot={()=>setView('forgot-pin')} onSignOut={handleSignOut} />;
  if (view === 'app') return <BudgetApp lead={currentLead} firebaseUser={firebaseUser} onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} />;
  return <LandingPage onSubmit={handleLeadSubmit} repName={repName} />;
}

function ForgotPin({ firebaseUser, currentLead, onComplete, onBack }) {
  const [step, setStep] = useState('verify'); // verify | newpin | done
  const [phone, setPhone] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const verifyPhone = () => {
    const stored = currentLead?.phone?.replace(/\D/g,'');
    const entered = phone.replace(/\D/g,'');
    if (!entered || entered.length < 10) { setError('Enter your phone number.'); return; }
    if (stored && entered !== stored) { setError('Phone number does not match our records.'); return; }
    setError('');
    setStep('newpin');
  };

  const saveNewPin = () => {
    if (newPin.length !== 4) { setError('PIN must be 4 digits.'); return; }
    if (newPin !== confirmPin) { setError('PINs do not match.'); return; }
    const uid = firebaseUser.uid;
    localStorage.setItem(`mm_pin_${uid}`, btoa(newPin + uid));
    sessionStorage.setItem(`mm_auth_${uid}`, 'true');
    setStep('done');
    setTimeout(onComplete, 1200);
  };

  const G = '#2a6b4a';
  const BORDER = '#e8e4dc';

  return (
    <div style={{ minHeight:'100vh', background:'#f5f4f0', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#fff', border:`1px solid ${BORDER}`, borderRadius:20, padding:'2.5rem 2rem', width:'100%', maxWidth:380, textAlign:'center' }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:22, color:'#1a1a1a', marginBottom:20 }}>
          Money<span style={{ color:G }}>Map</span>
        </div>

        {step==='verify' && (
          <>
            <div style={{ fontSize:32, marginBottom:12 }}>🔐</div>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:18, color:'#1a1a1a', marginBottom:6 }}>Reset your PIN</div>
            <div style={{ fontSize:12, color:'#888', marginBottom:20, lineHeight:1.6 }}>Enter the phone number on your account to verify your identity.</div>
            <div style={{ textAlign:'left', marginBottom:12 }}>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.07em', color:'#aaa', display:'block', marginBottom:5 }}>Phone number</label>
              <input type="tel" placeholder="555-555-5555" value={phone} onChange={e=>{ setPhone(e.target.value); setError(''); }}
                style={{ background:'#fafaf8', border:`1px solid ${error?'#b83030':BORDER}`, borderRadius:8, padding:'10px 12px', color:'#1a1a1a', fontSize:13, width:'100%', boxSizing:'border-box' }}/>
            </div>
            {error && <div style={{ color:'#b83030', fontSize:12, marginBottom:10, textAlign:'left' }}>{error}</div>}
            <button onClick={verifyPhone} style={{ background:G, color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer', width:'100%', marginBottom:10 }}>Verify</button>
            <button onClick={onBack} style={{ background:'none', border:'none', color:'#888', fontSize:12, cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 }}>Back to PIN login</button>
          </>
        )}

        {step==='newpin' && (
          <>
            <div style={{ fontSize:32, marginBottom:12 }}>🔑</div>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:18, color:'#1a1a1a', marginBottom:6 }}>Set a new PIN</div>
            <div style={{ fontSize:12, color:'#888', marginBottom:20 }}>Choose a new 4-digit PIN for your account.</div>
            <div style={{ textAlign:'left', marginBottom:12 }}>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.07em', color:'#aaa', display:'block', marginBottom:5 }}>New PIN</label>
              <input type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={newPin} onChange={e=>{ setNewPin(e.target.value.replace(/\D/g,'').slice(0,4)); setError(''); }}
                style={{ background:'#fafaf8', border:`1px solid ${BORDER}`, borderRadius:8, padding:'10px 12px', color:'#1a1a1a', fontSize:18, width:'100%', boxSizing:'border-box', letterSpacing:'0.3em', textAlign:'center' }}/>
            </div>
            <div style={{ textAlign:'left', marginBottom:16 }}>
              <label style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.07em', color:'#aaa', display:'block', marginBottom:5 }}>Confirm PIN</label>
              <input type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={confirmPin} onChange={e=>{ setConfirmPin(e.target.value.replace(/\D/g,'').slice(0,4)); setError(''); }}
                style={{ background:'#fafaf8', border:`1px solid ${BORDER}`, borderRadius:8, padding:'10px 12px', color:'#1a1a1a', fontSize:18, width:'100%', boxSizing:'border-box', letterSpacing:'0.3em', textAlign:'center' }}/>
            </div>
            {error && <div style={{ color:'#b83030', fontSize:12, marginBottom:10, textAlign:'left' }}>{error}</div>}
            <button onClick={saveNewPin} style={{ background:G, color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer', width:'100%' }}>Save new PIN</button>
          </>
        )}

        {step==='done' && (
          <>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:18, color:'#1a1a1a', marginBottom:6 }}>PIN updated!</div>
            <div style={{ fontSize:13, color:'#888' }}>Taking you to your dashboard…</div>
          </>
        )}
      </div>
    </div>
  );
}


function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#2a6b4a', marginBottom: 8 }}>MoneyMap</div>
        <div style={{ fontSize: 13, color: '#888' }}>Loading…</div>
      </div>
    </div>
  );
}

function AdminLogin({ onSuccess }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) { onSuccess(); }
    else { setErr('Incorrect password.'); setPw(''); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#f5f4f0' }}>
      <div className="modal-box slide-up" style={{ maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 6, color: '#0f2a5e' }}>Admin Access</h2>
          <p style={{ color: '#888', fontSize: 13 }}>Enter your admin password to view leads</p>
        </div>
        <input type="password" value={pw} placeholder="Admin password"
          onChange={e => { setPw(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ marginBottom: 12 }} />
        {err && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{err}</p>}
        <button className="btn-gold" style={{ width: '100%' }} onClick={handleLogin}>Enter Admin Panel</button>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#888' }}>
          <a href="#" onClick={e => { e.preventDefault(); window.location.hash = ''; window.location.reload(); }} style={{ color: '#2a6b4a', textDecoration: 'none' }}>← Back</a>
        </p>
      </div>
    </div>
  );
}

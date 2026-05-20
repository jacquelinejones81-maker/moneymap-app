import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile, deleteUser } from 'firebase/auth';
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

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#admin') { setView('admin-login'); return; }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
     // Check if account was cancelled - clear flag and treat as new user
        const cancelled = localStorage.getItem(`mm_cancelled_${user.uid}`);
        if (cancelled) {
          localStorage.removeItem(`mm_cancelled_${user.uid}`);
          signOut(auth);
          return;
        }
        setFirebaseUser(user);
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
        setFirebaseUser(null);
        setView('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLeadSubmit = async (lead) => {
    try {
      const tempPassword = btoa(lead.email + lead.phone).slice(0, 20) + 'Mm1!';
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, lead.email, tempPassword);
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          userCredential = await signInWithEmailAndPassword(auth, lead.email, tempPassword);
        } else throw err;
      }
      const user = userCredential.user;
      await updateProfile(user, { displayName: lead.name });
      const newLead = {
        ...lead,
        uid: user.uid,
        id: Date.now(),
        submittedAt: new Date().toISOString(),
        crmAdded: false,
        bookSent: false,
        reviewCalled: false,
      };
      const leads = JSON.parse(localStorage.getItem('mm_leads') || '[]');
      const exists = leads.find(l => l.email === lead.email);
      if (!exists) {
        leads.unshift(newLead);
        localStorage.setItem('mm_leads', JSON.stringify(leads));
      }
      localStorage.setItem(`mm_lead_${user.uid}`, JSON.stringify(newLead));
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
      // Mark as cancelled FIRST so auth listener ignores it
      localStorage.setItem(`mm_cancelled_${uid}`, 'true');
      // Clear all session and PIN data
      localStorage.removeItem(`mm_pin_${uid}`);
      localStorage.removeItem(`mm_lead_${uid}`);
      sessionStorage.removeItem(`mm_auth_${uid}`);
      // Sign out and delete account
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
  if (view === 'pin-login') return <PinLogin firebaseUser={firebaseUser} onSuccess={handlePinLogin} onNewUser={() => setView('landing')} />;
  if (view === 'app') return <BudgetApp lead={currentLead} firebaseUser={firebaseUser} onSignOut={handleSignOut} onDeleteAccount={handleDeleteAccount} />;
  return <LandingPage onSubmit={handleLeadSubmit} />;
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--gold)', marginBottom: 8 }}>MoneyMap</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="modal-box slide-up" style={{ maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 6 }}>Admin Access</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Enter your admin password to view leads</p>
        </div>
        <input
          type="password" value={pw} placeholder="Admin password"
          onChange={e => { setPw(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{ marginBottom: 12 }}
        />
        {err && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</p>}
        <button className="btn-gold" style={{ width: '100%' }} onClick={handleLogin}>Enter Admin Panel</button>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
          <a href="#" onClick={e => { e.preventDefault(); window.location.hash = ''; window.location.reload(); }} style={{ color: 'var(--gold)', textDecoration: 'none' }}>← Back</a>
        </p>
      </div>
    </div>
  );
}
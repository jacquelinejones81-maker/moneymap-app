import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import BudgetApp from './BudgetApp';
import AdminPanel from './AdminPanel';
import PinSetup from './PinSetup';
import PinLogin from './PinLogin';

const ADMIN_PASSWORD = 'moneymap2024';

export default function App() {
  const [view, setView] = useState('loading');
  const [currentLead, setCurrentLead] = useState(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#admin') { setView('admin-login'); return; }
    const isAuthenticated = sessionStorage.getItem('mm_auth') === 'true';
    if (isAuthenticated) {
      const lead = JSON.parse(sessionStorage.getItem('mm_lead') || 'null');
      setCurrentLead(lead);
      setView('app');
      return;
    }
    const accounts = JSON.parse(localStorage.getItem('mm_accounts') || '{}');
    const hasAnyAccount = Object.keys(accounts).length > 0;
    setView(hasAnyAccount ? 'pin-login' : 'landing');
  }, []);

  const handleLeadSubmit = (lead) => {
    const leads = JSON.parse(localStorage.getItem('mm_leads') || '[]');
    const newLead = {
      ...lead,
      id: Date.now(),
      submittedAt: new Date().toISOString(),
      crmAdded: false,
      bookSent: false,
      reviewCalled: false,
    };
    leads.unshift(newLead);
    localStorage.setItem('mm_leads', JSON.stringify(leads));
    setCurrentLead(newLead);
    setView('pin-setup');
  };

  const handlePinSetup = (pin) => {
    const accounts = JSON.parse(localStorage.getItem('mm_accounts') || '{}');
    const email = currentLead?.email || '';
    accounts[email.toLowerCase()] = {
      pin: btoa(pin + email.toLowerCase()),
      name: currentLead?.name || '',
      leadId: currentLead?.id,
    };
    localStorage.setItem('mm_accounts', JSON.stringify(accounts));
    sessionStorage.setItem('mm_auth', 'true');
    sessionStorage.setItem('mm_lead', JSON.stringify(currentLead));
    setView('app');
  };

  const handlePinLogin = (lead) => {
    sessionStorage.setItem('mm_auth', 'true');
    sessionStorage.setItem('mm_lead', JSON.stringify(lead));
    setCurrentLead(lead);
    setView('app');
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('mm_auth');
    sessionStorage.removeItem('mm_lead');
    setCurrentLead(null);
    setView('pin-login');
  };

  if (view === 'loading') return <LoadingScreen />;
  if (view === 'admin-login') return <AdminLogin onSuccess={() => setView('admin')} />;
  if (view === 'admin') return <AdminPanel onBack={() => { window.location.hash = ''; setView('pin-login'); }} />;
  if (view === 'pin-setup') return <PinSetup lead={currentLead} onComplete={handlePinSetup} />;
  if (view === 'pin-login') return <PinLogin onSuccess={handlePinLogin} onNewUser={() => setView('landing')} />;
  if (view === 'app') return <BudgetApp lead={currentLead} onSignOut={handleSignOut} />;
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
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
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--gold)', marginBot
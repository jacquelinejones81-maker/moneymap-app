import React, { useState, useEffect } from 'react';

const BENEFITS = [
  { icon: '📊', text: 'Checkbook-style register that tracks every dollar' },
  { icon: '🎯', text: 'Debt stacking engine that shows your payoff timeline' },
  { icon: '📈', text: 'Spending reports — monthly, quarterly, yearly' },
  { icon: '🐷', text: 'Savings goals tracker with real-time progress' },
  { icon: '🔔', text: 'Smart alerts when you overspend or underspend' },
  { icon: '📧', text: 'Exclusive money tips delivered to your inbox' },
];

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.slice(0,3) + '-' + digits.slice(3);
  return digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
}

function isReturningUser(email) {
  if (!email) return false;
  const emailKey = 'mm_returning_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return !!localStorage.getItem(emailKey);
}

function markReturningUser(email) {
  if (!email) return;
  const emailKey = 'mm_returning_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  localStorage.setItem(emailKey, 'true');
}

const G = '#2a6b4a';
const GL = 'rgba(42,107,74,0.08)';
const GM = 'rgba(42,107,74,0.15)';
const BORDER = '#e8e4dc';
const BORDER2 = 'rgba(42,107,74,0.18)';

export default function LandingPage({ onSubmit, repName }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [wantsReview, setWantsReview] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(function() {
    function handleResize() { setIsMobile(window.innerWidth <= 768); }
    window.addEventListener('resize', handleResize);
    return function() { window.removeEventListener('resize', handleResize); };
  }, []);

  const handleEmailBlur = function() {
    if (form.email && isReturningUser(form.email)) {
      setIsReturning(true);
    } else {
      setIsReturning(false);
    }
  };

  const validate = function() {
    const e = {};
    if (!form.name.trim()) e.name = 'Your name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'A valid email is required';
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) e.phone = 'A valid phone number is required';
    return e;
  };

  const handleGetAccess = function() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const lead = Object.assign({}, form, { wantsReview: wantsReview });
    if (isReturningUser(form.email)) {
      onSubmit(lead);
      return;
    }
    setSubmittedLead(lead);
    setShowPopup(true);
  };

  const handleAgree = function() {
    if (!agreed) return;
    markReturningUser(submittedLead.email);
    onSubmit(Object.assign({}, submittedLead));
  };

  const handlePhoneChange = function(e) {
    const formatted = formatPhone(e.target.value);
    setForm(function(f) { return Object.assign({}, f, { phone: formatted }); });
    setErrors(function(er) { return Object.assign({}, er, { phone: '' }); });
  };

  const repDisplay = repName ? repName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase()) : '';

  const inputStyle = (hasErr) => ({
    background: '#fafaf8',
    border: `1px solid ${hasErr ? '#b83030' : '#e0ddd6'}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: '#1a1a1a',
    fontSize: 13,
    width: '100%',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  });

  const labelStyle = {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: '#aaa',
    display: 'block',
    marginBottom: 5,
    fontWeight: 500,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '1.5rem 1rem 3rem' : '2.5rem 1.5rem 4rem' }}>

        {repDisplay && (
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span style={{ background: GL, border: `1px solid ${BORDER2}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, color: G, fontWeight: 600 }}>
              👤 Shared by {repDisplay}
            </span>
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '2.5rem', paddingTop: '0.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: GL, border: `1px solid ${BORDER2}`, borderRadius: 20, padding: '5px 16px', marginBottom: '1.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: G, display: 'inline-block' }}></span>
            <span style={{ fontSize: 11, fontWeight: 600, color: G, letterSpacing: '0.07em' }}>FREE FINANCIAL TOOL</span>
          </div>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: isMobile ? '2rem' : 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 'normal', lineHeight: 1.15, marginBottom: '1rem', color: '#1a1a1a' }}>
            Stop Wondering<br />
            <span style={{ color: G }}>Where Your Money Went</span>
          </h1>
          <p style={{ fontSize: isMobile ? '0.95rem' : 'clamp(0.95rem, 2vw, 1.1rem)', color: '#555', maxWidth: 540, margin: '0 auto', lineHeight: 1.75 }}>
            The same budgeting system financial professionals use — now free for you. Track spending, crush debt, and finally build savings that stick.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem', alignItems: 'start' }}>

          <div style={{ flex: isMobile ? 'none' : '1.1', width: '100%' }}>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 17, color: '#1a1a1a', marginBottom: 14, fontWeight: 'normal' }}>
              What you get — 100% free:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: '1.5rem' }}>
              {BENEFITS.map(function(b, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span style={{ fontSize: 19, flexShrink: 0 }}>{b.icon}</span>
                    <span style={{ fontSize: 13.5, color: '#333', lineHeight: 1.5 }}>{b.text}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ background: GL, border: `1px solid ${BORDER2}`, borderRadius: 12, padding: '16px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>📚</span>
                <div>
                  <div style={{ fontFamily: "'Georgia', serif", fontSize: 14, color: G, marginBottom: 5 }}>
                    Bonus: Free "How Money Works" book
                  </div>
                  <div style={{ fontSize: 12.5, color: '#3a5a4a', lineHeight: 1.6 }}>
                    Understand the fundamentals of building wealth — sent straight to your inbox after signing up.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: isMobile ? 'none' : '0.9', width: '100%', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: isMobile ? '1.25rem' : '2rem' }}>
            <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 19, marginBottom: 6, textAlign: 'center', color: '#1a1a1a', fontWeight: 'normal' }}>
              Get free access or log back in
            </h3>
            <p style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              New here? Fill out the form to get started. <strong style={{ color: '#444' }}>Already have an account?</strong> Enter your same name, email, and phone to pick up right where you left off.
            </p>

            {isReturning && (
              <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                👋 Welcome back! Fill in your info and we'll take you straight to your dashboard.
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Full name</label>
              <input type="text" placeholder="Your full name" value={form.name}
                style={inputStyle(errors.name)}
                onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { name: e.target.value }); }); setErrors(function(er) { return Object.assign({}, er, { name: '' }); }); }} />
              {errors.name && <p style={{ color: '#b83030', fontSize: 11, marginTop: 4 }}>{errors.name}</p>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Email address</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                style={inputStyle(errors.email)}
                onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { email: e.target.value }); }); setErrors(function(er) { return Object.assign({}, er, { email: '' }); }); setIsReturning(false); }}
                onBlur={handleEmailBlur} />
              {errors.email && <p style={{ color: '#b83030', fontSize: 11, marginTop: 4 }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Phone number</label>
              <input type="tel" placeholder="555-555-5555" value={form.phone}
                style={inputStyle(errors.phone)}
                onChange={handlePhoneChange} />
              {errors.phone && <p style={{ color: '#b83030', fontSize: 11, marginTop: 4 }}>{errors.phone}</p>}
            </div>

            {!isReturning && (
              <div style={{ background: GL, border: `1px solid ${BORDER2}`, borderRadius: 10, padding: '14px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: G, fontWeight: 600, marginBottom: 5 }}>💡 Optional: Free financial review</div>
                <p style={{ fontSize: 12, color: '#444', lineHeight: 1.6, marginBottom: 10 }}>
                  Would you like a complimentary financial review? Check the box and a financial professional will reach out to you within 24 hours.
                </p>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={wantsReview}
                    onChange={function() { setWantsReview(function(v) { return !v; }); }}
                    style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2, accentColor: G, cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: wantsReview ? '#16a34a' : G, lineHeight: 1.5, fontWeight: 500 }}>
                    {wantsReview ? '✓ Yes, I want a free financial review!' : 'Yes, I want a free complimentary financial review.'}
                  </span>
                </label>
              </div>
            )}

            <button
              style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}
              onClick={handleGetAccess}>
              {isReturning ? 'Take me to my dashboard →' : 'Get free access or log back in'}
            </button>
            <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              By signing up you agree to receive financial tips and updates. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="#admin" style={{ fontSize: 11, color: '#ccc', textDecoration: 'none' }}
            onClick={function() { window.location.hash = 'admin'; window.location.reload(); }}>
            Admin login
          </a>
        </div>
      </div>

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-box slide-up" style={{ maxWidth: 540 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontFamily: "'Georgia', serif", fontSize: isMobile ? 22 : 26, marginBottom: 8, lineHeight: 1.2, color: '#1a1a1a', fontWeight: 'normal' }}>
                You're in, {submittedLead && submittedLead.name ? submittedLead.name.split(' ')[0] : 'there'}!
              </h2>
              <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7 }}>
                Your financial transformation starts right now.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' }}>

              <div style={{ background: GL, border: `1px solid ${BORDER2}`, borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>📧</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: G, marginBottom: 3 }}>
                    Check your email at {submittedLead && submittedLead.email}
                  </div>
                  <div style={{ fontSize: 12, color: '#3a5a4a', lineHeight: 1.5 }}>
                    Your free "How Money Works" book is on its way, plus exclusive money tips.
                  </div>
                </div>
              </div>

              {wantsReview && (
                <div style={{ background: GL, border: `1px solid ${GM}`, borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>📅</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: G, marginBottom: 5 }}>
                        Your complimentary financial review is confirmed ✓
                      </div>
                      <div style={{ fontSize: 12, color: '#444', lineHeight: 1.6 }}>
                        {repDisplay
                          ? `${repDisplay} will personally reach out to you within 24 hours to schedule your free review.`
                          : 'A financial professional will personally reach out to you within 24 hours to schedule your free review.'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!wantsReview && (
                <div style={{ background: '#fafaf8', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px' }}>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6, marginBottom: 8 }}>
                    <strong style={{ color: '#1a1a1a' }}>Want to know your retirement number?</strong> A free 1-on-1 financial review can map out exactly where you are and how to get where you want to be.
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {repDisplay
                      ? `Simply reply to your welcome email or ask ${repDisplay} to schedule a free review with you.`
                      : 'Simply reply to your welcome email to request a free complimentary financial review.'
                    }
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🚀</span>
                <div style={{ fontSize: 12, color: '#444', lineHeight: 1.5 }}>
                  <strong style={{ color: '#16a34a' }}>Your dashboard is ready.</strong> Set your beginning balance, add your debts, and log your first transactions today.
                </div>
              </div>
            </div>

            <div style={{ background: '#fafaf8', borderRadius: 10, padding: '12px 14px', marginBottom: '1.25rem', border: `1px solid ${BORDER}` }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed}
                  onChange={function(e) { setAgreed(e.target.checked); }}
                  style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2, accentColor: G }} />
                <span style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>
                  I agree to receive the free "How Money Works" book, financial wellness tips, and occasional updates via email. I understand I can unsubscribe at any time.
                </span>
              </label>
            </div>

            <button
              style={{ background: G, color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 14, fontWeight: 600, width: '100%', cursor: agreed ? 'pointer' : 'not-allowed', opacity: agreed ? 1 : 0.4, fontFamily: 'inherit' }}
              onClick={handleAgree}>
              I agree — take me to my dashboard 🎯
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

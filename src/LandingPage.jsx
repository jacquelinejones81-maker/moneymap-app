import React, { useState, useEffect } from 'react';

const CALENDLY_URL = 'https://calendly.com/jacquelinejones81/serviceappointment';

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

export default function LandingPage({ onSubmit }) {
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

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,111,212,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: isMobile ? '1.5rem 1rem 3rem' : '2rem 1.5rem 4rem' }}>

        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem', paddingTop: '1.5rem' }} className="fade-in">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(26,111,212,0.1)', border: '1px solid rgba(26,111,212,0.25)', borderRadius: 20, padding: '6px 16px', marginBottom: '1.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a6fd4', display: 'inline-block' }}></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1a6fd4', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>FREE FINANCIAL TOOL</span>
          </div>
          <h1 style={{ fontSize: isMobile ? '2rem' : 'clamp(2.2rem, 5vw, 3.6rem)', fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem', color: '#0f2a5e' }}>
            Stop Wondering <br />
            <span style={{ background: 'linear-gradient(135deg, #1a6fd4, #5ba3f5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Where Your Money Went</span>
          </h1>
          <p style={{ fontSize: isMobile ? '1rem' : 'clamp(1rem, 2vw, 1.2rem)', color: '#2d5a9e', maxWidth: 560, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
            The same budgeting system financial professionals use — now free for you. Track spending, crush debt, and finally build savings that stick.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem', alignItems: 'start' }}>

          <div className="fade-in" style={{ flex: isMobile ? 'none' : '1.1', width: '100%' }}>
            <h2 style={{ fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: '1rem', color: '#0f2a5e' }}>What you get — 100% free:</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
              {BENEFITS.map(function(b, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{b.icon}</span>
                    <span style={{ fontSize: 14, color: '#2d5a9e', lineHeight: 1.4 }}>{b.text}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: 'rgba(26,111,212,0.06)', border: '1px solid rgba(26,111,212,0.2)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>📚</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#1a6fd4', marginBottom: 4 }}>BONUS: Free "How Money Works" Book</div>
                  <div style={{ fontSize: 13, color: '#2d5a9e', lineHeight: 1.5 }}>Understand the fundamentals of building wealth — sent straight to your inbox after signing up.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="slide-up" style={{ flex: isMobile ? 'none' : '0.9', width: '100%', background: '#fff', border: '1px solid #c7ddf7', borderRadius: 'var(--radius-xl)', padding: isMobile ? '1.25rem' : '2rem', boxShadow: '0 4px 20px rgba(26,111,212,0.1)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: '0.375rem', textAlign: 'center', color: '#0f2a5e' }}>Get Free Access or Log Back In</h3>
            <p style={{ fontSize: 12, color: '#6b8dc4', textAlign: 'center', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              New here? Fill out the form to get started. <strong style={{ color: '#2d5a9e' }}>Already have an account?</strong> Enter your same name, email, and phone to pick up right where you left off — no new sign-up, no duplicate offers.
            </p>

            {isReturning && (
              <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#16a34a', fontWeight: 500 }}>
                👋 Welcome back! Fill in your info and we'll take you straight to your dashboard.
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6b8dc4', display: 'block', marginBottom: 5, fontWeight: 500 }}>Full name</label>
              <input type="text" placeholder="Your full name" value={form.name}
                onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { name: e.target.value }); }); setErrors(function(er) { return Object.assign({}, er, { name: '' }); }); }}
                style={errors.name ? { borderColor: '#dc2626' } : {}} />
              {errors.name && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>{errors.name}</p>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#6b8dc4', display: 'block', marginBottom: 5, fontWeight: 500 }}>Email address</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { email: e.target.value }); }); setErrors(function(er) { return Object.assign({}, er, { email: '' }); }); setIsReturning(false); }}
                onBlur={handleEmailBlur}
                style={errors.email ? { borderColor: '#dc2626' } : {}} />
              {errors.email && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#6b8dc4', display: 'block', marginBottom: 5, fontWeight: 500 }}>Phone number</label>
              <input type="tel" placeholder="555-555-5555" value={form.phone}
                onChange={handlePhoneChange}
                style={errors.phone ? { borderColor: '#dc2626' } : {}} />
              {errors.phone && <p style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>{errors.phone}</p>}
            </div>

            {!isReturning && (
              <div style={{ background: 'rgba(26,111,212,0.04)', border: '1px solid rgba(26,111,212,0.15)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#1a6fd4', fontWeight: 600, marginBottom: 5 }}>💡 Optional: Free Financial Review</div>
                <p style={{ fontSize: 12, color: '#2d5a9e', lineHeight: 1.6, marginBottom: 10 }}>
                  Want to know exactly how much you need saved to retire on your own terms? Check the box below to request a <strong style={{ color: '#0f2a5e' }}>free complimentary financial review</strong>.
                </p>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={wantsReview} onChange={function() { setWantsReview(function(v) { return !v; }); }}
                    style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, accentColor: '#1a6fd4', cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: wantsReview ? '#16a34a' : '#1a6fd4', lineHeight: 1.5, fontWeight: 500 }}>
                    {wantsReview ? '✓ Yes, I want a free financial review!' : 'Yes, I want to know my number — request a free financial review.'}
                  </span>
                </label>
              </div>
            )}

            <button className="btn-gold" style={{ width: '100%', padding: '14px', fontSize: 15 }} onClick={handleGetAccess}>
              {isReturning ? 'Take Me to My Dashboard →' : 'Get Free Access or Log Back In'}
            </button>
            <p style={{ fontSize: 11, color: '#6b8dc4', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              By signing up you agree to receive financial tips and updates. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: 11, color: '#6b8dc4' }}>
            <a href="#admin" style={{ color: '#6b8dc4', textDecoration: 'none' }}
              onClick={function() { window.location.hash = 'admin'; window.location.reload(); }}>
              Admin login
            </a>
          </p>
        </div>
      </div>

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-box slide-up" style={{ maxWidth: 540 }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 26, marginBottom: 10, lineHeight: 1.2, color: '#0f2a5e' }}>
                You're In, {submittedLead && submittedLead.name ? submittedLead.name.split(' ')[0] : 'there'}!
              </h2>
              <p style={{ color: '#2d5a9e', fontSize: 14, lineHeight: 1.7 }}>
                Your financial transformation starts right now.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' }}>

              <div style={{ background: 'rgba(26,111,212,0.06)', border: '1px solid rgba(26,111,212,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>📧</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a6fd4', marginBottom: 3 }}>Check your email at {submittedLead && submittedLead.email}</div>
                  <div style={{ fontSize: 12, color: '#2d5a9e', lineHeight: 1.5 }}>Your free "How Money Works" book is on its way, plus exclusive money tips.</div>
                </div>
              </div>

              {wantsReview && (
                <div style={{ background: 'rgba(26,111,212,0.06)', border: '1px solid rgba(26,111,212,0.3)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>📅</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a6fd4', marginBottom: 5 }}>Your complimentary financial review is confirmed ✓</div>
                      <div style={{ fontSize: 12, color: '#2d5a9e', lineHeight: 1.6 }}>Most people retire on someone else's timeline because they never knew their number. We're going to change that for you.</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(26,111,212,0.15)' }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a6fd4', marginBottom: 8, textAlign: 'center' }}>Want to lock in your spot right now?</div>
                    <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #1a6fd4, #5ba3f5)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, padding: '13px 20px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
                      📅 Schedule My Free Review Now
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#f8faff', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📞</span>
                    <p style={{ fontSize: 12, color: '#6b8dc4', lineHeight: 1.6, margin: 0 }}>
                      <strong style={{ color: '#2d5a9e' }}>Expect a courtesy call</strong> — a financial professional will personally reach out to you within 24 hours to schedule your free review.
                    </p>
                  </div>
                </div>
              )}

              {/* Always show booking option even if they didn't check the box */}
              {!wantsReview && (
                <div style={{ background: '#f8faff', border: '1px solid #c7ddf7', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 13, color: '#2d5a9e', lineHeight: 1.6 }}>
                    <strong style={{ color: '#0f2a5e' }}>Want to know your retirement number?</strong> A free 1-on-1 financial review can map out exactly where you are and how to get where you want to be.
                  </div>
                  <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #1a6fd4, #5ba3f5)', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, padding: '11px 20px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
                    📅 Book a Free Financial Review — Optional
                  </a>
                </div>
              )}

              <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🚀</span>
                <div style={{ fontSize: 12, color: '#2d5a9e', lineHeight: 1.5 }}>
                  <strong style={{ color: '#16a34a' }}>Your dashboard is ready.</strong> Set your beginning balance, add your debts, and log your first transactions today.
                </div>
              </div>
            </div>

            <div style={{ background: '#f8faff', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '1.25rem', border: '1px solid #c7ddf7' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={function(e) { setAgreed(e.target.checked); }}
                  style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, accentColor: '#1a6fd4' }} />
                <span style={{ fontSize: 12, color: '#2d5a9e', lineHeight: 1.6 }}>
                  I agree to receive the free "How Money Works" book, financial wellness tips, and occasional updates via email. I understand I can unsubscribe at any time.
                </span>
              </label>
            </div>

            <button className="btn-gold"
              style={{ width: '100%', padding: '14px', fontSize: 15, opacity: agreed ? 1 : 0.4, cursor: agreed ? 'pointer' : 'not-allowed' }}
              onClick={handleAgree}>
              I Agree — Take Me to My Dashboard 🎯
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
}

export default function LandingPage({ onSubmit, onReturnUser }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [wantsReview, setWantsReview] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Your name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'A valid email is required';
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) e.phone = 'A valid phone number is required';
    return e;
  };

  const handleGetAccess = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSubmittedLead({ ...form, wantsReview });
    setShowPopup(true);
  };

  const handleAgree = () => {
    if (!agreed) return;
    onSubmit({ ...submittedLead });
  };

  const handleReviewCheck = () => {
    if (!wantsReview) setWantsReview(true);
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setForm(f => ({ ...f, phone: formatted }));
    setErrors(er => ({ ...er, phone: '' }));
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,160,0.06) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: isMobile ? '1.5rem 1rem 3rem' : '2rem 1.5rem 4rem' }}>

        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem', paddingTop: '1.5rem' }} className="fade-in">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 20, padding: '6px 16px', marginBottom: '1.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }}></span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>FREE FINANCIAL TOOL</span>
          </div>
          <h1 style={{ fontSize: isMobile ? '2rem' : 'clamp(2.2rem, 5vw, 3.6rem)', fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
            Stop Wondering <br />
            <span style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Where Your Money Went</span>
          </h1>
          <p style={{ fontSize: isMobile ? '1rem' : 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
            The same budgeting system financial professionals use — now free for you. Track spending, crush debt, and finally build savings that stick.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '2rem', alignItems: 'start' }}>

          <div className="fade-in" style={{ flex: isMobile ? 'none' : '1.1', width: '100%' }}>
            <h2 style={{ fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>What you get — 100% free:</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
              {BENEFITS.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{b.icon}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{b.text}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>📚</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--gold)', marginBottom: 4 }}>BONUS: Free "How Money Works" Book</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Understand the fundamentals of building wealth — sent straight to your inbox after signing up.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="slide-up" style={{ flex: isMobile ? 'none' : '0.9', width: '100%', background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: 'var(--radius-xl)', padding: isMobile ? '1.25rem' : '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: '0.375rem', textAlign: 'center' }}>Get Free Access</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>No credit card. No catch. Just results.</p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5, fontWeight: 500 }}>Full name</label>
              <input type="text" placeholder="Your full name" value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })); }}
                style={errors.name ? { borderColor: 'var(--red)' } : {}} />
              {errors.name && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.name}</p>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5, fontWeight: 500 }}>Email address</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })); }}
                style={errors.email ? { borderColor: 'var(--red)' } : {}} />
              {errors.email && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5, fontWeight: 500 }}>Phone number</label>
              <input
                type="tel"
                placeholder="555-555-5555"
                value={form.phone}
                onChange={handlePhoneChange}
                style={errors.phone ? { borderColor: 'var(--red)' } : {}}
              />
              {errors.phone && <p style={{ color: '#f87171', fontSize: 11, marginTop: 4 }}>{errors.phone}</p>}
            </div>

            <div style={{ background: wantsReview ? 'rgba(14,165,160,0.1)' : 'rgba(14,165,160,0.06)', border: `1px solid ${wantsReview ? 'rgba(14,165,160,0.5)' : 'rgba(14,165,160,0.2)'}`, borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: 16, transition: 'all 0.3s ease' }}>
              <div style={{ fontSize: 12, color: 'var(--teal-light)', fontWeight: 600, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>💡 Did you know?</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
                Most people have <strong style={{ color: 'var(--text-primary)' }}>no idea how much money they actually need saved to retire on their own terms</strong> — not someone else's timeline. A complimentary financial review changes that. In one free session, we map out exactly where you are, where you want to be, and how to get there.
              </p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: wantsReview ? 'default' : 'pointer' }}>
                <input type="checkbox" checked={wantsReview} onChange={handleReviewCheck}
                  style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, accentColor: 'var(--teal)', cursor: wantsReview ? 'default' : 'pointer' }} />
                <span style={{ fontSize: 13, color: 'var(--teal-light)', lineHeight: 1.5, fontWeight: 500 }}>
                  {wantsReview
                    ? <><strong style={{ color: '#5eead4' }}>✓ You're locked in</strong> — complimentary financial review requested.</>
                    : <><strong>Yes, I want to know my number</strong> — sign me up for a free complimentary financial review.</>
                  }
                </span>
              </label>
            </div>

            <button className="btn-gold" style={{ width: '100%', padding: '14px', fontSize: 15 }} onClick={handleGetAccess}>
              Unlock My Free Budget App →
            </button>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              By signing up you agree to receive financial tips and updates. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
           Already have access?{' '}
            <button onClick={onReturnUser} style={{ background:'none', border:'none', color:'var(--gold)', fontSize:12, cursor:'pointer', fontWeight:600, textDecoration:'underline' }}>
              Log in here →
            </button>
            <span style={{ color:'var(--text-muted)', margin:'0 6px' }}>·</span>
            <a href="#admin" style={{ color:'var(--text-muted)', fontSize:11, textDecoration:'none' }}
              onClick={() => { window.location.hash = 'admin'; window.location.reload(); }}>
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
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: isMobile ? 22 : 26, marginBottom: 10, lineHeight: 1.2 }}>
                You're In, {submittedLead?.name?.split(' ')[0]}!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
                Your financial transformation starts <em>right now</em>.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>📧</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: 3 }}>Check your email at {submittedLead?.email}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Your free <strong style={{ color: 'var(--text-primary)' }}>"How Money Works"</strong> book is on its way, plus exclusive money tips.</div>
                </div>
              </div>

              {wantsReview && (
                <div style={{ background: 'rgba(14,165,160,0.08)', border: '1px solid rgba(14,165,160,0.35)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>📅</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal-light)', marginBottom: 5 }}>Your complimentary financial review is confirmed ✓</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Most people retire on someone else's timeline because they never knew their number. <strong style={{ color: 'var(--text-primary)' }}>We're going to change that for you.</strong></div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(14,165,160,0.2)' }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal-light)', marginBottom: 8, textAlign: 'center' }}>Want to lock in your spot right now?</div>
                    <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #0ea5a0, #5eead4)', color: '#0a0f1e', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, padding: '13px 20px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
                      📅 Schedule My Free Review Now
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📞</span>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>Prefer we reach out?</strong> Someone will personally call you at <strong style={{ color: 'var(--text-primary)' }}>{submittedLead?.phone}</strong> within 24 hours.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 'var(--radius-md)', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🚀</span>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#4ade80' }}>Your dashboard is ready.</strong> Set your beginning balance, add your debts, and log your first transactions today.
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, accentColor: 'var(--gold)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  I agree to receive the free <strong style={{ color: 'var(--text-primary)' }}>"How Money Works" book</strong>, financial wellness tips, and occasional updates via email.
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
import React, { useState, useEffect } from 'react';

const TOUR_KEY = 'mm_tour_completed';

const STEPS = [
  { id:'welcome', icon:'👋', title:"Welcome to MoneyMap!", subtitle:"Let's take a 60-second tour", body:"You're about to get a quick look at everything this app can do for you. Each tool here is designed to help you take control of your money — one step at a time. You can always skip and come back later.", tab:null, color:'var(--gold)' },
  { id:'register', icon:'📒', title:"The Register", subtitle:"Your financial checkbook", body:"This is your home base. Log every transaction — just like the old paper checkbook register. Every dollar in and every dollar out shows up here with a running balance. You'll always know exactly where you stand.", tab:'register', color:'#378ADD', tip:'💡 Set your beginning balance first so your running total starts from the right number.' },
  { id:'bills', icon:'🗓', title:"Fixed Bills Tracker", subtitle:"Never miss a due date again", body:"Add your fixed bills once — rent, car note, electric, insurance, subscriptions — and they stay here permanently. Every month they reset so you can track what's paid and what's still owed. Red means overdue, green means done.", tab:'bills', color:'#f472b6', tip:"💡 Mark bills paid as soon as you pay them. You'll see a progress bar fill up as the month goes on." },
  { id:'budgets', icon:'🎯', title:"Budget Limits", subtitle:"Set it — and get alerted", body:"Set a monthly spending limit for each category. The moment you go over — groceries, entertainment, dining out — you get an alert at the top of the app. No more overspending without knowing it.", tab:'budgets', color:'#a78bfa', tip:'💡 Start with your biggest categories — food, housing, and transportation usually make up 70% of most budgets.' },
  { id:'debts', icon:'📉', title:"Debt Stack", subtitle:"The avalanche method — explained", body:"Enter every debt you have. The app automatically sorts them by interest rate and tells you exactly which one to attack first. Pay minimums on everything else and throw every extra dollar at the top debt. When it's gone, roll that payment into the next one.", tab:'debts', color:'#f87171', tip:'💡 The highest interest rate debt costs you the most money every single month. Killing it first saves you the most.' },
  { id:'savings', icon:'🐷', title:"Savings Goals", subtitle:"Build your future here", body:"Create savings goals — emergency fund, down payment, vacation, retirement. Set a target, track what you've saved, and watch the progress bar grow. The app also tracks your monthly savings rate and tells you if you're hitting the 20% benchmark.", tab:'savings', color:'#c9a84c', tip:"💡 Rule of thumb: save at least 1 month of expenses as your emergency fund before aggressively paying down debt." },
  { id:'cash', icon:'💵', title:"Cash Tracker", subtitle:"Stop letting cash disappear", body:"Cash is the #1 budget killer — it's invisible. Every time you spend cash, log it here. Over time you'll see exactly where your physical dollars are going. Most people are shocked when they see how fast small cash purchases add up.", tab:'cash', color:'#38bdf8', tip:'💡 Even $5 here and $10 there can add up to $200+ a month in untracked cash spending.' },
  { id:'timeline', icon:'⏱', title:"Payoff Timeline", subtitle:"See your debt-free date", body:"Enter your extra monthly payment and the app calculates exactly when you'll be debt-free and how much interest you'll save. Drag the number up and watch the date move closer. This is your motivation machine.", tab:'timeline', color:'#34d399', tip:'💡 Even an extra $50/month can shave years off your debt and save thousands in interest.' },
  { id:'spending', icon:'📊', title:"Spending Reports", subtitle:"Monthly, quarterly, yearly", body:"Switch between monthly, quarterly, and yearly views to see exactly where your money went. Use the arrows to navigate back in time. You'll start to see patterns — and patterns are where the real savings are hiding.", tab:'spending', color:'#fb923c', tip:'💡 Check your quarterly report once every 3 months to spot lifestyle creep before it becomes a habit.' },
  { id:'done', icon:'🚀', title:"You're ready to go!", subtitle:"Your financial future starts now", body:"That's the whole app. Start by setting your beginning balance, then add your bills and debts. The more you use it, the clearer your financial picture gets — and the closer you get to financial freedom.", tab:null, color:'#4ade80' },
];

export default function AppTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  const next = () => { if (isLast) { finish(); return; } setExiting(true); setTimeout(() => { setStep(s => s+1); setExiting(false); }, 220); };
  const prev = () => { if (isFirst) return; setExiting(true); setTimeout(() => { setStep(s => s-1); setExiting(false); }, 220); };
  const finish = () => { localStorage.setItem(TOUR_KEY, 'true'); onComplete(); };
  const goTo = (idx) => { setExiting(true); setTimeout(() => { setStep(idx); setExiting(false); }, 180); };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(6,10,20,0.92)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', backdropFilter:'blur(6px)' }}>
      <div style={{ background:'var(--navy-card)', border:`1px solid ${current.color}40`, borderRadius:'var(--radius-xl)', padding:'2.5rem 2rem 2rem', maxWidth:480, width:'100%', position:'relative', boxShadow:`0 0 60px ${current.color}20`, opacity:exiting?0:1, transform:exiting?'translateY(8px)':'translateY(0)', transition:'opacity 0.22s ease, transform 0.22s ease' }}>
        <button onClick={finish} style={{ position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:12, color:'var(--text-muted)', cursor:'pointer', padding:'4px 8px', borderRadius:6 }}>Skip tour ✕</button>
        <div style={{ marginBottom:'1.75rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>
            <span style={{ fontWeight:600, color:current.color }}>Step {step+1} of {STEPS.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div style={{ background:'rgba(255,255,255,0.05)', borderRadius:4, height:4, overflow:'hidden' }}>
            <div style={{ height:4, borderRadius:4, width:`${progress}%`, background:`linear-gradient(90deg, ${current.color}, ${current.color}99)`, transition:'width 0.4s ease' }} />
          </div>
        </div>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:52, marginBottom:14, lineHeight:1 }}>{current.icon}</div>
          {current.tab && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${current.color}15`, border:`1px solid ${current.color}35`, borderRadius:20, padding:'4px 14px', marginBottom:12 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:current.color, display:'inline-block' }}></span>
              <span style={{ fontSize:11, fontWeight:700, color:current.color, letterSpacing:'0.06em', textTransform:'uppercase' }}>{current.tab.charAt(0).toUpperCase()+current.tab.slice(1)} Tab</span>
            </div>
          )}
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, marginBottom:5 }}>{current.title}</h2>
          <div style={{ fontSize:13, color:current.color, fontWeight:600, marginBottom:12 }}>{current.subtitle}</div>
          <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.75, maxWidth:380, margin:'0 auto' }}>{current.body}</p>
        </div>
        {current.tip && (
          <div style={{ background:`${current.color}0d`, border:`1px solid ${current.color}25`, borderRadius:'var(--radius-md)', padding:'10px 14px', fontSize:12, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:'1.5rem', borderLeft:`3px solid ${current.color}` }}>{current.tip}</div>
        )}
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:'1.5rem' }}>
          {STEPS.map((s,i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width:i===step?20:7, height:7, borderRadius:4, background:i===step?current.color:i<step?`${current.color}60`:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', transition:'all 0.3s ease', padding:0 }} />
          ))}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {!isFirst && (
            <button onClick={prev} style={{ flex:'0 0 auto', background:'rgba(255,255,255,0.04)', border:'1px solid var(--navy-border)', color:'var(--text-secondary)', borderRadius:'var(--radius-md)', padding:'12px 18px', fontSize:13, cursor:'pointer', fontFamily:'var(--font-display)', fontWeight:600 }}>← Back</button>
          )}
          <button onClick={next} style={{ flex:1, background:`linear-gradient(135deg, ${current.color}, ${current.color}bb)`, border:'none', color:'#0a0f1e', borderRadius:'var(--radius-md)', padding:'13px', fontSize:14, cursor:'pointer', fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:'0.02em', boxShadow:`0 4px 14px ${current.color}30` }}>
            {isLast ? "🚀 Let's get started!" : isFirst ? "Start the tour →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useTour() {
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_KEY);
    if (!completed) { const t = setTimeout(() => setShowTour(true), 1200); return () => clearTimeout(t); }
  }, []);
  const completeTour = () => setShowTour(false);
  const resetTour = () => { localStorage.removeItem(TOUR_KEY); setShowTour(true); };
  return { showTour, completeTour, resetTour };
}
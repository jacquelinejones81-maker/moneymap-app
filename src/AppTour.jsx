import React, { useState, useEffect } from 'react';

const TOUR_KEY = 'mm_tour_completed';

const STEPS = [
  {
    id: 'welcome',
    icon: '👋',
    title: 'Welcome to MoneyMap!',
    subtitle: "Let's take a quick tour",
    body: "You're about to see everything this app can do for your finances. Each tool is designed to help you take control of your money — one step at a time. You can skip and come back anytime using the 🗺 Tour button.",
    tab: null,
    color: '#1a6fd4',
  },
  {
    id: 'register',
    icon: '📒',
    title: 'The Register',
    subtitle: 'Your financial checkbook',
    body: "Log every transaction — just like a paper checkbook. Every dollar in and out shows up here with a running balance. Set your beginning balance first so your totals start right. You can also import your bank statement using the 📂 Import CSV button in the header!",
    tab: 'register',
    color: '#1a6fd4',
    tip: '💡 Check the box next to transactions to select them and move them to a different account.',
  },
  {
    id: 'bills',
    icon: '🗓',
    title: 'Bills & Subscriptions',
    subtitle: 'Never miss a payment again',
    body: "Add your fixed bills and subscriptions once — they stay permanently and reset every month. Mark them paid and choose which account to deduct from. Use ✏️ to edit any entry or ↗ to move it to another account. Import your bank statement to auto-detect your bills and subscriptions!",
    tab: 'bills',
    color: '#7c3aed',
    tip: '💡 Scroll down in the Bills tab to find your Subscriptions section — tracked separately from fixed bills.',
  },
  {
    id: 'calendar',
    icon: '📅',
    title: 'Bills Calendar',
    subtitle: 'See your whole month at a glance',
    body: "A full calendar view showing every bill and subscription due date this month. Green means paid, yellow means due soon, red means overdue. Much easier than scanning a list — you can see your whole financial month in one view.",
    tab: 'calendar',
    color: '#059669',
    tip: '💡 The calendar shows both fixed bills AND subscriptions together so nothing slips through.',
  },
  {
    id: 'budgets',
    icon: '🎯',
    title: 'Budget Limits',
    subtitle: 'Set it and get alerted',
    body: "Set a monthly spending limit for each category. The moment you go over budget you get an alert at the top of the app. A new month budget reset banner appears on the 1st of each month so your limits are always fresh.",
    tab: 'budgets',
    color: '#d97706',
    tip: '💡 Start with your biggest categories — food, housing, and transportation usually make up 70% of most budgets.',
  },
  {
    id: 'debts',
    icon: '📉',
    title: 'Debt Stack',
    subtitle: 'The avalanche method — automated',
    body: "Enter every debt you have. The app sorts them by interest rate and tells you exactly which one to attack first. Pay minimums on everything else and throw every extra dollar at the top debt. When it's gone, roll that payment into the next one.",
    tab: 'debts',
    color: '#dc2626',
    tip: '💡 The highest interest rate debt costs you the most money every month. Killing it first saves you the most.',
  },
  {
    id: 'savings',
    icon: '🐷',
    title: 'Savings Goals',
    subtitle: 'Build your future here',
    body: "Create savings goals — emergency fund, down payment, vacation. Set a target, track what you've saved, and watch the progress bar grow. When you hit a goal a 🎉 milestone celebration pops up automatically!",
    tab: 'savings',
    color: '#16a34a',
    tip: '💡 Rule of thumb: save at least 1 month of expenses as your emergency fund before aggressively paying down debt.',
  },
  {
    id: 'cash',
    icon: '💵',
    title: 'Cash Tracker',
    subtitle: 'Stop letting cash disappear',
    body: "Cash is the #1 budget killer — it's invisible. Every time you spend cash, log it here. Most people are shocked when they see how fast small cash purchases add up. Even $5 here and $10 there can total $200+ a month.",
    tab: 'cash',
    color: '#0ea5e9',
    tip: '💡 Log cash purchases right when you spend them — your future self will thank you.',
  },
  {
    id: 'timeline',
    icon: '⏱',
    title: 'Payoff Timeline',
    subtitle: 'See your debt-free date',
    body: "Enter your extra monthly payment and the app calculates exactly when you'll be debt-free and how much interest you'll save. Even an extra $50/month can shave years off your debt.",
    tab: 'timeline',
    color: '#059669',
    tip: '💡 Your extra payment amount saves automatically so you never have to re-enter it.',
  },
  {
    id: 'spending',
    icon: '📊',
    title: 'Spending Reports',
    subtitle: 'Monthly, quarterly, yearly',
    body: "Switch between monthly, quarterly, and yearly views to see exactly where your money went. Use the arrows to go back in time. Click 📤 Export Summary to download a clean HTML report of any period.",
    tab: 'spending',
    color: '#ea580c',
    tip: '💡 Check your quarterly report every 3 months to spot lifestyle creep before it becomes a habit.',
  },
  {
    id: 'networth',
    icon: '💎',
    title: 'Net Worth Tracker',
    subtitle: 'Your complete financial picture',
    body: "Add your assets — home value, vehicles, savings and retirement accounts (name only, never account numbers). Add your liabilities — mortgage, car loans, credit cards. Your net worth updates instantly. Also includes your savings rate goal with a progress ring!",
    tab: 'networth',
    color: '#1a6fd4',
    tip: '💡 Update your asset and liability values monthly to track your net worth growth over time.',
  },
  {
    id: 'accounts',
    icon: '🏦',
    title: 'Multiple Accounts',
    subtitle: 'Track every account separately',
    body: "Create separate accounts for checking, bills, savings — whatever you need. Click ✏️ to rename any account. Click 🗑 to delete one. Use the 🔄 Transfer button in the header to move money between accounts without affecting your income or expense totals.",
    tab: null,
    color: '#7c3aed',
    tip: '💡 The ↺ Reset account button wipes all data in just that account — other accounts stay untouched.',
  },
  {
    id: 'import',
    icon: '📂',
    title: 'CSV Import',
    subtitle: 'Import your bank statement',
    body: "Download your bank statement as a CSV and upload it with the 📂 Import CSV button in the header. The app reads your transactions, detects known subscriptions automatically, and even detects fixed bills like mortgage payments and utilities — all in one import!",
    tab: null,
    color: '#059669',
    tip: '💡 Works with any bank — Chase, Wells Fargo, Bank of America, Community America, and more.',
  },
  {
    id: 'tips',
    icon: '💡',
    title: 'Financial Tips',
    subtitle: 'Occasional helpful nudges',
    body: "Every few days a financial tip popup appears in the corner. Topics include life insurance, debt elimination, savings, identity theft protection, home security, legal protection, and more. Click the CTA to let your financial rep know you want to learn more.",
    tab: null,
    color: '#1a6fd4',
    tip: '💡 Each tip shows only once and never repeats — so every tip is something new and valuable.',
  },
  {
    id: 'done',
    icon: '🚀',
    title: "You're ready to go!",
    subtitle: 'Your financial future starts now',
    body: "That's the whole app! Start by setting your beginning balance, then add your bills and debts. Import your bank statement to get started fast. The more you use it, the clearer your financial picture gets — and the closer you get to financial freedom.",
    tab: null,
    color: '#16a34a',
  },
];

export default function AppTour({ onComplete }) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  const next = () => {
    if (isLast) { finish(); return; }
    setExiting(true);
    setTimeout(() => { setStep(s => s + 1); setExiting(false); }, 220);
  };

  const prev = () => {
    if (isFirst) return;
    setExiting(true);
    setTimeout(() => { setStep(s => s - 1); setExiting(false); }, 220);
  };

  const finish = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    onComplete();
  };

  const goTo = (idx) => {
    setExiting(true);
    setTimeout(() => { setStep(idx); setExiting(false); }, 180);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(6,10,20,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: '#fff',
        border: `1px solid ${current.color}40`,
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2rem 2rem',
        maxWidth: 480, width: '100%',
        position: 'relative',
        boxShadow: `0 0 60px ${current.color}20`,
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.22s ease, transform 0.22s ease',
      }}>

        {/* Skip button */}
        <button onClick={finish} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none',
          fontSize: 12, color: '#6b8dc4',
          cursor: 'pointer', padding: '4px 8px',
          borderRadius: 6,
        }}>
          Skip tour ✕
        </button>

        {/* Progress bar */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b8dc4', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: current.color }}>Step {step + 1} of {STEPS.length}</span>
            <span>{progress}% complete</span>
          </div>
          <div style={{ background: '#e8f1fd', borderRadius: 4, height: 4, overflow: 'hidden' }}>
            <div style={{
              height: 4, borderRadius: 4,
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${current.color}, ${current.color}99)`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Icon + heading */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>
            {current.icon}
          </div>

          {current.tab && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${current.color}15`,
              border: `1px solid ${current.color}35`,
              borderRadius: 20, padding: '4px 14px', marginBottom: 12,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: current.color, display: 'inline-block' }}></span>
              <span style={{ fontSize: 11, fontWeight: 700, color: current.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {current.tab.charAt(0).toUpperCase() + current.tab.slice(1)} Tab
              </span>
            </div>
          )}

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800,
            marginBottom: 5, color: '#0f2a5e',
          }}>
            {current.title}
          </h2>
          <div style={{ fontSize: 13, color: current.color, fontWeight: 600, marginBottom: 12 }}>
            {current.subtitle}
          </div>
          <p style={{ fontSize: 14, color: '#2d5a9e', lineHeight: 1.75, maxWidth: 380, margin: '0 auto' }}>
            {current.body}
          </p>
        </div>

        {/* Tip box */}
        {current.tip && (
          <div style={{
            background: `${current.color}0d`,
            border: `1px solid ${current.color}25`,
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            fontSize: 12, color: '#2d5a9e',
            lineHeight: 1.6, marginBottom: '1.5rem',
            borderLeft: `3px solid ${current.color}`,
          }}>
            {current.tip}
          </div>
        )}

        {/* Dot nav */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === step ? 20 : 7,
                height: 7,
                borderRadius: 4,
                background: i === step ? current.color : i < step ? `${current.color}60` : '#e8f1fd',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {!isFirst && (
            <button onClick={prev} style={{
              flex: '0 0 auto',
              background: '#f8faff',
              border: '1px solid #c7ddf7',
              color: '#2d5a9e',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px', fontSize: 13, cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600,
            }}>
              ← Back
            </button>
          )}
          <button onClick={next} style={{
            flex: 1,
            background: `linear-gradient(135deg, ${current.color}, ${current.color}bb)`,
            border: 'none',
            color: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '13px', fontSize: 14, cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: `0 4px 14px ${current.color}30`,
          }}>
            {isLast ? "🚀 Let's get started!" : isFirst ? 'Start the tour →' : 'Next →'}
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
    if (!completed) {
      const t = setTimeout(() => setShowTour(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const completeTour = () => setShowTour(false);
  const resetTour = () => {
    localStorage.removeItem(TOUR_KEY);
    setShowTour(true);
  };

  return { showTour, completeTour, resetTour };
}

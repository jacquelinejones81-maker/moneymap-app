import React, { useState, useEffect } from 'react';

const TIPS = [
  {
    id: 'life_ins_1',
    category: 'Life Insurance',
    icon: '🛡️',
    color: '#1a6fd4',
    bg: 'rgba(26,111,212,0.06)',
    border: 'rgba(26,111,212,0.2)',
    title: 'Is your family protected?',
    body: "Most families are underinsured — or not insured at all. Life insurance ensures your loved ones are taken care of financially if something happens to you. A 10-minute conversation could give your family a lifetime of security.",
    cta: "Learn about life insurance",
  },
  {
    id: 'life_ins_2',
    category: 'Life Insurance',
    icon: '💙',
    color: '#1a6fd4',
    bg: 'rgba(26,111,212,0.06)',
    border: 'rgba(26,111,212,0.2)',
    title: "Term vs. whole life — do you know the difference?",
    body: "Term life is affordable protection for a set period. Whole life builds cash value over time. Most families need both at different stages. A free review can show you exactly what makes sense for your situation.",
    cta: "Get a free life insurance review",
  },
  {
    id: 'debt_1',
    category: 'Debt',
    icon: '📉',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.06)',
    border: 'rgba(220,38,38,0.2)',
    title: 'Your debt is costing you more than you think',
    body: "A $5,000 credit card balance at 24% APR costs you over $1,200 a year in interest alone. Your minimum payment barely touches the principal. A debt elimination strategy can save you thousands and years of payments.",
    cta: "Review my debt plan",
    action: 'tab:debts',
  },
  {
    id: 'debt_2',
    category: 'Debt',
    icon: '🧱',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.06)',
    border: 'rgba(220,38,38,0.2)',
    title: 'Stack your debts — attack the highest rate first',
    body: "Even an extra $50/month toward your highest-interest debt can shave years off your payoff timeline and save thousands in interest. The debt avalanche method is how financially smart people get out of debt fast.",
    cta: "See my debt payoff timeline",
    action: 'tab:timeline',
  },
  {
    id: 'savings_1',
    category: 'Savings',
    icon: '🐷',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.06)',
    border: 'rgba(22,163,74,0.2)',
    title: 'Do you have an emergency fund?',
    body: "Financial experts recommend 3-6 months of expenses saved before anything else. Without it, one unexpected bill can wipe out months of progress and push you deeper into debt. Start small — even $500 changes everything.",
    cta: "Start my emergency fund",
    action: 'tab:savings',
  },
  {
    id: 'savings_2',
    category: 'Savings',
    icon: '🎯',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.06)',
    border: 'rgba(22,163,74,0.2)',
    title: "Do you know your retirement number?",
    body: "Most people don't know their retirement number — the amount they need saved to retire comfortably. Without knowing your number, you can't know if you're on track. A free financial review can calculate it for you.",
    cta: "Find out my retirement number",
  },
  {
    id: 'auto_home_1',
    category: 'Auto & Home Insurance',
    icon: '🏠',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.06)',
    border: 'rgba(217,119,6,0.2)',
    title: 'Are you overpaying for auto insurance?',
    body: "The average American overpays for auto insurance by $400+ per year simply by not shopping around. Bundling home and auto can save even more. When did you last compare rates?",
    cta: "Review my coverage options",
  },
  {
    id: 'auto_home_2',
    category: 'Auto & Home Insurance',
    icon: '🏡',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.06)',
    border: 'rgba(217,119,6,0.2)',
    title: 'Is your home underinsured?',
    body: "Many homeowners are underinsured — meaning if something major happened, their policy wouldn't fully cover the cost to rebuild. When did you last review your homeowner's or renter's insurance coverage?",
    cta: "Review my home coverage",
  },
  {
    id: 'legal_1',
    category: 'Legal Protection',
    icon: '⚖️',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.2)',
    title: 'Do you have access to a lawyer when you need one?',
    body: "Attorney fees average $250-$350 per hour. Legal protection plans give you access to attorneys for everyday needs — wills, contracts, traffic tickets, landlord disputes — for a fraction of that cost.",
    cta: "Learn about legal protection",
  },
  {
    id: 'legal_2',
    category: 'Legal Protection',
    icon: '📋',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.2)',
    title: "Over 60% of Americans don't have a will",
    body: "Without a will, the state decides what happens to your assets and who raises your children. A legal protection plan makes it simple and affordable to create a will, health directive, and power of attorney.",
    cta: "Get my estate documents in order",
  },
  {
    id: 'identity_1',
    category: 'Identity Theft',
    icon: '🔒',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.06)',
    border: 'rgba(14,165,233,0.2)',
    title: 'Identity theft recovery takes 200 hours on average',
    body: "Recovering from identity theft takes an average of 200 hours and $1,300 out of pocket. Identity theft protection monitors your information 24/7 and handles the restoration process for you if it ever happens.",
    cta: "Learn about identity protection",
  },
  {
    id: 'identity_2',
    category: 'Identity Theft',
    icon: '🛡️',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.06)',
    border: 'rgba(14,165,233,0.2)',
    title: 'Your data is already out there',
    body: "Data breaches exposed over 422 million records last year. Your Social Security number, bank account info, and passwords may already be on the dark web. Do you have monitoring in place?",
    cta: "Check my identity protection options",
  },
  {
    id: 'home_security_1',
    category: 'Home Security',
    icon: '🏡',
    color: '#059669',
    bg: 'rgba(5,150,105,0.06)',
    border: 'rgba(5,150,105,0.2)',
    title: 'A security system can lower your insurance premium',
    body: "Home security systems deter break-ins and can lower your homeowner's insurance premium by 5-20%. Modern systems include cameras, motion sensors, and 24/7 professional monitoring — often for less than you think.",
    cta: "Learn about home security options",
  },
  {
    id: 'home_security_2',
    category: 'Home Security',
    icon: '📱',
    color: '#059669',
    bg: 'rgba(5,150,105,0.06)',
    border: 'rgba(5,150,105,0.2)',
    title: 'Most break-ins happen during the day',
    body: "68% of home burglaries occur when residents are away during daylight hours. Homes without security systems are 300% more likely to be targeted. Visible deterrents — cameras, signs, lighting — make a huge difference.",
    cta: "Review home security options",
  },
  {
    id: 'budget_1',
    category: 'Budgeting',
    icon: '💡',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    title: 'The 50/30/20 rule — a simple budget framework',
    body: "50% of your income goes to needs, 30% to wants, and 20% to savings and debt payoff. Check your spending report to see how your actual spending compares to this framework.",
    cta: "See my spending breakdown",
    action: 'tab:spending',
  },
  {
    id: 'budget_2',
    category: 'Budgeting',
    icon: '📊',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.2)',
    title: "Small daily habits — big yearly difference",
    body: "Cutting $10/day in unnecessary spending adds up to $3,650/year. That's an emergency fund, a debt payment, or the start of a retirement account. Track your cash spending to find the leaks.",
    cta: "Track my cash spending",
    action: 'tab:cash',
  },
  {
    id: 'fna_1',
    category: 'Financial Needs Analysis',
    icon: '💼',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.06)',
    border: 'rgba(99,102,241,0.2)',
    title: 'Do you have a complete financial picture?',
    body: "Most people manage money one piece at a time — a little savings here, a debt payment there. A Financial Needs Analysis connects all the dots: income, debt, protection, savings, and retirement in one complete view.",
    cta: "Get my financial needs analysis",
  },
  {
    id: 'fna_2',
    category: 'Financial Needs Analysis',
    icon: '🗺️',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.06)',
    border: 'rgba(99,102,241,0.2)',
    title: 'A financial roadmap changes everything',
    body: "People with a written financial plan are 2.5x more likely to save enough for retirement and feel confident about their finances. A free Financial Needs Analysis connects all the dots in one free session.",
    cta: "Get my financial roadmap",
  },
  {
    id: 'subscriptions_1',
    category: 'Subscriptions',
    icon: '💸',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.06)',
    border: 'rgba(236,72,153,0.2)',
    title: "You're probably spending more on subscriptions than you think",
    body: "The average American spends $273/month on subscriptions without realizing it. That same money invested monthly could grow to $180,000 in 20 years. Check your subscriptions tab to see where your money is going.",
    cta: "Review my subscriptions",
    action: 'tab:bills',
  },
  {
    id: 'subscriptions_2',
    category: 'Subscriptions',
    icon: '📱',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.06)',
    border: 'rgba(236,72,153,0.2)',
    title: 'Free trials that became monthly charges',
    body: "Most people underestimate their subscription spending by 2-3x. Free trials turn into monthly charges, and price increases go unnoticed. A quick audit of your bank statement can free up $50-$200/month.",
    cta: "Audit my subscriptions",
    action: 'tab:bills',
  },
  {
    id: 'mortgage_1',
    category: 'Mortgage',
    icon: '🏠',
    color: '#0f766e',
    bg: 'rgba(15,118,110,0.06)',
    border: 'rgba(15,118,110,0.2)',
    title: 'Extra mortgage payments save you years',
    body: "Even an extra $100/month on a 30-year mortgage can cut 4-6 years off your payoff timeline and save tens of thousands in interest. Check your payoff tab to see what an extra payment does for you.",
    cta: "See my payoff timeline",
    action: 'tab:timeline',
  },
  {
    id: 'mortgage_2',
    category: 'Mortgage',
    icon: '🔑',
    color: '#0f766e',
    bg: 'rgba(15,118,110,0.06)',
    border: 'rgba(15,118,110,0.2)',
    title: 'Every dollar of principal builds equity',
    body: "Every dollar of principal you pay down builds equity in your home. The faster you pay it down, the more equity you build — and equity is one of the most powerful wealth-building tools available to homeowners.",
    cta: "Learn about accelerating my payoff",
  },
  {
    id: 'pay_yourself_1',
    category: 'Savings',
    icon: '🐷',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.06)',
    border: 'rgba(22,163,74,0.2)',
    title: 'Pay yourself first',
    body: "Most people save what's left over after spending. Wealthy people spend what's left over after saving. Set aside 10-20% of every paycheck before paying a single bill — treat savings like a non-negotiable expense.",
    cta: 'Talk to my rep about saving strategies',
    action: 'rep:savings',
    secondaryCta: 'Set a savings goal now',
    secondaryAction: 'tab:savings',
  },
  {
    id: 'pay_yourself_2',
    category: 'Savings',
    icon: '💰',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.06)',
    border: 'rgba(22,163,74,0.2)',
    title: 'The 10% rule that builds real wealth',
    body: "Saving just 10% of your income consistently — even on a modest salary — can build over $500,000 in 30 years with average market returns. The secret isn't how much you make. It's how consistently you save before you spend.",
    cta: 'Talk to my rep about a savings plan',
    action: 'rep:savings',
    secondaryCta: 'Set a savings goal now',
    secondaryAction: 'tab:savings',
  },
];

function getNextTip(uid) {
  const seenKey = 'mm_tips_seen_' + uid;
  const lastKey = 'mm_tips_last_' + uid;
  const seen = JSON.parse(localStorage.getItem(seenKey) || '[]');
  const last = localStorage.getItem(lastKey);
  if (last) {
    const daysSince = (Date.now() - parseInt(last)) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) return null;
  }
  const unseen = TIPS.filter(function(t) { return !seen.includes(t.id); });
  if (unseen.length === 0) return null;
  return unseen[Math.floor(Math.random() * unseen.length)];
}

function markTipSeen(uid, tipId) {
  const seenKey = 'mm_tips_seen_' + uid;
  const lastKey = 'mm_tips_last_' + uid;
  const seen = JSON.parse(localStorage.getItem(seenKey) || '[]');
  if (!seen.includes(tipId)) seen.push(tipId);
  localStorage.setItem(seenKey, JSON.stringify(seen));
  localStorage.setItem(lastKey, Date.now().toString());
}

// ── Rep Contact Card ─────────────────────────────────────────────
export function RepContactCard({ repName, uid }) {
  // Format the rep name from the URL slug (e.g. "jackieJones" -> "Jackie Jones")
  const displayName = repName
    ? repName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase())
    : '';

  if (!displayName) return null;

  return (
    <div style={{ background: 'rgba(42,107,74,0.06)', border: '1px solid rgba(42,107,74,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 20 }}>👤</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700 }}>Your financial rep</div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{displayName}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Will reach out within 24 hrs</div>
    </div>
  )

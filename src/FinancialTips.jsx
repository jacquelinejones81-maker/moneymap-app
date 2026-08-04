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
    body: "Most families are underinsured — or not insured at all. Life insurance ensures your loved ones are taken care of financially if something happens to you. A 10-minute conversation could give your family a lifetime of security.',
    cta: "Learn about life insurance',
  },
  {
    id: 'life_ins_2',
    category: 'Life Insurance',
    icon: '💙',
    color: '#1a6fd4',
    bg: 'rgba(26,111,212,0.06)',
    border: 'rgba(26,111,212,0.2)',
    title: 'Term vs. whole life — do you know the difference?',
    body: "Choosing the wrong type of life insurance could cost you thousands. Term life is affordable and straightforward. Whole life builds cash value. Knowing which one fits your situation is key to protecting your family the right way.",
    cta: "Get a free life insurance review',
  },
  {
    id: "debt_1',
    category: 'Debt',
    icon: '📉',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.06)',
    border: 'rgba(220,38,38,0.2)',
    title: 'High interest debt is costing you more than you think',
    body: "A $5,000 credit card balance at 24% APR costs you over $1,200 a year in interest alone. Your Debt Stack tab shows you the fastest way out — the avalanche method attacks the highest interest first to save you the most money.',
    cta: "Review my debt plan',
    action: 'tab:debts',
  },
  {
    id: 'debt_2',
    category: 'Debt',
    icon: '🏆',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.06)',
    border: 'rgba(220,38,38,0.2)',
    title: 'Every extra dollar toward debt saves you more later',
    body: "Even an extra $50/month toward your highest-interest debt can shave years off your payoff timeline and save thousands in interest. Check your Payoff tab to see exactly how much you could save.',
    cta: "See my payoff timeline',
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
    body: "Financial experts recommend 3-6 months of expenses saved before anything else. Without it, one unexpected event — a car repair, medical bill, or job loss — can derail everything. Start small. Even $500 is a foundation.',
    cta: "Set up my emergency fund goal',
    action: 'tab:savings',
  },
  {
    id: 'savings_2',
    category: 'Savings',
    icon: '📈',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.06)',
    border: 'rgba(22,163,74,0.2)',
    title: 'The average American retires with less than $50,000',
    body: "Most people don't know their retirement number — the amount they need saved to retire on their own timeline. A free financial review can map out exactly what you need and how to get there.",
    cta: "Find out my retirement number',
  },
  {
    id: "auto_home_1',
    category: 'Auto & Home Insurance',
    icon: '🏠',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.06)',
    border: 'rgba(217,119,6,0.2)',
    title: 'Are you overpaying for auto insurance?',
    body: "The average American overpays for auto insurance by $400+ per year simply by not shopping around. A quick review could find you better coverage at a lower rate — more money to put toward your financial goals.',
    cta: "Review my auto insurance',
  },
  {
    id: 'auto_home_2',
    category: 'Auto & Home Insurance',
    icon: '🔑',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.06)',
    border: 'rgba(217,119,6,0.2)',
    title: 'Is your home properly protected?',
    body: "Many homeowners are underinsured — meaning if something major happened, their policy wouldn't fully cover the cost to rebuild. When did you last review your homeowner's or renter's insurance coverage?",
    cta: "Review my home coverage',
  },
  {
    id: "legal_1',
    category: 'Legal Protection',
    icon: '⚖️',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.2)',
    title: 'Do you have a will?',
    body: "Over 60% of Americans don't have a will. Without one, the state decides what happens to your assets and who raises your children. Legal protection plans make it affordable to have a will, power of attorney, and more.",
    cta: "Learn about legal protection',
  },
  {
    id: "legal_2',
    category: 'Legal Protection',
    icon: '📋',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.2)',
    title: "Legal help shouldn't be a luxury",
    body: "Attorney fees average $250-$350 per hour. Legal protection plans give you access to attorneys for a fraction of that cost — for everything from reviewing contracts to handling traffic tickets to creating estate documents.',
    cta: "Learn about legal plans',
  },
  {
    id: 'identity_1',
    category: 'Identity Theft Protection',
    icon: '🔒',
    color: '#db2777',
    bg: 'rgba(219,39,119,0.06)',
    border: 'rgba(219,39,119,0.2)',
    title: 'Identity theft happens every 2 seconds in the US',
    body: "Recovering from identity theft takes an average of 200 hours and $1,300 out of pocket. Identity theft protection monitors your credit, alerts you to suspicious activity, and helps restore your identity if stolen.',
    cta: "Learn about identity protection',
  },
  {
    id: 'identity_2',
    category: 'Identity Theft Protection',
    icon: '🛡️',
    color: '#db2777',
    bg: 'rgba(219,39,119,0.06)',
    border: 'rgba(219,39,119,0.2)',
    title: 'Your financial data is more exposed than you think',
    body: "Data breaches exposed over 422 million records last year. Your Social Security number, bank accounts, and credit cards could already be on the dark web. Monitoring services alert you before damage is done.',
    cta: "Check my exposure risk',
  },
  {
    id: 'home_security_1',
    category: 'Home Security',
    icon: '📷',
    color: '#059669',
    bg: 'rgba(5,150,105,0.06)',
    border: 'rgba(5,150,105,0.2)',
    title: 'A home without security is 3x more likely to be burglarized',
    body: "Home security systems deter break-ins and can lower your homeowner's insurance premium by up to 20%. Modern systems are affordable, easy to install, and monitored 24/7 for fire, carbon monoxide, and intrusion.",
    cta: "Learn about home security',
  },
  {
    id: "home_security_2',
    category: 'Home Security',
    icon: '🏡',
    color: '#059669',
    bg: 'rgba(5,150,105,0.06)',
    border: 'rgba(5,150,105,0.2)',
    title: "Protect what you've worked hard to build",
    body: "Your home is likely your biggest asset. A monitored security system gives you peace of mind whether you're home or away — and many insurers offer discounts just for having one installed.",
    cta: "Explore home security options',
  },
  {
    id: "budget_1',
    category: 'Budgeting',
    icon: '💡',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.06)',
    border: 'rgba(14,165,233,0.2)',
    title: 'The 50/30/20 rule — are you following it?',
    body: "50% of your income goes to needs, 30% to wants, and 20% to savings and debt payoff. Check your Spending tab to see how your breakdown compares. Small adjustments now create big results over time.',
    cta: "Review my spending breakdown',
    action: 'tab:spending',
  },
  {
    id: 'budget_2',
    category: 'Budgeting',
    icon: '📊',
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.06)',
    border: 'rgba(14,165,233,0.2)',
    title: 'Do you know where every dollar is going?',
    body: "People who track their spending save an average of 20% more per month than those who don't. You're already using MoneyMap — you're ahead of most people. Keep logging and watch your financial picture get clearer.",
    cta: "Keep tracking',
    action: "tab:register',
  },
  {
    id: 'mortgage_1',
    category: 'Mortgage',
    icon: '🏠',
    color: '#059669',
    bg: 'rgba(5,150,105,0.06)',
    border: 'rgba(5,150,105,0.2)',
    title: 'Pay extra toward your mortgage principal',
    body: "Even an extra $100/month on a 30-year mortgage can cut 4-6 years off your payoff timeline and save tens of thousands in interest. The key is making sure extra payments go toward principal — not next month\'s payment. Check with your lender to confirm.",
    cta: "See my payoff timeline',
    action: "tab:timeline',
  },
  {
    id: 'mortgage_2',
    category: 'Mortgage',
    icon: '💰',
    color: '#059669',
    bg: 'rgba(5,150,105,0.06)',
    border: 'rgba(5,150,105,0.2)',
    title: 'Your mortgage is your biggest wealth-building tool',
    body: "Every dollar of principal you pay down builds equity in your home. The faster you pay it down the more equity you own. A financial needs analysis can show you exactly how your mortgage fits into your complete financial picture.',
    cta: "Request my free FNA',
  },
  {
    id: 'fna_1',
    category: 'Financial Needs Analysis',
    icon: '💼',
    color: '#1a6fd4',
    bg: 'rgba(26,111,212,0.06)',
    border: 'rgba(26,111,212,0.2)',
    title: 'Have you had a Financial Needs Analysis?',
    body: "A free Financial Needs Analysis looks at your complete financial picture — insurance coverage, debt, savings, retirement, and protection gaps. It takes about 30 minutes and gives you a clear roadmap to financial security. Most people are shocked by what they discover.',
    cta: "Request my free FNA',
  },
  {
    id: 'subscriptions_1',
    category: 'Subscriptions',
    icon: '💸',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.2)',
    title: 'Are subscriptions stealing from your future self?',
    body: "The average American spends $273/month on subscriptions without realizing it. That same money redirected to savings and earning compound interest over 20 years could grow significantly. Small changes today create big results tomorrow.',
    cta: "I want to learn more',
  },
  {
    id: 'subscriptions_2',
    category: 'Subscriptions',
    icon: '📱',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.2)',
    title: 'The subscription trap — do you know what you\'re paying for?',
    body: "Most people underestimate their subscription spending by 2-3x. Free trials turn into monthly charges. Forgotten services keep billing. A full audit of your subscriptions could free up hundreds of dollars a month toward your financial goals.',
    cta: "Help me review my subscriptions',
    action: 'tab:bills',
  },
  {
    id: 'fna_2',
    category: 'Financial Needs Analysis',
    icon: '🗺️',
    color: '#1a6fd4',
    bg: 'rgba(26,111,212,0.06)',
    border: 'rgba(26,111,212,0.2)',
    title: "You're tracking your money — now build a plan",
    body: "Tracking your spending is step one. Step two is building a complete financial plan that covers your income, protection, debt elimination, and long-term goals. A Financial Needs Analysis connects all the dots in one free session.",
    cta: "Get my financial roadmap',
  },
  {
    id: "pay_yourself_1',
    category: 'Savings',
    icon: '🐷',
    interest_key: 'interest_savings_1',
    title: 'Pay yourself first',
    body: "Most people save what's left over after spending. Wealthy people spend what's left over after saving. Set aside 10–20% of every paycheck before paying a single bill — treat savings like a non-negotiable expense.",
    cta: "Talk to my rep about saving strategies',
    action: "rep:savings',
    secondaryCta: 'Set a savings goal now',
    secondaryAction: 'tab:savings',
  },
  {
    id: 'pay_yourself_2',
    category: 'Savings',
    icon: '💰',
    interest_key: 'interest_savings_2',
    title: 'The 10% rule that builds real wealth',
    body: "Saving just 10% of your income consistently — even on a modest salary — can build over $500,000 in 30 years with average market returns. The secret isn't how much you make. It's how consistently you save before you spend.",
    cta: "Talk to my rep about a savings plan',
    action: "rep:savings',
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
  const [rep, setRep] = useState(null);

  useEffect(function() {
    if (!repName) return;
    async function fetchRep() {
      try {
        const { db } = await import('./firebase');
        const { collection, getDocs } = await import('firebase/firestore');
        const snap = await getDocs(collection(db, 'leads'));
        const leads = snap.docs.map(function(d) { return d.data(); });
        // Find lead whose name matches the rep slug
        const slug = repName.toLowerCase().replace(/\s+/g, '');
        const match = leads.find(function(l) {
          if (!l.name) return false;
          const nameSlug = l.name.toLowerCase().replace(/\s+/g, '');
          return nameSlug.includes(slug) || slug.includes(nameSlug.slice(0, 6));
        });
        if (match) {
          setRep({ name: match.name, phone: match.phone });
        }
      } catch (err) {
        console.error('Rep lookup error:', err);
      }
    }
    fetchRep();
  }, [repName]);

  if (!rep) return null;

  const formatPhone = function(phone) {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length === 10) return digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
    return phone;
  };

  return (
    <div style={{ background: 'rgba(26,111,212,0.06)', border: '1px solid rgba(26,111,212,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #1a6fd4, #5ba3f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
          {rep.name ? rep.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#6b8dc4', fontWeight: 500 }}>Your financial rep</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2a5e', fontFamily: 'var(--font-display)' }}>{rep.name}</div>
        </div>
      </div>
      <a href={'tel:' + rep.phone.replace(/\D/g, '')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #1a6fd4, #5ba3f5)', color: '#fff', borderRadius: 'var(--radius-md)', padding: '7px 14px', textDecoration: 'none', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
        📞 {formatPhone(rep.phone)}
      </a>
    </div>
  );
}

// ── Financial Tip Popup ──────────────────────────────────────────
export default function FinancialTipPopup({ uid, lead, onTabSwitch }) {
  const [tip, setTip] = useState(null);
  const [visible, setVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(function() {
    if (!uid) return;
    const timer = setTimeout(function() {
      const next = getNextTip(uid);
      if (next) {
        setTip(next);
        setVisible(true);
      }
    }, 30000);
    return function() { clearTimeout(timer); };
  }, [uid]);

  const handleDismiss = function() {
    if (tip) markTipSeen(uid, tip.id);
    setVisible(false);
  };

  const handleLearnMore = async function() {
    if (tip) markTipSeen(uid, tip.id);
    if (tip && tip.action && tip.action.startsWith('tab:')) {
      const tabName = tip.action.replace('tab:', '');
      if (onTabSwitch) onTabSwitch(tabName);
      setVisible(false);
      return;
    }
    setSending(true);
    try {
      const { db } = await import('./firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'leads', uid), {
        ['interest_' + tip.id]: true,
        lastInterestAt: new Date().toISOString(),
        lastInterestTopic: tip.category,
      });
      setSent(true);
      setTimeout(function() { setVisible(false); }, 2500);
    } catch (err) {
      console.error('Interest save error:', err);
      setVisible(false);
    }
    setSending(false);
  };

  if (!visible || !tip) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, maxWidth: 360, width: 'calc(100vw - 48px)', background: '#fff', border: '1px solid ' + tip.border, borderRadius: 'var(--radius-xl)', boxShadow: '0 8px 40px rgba(26,111,212,0.15)', zIndex: 999, overflow: 'hidden', animation: 'slideUpTip 0.4s ease forwards' }}>
      <style>{'@keyframes slideUpTip { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }'}</style>
      <div style={{ height: 4, background: 'linear-gradient(90deg, ' + tip.color + ', ' + tip.color + '88)' }} />
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{tip.icon}</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: tip.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tip.category}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#0f2a5e', lineHeight: 1.3 }}>{tip.title}</div>
            </div>
          </div>
          <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: '#6b8dc4', fontSize: 16, cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: '#2d5a9e', lineHeight: 1.6, marginBottom: 12 }}>{tip.body}</p>
        {sent ? (
          <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>Your rep will be in touch soon! 🎉</div>
              <div style={{ fontSize: 11, color: '#16a34a', lineHeight: 1.5, opacity: 0.85 }}>We've let your financial rep know you're interested in saving strategies. They'll reach out within 24 hours.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={handleLearnMore} disabled={sending} style={{ width: '100%', background: tip.action && tip.action.startsWith('rep:') ? 'rgba(42,107,74,0.08)' : 'linear-gradient(135deg, ' + tip.color + ', ' + tip.color + 'cc)', color: tip.action && tip.action.startsWith('rep:') ? '#2a6b4a' : '#fff', border: tip.action && tip.action.startsWith('rep:') ? '1px solid rgba(42,107,74,0.25)' : 'none', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)', lineHeight: 1.3, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{tip.action && tip.action.startsWith('rep:') ? '📞' : '→'}</span>
              {sending ? 'Sending…' : tip.cta}
            </button>
            {tip.secondaryCta && (
              <button onClick={() => {
                markTipSeen(uid, tip.id);
                if (tip.secondaryAction && tip.secondaryAction.startsWith('tab:')) {
                  const tabName = tip.secondaryAction.replace('tab:', '');
                  if (onTabSwitch) onTabSwitch(tabName);
                }
                setVisible(false);
              }} style={{ width: '100%', background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-display)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🐷</span>{tip.secondaryCta}
              </button>
            )}
            <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textAlign: 'center', padding: '4px', fontFamily: 'var(--font-display)' }}>
              Got it 👍
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

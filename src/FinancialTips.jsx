import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const TIPS = [
  // Life Insurance
  {
    id: "li_1",
    category: "Life Insurance",
    emoji: "🛡️",
    headline: "Is your family protected?",
    body: "Most families are underinsured — or not insured at all. A quick 15-minute life insurance review could make sure everything you've built is protected, no matter what.",
    cta: "Get a Free Review",
    tabTarget: null,
  },
  {
    id: "li_2",
    category: "Life Insurance",
    emoji: "🛡️",
    headline: "Term vs. Whole Life — do you know the difference?",
    body: "The right type of life insurance depends on your goals, your family, and your budget. Your financial rep can walk you through both options in plain English.",
    cta: "Ask My Rep",
    tabTarget: null,
  },

  // Debt
  {
    id: "debt_1",
    category: "Debt",
    emoji: "📉",
    headline: "Debt avalanche vs. debt snowball",
    body: "Two proven payoff strategies — one saves more money, one builds faster momentum. Check your Debt Stack tab to see which method works best for your situation.",
    cta: "View Debt Stack",
    tabTarget: "Debt Stack",
  },
  {
    id: "debt_2",
    category: "Debt",
    emoji: "📉",
    headline: "See your debt-free date",
    body: "Your Payoff Timeline tab shows exactly when you'll be debt-free based on your current payments. Want to get there faster? Your rep can help you find extra dollars to accelerate.",
    cta: "View Payoff Timeline",
    tabTarget: "Payoff Timeline",
  },

  // Savings
  {
    id: "sav_1",
    category: "Savings",
    emoji: "🐷",
    headline: "Do you have 3–6 months saved?",
    body: "An emergency fund covering 3–6 months of expenses is the foundation of any solid financial plan. Without it, one unexpected event can derail everything.",
    cta: "Talk to My Rep",
    tabTarget: null,
  },
  {
    id: "sav_2",
    category: "Savings",
    emoji: "🐷",
    headline: "The average American retires with less than $50K",
    body: "Social Security alone won't cut it. Do you know your retirement number? Your financial rep can help you build a savings strategy to hit it.",
    cta: "Get My Retirement Plan",
    tabTarget: null,
  },

  // Auto & Home Insurance
  {
    id: "ahi_1",
    category: "Auto & Home Insurance",
    emoji: "🏠",
    headline: "Are you overpaying for insurance?",
    body: "Many people are paying too much for auto and home coverage — or carrying the wrong coverage altogether. A quick review could save you money and fill dangerous gaps.",
    cta: "Request a Review",
    tabTarget: null,
  },
  {
    id: "ahi_2",
    category: "Auto & Home Insurance",
    emoji: "🚗",
    headline: "Bundling auto and home can save big",
    body: "Bundling your auto and home insurance is one of the easiest ways to lower your premiums. Ask your rep if you qualify for a bundled rate.",
    cta: "Ask My Rep",
    tabTarget: null,
  },

  // Legal Protection
  {
    id: "leg_1",
    category: "Legal Protection",
    emoji: "⚖️",
    headline: "Do you have a will?",
    body: "Over 60% of Americans don't have a will. Without one, the state decides what happens to your assets and your children. Legal protection plans can give you access to an attorney at an affordable monthly rate.",
    cta: "Learn More",
    tabTarget: null,
  },
  {
    id: "leg_2",
    category: "Legal Protection",
    emoji: "⚖️",
    headline: "Attorney access shouldn't be a luxury",
    body: "Legal issues don't just happen to other people — traffic tickets, landlord disputes, contract reviews. A legal protection plan gives you an attorney in your corner when you need one.",
    cta: "Talk to My Rep",
    tabTarget: null,
  },

  // Identity Theft
  {
    id: "id_1",
    category: "Identity Theft Protection",
    emoji: "🔒",
    headline: "Your identity is worth protecting",
    body: "Identity theft affects millions of Americans every year. Recovery can take years and thousands of dollars. Identity theft protection monitors your info 24/7 and helps you recover fast if something goes wrong.",
    cta: "Get Protected",
    tabTarget: null,
  },
  {
    id: "id_2",
    category: "Identity Theft Protection",
    emoji: "🔒",
    headline: "Is your info already exposed?",
    body: "Data breaches happen constantly. Your Social Security number, bank account, and personal details may already be on the dark web. Ask your rep about monitoring services that alert you instantly.",
    cta: "Ask My Rep",
    tabTarget: null,
  },

  // Home Security
  {
    id: "hs_1",
    category: "Home Security",
    emoji: "🏡",
    headline: "A monitored home is a safer home",
    body: "Homes without security systems are 300% more likely to be broken into. Home security doesn't just protect your family — it can also lower your homeowner's insurance premium.",
    cta: "Learn About Home Security",
    tabTarget: null,
  },
  {
    id: "hs_2",
    category: "Home Security",
    emoji: "🏡",
    headline: "Smart home security = insurance discounts",
    body: "Many insurance providers offer discounts for monitored security systems. Your rep can help you find a package that protects your home AND saves you money.",
    cta: "Talk to My Rep",
    tabTarget: null,
  },

  // Budgeting
  {
    id: "bud_1",
    category: "Budgeting",
    emoji: "💡",
    headline: "Where does your money actually go?",
    body: "Most people underestimate their spending by 20–30%. Your Spending tab gives you a real breakdown — no guessing. Knowledge is the first step to change.",
    cta: "Check My Spending",
    tabTarget: "Spending",
  },
  {
    id: "bud_2",
    category: "Budgeting",
    emoji: "💡",
    headline: "Every dollar should have a job",
    body: "Zero-based budgeting means assigning every dollar a purpose before the month begins. Head to your Register tab to start giving your money direction.",
    cta: "Open My Register",
    tabTarget: "Register",
  },
];

const STORAGE_KEY = "moneymap_seen_tips";
const LAST_SHOWN_KEY = "moneymap_tip_last_shown";
const MIN_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const INITIAL_DELAY_MS = 30 * 1000; // 30 seconds after login

export default function FinancialTips({ currentUser, onTabSwitch }) {
  const [tip, setTip] = useState(null);
  const [visible, setVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const timer = setTimeout(() => {
      const now = Date.now();
      const lastShown = parseInt(localStorage.getItem(LAST_SHOWN_KEY) || "0");

      if (now - lastShown < MIN_INTERVAL_MS) return;

      const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const unseen = TIPS.filter((t) => !seen.includes(t.id));

      if (unseen.length === 0) return;

      const pick = unseen[Math.floor(Math.random() * unseen.length)];
      setTip(pick);
      setVisible(true);
    }, INITIAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [currentUser]);

  const dismiss = () => {
    if (!tip) return;
    const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, tip.id]));
    localStorage.setItem(LAST_SHOWN_KEY, Date.now().toString());
    setVisible(false);
    setTimeout(() => setTip(null), 400);
  };

  const handleCTA = async () => {
    if (!tip) return;

    // If this tip links to a tab, switch to it
    if (tip.tabTarget && onTabSwitch) {
      onTabSwitch(tip.tabTarget);
      dismiss();
      return;
    }

    // Otherwise log interest to Firebase
    setSending(true);
    try {
      await addDoc(collection(db, "tip_interests"), {
        userId: currentUser.uid,
        userEmail: currentUser.email || "",
        tipId: tip.id,
        tipCategory: tip.category,
        tipHeadline: tip.headline,
        timestamp: serverTimestamp(),
      });
      setSent(true);
      setTimeout(() => {
        dismiss();
        setSent(false);
        setSending(false);
      }, 1800);
    } catch (err) {
      console.error("Error logging tip interest:", err);
      setSending(false);
      dismiss();
    }
  };

  if (!tip) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          maxWidth: "420px",
          width: "100%",
          padding: "28px 24px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "transform 0.35s ease",
          position: "relative",
        }}
      >
        {/* Category badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#e8f0fe",
            color: "#1a73e8",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: "20px",
            marginBottom: "14px",
          }}
        >
          <span>{tip.emoji}</span>
          <span>{tip.category}</span>
        </div>

        {/* Headline */}
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: "18px",
            fontWeight: 700,
            color: "#1a1a2e",
            lineHeight: 1.3,
          }}
        >
          {tip.headline}
        </h2>

        {/* Body */}
        <p
          style={{
            margin: "0 0 22px",
            fontSize: "14px",
            color: "#555",
            lineHeight: 1.6,
          }}
        >
          {tip.body}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleCTA}
            disabled={sending}
            style={{
              flex: 1,
              minWidth: "140px",
              backgroundColor: sending ? "#a0b4e0" : "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "11px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: sending ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {sent ? "✅ Message Sent!" : sending ? "Sending..." : tip.cta}
          </button>

          <button
            onClick={dismiss}
            style={{
              flex: 1,
              minWidth: "100px",
              backgroundColor: "#f1f3f4",
              color: "#444",
              border: "none",
              borderRadius: "8px",
              padding: "11px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Got it 👍
          </button>
        </div>

        {/* Fine print */}
        {!tip.tabTarget && (
          <p
            style={{
              margin: "14px 0 0",
              fontSize: "11px",
              color: "#aaa",
              textAlign: "center",
            }}
          >
            Tapping "{tip.cta}" will notify your financial rep that you're interested.
          </p>
        )}
      </div>
    </div>
  );
}

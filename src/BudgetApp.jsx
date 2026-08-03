import React, { useState, useEffect, useRef } from 'react';
import AppTour, { useTour } from './AppTour';
import FinancialTipPopup, { RepContactCard } from './FinancialTips';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const GROUPS = {
  'Income':       { color:'#16a34a', bg:'rgba(22,163,74,0.12)', cats:['Paycheck','Freelance / side income','Tax refund','Other income'] },
  'Housing':      { color:'#1a6fd4', bg:'rgba(26,111,212,0.1)', cats:['Mortgage / rent','Electric bill','Water bill','Gas / heat bill','Internet','Cable / streaming','Phone bill','HOA fee','Home repair','Other housing'] },
  'Insurance':    { color:'#7c3aed', bg:'rgba(124,58,237,0.1)', cats:['Auto insurance','Life insurance','Health insurance','Dental / vision','Home / renters ins.','Other insurance'] },
  'Transportation':{ color:'#d97706', bg:'rgba(217,119,6,0.1)', cats:['Car payment','Gas / fuel','Car repair / maintenance','Parking / tolls','Public transit','Rideshare','Registration / tags','Other transport'] },
  'Food':         { color:'#059669', bg:'rgba(5,150,105,0.1)', cats:['Groceries','Restaurants / dining out','Fast food','Coffee shops','Other food'] },
  'Health':       { color:'#db2777', bg:'rgba(219,39,119,0.1)', cats:['Doctor visit','Dentist','Prescription / pharmacy','Gym membership','Mental health','Other health'] },
  'Debt Payments':{ color:'#dc2626', bg:'rgba(220,38,38,0.1)', cats:['Credit card payment','Student loan','Personal loan','Medical debt','Other debt payment'] },
  'Kids & Family':{ color:'#16a34a', bg:'rgba(22,163,74,0.1)', cats:['Childcare / daycare','School tuition','School supplies','Kids activities','Baby supplies','Other family'] },
  'Personal':     { color:'#6b7280', bg:'rgba(107,114,128,0.1)', cats:['Clothing','Haircut / grooming','Subscriptions','Gifts','Charity / donations','Other personal'] },
  'Entertainment':{ color:'#ea580c', bg:'rgba(234,88,12,0.1)', cats:['Movies / events','Hobbies','Vacation / travel','Dining / nightlife','Books / games','Other entertainment'] },
  'Savings':      { color:'#1a6fd4', bg:'rgba(26,111,212,0.1)', cats:['Emergency fund','Retirement (401k/IRA)','Investment','Savings account','Other savings'] },
  'Cash Spending':{ color:'#0ea5e9', bg:'rgba(14,165,233,0.1)', cats:['Cash - Groceries','Cash - Fast food','Cash - Restaurants','Cash - Gas / fuel','Cash - Coffee','Cash - Hair / grooming','Cash - Clothing','Cash - Entertainment','Cash - Kids','Cash - Household','Cash - Tips','Cash - Other'] },
  'Other':        { color:'#6b7280', bg:'rgba(107,114,128,0.1)', cats:['Miscellaneous','Cash withdrawal','Other'] }
};
const ALL_CATS = {};
Object.entries(GROUPS).forEach(([g,v]) => v.cats.forEach(c => { ALL_CATS[c] = { group:g, color:v.color, bg:v.bg }; }));

const WELCOME_VIDEO_ID = 'YOUR_YOUTUBE_VIDEO_ID';

function getYouTubeId(input) {
  if (!input || input === 'YOUR_YOUTUBE_VIDEO_ID') return null;
  const match = input.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : (input.length === 11 ? input : null);
}

function WelcomeVideoModal({ lead, onClose }) {
  const videoId = getYouTubeId(WELCOME_VIDEO_ID);
  const firstName = lead?.name?.split(' ')[0] || 'there';
  if (!videoId) return null;
  return (
    <div className="modal-overlay" style={{ zIndex:2000 }} onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="slide-up" style={{ background:'#fff', border:'1px solid var(--navy-border)', borderRadius:'var(--radius-xl)', padding:'2rem', maxWidth:620, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, marginBottom:6, color:'#0f2a5e' }}>A personal note for you, {firstName} 👋</h2>
          <p style={{ fontSize:13, color:'#6b8dc4', lineHeight:1.6 }}>Before you dive in — take 2 minutes to watch this.</p>
        </div>
        <div style={{ position:'relative', paddingBottom:'56.25%', height:0, borderRadius:'var(--radius-lg)', overflow:'hidden', border:'1px solid var(--navy-border)', marginBottom:'1.25rem' }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`} title="Welcome to MoneyMap" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-gold" style={{ flex:1, padding:'13px', fontSize:14 }} onClick={onClose}>I'm ready — take me to my dashboard 🚀</button>
          <button className="btn-outline" style={{ fontSize:12, padding:'13px 16px' }} onClick={onClose}>Skip</button>
        </div>
      </div>
    </div>
  );
}

function DeleteAccountModal({ lead, onConfirm, onCancel }) {
  const [confirmed, setConfirmed] = useState(false);
  const firstName = lead?.name?.split(' ')[0] || 'there';
  return (
    <div className="modal-overlay" style={{ zIndex:3000 }}>
      <div className="modal-box slide-up" style={{ maxWidth:460 }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, marginBottom:8, color:'#0f2a5e' }}>Cancel your account?</h2>
          <p style={{ fontSize:13, color:'#6b8dc4', lineHeight:1.7 }}>Are you sure you want to cancel, {firstName}? <strong style={{ color:'#0f2a5e' }}>This cannot be undone.</strong></p>
        </div>
        <div style={{ background:'#f8faff', borderRadius:'var(--radius-md)', padding:'12px 16px', marginBottom:'1.25rem' }}>
          <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer' }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ width:16, height:16, flexShrink:0, marginTop:2, accentColor:'#dc2626' }} />
            <span style={{ fontSize:12, color:'#6b8dc4', lineHeight:1.6 }}>Yes, I understand — permanently cancel my account and remove all my data.</span>
          </label>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-outline" style={{ flex:1 }} onClick={onCancel}>Keep my account</button>
          <button onClick={onConfirm} disabled={!confirmed} style={{ flex:1, background: confirmed ? '#dc2626' : 'rgba(220,38,38,0.3)', color:'#fff', border:'none', borderRadius:'var(--radius-md)', padding:'12px', fontSize:13, fontWeight:700, cursor: confirmed ? 'pointer' : 'not-allowed', fontFamily:'var(--font-display)', transition:'all 0.2s' }}>
            Cancel my account
          </button>
        </div>
      </div>
    </div>
  );
}

function GoodbyeModal({ lead }) {
  const firstName = lead?.name?.split(' ')[0] || 'there';
  return (
    <div className="modal-overlay" style={{ zIndex:3000 }}>
      <div className="modal-box slide-up" style={{ maxWidth:460, textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:16 }}>👋</div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, marginBottom:10, color:'#0f2a5e' }}>Take care, {firstName}!</h2>
        <p style={{ fontSize:14, color:'#6b8dc4', lineHeight:1.7, marginBottom:16 }}>Your account has been cancelled.</p>
        <div style={{ background:'rgba(26,111,212,0.06)', border:'1px solid rgba(26,111,212,0.2)', borderRadius:'var(--radius-md)', padding:'14px 16px', marginBottom:16 }}>
          <p style={{ fontSize:13, color:'#2d5a9e', lineHeight:1.6 }}>💙 You're always welcome back. Just sign up again — it's always free.</p>
        </div>
        <p style={{ fontSize:12, color:'#6b8dc4' }}>Redirecting you in a moment…</p>
      </div>
    </div>
  );
}

function PayBillModal({ bill, accounts, onConfirm, onCancel }) {
  const [selectedAccount, setSelectedAccount] = useState(Object.keys(accounts)[0] || 'main');
  const [deductFromAccount, setDeductFromAccount] = useState(true);
  return (
    <div className="modal-overlay" style={{ zIndex:3000 }}>
      <div className="modal-box slide-up" style={{ maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>💳</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:6, color:'#0f2a5e' }}>Mark "{bill.name}" as paid</h2>
          <p style={{ fontSize:13, color:'#6b8dc4' }}>${bill.amount.toFixed(2)}</p>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, color:'#6b8dc4', display:'block', marginBottom:6, fontWeight:500 }}>Deduct from which account?</label>
          <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} style={{ marginBottom:10 }}>
            {Object.entries(accounts).map(([key, acct]) => (
              <option key={key} value={key}>{acct.name}</option>
            ))}
          </select>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#2d5a9e' }}>
            <input type="checkbox" checked={deductFromAccount} onChange={e => setDeductFromAccount(e.target.checked)} style={{ width:15, height:15, accentColor:'#1a6fd4' }} />
            Automatically add debit transaction to this account
          </label>
        </div>
        <div style={{ background:'#f0f6ff', borderRadius:'var(--radius-md)', padding:'10px 14px', marginBottom:16, fontSize:12, color:'#2d5a9e' }}>
          {deductFromAccount ? `A debit of $${bill.amount.toFixed(2)} will be added to "${accounts[selectedAccount]?.name}" register.` : 'Bill will be marked paid without affecting any account balance.'}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-outline" style={{ flex:1 }} onClick={onCancel}>Cancel</button>
          <button className="btn-gold" style={{ flex:1 }} onClick={() => onConfirm(selectedAccount, deductFromAccount)}>✓ Mark as Paid</button>
        </div>
      </div>
    </div>
  );
}

// ── Split Transaction Modal ──────────────────────────────────────
function SplitModal({ form, onConfirm, onCancel }) {
  const [splits, setSplits] = useState([
    { grp: form.grp || '', cat: form.cat || '', amt: form.amt || '', note: '' },
    { grp: '', cat: '', amt: '', note: '' },
  ]);
  const total = splits.reduce((s, sp) => s + (parseFloat(sp.amt) || 0), 0);
  const original = parseFloat(form.amt) || 0;
  const remaining = parseFloat((original - total).toFixed(2));

  const addSplit = () => setSplits([...splits, { grp: '', cat: '', amt: '', note: '' }]);
  const removeSplit = i => setSplits(splits.filter((_, idx) => idx !== i));
  const updateSplit = (i, field, val) => {
    const updated = splits.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    setSplits(updated);
  };

  const handleConfirm = () => {
    const valid = splits.filter(s => s.cat && parseFloat(s.amt) > 0);
    if (valid.length < 2) { alert('Add at least 2 valid split amounts.'); return; }
    if (Math.abs(remaining) > 0.01) { alert(`Split total ($${total.toFixed(2)}) must equal original amount ($${original.toFixed(2)}). Remaining: $${remaining.toFixed(2)}`); return; }
    onConfirm(valid);
  };

  return (
    <div className="modal-overlay" style={{ zIndex:3000 }}>
      <div className="modal-box slide-up" style={{ maxWidth:520 }}>
        <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✂️</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, marginBottom:4, color:'#0f2a5e' }}>Split Transaction</h2>
          <p style={{ fontSize:13, color:'#6b8dc4' }}>Total: ${original.toFixed(2)} — Remaining: <strong style={{ color: Math.abs(remaining) < 0.01 ? '#16a34a' : '#dc2626' }}>${remaining.toFixed(2)}</strong></p>
        </div>
        {splits.map((sp, i) => (
          <div key={i} style={{ background:'#f8faff', borderRadius:'var(--radius-md)', padding:'12px', marginBottom:8, border:'1px solid #c7ddf7' }}>
            <div style={{ display:'flex', gap:8, marginBottom:6, flexWrap:'wrap' }}>
              <select value={sp.grp} onChange={e => updateSplit(i, 'grp', e.target.value)} style={{ flex:1, minWidth:120 }}>
                <option value="">-- Group --</option>
                {Object.keys(GROUPS).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={sp.cat} onChange={e => updateSplit(i, 'cat', e.target.value)} style={{ flex:1, minWidth:120 }}>
                <option value="">-- Category --</option>
                {(sp.grp ? GROUPS[sp.grp]?.cats || [] : Object.values(GROUPS).flatMap(v => v.cats)).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="Amount" min="0" step="0.01" value={sp.amt} onChange={e => updateSplit(i, 'amt', e.target.value)} style={{ width:90 }} />
              {splits.length > 2 && <button className="btn-danger" onClick={() => removeSplit(i)}>✕</button>}
            </div>
            <input placeholder="Note (optional)" value={sp.note} onChange={e => updateSplit(i, 'note', e.target.value)} style={{ fontSize:12 }} />
          </div>
        ))}
        <button className="btn-outline" style={{ width:'100%', marginBottom:12, fontSize:12 }} onClick={addSplit}>+ Add another split</button>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-outline" style={{ flex:1 }} onClick={onCancel}>Cancel</button>
          <button className="btn-gold" style={{ flex:1 }} onClick={handleConfirm}>Save splits</button>
        </div>
      </div>
    </div>
  );
}


function AutocompleteInput({value,onChange,transactions,onSelect,style}){
  const [suggestions,setSuggestions]=useState([]);
  const [showSugg,setShowSugg]=useState(false);
  const [focused,setFocused]=useState(false);
  const ref=useRef(null);

  useEffect(()=>{
    if(!value||value.length<2){setSuggestions([]);setShowSugg(false);return;}
    const lower=value.toLowerCase();
    const seen=new Set();
    const matches=transactions
      .filter(t=>t.desc&&t.desc.toLowerCase().includes(lower))
      .filter(t=>{if(seen.has(t.desc))return false;seen.add(t.desc);return true;})
      .slice(0,6)
      .map(t=>({desc:t.desc,grp:t.grp,cat:t.cat}));
    setSuggestions(matches);
    setShowSugg(matches.length>0&&focused);
  },[value,transactions,focused]);

  useEffect(()=>{
    const handleClick=e=>{if(ref.current&&!ref.current.contains(e.target))setShowSugg(false);};
    document.addEventListener('mousedown',handleClick);
    return()=>document.removeEventListener('mousedown',handleClick);
  },[]);

  return(
    <div ref={ref} style={{position:'relative',flex:1}}>
      <input
        type="text"
        placeholder="Description"
        value={value}
        onChange={e=>onChange(e.target.value)}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setTimeout(()=>setFocused(false),150)}
        style={{width:'100%',...(style||{})}}
      />
      {showSugg&&suggestions.length>0&&(
        <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid #c7ddf7',borderRadius:'var(--radius-md)',boxShadow:'0 4px 16px rgba(26,111,212,0.12)',zIndex:999,overflow:'hidden',marginTop:2}}>
          {suggestions.map((s,i)=>(
            <div key={i} onMouseDown={()=>{onSelect(s);setShowSugg(false);}} style={{padding:'9px 14px',cursor:'pointer',borderBottom:i<suggestions.length-1?'1px solid #e8f1fd':'none',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:13,color:'#0f2a5e',fontWeight:500}}>{s.desc}</span>
              {s.cat&&<span style={{fontSize:10,color:'#6b8dc4',background:'#f0f6ff',padding:'2px 8px',borderRadius:8}}>{s.cat}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Known Subscription Services Database ─────────────────────
const KNOWN_SUBSCRIPTIONS = [
  // Streaming
  {keywords:['netflix'],name:'Netflix',category:'Streaming'},
  {keywords:['hulu'],name:'Hulu',category:'Streaming'},
  {keywords:['disney','disneyplus','disney+'],name:'Disney+',category:'Streaming'},
  {keywords:['hbo','max','hbomax'],name:'HBO Max',category:'Streaming'},
  {keywords:['peacock'],name:'Peacock',category:'Streaming'},
  {keywords:['paramount','paramount+'],name:'Paramount+',category:'Streaming'},
  {keywords:['appletv','apple tv'],name:'Apple TV+',category:'Streaming'},
  {keywords:['youtube premium','youtubepremium'],name:'YouTube Premium',category:'Streaming'},
  {keywords:['espn','espn+'],name:'ESPN+',category:'Streaming'},
  {keywords:['fubo','fubotv'],name:'FuboTV',category:'Streaming'},
  {keywords:['sling'],name:'Sling TV',category:'Streaming'},
  {keywords:['discovery+','discoveryplus'],name:'Discovery+',category:'Streaming'},
  {keywords:['showtime'],name:'Showtime',category:'Streaming'},
  {keywords:['starz'],name:'Starz',category:'Streaming'},
  // Music
  {keywords:['spotify'],name:'Spotify',category:'Music'},
  {keywords:['apple music','applemusic'],name:'Apple Music',category:'Music'},
  {keywords:['tidal'],name:'Tidal',category:'Music'},
  {keywords:['pandora'],name:'Pandora',category:'Music'},
  {keywords:['amazon music','amazonmusic'],name:'Amazon Music',category:'Music'},
  {keywords:['siriusxm','sirius xm'],name:'SiriusXM',category:'Music'},
  {keywords:['deezer'],name:'Deezer',category:'Music'},
  {keywords:['soundcloud'],name:'SoundCloud',category:'Music'},
  // Gaming
  {keywords:['xbox','xboxgamepass','xbox game pass'],name:'Xbox Game Pass',category:'Gaming'},
  {keywords:['playstation','psplus','ps plus','playstation plus'],name:'PlayStation Plus',category:'Gaming'},
  {keywords:['nintendo','nintendo online'],name:'Nintendo Online',category:'Gaming'},
  {keywords:['ea play','eaplay'],name:'EA Play',category:'Gaming'},
  {keywords:['steam'],name:'Steam',category:'Gaming'},
  {keywords:['twitch'],name:'Twitch',category:'Gaming'},
  // Fitness
  {keywords:['peloton'],name:'Peloton',category:'Fitness'},
  {keywords:['planet fitness','planetfitness'],name:'Planet Fitness',category:'Fitness'},
  {keywords:['gold's gym','golds gym','goldsgym'],name:"Gold's Gym",category:'Fitness'},
  {keywords:['anytime fitness','anytimefitness'],name:'Anytime Fitness',category:'Fitness'},
  {keywords:['beachbody'],name:'Beachbody',category:'Fitness'},
  {keywords:['myfitnesspal'],name:'MyFitnessPal',category:'Fitness'},
  {keywords:['noom'],name:'Noom',category:'Fitness'},
  {keywords:['fitbit'],name:'Fitbit Premium',category:'Fitness'},
  {keywords:['crunch'],name:'Crunch Fitness',category:'Fitness'},
  {keywords:['la fitness','lafitness'],name:'LA Fitness',category:'Fitness'},
  {keywords:['equinox'],name:'Equinox',category:'Fitness'},
  // Software & Productivity
  {keywords:['adobe','adobe creative','adobe cc'],name:'Adobe Creative Cloud',category:'Software'},
  {keywords:['microsoft 365','microsoft365','office 365','office365'],name:'Microsoft 365',category:'Software'},
  {keywords:['dropbox'],name:'Dropbox',category:'Software'},
  {keywords:['google one','googleone'],name:'Google One',category:'Software'},
  {keywords:['icloud'],name:'iCloud Storage',category:'Software'},
  {keywords:['canva'],name:'Canva',category:'Software'},
  {keywords:['zoom'],name:'Zoom',category:'Software'},
  {keywords:['slack'],name:'Slack',category:'Software'},
  {keywords:['notion'],name:'Notion',category:'Software'},
  {keywords:['grammarly'],name:'Grammarly',category:'Software'},
  {keywords:['lastpass'],name:'LastPass',category:'Software'},
  {keywords:['1password'],name:'1Password',category:'Software'},
  {keywords:['nordvpn','nord vpn'],name:'NordVPN',category:'Software'},
  {keywords:['expressvpn','express vpn'],name:'ExpressVPN',category:'Software'},
  {keywords:['quickbooks'],name:'QuickBooks',category:'Software'},
  // Food & Delivery
  {keywords:['doordash','door dash'],name:'DoorDash',category:'Food / Delivery'},
  {keywords:['hellofresh','hello fresh'],name:'HelloFresh',category:'Food / Delivery'},
  {keywords:['instacart'],name:'Instacart',category:'Food / Delivery'},
  {keywords:['factor','factor75'],name:'Factor Meals',category:'Food / Delivery'},
  {keywords:['every plate','everyplate'],name:'Every Plate',category:'Food / Delivery'},
  {keywords:['blue apron','blueapron'],name:'Blue Apron',category:'Food / Delivery'},
  {keywords:['freshly'],name:'Freshly',category:'Food / Delivery'},
  {keywords:['grubhub'],name:'Grubhub',category:'Food / Delivery'},
  {keywords:['ubereats','uber eats'],name:'Uber Eats',category:'Food / Delivery'},
  // News & Education
  {keywords:['new york times','nytimes','nyt'],name:'New York Times',category:'News'},
  {keywords:['washington post','washpost'],name:'Washington Post',category:'News'},
  {keywords:['wall street journal','wsj'],name:'Wall Street Journal',category:'News'},
  {keywords:['duolingo'],name:'Duolingo',category:'Education'},
  {keywords:['masterclass'],name:'MasterClass',category:'Education'},
  {keywords:['skillshare'],name:'Skillshare',category:'Education'},
  {keywords:['coursera'],name:'Coursera',category:'Education'},
  {keywords:['audible'],name:'Audible',category:'Education'},
  {keywords:['scribd'],name:'Scribd',category:'Education'},
  {keywords:['headspace'],name:'Headspace',category:'Education'},
  {keywords:['calm'],name:'Calm',category:'Education'},
  {keywords:['babbel'],name:'Babbel',category:'Education'},
  // Identity & Security
  {keywords:['lifelock','life lock'],name:'LifeLock',category:'Other'},
  {keywords:['identity guard','identityguard'],name:'Identity Guard',category:'Other'},
  {keywords:['aura'],name:'Aura',category:'Other'},
  {keywords:['norton'],name:'Norton Security',category:'Other'},
  {keywords:['mcafee'],name:'McAfee',category:'Other'},
  {keywords:['experian'],name:'Experian',category:'Other'},
  // Shopping & Other
  {keywords:['amazon prime','amazon.com','amazonprime'],name:'Amazon Prime',category:'Other'},
  {keywords:['linkedin','linkedin premium'],name:'LinkedIn Premium',category:'Other'},
  {keywords:['chatgpt','openai'],name:'ChatGPT Plus',category:'Software'},
  {keywords:['midjourney'],name:'Midjourney',category:'Software'},
  {keywords:['claude','anthropic'],name:'Claude AI',category:'Software'},
  {keywords:['patreon'],name:'Patreon',category:'Other'},
  {keywords:['onlyfans'],name:'OnlyFans',category:'Other'},
  {keywords:['bumble','tinder','match.com','eharmony'],name:'Dating App',category:'Other'},
  {keywords:['stitch fix','stitchfix'],name:'Stitch Fix',category:'Other'},
  {keywords:['birchbox'],name:'Birchbox',category:'Other'},
  {keywords:['ipsy'],name:'IPSY',category:'Other'},
  // Hurdlr
  {keywords:['hurdlr'],name:'Hurdlr',category:'Software'},
  // AI Tools
  {keywords:['gemini','gemini advanced'],name:'Gemini Advanced',category:'Software'},
  {keywords:['copilot pro','copilot'],name:'Copilot Pro',category:'Software'},
  {keywords:['jasper','jasper ai'],name:'Jasper AI',category:'Software'},
  {keywords:['copy.ai','copyai'],name:'Copy.ai',category:'Software'},
  {keywords:['perplexity'],name:'Perplexity AI',category:'Software'},
  {keywords:['runway','runwayml'],name:'Runway ML',category:'Software'},
  {keywords:['elevenlabs'],name:'ElevenLabs',category:'Software'},
  {keywords:['synthesia'],name:'Synthesia',category:'Software'},
  // Social & Content
  {keywords:['youtubetv','youtube tv'],name:'YouTube TV',category:'Streaming'},
  {keywords:['substack'],name:'Substack',category:'News'},
  {keywords:['medium'],name:'Medium',category:'News'},
  {keywords:['beehiiv'],name:'Beehiiv',category:'Software'},
  {keywords:['x premium','twitter blue','twitter'],name:'X Premium',category:'Software'},
  // Business Tools
  {keywords:['hubspot'],name:'HubSpot',category:'Software'},
  {keywords:['mailchimp'],name:'Mailchimp',category:'Software'},
  {keywords:['activecampaign'],name:'ActiveCampaign',category:'Software'},
  {keywords:['gohighlevel','highlevel','go high level'],name:'GoHighLevel',category:'Software'},
  {keywords:['constant contact','constantcontact'],name:'Constant Contact',category:'Software'},
  {keywords:['convertkit'],name:'ConvertKit',category:'Software'},
  {keywords:['klaviyo'],name:'Klaviyo',category:'Software'},
  {keywords:['calendly'],name:'Calendly',category:'Software'},
  {keywords:['hootsuite'],name:'Hootsuite',category:'Software'},
  {keywords:['buffer'],name:'Buffer',category:'Software'},
  {keywords:['zapier'],name:'Zapier',category:'Software'},
  {keywords:['monday.com','monday com'],name:'Monday.com',category:'Software'},
  {keywords:['asana'],name:'Asana',category:'Software'},
  {keywords:['clickup'],name:'ClickUp',category:'Software'},
  {keywords:['freshbooks'],name:'FreshBooks',category:'Software'},
  {keywords:['gusto'],name:'Gusto',category:'Software'},
  {keywords:['docusign'],name:'DocuSign',category:'Software'},
  // Photo & Design
  {keywords:['lightroom','adobe lightroom'],name:'Adobe Lightroom',category:'Software'},
  {keywords:['shutterstock'],name:'Shutterstock',category:'Software'},
  {keywords:['envato'],name:'Envato',category:'Software'},
  {keywords:['picmonkey'],name:'PicMonkey',category:'Software'},
  {keywords:['visme'],name:'Visme',category:'Software'},
  // Education
  {keywords:['udemy'],name:'Udemy',category:'Education'},
  {keywords:['linkedin learning'],name:'LinkedIn Learning',category:'Education'},
  {keywords:['rosetta stone','rosettastone'],name:'Rosetta Stone',category:'Education'},
  {keywords:['chegg'],name:'Chegg',category:'Education'},
  {keywords:['italki'],name:'iTalki',category:'Education'},
  // Health & Wellness
  {keywords:['teladoc'],name:'Teladoc',category:'Fitness'},
  {keywords:['mdlive'],name:'MDLive',category:'Fitness'},
  {keywords:['weight watchers','weightwatchers','ww.com'],name:'WW (Weight Watchers)',category:'Fitness'},
  {keywords:['daily burn','dailyburn'],name:'Daily Burn',category:'Fitness'},
  // Shopping & Boxes
  {keywords:['walmart plus','walmart+'],name:'Walmart+',category:'Other'},
  {keywords:['sams club','sam's club'],name:"Sam's Club",category:'Other'},
  {keywords:['fabfitfun'],name:'FabFitFun',category:'Other'},
  {keywords:['thrive market','thrivemarket'],name:'Thrive Market',category:'Other'},
  {keywords:['sunbasket'],name:'Sunbasket',category:'Food / Delivery'},
  {keywords:['green chef','greenchef'],name:'Green Chef',category:'Food / Delivery'},
  {keywords:['gobble'],name:'Gobble',category:'Food / Delivery'},
  // Entertainment
  {keywords:['crunchyroll'],name:'Crunchyroll',category:'Streaming'},
  {keywords:['shudder'],name:'Shudder',category:'Streaming'},
  {keywords:['britbox'],name:'BritBox',category:'Streaming'},
  {keywords:['acorn tv','acorntv'],name:'Acorn TV',category:'Streaming'},
  {keywords:['amc+','amc plus'],name:'AMC+',category:'Streaming'},
  {keywords:['mubi'],name:'Mubi',category:'Streaming'},
  // Finance
  {keywords:['ynab','you need a budget'],name:'YNAB',category:'Software'},
  {keywords:['acorns'],name:'Acorns',category:'Software'},
  {keywords:['robinhood gold'],name:'Robinhood Gold',category:'Software'},
  // Communication
  {keywords:['google workspace','gsuite','g suite'],name:'Google Workspace',category:'Software'},
  {keywords:['grasshopper'],name:'Grasshopper',category:'Software'},
  {keywords:['ringcentral'],name:'RingCentral',category:'Software'},
  {keywords:['openphone'],name:'OpenPhone',category:'Software'},
  {keywords:['nextiva'],name:'Nextiva',category:'Software'},
  {keywords:['magicjack'],name:'MagicJack',category:'Software'},
  {keywords:['ooma'],name:'Ooma',category:'Software'},
  // Security & Privacy
  {keywords:['bitdefender'],name:'Bitdefender',category:'Software'},
  {keywords:['malwarebytes'],name:'Malwarebytes',category:'Software'},
  // Auto & Travel
  {keywords:['onstar'],name:'OnStar',category:'Other'},
  {keywords:['aaa'],name:'AAA',category:'Other'},
  {keywords:['clear'],name:'CLEAR',category:'Other'},
  {keywords:['tripit'],name:'TripIt Pro',category:'Other'},
];

// ── Known Fixed Bills Database ────────────────────────────────
const KNOWN_FIXED_BILLS = [
  // Mortgage
  {keywords:['us bank mortgage','usbank mortgage','us bank home'],name:'US Bank Mortgage',category:'Mortgage / rent'},
  {keywords:['rocket mortgage','quicken loans'],name:'Rocket Mortgage',category:'Mortgage / rent'},
  {keywords:['mr cooper','nationstar'],name:'Mr. Cooper Mortgage',category:'Mortgage / rent'},
  {keywords:['wells fargo home','wells fargo mortgage'],name:'Wells Fargo Mortgage',category:'Mortgage / rent'},
  {keywords:['chase mortgage','jpmorgan mortgage'],name:'Chase Mortgage',category:'Mortgage / rent'},
  {keywords:['loandepot'],name:'LoanDepot',category:'Mortgage / rent'},
  {keywords:['freedom mortgage'],name:'Freedom Mortgage',category:'Mortgage / rent'},
  {keywords:['pennymac'],name:'PennyMac',category:'Mortgage / rent'},
  {keywords:['caliber home'],name:'Caliber Home Loans',category:'Mortgage / rent'},
  {keywords:['newrez'],name:'NewRez Mortgage',category:'Mortgage / rent'},
  {keywords:['phh mortgage'],name:'PHH Mortgage',category:'Mortgage / rent'},
  // Electric
  {keywords:['evergy'],name:'Evergy Electric',category:'Electric bill'},
  {keywords:['duke energy'],name:'Duke Energy',category:'Electric bill'},
  {keywords:['comed'],name:'ComEd Electric',category:'Electric bill'},
  {keywords:['georgia power'],name:'Georgia Power',category:'Electric bill'},
  {keywords:['dominion energy'],name:'Dominion Energy',category:'Electric bill'},
  {keywords:['xcel energy'],name:'Xcel Energy',category:'Electric bill'},
  {keywords:['fpl','florida power'],name:'FPL Electric',category:'Electric bill'},
  {keywords:['entergy'],name:'Entergy',category:'Electric bill'},
  {keywords:['aep','american electric power'],name:'AEP Electric',category:'Electric bill'},
  {keywords:['ameren'],name:'Ameren Electric',category:'Electric bill'},
  {keywords:['eversource'],name:'Eversource Energy',category:'Electric bill'},
  {keywords:['national grid'],name:'National Grid',category:'Electric bill'},
  {keywords:['pge','pg&e','pacific gas'],name:'PG&E',category:'Electric bill'},
  {keywords:['puget sound energy'],name:'Puget Sound Energy',category:'Electric bill'},
  {keywords:['srp','salt river project'],name:'SRP Electric',category:'Electric bill'},
  // Gas/Heat
  {keywords:['atmos energy','atmos'],name:'Atmos Energy',category:'Gas / heat bill'},
  {keywords:['spire gas','spire mo'],name:'Spire Gas',category:'Gas / heat bill'},
  {keywords:['centerpoint','center point'],name:'CenterPoint Energy',category:'Gas / heat bill'},
  {keywords:['peoples gas','peoples natural'],name:'Peoples Gas',category:'Gas / heat bill'},
  {keywords:['nicor gas','nicor'],name:'Nicor Gas',category:'Gas / heat bill'},
  {keywords:['laclede gas'],name:'Laclede Gas',category:'Gas / heat bill'},
  {keywords:['southwest gas'],name:'Southwest Gas',category:'Gas / heat bill'},
  // Internet
  {keywords:['google fiber','googlefiber'],name:'Google Fiber',category:'Internet'},
  {keywords:['xfinity','comcast'],name:'Xfinity/Comcast',category:'Internet'},
  {keywords:['spectrum','charter'],name:'Spectrum Internet',category:'Internet'},
  {keywords:['att fiber','at&t fiber','att internet'],name:'AT&T Fiber',category:'Internet'},
  {keywords:['cox communications','cox cable'],name:'Cox Internet',category:'Internet'},
  {keywords:['centurylink','lumen'],name:'CenturyLink',category:'Internet'},
  {keywords:['wow internet','wowway'],name:'WOW Internet',category:'Internet'},
  {keywords:['mediacom'],name:'Mediacom',category:'Internet'},
  {keywords:['starlink'],name:'Starlink',category:'Internet'},
  {keywords:['earthlink'],name:'EarthLink',category:'Internet'},
  {keywords:['hughesnet'],name:'HughesNet',category:'Internet'},
  // Phone
  {keywords:['at&t','att wireless','att mobility'],name:'AT&T Wireless',category:'Phone bill'},
  {keywords:['verizon wireless','verizon'],name:'Verizon Wireless',category:'Phone bill'},
  {keywords:['t-mobile','tmobile'],name:'T-Mobile',category:'Phone bill'},
  {keywords:['metro pcs','metropcs','metro by t'],name:'Metro PCS',category:'Phone bill'},
  {keywords:['cricket wireless','cricket'],name:'Cricket Wireless',category:'Phone bill'},
  {keywords:['boost mobile','boostmobile'],name:'Boost Mobile',category:'Phone bill'},
  {keywords:['us cellular','uscellular'],name:'US Cellular',category:'Phone bill'},
  {keywords:['consumer cellular'],name:'Consumer Cellular',category:'Phone bill'},
  {keywords:['mint mobile','mintmobile'],name:'Mint Mobile',category:'Phone bill'},
  // Auto Loans
  {keywords:['toyota financial','toyota motor credit'],name:'Toyota Financial',category:'Car payment'},
  {keywords:['honda financial','american honda finance'],name:'Honda Financial',category:'Car payment'},
  {keywords:['ford credit','ford motor credit'],name:'Ford Motor Credit',category:'Car payment'},
  {keywords:['gm financial','gmfinancial'],name:'GM Financial',category:'Car payment'},
  {keywords:['ally auto','ally financial'],name:'Ally Auto',category:'Car payment'},
  {keywords:['capital one auto'],name:'Capital One Auto',category:'Car payment'},
  {keywords:['chrysler capital'],name:'Chrysler Capital',category:'Car payment'},
  {keywords:['hyundai motor finance'],name:'Hyundai Motor Finance',category:'Car payment'},
  {keywords:['kia motors finance','kia finance'],name:'Kia Motors Finance',category:'Car payment'},
  {keywords:['nissan motor','nmac'],name:'Nissan Motor Finance',category:'Car payment'},
  {keywords:['subaru motors','subaru finance'],name:'Subaru Motors Finance',category:'Car payment'},
  {keywords:['carmax auto'],name:'CarMax Auto Finance',category:'Car payment'},
  {keywords:['community america','communityamerica'],name:'Community America Auto',category:'Car payment'},
  // Student Loans
  {keywords:['navient'],name:'Navient Student Loan',category:'Student loan'},
  {keywords:['sallie mae','salliemae'],name:'Sallie Mae',category:'Student loan'},
  {keywords:['nelnet'],name:'Nelnet Student Loan',category:'Student loan'},
  {keywords:['fedloan','fed loan'],name:'FedLoan Servicing',category:'Student loan'},
  {keywords:['mohela'],name:'MOHELA Student Loan',category:'Student loan'},
  {keywords:['edfinancial'],name:'EdFinancial',category:'Student loan'},
  {keywords:['great lakes','greatlakes'],name:'Great Lakes Loans',category:'Student loan'},
  // Credit Cards
  {keywords:['chase card','chase sapphire','chase freedom'],name:'Chase Credit Card',category:'Credit card payment'},
  {keywords:['bank of america card','bofa card'],name:'Bank of America Card',category:'Credit card payment'},
  {keywords:['citi card','citibank card','citicard'],name:'Citi Credit Card',category:'Credit card payment'},
  {keywords:['capital one card','capital one payment'],name:'Capital One Card',category:'Credit card payment'},
  {keywords:['discover card','discover payment'],name:'Discover Card',category:'Credit card payment'},
  {keywords:['american express','amex'],name:'American Express',category:'Credit card payment'},
  {keywords:['synchrony','synchrony bank'],name:'Synchrony Bank',category:'Credit card payment'},
  {keywords:['barclays'],name:'Barclays Card',category:'Credit card payment'},
  {keywords:['wells fargo card','wells fargo visa'],name:'Wells Fargo Card',category:'Credit card payment'},
  {keywords:['community america credit','communityamerica credit'],name:'Community America Credit Card',category:'Credit card payment'},
  // Insurance
  {keywords:['primerica life','primerica insurance'],name:'Primerica Life Insurance',category:'Life insurance'},
  {keywords:['primerica invest','primerica financial'],name:'Primerica Investments',category:'Other insurance'},
  {keywords:['state farm'],name:'State Farm Insurance',category:'Auto insurance'},
  {keywords:['allstate'],name:'Allstate Insurance',category:'Auto insurance'},
  {keywords:['geico'],name:'Geico Insurance',category:'Auto insurance'},
  {keywords:['progressive'],name:'Progressive Insurance',category:'Auto insurance'},
  {keywords:['usaa'],name:'USAA Insurance',category:'Auto insurance'},
  {keywords:['farmers insurance','farmers'],name:'Farmers Insurance',category:'Auto insurance'},
  {keywords:['liberty mutual'],name:'Liberty Mutual',category:'Auto insurance'},
  {keywords:['nationwide'],name:'Nationwide Insurance',category:'Auto insurance'},
  {keywords:['travelers'],name:'Travelers Insurance',category:'Auto insurance'},
  {keywords:['erie insurance'],name:'Erie Insurance',category:'Auto insurance'},
  {keywords:['metlife'],name:'MetLife Insurance',category:'Life insurance'},
  {keywords:['new york life','newyorklife'],name:'New York Life',category:'Life insurance'},
  {keywords:['northwestern mutual'],name:'Northwestern Mutual',category:'Life insurance'},
  {keywords:['aflac'],name:'Aflac Insurance',category:'Health insurance'},
  {keywords:['cigna'],name:'Cigna Health',category:'Health insurance'},
  {keywords:['unitedhealth','united health','uhc'],name:'UnitedHealth',category:'Health insurance'},
  {keywords:['anthem'],name:'Anthem Health',category:'Health insurance'},
  {keywords:['blue cross','bluecross','bcbs'],name:'Blue Cross Blue Shield',category:'Health insurance'},
  {keywords:['humana'],name:'Humana',category:'Health insurance'},
  {keywords:['aetna'],name:'Aetna Health',category:'Health insurance'},
  // Government/Tax
  {keywords:['irs','internal revenue'],name:'IRS Payment',category:'Other'},
  {keywords:['state tax','dept of revenue','department of revenue'],name:'State Tax Payment',category:'Other'},
  {keywords:['county tax','property tax'],name:'Property Tax',category:'Other'},
  // Water
  {keywords:['kansas city water','kc water'],name:'Kansas City Water',category:'Water bill'},
  {keywords:['city utilities','city water','municipal water'],name:'City Water Utility',category:'Water bill'},
  {keywords:['water department','water dept'],name:'Water Department',category:'Water bill'},
  // HOA
  {keywords:['hoa','homeowners association','community management','property management'],name:'HOA Payment',category:'HOA fee'},
  // Childcare
  {keywords:['kindercare','kinder care'],name:'KinderCare',category:'Childcare / daycare'},
  {keywords:['bright horizons','brighthorizons'],name:'Bright Horizons',category:'Childcare / daycare'},
  {keywords:['la petite','lapetite'],name:'La Petite Academy',category:'Childcare / daycare'},
  {keywords:['primrose school','primrose'],name:'Primrose Schools',category:'Childcare / daycare'},
  // Gym/Fitness memberships (fixed)
  {keywords:['ymca','the y'],name:'YMCA',category:'Gym membership'},
  {keywords:['lifetime fitness','life time'],name:'Life Time Fitness',category:'Gym membership'},
];

function detectFixedBills(transactions){
  const found=[];
  const seen=new Set();
  transactions.forEach(tx=>{
    if(tx.type!=='debit')return;
    const desc=(tx.desc||'').toLowerCase();
    KNOWN_FIXED_BILLS.forEach(bill=>{
      const match=bill.keywords.some(kw=>desc.includes(kw.toLowerCase()));
      if(match&&!seen.has(bill.name)){
        seen.add(bill.name);
        found.push({
          id:Date.now()+Math.random(),
          name:bill.name,
          amount:tx.amt,
          dueDay:new Date(tx.date+'T00:00:00').getDate()||1,
          category:bill.category,
          autopay:false,
          createdAt:new Date().toISOString(),
          detected:true,
        });
      }
    });
  });
  return found;
}


function detectSubscriptions(transactions){
  const found=[];
  const seen=new Set();
  transactions.forEach(tx=>{
    if(tx.type!=='debit')return;
    const desc=(tx.desc||'').toLowerCase();
    KNOWN_SUBSCRIPTIONS.forEach(sub=>{
      const match=sub.keywords.some(kw=>desc.includes(kw.toLowerCase()));
      if(match&&!seen.has(sub.name)){
        seen.add(sub.name);
        found.push({
          id:Date.now()+Math.random(),
          name:sub.name,
          amount:tx.amt,
          cycle:'monthly',
          category:sub.category,
          dueDay:new Date(tx.date+'T00:00:00').getDate()||1,
          autopay:true,
          subsPaid:{},
          detected:true,
        });
      }
    });
  });
  return found;
}


function DropZone({onFile}){
  const [dragging,setDragging]=useState(false);
  const id='csv-file-input-'+Math.random().toString(36).slice(2);

  const handleDrop=e=>{
    e.preventDefault();
    setDragging(false);
    const file=e.dataTransfer.files[0];
    if(file&&(file.name.endsWith('.csv')||file.type==='text/csv')){
      const event={target:{files:[file]}};
      onFile(event);
    } else {
      alert('Please drop a CSV file.');
    }
  };

  const handleDragOver=e=>{e.preventDefault();e.stopPropagation();setDragging(true);};
  const handleDragLeave=e=>{e.preventDefault();setDragging(false);};

  return(
    <label
      htmlFor="csv-upload"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        display:'block',
        background:dragging?'rgba(26,111,212,0.1)':'#f8faff',
        border:`2px dashed ${dragging?'#1a6fd4':'#c7ddf7'}`,
        borderRadius:'var(--radius-lg)',
        padding:'2.5rem 2rem',
        textAlign:'center',
        marginBottom:'1.25rem',
        cursor:'pointer',
        transition:'all 0.2s',
        transform:dragging?'scale(1.01)':'scale(1)',
      }}
    >
      <div style={{fontSize:40,marginBottom:10}}>{dragging?'📂':'⬆️'}</div>
      <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:15,color:'#1a6fd4',marginBottom:6}}>
        {dragging?'Drop your CSV file here!':'Drag & drop your CSV file here'}
      </div>
      <div style={{fontSize:12,color:'#6b8dc4',marginBottom:10}}>or</div>
      <div style={{display:'inline-block',background:'linear-gradient(135deg,#1a6fd4,#5ba3f5)',color:'#fff',fontFamily:'var(--font-display)',fontWeight:700,fontSize:12,padding:'8px 20px',borderRadius:'var(--radius-md)',pointerEvents:'none'}}>
        Browse files
      </div>
      <div style={{fontSize:11,color:'#6b8dc4',marginTop:10}}>Supports CSV files from any bank</div>
      <input id="csv-upload" type="file" accept=".csv,text/csv" onChange={onFile} style={{display:'none'}}/>
    </label>
  );
}


function CSVImportModal({onImport,onCancel,existingTransactions,accounts,defaultAccount,onAddSubscriptions,onAddFixedBills}){
  const [step,setStep]=useState('upload'); // upload | map | preview | subs | bills | done
  const [rawRows,setRawRows]=useState([]);
  const [headers,setHeaders]=useState([]);
  const [mapping,setMapping]=useState({date:'',description:'',amount:'',debit:'',credit:''});
  const [mappingType,setMappingType]=useState('single'); // single=one amount col, split=debit+credit cols
  const [preview,setPreview]=useState([]);
  const [duplicates,setDuplicates]=useState(0);
  const [importing,setImporting]=useState(false);
  const [fileName,setFileName]=useState('');
  const [selectedAccount,setSelectedAccount]=useState(defaultAccount||Object.keys(accounts||{})[0]||'main');
  const [detectedSubs,setDetectedSubs]=useState([]);
  const [selectedSubIds,setSelectedSubIds]=useState([]);
  const [subTargetAccount,setSubTargetAccount]=useState(defaultAccount||'main');
  const [detectedBills,setDetectedBills]=useState([]);
  const [selectedBillIds,setSelectedBillIds]=useState([]);
  const [billTargetAccount,setBillTargetAccount]=useState(defaultAccount||'main');

  const parseCSV=(text)=>{
    const lines=text.split(/\r?\n/).filter(l=>l.trim());
    const headers=lines[0].split(',').map(h=>h.replace(/"/g,'').trim());
    const rows=lines.slice(1).map(line=>{
      const cols=[];let cur='';let inQ=false;
      for(let i=0;i<line.length;i++){
        if(line[i]==='"'){inQ=!inQ;}
        else if(line[i]===','&&!inQ){cols.push(cur.trim());cur='';}
        else cur+=line[i];
      }
      cols.push(cur.trim());
      return cols;
    }).filter(r=>r.length>1&&r.some(c=>c.trim()));
    return{headers,rows};
  };

  const handleFile=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    setFileName(file.name);
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const{headers,rows}=parseCSV(ev.target.result);
      setHeaders(headers);
      setRawRows(rows);
      // Auto-detect common column names
      const lower=headers.map(h=>h.toLowerCase());
      const autoMap={date:'',description:'',amount:'',debit:'',credit:''};
      headers.forEach((h,i)=>{
        const l=h.toLowerCase();
        if(l.includes('date'))autoMap.date=h;
        if(l.includes('desc')||l.includes('memo')||l.includes('narr')||l.includes('payee')||l.includes('transaction'))autoMap.description=h;
        if(l.includes('amount')&&!l.includes('debit')&&!l.includes('credit'))autoMap.amount=h;
        if(l.includes('debit')||l.includes('withdrawal'))autoMap.debit=h;
        if(l.includes('credit')||l.includes('deposit'))autoMap.credit=h;
      });
      // Detect if split debit/credit
      if(autoMap.debit&&autoMap.credit){setMappingType('split');}
      setMapping(autoMap);
      setStep('map');
    };
    reader.readAsText(file);
  };

  const buildPreview=()=>{
    const results=[];
    rawRows.forEach((row,idx)=>{
      const getValue=(col)=>{
        const i=headers.indexOf(col);
        return i>=0?(row[i]||'').replace(/"/g,'').trim():'';
      };
      const dateStr=getValue(mapping.date);
      const desc=getValue(mapping.description);
      if(!dateStr||!desc)return;
      // Parse date
      let date='';
      const d=new Date(dateStr);
      if(!isNaN(d.getTime())){
        date=d.toISOString().split('T')[0];
      } else {
        // Try MM/DD/YYYY
        const parts=dateStr.split(/[\/\-\.]/);
        if(parts.length===3){
          const yr=parts[2].length===4?parts[2]:'20'+parts[2];
          date=`${yr}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`;
        }
      }
      if(!date)return;
      let amt=0;let type='debit';
      if(mappingType==='split'){
        const deb=parseFloat(getValue(mapping.debit).replace(/[$,]/g,''))||0;
        const cred=parseFloat(getValue(mapping.credit).replace(/[$,]/g,''))||0;
        if(cred>0){amt=cred;type='credit';}
        else if(deb>0){amt=deb;type='debit';}
        else return;
      } else {
        const raw=parseFloat(getValue(mapping.amount).replace(/[$,]/g,''))||0;
        if(raw===0)return;
        if(raw<0){amt=Math.abs(raw);type='debit';}
        else{amt=raw;type='credit';}
      }
      // Duplicate check
      const isDup=existingTransactions.some(t=>t.date===date&&Math.abs(t.amt-amt)<0.01&&t.desc.toLowerCase()===desc.toLowerCase());
      results.push({id:Date.now()+idx,date,desc,amt,type,grp:'',cat:'',note:'',refNum:'',recurring:'none',isDup});
    });
    const dups=results.filter(r=>r.isDup).length;
    setDuplicates(dups);
    setPreview(results);
    setStep('preview');
  };

  const handleImport=()=>{
    setImporting(true);
    const toImport=preview.filter(r=>!r.isDup).map(({isDup,...r})=>r);
    setTimeout(()=>{
      onImport(toImport,selectedAccount);
      // Detect subscriptions from imported transactions
      const detectedS=detectSubscriptions(toImport);
      const detectedB=detectFixedBills(toImport);
      if(detectedS.length>0){
        setDetectedSubs(detectedS);
        setSelectedSubIds(detectedS.map(s=>s.id));
        setSubTargetAccount(selectedAccount||defaultAccount||'main');
        setDetectedBills(detectedB);
        setSelectedBillIds(detectedB.map(b=>b.id));
        setBillTargetAccount(selectedAccount||defaultAccount||'main');
        setImporting(false);
        setStep('subs');
      } else if(detectedB.length>0){
        setDetectedBills(detectedB);
        setSelectedBillIds(detectedB.map(b=>b.id));
        setBillTargetAccount(selectedAccount||defaultAccount||'main');
        setImporting(false);
        setStep('bills');
      } else {
        setStep('done');
        setImporting(false);
      }
    },500);
  };

  return(
    <div className="modal-overlay" style={{zIndex:3000}} onClick={e=>e.target===e.currentTarget&&onCancel()}>
      <div className="modal-box slide-up" style={{maxWidth:580,maxHeight:'85vh',overflow:'auto'}}>
        
        {step==='upload'&&(
          <>
            <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
              <div style={{fontSize:40,marginBottom:10}}>📂</div>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:22,marginBottom:8,color:'#0f2a5e'}}>Import Bank Statement</h2>
              <p style={{fontSize:13,color:'#6b8dc4',lineHeight:1.6}}>Download your bank statement as a CSV file and upload it here. MoneyMap will automatically read your transactions.</p>
            </div>
            <DropZone onFile={handleFile} />
            <div style={{background:'rgba(26,111,212,0.06)',border:'1px solid rgba(26,111,212,0.15)',borderRadius:'var(--radius-md)',padding:'12px 14px',marginBottom:'1.25rem'}}>
              <div style={{fontSize:12,fontWeight:600,color:'#1a6fd4',marginBottom:6}}>💡 How to get your CSV file:</div>
              <div style={{fontSize:12,color:'#2d5a9e',lineHeight:1.8}}>
                Log into your bank → Statements or Transaction History → Download → Choose CSV format
              </div>
            </div>
            <button className="btn-outline" style={{width:'100%'}} onClick={onCancel}>Cancel</button>
          </>
        )}

        {step==='map'&&(
          <>
            <div style={{marginBottom:'1.25rem'}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:6,color:'#0f2a5e'}}>Map Your Columns</h2>
              <p style={{fontSize:13,color:'#6b8dc4'}}>File: <strong>{fileName}</strong> — {rawRows.length} rows found. Tell us which columns contain your data.</p>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4,fontWeight:500}}>Amount format</label>
              <div style={{display:'flex',gap:10,marginBottom:12}}>
                <button onClick={()=>setMappingType('single')} style={{flex:1,padding:'8px',fontSize:12,fontWeight:600,borderRadius:'var(--radius-md)',border:`1px solid ${mappingType==='single'?'#1a6fd4':'#c7ddf7'}`,background:mappingType==='single'?'rgba(26,111,212,0.1)':'transparent',color:mappingType==='single'?'#1a6fd4':'#6b8dc4',cursor:'pointer'}}>
                  Single amount column
                </button>
                <button onClick={()=>setMappingType('split')} style={{flex:1,padding:'8px',fontSize:12,fontWeight:600,borderRadius:'var(--radius-md)',border:`1px solid ${mappingType==='split'?'#1a6fd4':'#c7ddf7'}`,background:mappingType==='split'?'rgba(26,111,212,0.1)':'transparent',color:mappingType==='split'?'#1a6fd4':'#6b8dc4',cursor:'pointer'}}>
                  Separate debit/credit columns
                </button>
              </div>
            </div>
            {[
              {key:'date',label:'Date column'},
              {key:'description',label:'Description column'},
              ...(mappingType==='single'?[{key:'amount',label:'Amount column'}]:[{key:'debit',label:'Debit / Withdrawal column'},{key:'credit',label:'Credit / Deposit column'}])
            ].map(({key,label})=>(
              <div key={key} style={{marginBottom:10}}>
                <label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4,fontWeight:500}}>{label}</label>
                <select value={mapping[key]} onChange={e=>setMapping(m=>({...m,[key]:e.target.value}))}>
                  <option value="">-- Select column --</option>
                  {headers.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
            <div style={{display:'flex',gap:10,marginTop:'1.25rem'}}>
              <button className="btn-outline" style={{flex:1}} onClick={()=>setStep('upload')}>← Back</button>
              <button className="btn-gold" style={{flex:1}} onClick={buildPreview} disabled={!mapping.date||!mapping.description}>
                Preview Transactions →
              </button>
            </div>
          </>
        )}

        {step==='preview'&&(
          <>
            <div style={{marginBottom:'1rem'}}>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:6,color:'#0f2a5e'}}>Preview Import</h2>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <span style={{background:'rgba(22,163,74,0.1)',color:'#16a34a',fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:10}}>{preview.filter(r=>!r.isDup).length} to import</span>
                {duplicates>0&&<span style={{background:'rgba(217,119,6,0.1)',color:'#d97706',fontSize:12,fontWeight:600,padding:'3px 10px',borderRadius:10}}>{duplicates} duplicates skipped</span>}
              </div>
            </div>
            <div style={{maxHeight:300,overflow:'auto',border:'1px solid #c7ddf7',borderRadius:'var(--radius-md)',marginBottom:'1rem'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{position:'sticky',top:0,background:'#f8faff'}}>
                  <th style={{padding:'8px 10px',textAlign:'left',color:'#6b8dc4',fontWeight:600}}>Date</th>
                  <th style={{padding:'8px 10px',textAlign:'left',color:'#6b8dc4',fontWeight:600}}>Description</th>
                  <th style={{padding:'8px 10px',textAlign:'right',color:'#6b8dc4',fontWeight:600}}>Amount</th>
                  <th style={{padding:'8px 10px',textAlign:'center',color:'#6b8dc4',fontWeight:600}}>Type</th>
                  <th style={{padding:'8px 10px',textAlign:'center',color:'#6b8dc4',fontWeight:600}}>Status</th>
                </tr></thead>
                <tbody>
                  {preview.map((row,i)=>(
                    <tr key={i} style={{opacity:row.isDup?0.4:1,background:row.isDup?'#fff8f0':'transparent'}}>
                      <td style={{padding:'7px 10px',color:'#2d5a9e'}}>{new Date(row.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                      <td style={{padding:'7px 10px',color:'#0f2a5e',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.desc}</td>
                      <td style={{padding:'7px 10px',textAlign:'right',fontWeight:600,color:row.type==='credit'?'#16a34a':'#dc2626'}}>${row.amt.toFixed(2)}</td>
                      <td style={{padding:'7px 10px',textAlign:'center'}}><span style={{fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:8,background:row.type==='credit'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.1)',color:row.type==='credit'?'#16a34a':'#dc2626'}}>{row.type}</span></td>
                      <td style={{padding:'7px 10px',textAlign:'center'}}>{row.isDup?<span style={{fontSize:10,color:'#d97706',fontWeight:600}}>DUPLICATE</span>:<span style={{fontSize:10,color:'#16a34a',fontWeight:600}}>NEW</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {accounts&&Object.keys(accounts).length>1&&(
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:6,fontWeight:500}}>Import into which account?</label>
                <select value={selectedAccount} onChange={e=>setSelectedAccount(e.target.value)}>
                  {Object.entries(accounts).map(([key,acct])=>(
                    <option key={key} value={key}>{acct.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{display:'flex',gap:10}}>
              <button className="btn-outline" style={{flex:1}} onClick={()=>setStep('map')}>← Back</button>
              <button className="btn-gold" style={{flex:1}} onClick={handleImport} disabled={importing||preview.filter(r=>!r.isDup).length===0}>
                {importing?'Importing…':'Import '+preview.filter(r=>!r.isDup).length+' Transactions'}
              </button>
            </div>
          </>
        )}

        {step==='subs'&&(
          <>
            <div style={{textAlign:'center',marginBottom:'1.25rem'}}>
              <div style={{fontSize:40,marginBottom:10}}>📱</div>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:6,color:'#0f2a5e'}}>Subscriptions Detected!</h2>
              <p style={{fontSize:13,color:'#6b8dc4',lineHeight:1.6}}>We found <strong style={{color:'#7c3aed'}}>{detectedSubs.length} possible subscription{detectedSubs.length!==1?'s':''}</strong> in your import. Select which ones to add to your Subscriptions tab.</p>
            </div>
            <div style={{maxHeight:280,overflow:'auto',marginBottom:'1rem'}}>
              {detectedSubs.map(sub=>(
                <div key={sub.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:selectedSubIds.includes(sub.id)?'rgba(124,58,237,0.06)':'#f8faff',border:`1px solid ${selectedSubIds.includes(sub.id)?'rgba(124,58,237,0.2)':'#c7ddf7'}`,borderRadius:'var(--radius-md)',marginBottom:6,cursor:'pointer'}} onClick={()=>setSelectedSubIds(s=>s.includes(sub.id)?s.filter(i=>i!==sub.id):[...s,sub.id])}>
                  <input type="checkbox" checked={selectedSubIds.includes(sub.id)} onChange={()=>{}} style={{width:15,height:15,accentColor:'#7c3aed',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,color:'#0f2a5e'}}>{sub.name}</div>
                    <div style={{fontSize:11,color:'#6b8dc4'}}>{sub.category} · due {sub.dueDay}{['th','st','nd','rd'][sub.dueDay%10]||'th'} · ⚡ Autopay</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:13,color:'#7c3aed',flexShrink:0}}>${sub.amount.toFixed(2)}/mo</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <button className="btn-outline" style={{fontSize:11,flex:1}} onClick={()=>{setSelectedSubIds(detectedSubs.map(s=>s.id));}}>Select all</button>
              <button className="btn-outline" style={{fontSize:11,flex:1}} onClick={()=>setSelectedSubIds([])}>Deselect all</button>
            </div>
            {accounts&&Object.keys(accounts).length>1&&(
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:6,fontWeight:500}}>Add subscriptions to which account?</label>
                <select value={subTargetAccount} onChange={e=>setSubTargetAccount(e.target.value)}>
                  {Object.entries(accounts).map(([key,acct])=>(
                    <option key={key} value={key}>{acct.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{display:'flex',gap:10}}>
              <button className="btn-outline" style={{flex:1}} onClick={()=>{if(detectedBills.length>0)setStep('bills');else setStep('done');}}>Skip</button>
              <button className="btn-gold" style={{flex:1,background:'linear-gradient(135deg,#7c3aed,#a78bfa)'}} onClick={()=>{
                const toAdd=detectedSubs.filter(s=>selectedSubIds.includes(s.id)).map(({detected,...s})=>s);
                onAddSubscriptions&&onAddSubscriptions(toAdd,subTargetAccount||selectedAccount);
                if(detectedBills.length>0) setStep('bills');
                else setStep('done');
              }}>
                Add {selectedSubIds.length} Subscription{selectedSubIds.length!==1?'s':''}
              </button>
            </div>
          </>
        )}
        {step==='bills'&&(
          <>
            <div style={{textAlign:'center',marginBottom:'1.25rem'}}>
              <div style={{fontSize:40,marginBottom:10}}>🗓</div>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:6,color:'#0f2a5e'}}>Fixed Bills Detected!</h2>
              <p style={{fontSize:13,color:'#6b8dc4',lineHeight:1.6}}>We found <strong style={{color:'#1a6fd4'}}>{detectedBills.length} possible fixed bill{detectedBills.length!==1?'s':''}</strong> in your import. Select which ones to add to your Bills tab.</p>
            </div>
            <div style={{maxHeight:280,overflow:'auto',marginBottom:'1rem'}}>
              {detectedBills.map(bill=>(
                <div key={bill.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:selectedBillIds.includes(bill.id)?'rgba(26,111,212,0.06)':'#f8faff',border:`1px solid ${selectedBillIds.includes(bill.id)?'rgba(26,111,212,0.2)':'#c7ddf7'}`,borderRadius:'var(--radius-md)',marginBottom:6,cursor:'pointer'}} onClick={()=>setSelectedBillIds(s=>s.includes(bill.id)?s.filter(i=>i!==bill.id):[...s,bill.id])}>
                  <input type="checkbox" checked={selectedBillIds.includes(bill.id)} onChange={()=>{}} style={{width:15,height:15,accentColor:'#1a6fd4',flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:'var(--font-display)',fontSize:13,fontWeight:700,color:'#0f2a5e'}}>{bill.name}</div>
                    <div style={{fontSize:11,color:'#6b8dc4'}}>{bill.category} · due {bill.dueDay}{['th','st','nd','rd'][bill.dueDay%10]||'th'}</div>
                  </div>
                  <div style={{fontWeight:700,fontSize:13,color:'#1a6fd4',flexShrink:0}}>${bill.amount.toFixed(2)}/mo</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              <button className="btn-outline" style={{fontSize:11,flex:1}} onClick={()=>setSelectedBillIds(detectedBills.map(b=>b.id))}>Select all</button>
              <button className="btn-outline" style={{fontSize:11,flex:1}} onClick={()=>setSelectedBillIds([])}>Deselect all</button>
            </div>
            {accounts&&Object.keys(accounts).length>1&&(
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:6,fontWeight:500}}>Add bills to which account?</label>
                <select value={billTargetAccount} onChange={e=>setBillTargetAccount(e.target.value)}>
                  {Object.entries(accounts).map(([key,acct])=>(
                    <option key={key} value={key}>{acct.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{display:'flex',gap:10}}>
              <button className="btn-outline" style={{flex:1}} onClick={()=>setStep('done')}>Skip</button>
              <button className="btn-gold" style={{flex:1}} onClick={()=>{
                const toAdd=detectedBills.filter(b=>selectedBillIds.includes(b.id)).map(({detected,...b})=>b);
                onAddFixedBills&&onAddFixedBills(toAdd,billTargetAccount||selectedAccount);
                setStep('done');
              }}>
                Add {selectedBillIds.length} Bill{selectedBillIds.length!==1?'s':''}
              </button>
            </div>
          </>
        )}
        {step==='done'&&(
          <div style={{textAlign:'center',padding:'1rem 0'}}>
            <div style={{fontSize:52,marginBottom:16}}>🎉</div>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:24,marginBottom:10,color:'#0f2a5e'}}>Import Complete!</h2>
            <p style={{fontSize:14,color:'#6b8dc4',lineHeight:1.7,marginBottom:'1.5rem'}}>Your transactions have been imported successfully. Head to the Register tab to assign categories.</p>
            <button className="btn-gold" style={{width:'100%'}} onClick={onCancel}>Go to my Register 📒</button>
          </div>
        )}
      </div>
    </div>
  );
}


function AddToHomeScreenModal({onClose}){
  return(
    <div className="modal-overlay" style={{zIndex:2500}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box slide-up" style={{maxWidth:460}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:28}}>📱</span>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:19,color:'#0f2a5e'}}>Add App to Your Phone</h2>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#6b8dc4',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>

        <div style={{marginBottom:'1.25rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <span style={{fontSize:18}}>🍎</span>
            <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:14,color:'#0f2a5e'}}>iPhone / Safari</span>
          </div>
          <ol style={{paddingLeft:20,margin:0}}>
            <li style={{fontSize:13,color:'#2d5a9e',lineHeight:1.8,marginBottom:4}}>Open this app in <strong>Safari</strong></li>
            <li style={{fontSize:13,color:'#2d5a9e',lineHeight:1.8,marginBottom:4}}>Tap the <strong>Share button</strong> (box with arrow ⬆️)</li>
            <li style={{fontSize:13,color:'#2d5a9e',lineHeight:1.8,marginBottom:4}}>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li style={{fontSize:13,color:'#2d5a9e',lineHeight:1.8}}>Tap <strong>"Add"</strong> in the top right</li>
          </ol>
        </div>

        <div style={{borderTop:'1px solid #e8f1fd',paddingTop:'1.25rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <span style={{fontSize:18}}>🤖</span>
            <span style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:14,color:'#0f2a5e'}}>Android / Chrome</span>
          </div>
          <ol style={{paddingLeft:20,margin:0}}>
            <li style={{fontSize:13,color:'#2d5a9e',lineHeight:1.8,marginBottom:4}}>Open this app in <strong>Chrome</strong></li>
            <li style={{fontSize:13,color:'#2d5a9e',lineHeight:1.8,marginBottom:4}}>Tap the <strong>three dots menu</strong> (top right ⋮)</li>
            <li style={{fontSize:13,color:'#2d5a9e',lineHeight:1.8,marginBottom:4}}>Tap <strong>"Add to Home screen"</strong></li>
            <li style={{fontSize:13,color:'#2d5a9e',lineHeight:1.8}}>Tap <strong>"Add"</strong></li>
          </ol>
        </div>

        <button className="btn-gold" style={{width:'100%',marginTop:'1.5rem'}} onClick={onClose}>Got it! 👍</button>
      </div>
    </div>
  );
}

function ClearBtn({label,onClear,title,message}){
  const [show,setShow]=useState(false);
  return(
    <>
      {show&&<ClearConfirmModal title={title} message={message} onConfirm={()=>{onClear();setShow(false);}} onCancel={()=>setShow(false)}/>}
      <button onClick={()=>setShow(true)} style={{background:'rgba(220,38,38,0.08)',color:'#dc2626',border:'1px solid rgba(220,38,38,0.2)',borderRadius:'var(--radius-sm)',padding:'4px 10px',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
        🗑 {label}
      </button>
    </>
  );
}


function ClearConfirmModal({title,message,onConfirm,onCancel}){
  const [checked,setChecked]=useState(false);
  return(
    <div className="modal-overlay" style={{zIndex:4000}}>
      <div className="modal-box slide-up" style={{maxWidth:420}}>
        <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
          <div style={{fontSize:40,marginBottom:10}}>⚠️</div>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:8,color:'#0f2a5e'}}>{title}</h2>
          <p style={{fontSize:13,color:'#6b8dc4',lineHeight:1.6}}>{message}</p>
        </div>
        <div style={{background:'#f8faff',borderRadius:'var(--radius-md)',padding:'12px 16px',marginBottom:'1.25rem',border:'1px solid #c7ddf7'}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
            <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} style={{width:16,height:16,flexShrink:0,marginTop:2,accentColor:'#dc2626'}}/>
            <span style={{fontSize:12,color:'#2d5a9e',lineHeight:1.6}}>Yes, I understand — this cannot be undone.</span>
          </label>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-outline" style={{flex:1}} onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm} disabled={!checked} style={{flex:1,background:checked?'#dc2626':'rgba(220,38,38,0.3)',color:'#fff',border:'none',borderRadius:'var(--radius-md)',padding:'12px',fontSize:13,fontWeight:700,cursor:checked?'pointer':'not-allowed',fontFamily:'var(--font-display)',transition:'all 0.2s'}}>
            Yes, clear it
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BudgetApp({ lead, firebaseUser, onSignOut, onDeleteAccount }) {
  const uid = firebaseUser?.uid;
  const [activeAccount, setActiveAccount] = useState('main');
  const [accounts, setAccounts] = useState({ main: { name:'Main Account', transactions:[], debts:[], budgets:{}, beginBal:{amount:0,date:'',set:false}, goals:[], bills:[], billsPaid:{}, extraPayment:'', subscriptions:[] } });
  const [activeTab, setActiveTab] = useState('register');
  const [periodMode, setPeriodMode] = useState('monthly');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [savedMsg, setSavedMsg] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [showCashPopup, setShowCashPopup] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [loading, setLoading] = useState(true);
  const [payBillModal, setPayBillModal] = useState(null);
  const [showResetAccount, setShowResetAccount] = useState(false);
  const [showAddToHome, setShowAddToHome] = useState(false);
  const [showMortgageTip, setShowMortgageTip] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingAccountKey, setEditingAccountKey] = useState(null);
  const [editingAccountName, setEditingAccountName] = useState('');
  const [deleteAccountKey, setDeleteAccountKey] = useState(null);
  const [splitModal, setSplitModal] = useState(null);
  const [budgetResetBanner, setBudgetResetBanner] = useState(false);
  const { showTour, completeTour, resetTour } = useTour();

  useEffect(() => {
    if (!uid) return;
    const timeout = setTimeout(() => { setLoading(false); }, 4000);
    const docRef = doc(db, 'users', uid, 'data', 'budgetData');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      clearTimeout(timeout);
      if (snap.exists()) {
        const data = snap.data();
        if (data.accounts) setAccounts(data.accounts);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore error:', error);
      clearTimeout(timeout);
      setLoading(false);
    });
    return () => { clearTimeout(timeout); unsubscribe(); };
  }, [uid]);

  // Budget reset banner on 1st of month
  useEffect(() => {
    const today = new Date();
    if (today.getDate() === 1) {
      const key = `mm_budget_reset_${uid}_${today.getFullYear()}_${today.getMonth()}`;
      if (!localStorage.getItem(key)) setBudgetResetBanner(true);
    }
  }, [uid]);

  const dismissBudgetBanner = (copy) => {
    const today = new Date();
    const key = `mm_budget_reset_${uid}_${today.getFullYear()}_${today.getMonth()}`;
    localStorage.setItem(key, 'true');
    setBudgetResetBanner(false);
    if (copy) {
      // Copy last month's budgets to this month (they're already there, just confirm)
      alert('Budget limits carried over! Review them in the Budgets tab.');
    }
  };

  const saveToFirebase = async (updatedAccounts) => {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'data', 'budgetData');
      await setDoc(docRef, { accounts: updatedAccounts }, { merge: true });
      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 1800);
    } catch (err) { console.error('Save error:', err); }
  };

  const updateAccount = (field, value, accountKey) => {
    const key = accountKey || activeAccount;
    const updated = { ...accounts, [key]: { ...accounts[key], [field]: value } };
    setAccounts(updated);
    saveToFirebase(updated);
  };

  const acct = accounts[activeAccount] || accounts.main;
  const { transactions, debts, budgets, beginBal, goals, bills, billsPaid, extraPayment, subscriptions } = acct;

  const txs = v => updateAccount('transactions', v);
  const dbs = v => updateAccount('debts', v);
  const bgs = v => updateAccount('budgets', v);
  const bbs = v => updateAccount('beginBal', v);
  const gls = v => updateAccount('goals', v);
  const bls = v => updateAccount('bills', v);
  const bps = v => updateAccount('billsPaid', v);
  const eps = v => updateAccount('extraPayment', v);
  const subs = v => updateAccount('subscriptions', v);

  useEffect(() => {
    const videoId = getYouTubeId(WELCOME_VIDEO_ID);
    if (!videoId) return;
    const watched = localStorage.getItem(`mm_video_${uid}`);
    if (!watched) { const t = setTimeout(() => setShowVideo(true), 800); return () => clearTimeout(t); }
  }, [uid]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'cash' && !localStorage.getItem(`mm_cash_${uid}`)) setShowCashPopup(true);
  };

  const closeCashPopup = () => { localStorage.setItem(`mm_cash_${uid}`, 'true'); setShowCashPopup(false); };
  const closeVideo = () => { localStorage.setItem(`mm_video_${uid}`, 'true'); setShowVideo(false); };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    setShowGoodbye(true);
    setTimeout(async () => { await onDeleteAccount(); }, 2000);
  };

  const addNewAccount = () => {
    if (!newAccountName.trim()) return;
    const key = `account_${Date.now()}`;
    const updated = { ...accounts, [key]: { name:newAccountName.trim(), transactions:[], debts:[], budgets:{}, beginBal:{amount:0,date:'',set:false}, goals:[], bills:[], billsPaid:{}, extraPayment:'', subscriptions:[] } };
    setAccounts(updated);
    saveToFirebase(updated);
    setActiveAccount(key);
    setNewAccountName('');
    setShowAddAccount(false);
  };

  const saveAccountRename = () => {
    if (!editingAccountName.trim()) return;
    const updated = { ...accounts, [editingAccountKey]: { ...accounts[editingAccountKey], name: editingAccountName.trim() } };
    setAccounts(updated);
    saveToFirebase(updated);
    setEditingAccountKey(null);
    setEditingAccountName('');
  };

  const handlePayBill = (bill) => setPayBillModal(bill);

  const handlePayBillConfirm = (selectedAccountKey, deductFromAccount) => {
    const bill = payBillModal;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const key = `${monthKey}_${bill.id}`;
    const updatedBillsPaid = { ...billsPaid, [key]: { paidAt: now.toISOString() } };
    if (deductFromAccount) {
      const targetAcct = accounts[selectedAccountKey];
      const newTx = { id: Date.now(), date: now.toISOString().split('T')[0], desc: bill.name, type: 'debit', grp: 'Housing', cat: bill.category || 'Other', amt: bill.amount, note: '', refNum: '' };
      const updatedTxs = [newTx, ...(targetAcct.transactions || [])];
      updatedTxs.sort((a,b) => b.date.localeCompare(a.date) || b.id - a.id);
      const updated = { ...accounts, [activeAccount]: { ...accounts[activeAccount], billsPaid: updatedBillsPaid }, [selectedAccountKey]: { ...accounts[selectedAccountKey], transactions: updatedTxs } };
      setAccounts(updated);
      saveToFirebase(updated);
    } else {
      updateAccount('billsPaid', updatedBillsPaid);
    }
    setPayBillModal(null);
  };

  const handleUnpayBill = (billId) => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const key = `${monthKey}_${billId}`;
    const updated = { ...billsPaid };
    delete updated[key];
    updateAccount('billsPaid', updated);
  };

  const firstName = lead?.name?.split(' ')[0] || firebaseUser?.displayName?.split(' ')[0] || 'there';

  const tabs = [
    {id:'register',label:'Register',icon:'📒'},
    {id:'bills',label:'Bills',icon:'🗓'},
    {id:'budgets',label:'Budgets',icon:'🎯'},
    {id:'debts',label:'Debt Stack',icon:'📉'},
    {id:'savings',label:'Savings',icon:'🐷'},
    {id:'cash',label:'Cash',icon:'💵'},
    {id:'timeline',label:'Payoff',icon:'⏱'},
    {id:'spending',label:'Spending',icon:'📊'},
  ];

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f6ff' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'#1a6fd4', marginBottom:8 }}>MoneyMap</div>
        <div style={{ fontSize:13, color:'#6b8dc4' }}>Loading your data…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f0f6ff' }}>
      {showTour && <AppTour onComplete={completeTour} />}
      <FinancialTipPopup uid={uid} lead={lead} onTabSwitch={handleTabSwitch} />
      {showVideo && <WelcomeVideoModal lead={lead} onClose={closeVideo} />}
      {showCashPopup && <CashPopup onClose={closeCashPopup} />}
      {showDeleteModal && <DeleteAccountModal lead={lead} onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} />}
      {showGoodbye && <GoodbyeModal lead={lead} />}
      {showCSVImport && <CSVImportModal
        existingTransactions={accounts[activeAccount]?.transactions||[]}
        accounts={accounts}
        defaultAccount={activeAccount}
        onImport={(newTxs, targetAccountKey)=>{
          const targetAcct=accounts[targetAccountKey]||accounts[activeAccount];
          const existing=targetAcct.transactions||[];
          const updated=[...newTxs,...existing];
          updated.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
          const updatedAccounts={...accounts,[targetAccountKey]:{...targetAcct,transactions:updated}};
          setAccounts(updatedAccounts);
          saveToFirebase(updatedAccounts);
        }}
        onCancel={()=>setShowCSVImport(false)}
        onAddSubscriptions={(newSubs, targetAccountKey)=>{
          const targetAcct=accounts[targetAccountKey]||accounts[activeAccount];
          const existingSubs=targetAcct.subscriptions||[];
          const updated={...accounts,[targetAccountKey]:{...targetAcct,subscriptions:[...existingSubs,...newSubs]}};
          setAccounts(updated);
          saveToFirebase(updated);
        }}
        onAddFixedBills={(newBills, targetAccountKey)=>{
          const targetAcct=accounts[targetAccountKey]||accounts[activeAccount];
          const existingBills=targetAcct.bills||[];
          const updated={...accounts,[targetAccountKey]:{...targetAcct,bills:[...existingBills,...newBills]}};
          setAccounts(updated);
          saveToFirebase(updated);
        }}
      />}
      {showAddToHome && <AddToHomeScreenModal onClose={() => setShowAddToHome(false)} />}
      {showMortgageTip && (
        <div className="modal-overlay" style={{zIndex:2500}} onClick={e=>e.target===e.currentTarget&&setShowMortgageTip(false)}>
          <div className="modal-box slide-up" style={{maxWidth:460}}>
            <div style={{height:4,background:'linear-gradient(90deg,#059669,#34d399)',borderRadius:'4px 4px 0 0',margin:'-2rem -2rem 1.25rem'}}/>
            <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:'1rem'}}>
              <span style={{fontSize:32,flexShrink:0}}>🏠</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:'#059669',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>Mortgage Tip</div>
                <h2 style={{fontFamily:'var(--font-display)',fontSize:18,color:'#0f2a5e',lineHeight:1.3}}>Pay extra toward your mortgage principal</h2>
              </div>
            </div>
            <p style={{fontSize:13,color:'#2d5a9e',lineHeight:1.7,marginBottom:'1rem'}}>
              Even an extra <strong style={{color:'#059669'}}>$100/month</strong> on a 30-year mortgage can cut <strong style={{color:'#059669'}}>4-6 years</strong> off your payoff timeline and save tens of thousands in interest.
            </p>
            <div style={{background:'rgba(5,150,105,0.06)',border:'1px solid rgba(5,150,105,0.2)',borderRadius:'var(--radius-md)',padding:'12px 14px',marginBottom:'1.25rem'}}>
              <div style={{fontSize:12,color:'#059669',fontWeight:600,marginBottom:4}}>💡 Pro tip</div>
              <div style={{fontSize:12,color:'#2d5a9e',lineHeight:1.6}}>Make sure extra payments go toward <strong>principal</strong> — not next month's payment. Check with your lender to confirm how to designate extra payments correctly.</div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn-gold" style={{flex:1,background:'linear-gradient(135deg,#059669,#34d399)'}} onClick={()=>{setShowMortgageTip(false);setActiveTab('timeline');}}>
                📊 See my payoff timeline
              </button>
              <button className="btn-outline" style={{fontSize:12}} onClick={()=>setShowMortgageTip(false)}>Got it 👍</button>
            </div>
          </div>
        </div>
      )}
      {payBillModal && <PayBillModal bill={payBillModal} accounts={accounts} onConfirm={handlePayBillConfirm} onCancel={() => setPayBillModal(null)} />}
      {showResetAccount && (
        <ClearConfirmModal
          title={"Reset " + (acct.name || 'Account') + "?"}
          message="This will wipe ALL transactions, bills, debts, goals, subscriptions, and beginning balance in this account. Other accounts are not affected."
          onConfirm={() => {
            const reset = { name: acct.name, transactions:[], debts:[], budgets:{}, beginBal:{amount:0,date:'',set:false}, goals:[], bills:[], billsPaid:{}, extraPayment:'', subscriptions:[] };
            const updated = { ...accounts, [activeAccount]: reset };
            setAccounts(updated);
            saveToFirebase(updated);
            setShowResetAccount(false);
          }}
          onCancel={() => setShowResetAccount(false)}
        />
      )}
      {splitModal && <SplitModal form={splitModal.form} onConfirm={(splits) => { splitModal.onConfirm(splits); setSplitModal(null); }} onCancel={() => setSplitModal(null)} />}

      {/* Budget Reset Banner */}
      {budgetResetBanner && (
        <div style={{ background:'linear-gradient(135deg, #1a6fd4, #5ba3f5)', padding:'12px 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:13, color:'#fff', fontWeight:500 }}>🎯 New month! Would you like to carry over last month's budget limits?</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => dismissBudgetBanner(true)} style={{ background:'#fff', color:'#1a6fd4', border:'none', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>Yes, carry over</button>
            <button onClick={() => dismissBudgetBanner(false)} style={{ background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.4)', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #c7ddf7', padding:'0.875rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, boxShadow:'0 2px 8px rgba(26,111,212,0.08)' }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'#1a6fd4' }}>MoneyMap</div>
          <div style={{ fontSize:12, color:'#6b8dc4' }}>Welcome back, {firstName} 👋</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {savedMsg && <span style={{ fontSize:12, color:'#16a34a' }}>✓ {savedMsg}</span>}
          <button className="btn-outline" style={{ fontSize:11 }} onClick={() => setShowCSVImport(true)}>📂 Import CSV</button>
          <button className="btn-outline" style={{ fontSize:11 }} onClick={() => setShowAddToHome(true)}>📱 Add to Phone</button>
          <button className="btn-outline" style={{ fontSize:11 }} onClick={resetTour}>🗺 Tour</button>
          <button className="btn-outline" style={{ fontSize:11 }} onClick={() => exportCSV(transactions, beginBal)}>⬇ CSV</button>
          <button className="btn-outline" style={{ fontSize:11 }} onClick={onSignOut}>Sign out</button>
          <button onClick={() => setShowDeleteModal(true)} style={{ background:'none', border:'none', color:'#6b8dc4', fontSize:11, cursor:'pointer', textDecoration:'underline' }}>Cancel account</button>
        </div>
      </div>

      {/* Account tabs */}
      <div style={{ background:'#fff', borderBottom:'1px solid #c7ddf7', padding:'0.5rem 1.5rem', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
        {Object.entries(accounts).map(([key, acctData]) => (
          <div key={key} style={{ display:'flex', alignItems:'center', gap:2 }}>
            {editingAccountKey===key ? (
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
                <input value={editingAccountName} onChange={e=>setEditingAccountName(e.target.value)} style={{ padding:'3px 8px', fontSize:12, width:130, borderRadius:20 }} onKeyDown={e=>{if(e.key==='Enter')saveAccountRename();if(e.key==='Escape'){setEditingAccountKey(null);}}} autoFocus />
                <button className="btn-gold" style={{ padding:'3px 10px', fontSize:11 }} onClick={saveAccountRename}>Save</button>
                <button className="btn-outline" style={{ padding:'3px 8px', fontSize:11 }} onClick={()=>setEditingAccountKey(null)}>✕</button>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:2 }}>
                <button onClick={() => setActiveAccount(key)} style={{ padding:'5px 12px', fontSize:12, fontWeight:600, borderRadius:20, cursor:'pointer', border:`1px solid ${activeAccount===key?'#1a6fd4':'#c7ddf7'}`, background: activeAccount===key?'rgba(26,111,212,0.1)':'transparent', color: activeAccount===key?'#1a6fd4':'#6b8dc4', fontFamily:'var(--font-display)', transition:'all 0.2s' }}>
                  {acctData.name}
                </button>
                {activeAccount===key && (
                  <div style={{ display:'flex', gap:2 }}>
                    <button onClick={()=>{setEditingAccountKey(key);setEditingAccountName(acctData.name);}} title="Rename account" style={{ background:'none', border:'none', color:'#6b8dc4', fontSize:12, cursor:'pointer', padding:'2px 4px' }}>✏️</button>
                    {key!=='main' && <button onClick={()=>setDeleteAccountKey(key)} title="Delete account" style={{ background:'none', border:'none', color:'rgba(220,38,38,0.5)', fontSize:12, cursor:'pointer', padding:'2px 4px' }}>🗑</button>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {showAddAccount ? (
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <input value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="Account name" style={{ padding:'4px 10px', fontSize:12, width:150, borderRadius:20 }} onKeyDown={e => e.key==='Enter'&&addNewAccount()} autoFocus />
            <button className="btn-gold" style={{ padding:'5px 12px', fontSize:12 }} onClick={addNewAccount}>Add</button>
            <button className="btn-outline" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setShowAddAccount(false)}>✕</button>
          </div>
        ) : (
          <>
            <button onClick={() => setShowAddAccount(true)} style={{ padding:'5px 12px', fontSize:11, borderRadius:20, cursor:'pointer', border:'1px dashed #c7ddf7', background:'transparent', color:'#6b8dc4', transition:'all 0.2s' }}>+ Add account</button>
            <button onClick={() => setShowResetAccount(true)} style={{ padding:'5px 12px', fontSize:11, borderRadius:20, cursor:'pointer', border:'1px dashed rgba(220,38,38,0.3)', background:'transparent', color:'rgba(220,38,38,0.6)', transition:'all 0.2s', marginLeft:'auto' }}>↺ Reset account</button>
          </>
        )}
      </div>
      {deleteAccountKey && (
        <ClearConfirmModal
          title={`Delete "${accounts[deleteAccountKey]?.name}"?`}
          message="This will permanently delete this account and ALL its transactions, bills, debts, goals, and subscriptions. This cannot be undone."
          onConfirm={()=>{
            const updated={...accounts};
            delete updated[deleteAccountKey];
            setAccounts(updated);
            saveToFirebase(updated);
            setActiveAccount('main');
            setDeleteAccountKey(null);
          }}
          onCancel={()=>setDeleteAccountKey(null)}
        />
      )}

      <div style={{ maxWidth:860, margin:'0 auto', padding:'1.25rem 1rem 4rem' }}>
        {lead && lead.referredBy && <RepContactCard repName={lead.referredBy} uid={uid} />}
        <MetricsBar transactions={transactions} debts={debts} beginBal={beginBal} />
        <AlertsBar transactions={transactions} budgets={budgets} />
        <div className="tabs">
          {tabs.map(t => (
            <button key={t.id} className={`tab ${activeTab===t.id?'active':''}`} onClick={() => handleTabSwitch(t.id)}>
              <span style={{ marginRight:4 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        {activeTab==='register' && <RegisterTab transactions={transactions} setTransactions={txs} beginBal={beginBal} setBeginBal={bbs} onSplitRequest={(form, onConfirm) => setSplitModal({ form, onConfirm })} onMortgageDetected={() => { const seen = localStorage.getItem('mm_mortgage_tip_' + uid); if(!seen) { setShowMortgageTip(true); localStorage.setItem('mm_mortgage_tip_' + uid, 'true'); }}} accounts={accounts} activeAccount={activeAccount} onMoveTransactions={(txIds, targetKey)=>{ const toMove=transactions.filter(t=>txIds.includes(t.id)); const remaining=transactions.filter(t=>!txIds.includes(t.id)); const targetTxs=[...(accounts[targetKey].transactions||[]),...toMove]; targetTxs.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id); const updated={...accounts,[activeAccount]:{...accounts[activeAccount],transactions:remaining},[targetKey]:{...accounts[targetKey],transactions:targetTxs}}; setAccounts(updated); saveToFirebase(updated); }} />}
        {activeTab==='bills' && <BillsTab bills={bills} setBills={bls} billsPaid={billsPaid} onPayBill={handlePayBill} onUnpayBill={handleUnpayBill} subscriptions={subscriptions} setSubscriptions={subs} transactions={transactions} goals={goals} accounts={accounts} activeAccount={activeAccount} setAccounts={setAccounts} saveToFirebase={saveToFirebase} onMoveBill={(bill,targetKey)=>{ if(!targetKey)return; const srcUpdated=bills.filter(b=>b.id!==bill.id); const tgtUpdated=[...(accounts[targetKey].bills||[]),bill]; const updated={...accounts,[activeAccount]:{...accounts[activeAccount],bills:srcUpdated},[targetKey]:{...accounts[targetKey],bills:tgtUpdated}}; setAccounts(updated); saveToFirebase(updated); }} onMoveSubscription={(sub,targetKey)=>{ if(!targetKey)return; const srcUpdated=subscriptions.filter(s=>s.id!==sub.id); const tgtUpdated=[...(accounts[targetKey].subscriptions||[]),sub]; const updated={...accounts,[activeAccount]:{...accounts[activeAccount],subscriptions:srcUpdated},[targetKey]:{...accounts[targetKey],subscriptions:tgtUpdated}}; setAccounts(updated); saveToFirebase(updated); }} />}
        {activeTab==='budgets' && <BudgetsTab transactions={transactions} budgets={budgets} setBudgets={bgs} />}
        {activeTab==='debts' && <DebtsTab debts={debts} setDebts={dbs} />}
        {activeTab==='savings' && <SavingsTab transactions={transactions} goals={goals} setGoals={gls} />}
        {activeTab==='cash' && <CashTab transactions={transactions} setTransactions={txs} />}
        {activeTab==='timeline' && <TimelineTab debts={debts} extraPayment={extraPayment} setExtraPayment={eps} />}
        {activeTab==='spending' && <SpendingTab transactions={transactions} periodMode={periodMode} setPeriodMode={setPeriodMode} periodOffset={periodOffset} setPeriodOffset={setPeriodOffset} />}
      </div>
    </div>
  );
}

function MetricsBar({transactions,debts,beginBal}){
  const n=new Date();const m=n.getMonth();const y=n.getFullYear();
  const debits=transactions.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amt,0);
  const credits=transactions.filter(t=>t.type==='credit').reduce((s,t)=>s+t.amt,0);
  const bal=(beginBal.amount||0)+credits-debits;
  const totalDebt=debts.reduce((s,d)=>s+d.bal,0);
  const monthIncome=transactions.filter(t=>{const d=new Date(t.date+'T00:00:00');return t.type==='credit'&&d.getMonth()===m&&d.getFullYear()===y;}).reduce((s,t)=>s+t.amt,0);
  const monthSpend=transactions.filter(t=>{const d=new Date(t.date+'T00:00:00');return t.type==='debit'&&d.getMonth()===m&&d.getFullYear()===y;}).reduce((s,t)=>s+t.amt,0);
  const net=monthIncome-monthSpend;
  return(
    <div className="metric-grid">
      <div className="metric-card"><div className="lbl">Account balance</div><div className={`val ${bal>=0?'val-green':'val-red'}`}>${Math.abs(bal).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
      <div className="metric-card"><div className="lbl">Total debt</div><div className="val val-red">${totalDebt.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}</div></div>
      <div className="metric-card"><div className="lbl">Month income</div><div className={`val ${monthIncome>0?'val-green':'val-red'}`}>${monthIncome.toFixed(2)}</div></div>
      <div className="metric-card"><div className="lbl">Month net</div><div className={`val ${net>=0?'val-teal':'val-red'}`}>{net<0?'-':''}${Math.abs(net).toFixed(2)}</div></div>
    </div>
  );
}

function AlertsBar({transactions,budgets}){
  const n=new Date();const m=n.getMonth();const y=n.getFullYear();
  const getM=type=>transactions.filter(t=>{const d=new Date(t.date+'T00:00:00');return t.type===type&&d.getMonth()===m&&d.getFullYear()===y;});
  const monthSpend=getM('debit').reduce((s,t)=>s+t.amt,0);
  const monthIncome=getM('credit').reduce((s,t)=>s+t.amt,0);
  const monthSavings=getM('debit').filter(t=>t.grp==='Savings').reduce((s,t)=>s+t.amt,0);
  const net=monthIncome-monthSpend;
  const alerts=[];
  if(monthIncome>0&&net<0) alerts.push({type:'danger',msg:`Spending exceeds income — you're running a <strong>$${Math.abs(net).toFixed(2)} deficit</strong> this month.`});
  else if(monthIncome===0&&monthSpend>0) alerts.push({type:'warning',msg:'No income recorded this month. Add your paycheck so your net is accurate.'});
  if(monthIncome>0&&monthSavings===0) alerts.push({type:'warning',msg:'No savings recorded this month. Log a savings transaction under the Savings group.'});
  const catTotals={};
  getM('debit').forEach(t=>{catTotals[t.cat]=(catTotals[t.cat]||0)+t.amt;});
  Object.keys(budgets).filter(c=>budgets[c]>0&&(catTotals[c]||0)>budgets[c]).forEach(c=>alerts.push({type:'danger',msg:`<strong>${c}</strong> over budget — $${(catTotals[c]||0).toFixed(2)} of $${budgets[c].toFixed(2)} limit`}));
  if(!alerts.length) return null;
  return <div style={{marginBottom:'1rem'}}>{alerts.map((a,i)=><div key={i} className={`alert-box alert-${a.type}`} dangerouslySetInnerHTML={{__html:a.msg}}/>)}</div>;
}

function RegisterTab({transactions,setTransactions,beginBal,setBeginBal,onSplitRequest,onMortgageDetected,accounts,activeAccount,onMoveTransactions}){
  const emptyForm = {date:new Date().toISOString().split('T')[0],desc:'',type:'debit',grp:'',cat:'',amt:'',note:'',refNum:'',recurring:'none'};
  const [form,setForm]=useState(emptyForm);
  const [bbEdit,setBbEdit]=useState(false);
  const [bbForm,setBbForm]=useState({date:beginBal.date||new Date().toISOString().split('T')[0],amount:beginBal.amount||''});
  const [filterGrp,setFilterGrp]=useState('');
  const [filterCat,setFilterCat]=useState('');
  const [search,setSearch]=useState('');
  const [showExtra,setShowExtra]=useState(false);
  const [selectedTxIds,setSelectedTxIds]=useState([]);
  const [moveToAccount,setMoveToAccount]=useState('');
  const [err,setErr]=useState({});
  const grpCats=form.grp?GROUPS[form.grp]?.cats||[]:[];

  const addTx=()=>{
    const e={};
    if(!form.date)e.date=true;
    if(!form.desc.trim())e.desc=true;
    if(!form.cat)e.cat=true;
    if(!form.amt||isNaN(parseFloat(form.amt))||parseFloat(form.amt)<=0)e.amt=true;
    if(Object.keys(e).length){setErr(e);return;}
    const newTx={id:Date.now(),date:form.date,desc:form.desc.trim(),type:form.type,grp:form.grp,cat:form.cat,amt:parseFloat(form.amt),note:form.note||'',refNum:form.refNum||'',recurring:form.recurring||'none'};
    const updated=[newTx,...transactions];
    updated.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
    setTransactions(updated);
    setForm(f=>({...f,desc:'',amt:'',note:'',refNum:''}));
    setErr({});
  };

  const handleSplit=()=>{
    if(!form.amt||isNaN(parseFloat(form.amt))||parseFloat(form.amt)<=0){alert('Enter an amount first.');return;}
    onSplitRequest(form,(splits)=>{
      const newTxs=splits.map((sp,i)=>({id:Date.now()+i,date:form.date,desc:form.desc.trim()||'Split transaction',type:form.type,grp:sp.grp||'Other',cat:sp.cat,amt:parseFloat(sp.amt),note:sp.note||'Split',refNum:form.refNum||'',recurring:'none'}));
      const updated=[...newTxs,...transactions];
      updated.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
      setTransactions(updated);
      setForm(emptyForm);
      setErr({});
    });
  };

  const saveBB=()=>{
    const amt=parseFloat(bbForm.amount);
    if(isNaN(amt))return;
    setBeginBal({amount:amt,date:bbForm.date,set:true});
    setBbEdit(false);
  };

  const sorted=[...transactions].sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id);
  let runBal=beginBal.amount||0;
  const bals={};
  sorted.forEach(t=>{runBal+=t.type==='credit'?t.amt:-t.amt;bals[t.id]=runBal;});

  let filtered=transactions;
  if(filterGrp)filtered=filtered.filter(t=>t.grp===filterGrp);
  if(filterCat)filtered=filtered.filter(t=>t.cat===filterCat);
  if(search)filtered=filtered.filter(t=>`${t.desc} ${t.cat} ${t.grp} ${t.amt} ${t.refNum||''}`.toLowerCase().includes(search.toLowerCase()));
  const grpFilterCats=filterGrp?GROUPS[filterGrp]?.cats||[]:Object.values(GROUPS).flatMap(v=>v.cats);

  return(
    <>
      <div className="card">
        {!beginBal.set?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,padding:'4px 0'}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'#1a6fd4'}}>💰 Set beginning balance</div>
              <div style={{fontSize:12,color:'#6b8dc4'}}>Enter your account balance before tracking starts</div>
            </div>
            <button className="btn-gold" style={{fontSize:12,padding:'8px 16px'}} onClick={()=>setBbEdit(true)}>Set balance</button>
          </div>
        ):(
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
            <div>
              <div style={{fontSize:12,color:'#6b8dc4',marginBottom:2}}>Beginning balance</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,color:'#1a6fd4'}}>
                ${beginBal.amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
                <span style={{fontSize:12,color:'#6b8dc4',fontWeight:400,marginLeft:8}}>as of {new Date(beginBal.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button className="btn-outline" style={{fontSize:12}} onClick={()=>setBbEdit(true)}>Edit</button>
              <ClearBtn label="Clear" onClear={()=>setBeginBal({amount:0,date:'',set:false})} title="Clear beginning balance?" message="This will reset your beginning balance to zero." />
            </div>
          </div>
        )}
        {bbEdit&&(
          <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid #c7ddf7'}}>
            <div className="form-row r3">
              <input type="date" value={bbForm.date} onChange={e=>setBbForm(f=>({...f,date:e.target.value}))}/>
              <input type="number" value={bbForm.amount} placeholder="Starting balance ($)" step="0.01" onChange={e=>setBbForm(f=>({...f,amount:e.target.value}))}/>
              <button className="btn-gold" onClick={saveBB}>Save</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Add transaction</div>
        <div className="form-row r2">
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={err.date?{borderColor:'#dc2626'}:{}}/>
          <AutocompleteInput
            value={form.desc}
            onChange={val=>setForm(f=>({...f,desc:val}))}
            transactions={transactions}
            onSelect={suggestion=>{
              setForm(f=>({...f,desc:suggestion.desc,grp:suggestion.grp||f.grp,cat:suggestion.cat||f.cat}));
            }}
            style={err.desc?{borderColor:'#dc2626'}:{}}
          />
        </div>
        <div className="form-row r4" style={{marginBottom:10}}>
          <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="debit">Debit</option><option value="credit">Credit</option></select>
          <select value={form.grp} onChange={e=>setForm(f=>({...f,grp:e.target.value,cat:''}))}>
            <option value="">-- Group --</option>
            {Object.keys(GROUPS).map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={err.cat?{borderColor:'#dc2626'}:{}}>
            <option value="">-- Category --</option>
            {grpCats.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Amount" min="0" step="0.01" value={form.amt} onChange={e=>setForm(f=>({...f,amt:e.target.value}))} style={err.amt?{borderColor:'#dc2626'}:{}} onKeyDown={e=>e.key==='Enter'&&addTx()}/>
        </div>

        <button className="btn-outline" style={{fontSize:11,marginBottom:10}} onClick={()=>setShowExtra(x=>!x)}>
          {showExtra?'▲ Hide extras':'▼ Add note, ref #, recurring'}
        </button>

        {showExtra&&(
          <div style={{background:'#f8faff',borderRadius:'var(--radius-md)',padding:'12px',marginBottom:10,border:'1px solid #c7ddf7'}}>
            <div className="form-row r2" style={{marginBottom:8}}>
              <div>
                <label style={{fontSize:11,color:'#6b8dc4',display:'block',marginBottom:3}}>Note (optional)</label>
                <input placeholder="e.g. split with spouse, reimbursable..." value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
              </div>
              <div>
                <label style={{fontSize:11,color:'#6b8dc4',display:'block',marginBottom:3}}>Confirmation / Ref #</label>
                <input placeholder="e.g. TXN123456" value={form.refNum} onChange={e=>setForm(f=>({...f,refNum:e.target.value}))}/>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,color:'#6b8dc4',display:'block',marginBottom:3}}>Recurring</label>
              <select value={form.recurring} onChange={e=>setForm(f=>({...f,recurring:e.target.value}))} style={{maxWidth:200}}>
                <option value="none">Not recurring</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn-gold" onClick={addTx}>+ Add entry</button>
          <button className="btn-outline" onClick={handleSplit} style={{fontSize:12}}>✂️ Split</button>
        </div>
      </div>

      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <div className="card-title" style={{marginBottom:0}}>Register</div>
            {transactions.length>0&&<ClearBtn label="Clear all" onClear={()=>setTransactions([])} title="Clear all transactions?" message="This will permanently delete all transactions in this account." />}
            {selectedTxIds.length>0&&accounts&&Object.keys(accounts).length>1&&(
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,color:'#1a6fd4',fontWeight:600}}>{selectedTxIds.length} selected</span>
                <select value={moveToAccount} onChange={e=>setMoveToAccount(e.target.value)} style={{fontSize:11,padding:'3px 8px',width:'auto'}}>
                  <option value="">Move to...</option>
                  {Object.entries(accounts).filter(([k])=>k!==activeAccount).map(([k,a])=><option key={k} value={k}>{a.name}</option>)}
                </select>
                {moveToAccount&&<button className="btn-gold" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>{onMoveTransactions(selectedTxIds,moveToAccount);setSelectedTxIds([]);setMoveToAccount('');}}>Move</button>}
                <button className="btn-outline" style={{fontSize:11,padding:'4px 8px'}} onClick={()=>{setSelectedTxIds([]);setMoveToAccount('');}}>Cancel</button>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            <input placeholder="🔍 Search transactions..." value={search} onChange={e=>setSearch(e.target.value)} style={{fontSize:12,padding:'5px 10px',width:180}}/>
            <select value={filterGrp} onChange={e=>{setFilterGrp(e.target.value);setFilterCat('');}} style={{width:'auto',fontSize:12,padding:'4px 8px'}}>
              <option value="">All groups</option>
              {Object.keys(GROUPS).map(g=><option key={g} value={g}>{g}</option>)}
            </select>
            <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{width:'auto',fontSize:12,padding:'4px 8px'}}>
              <option value="">All categories</option>
              {grpFilterCats.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <table>
          <thead><tr>
            <th style={{width:28}}><input type="checkbox" onChange={e=>{if(e.target.checked)setSelectedTxIds(filtered.map(t=>t.id));else setSelectedTxIds([]);}} style={{accentColor:'#1a6fd4',width:13,height:13}}/></th>
            <th style={{width:64}}>Date</th>
            <th>Description</th>
            <th style={{width:100}}>Category</th>
            <th style={{width:66}}>Debit</th>
            <th style={{width:66}}>Credit</th>
            <th style={{width:72}}>Balance</th>
            <th style={{width:28}}></th>
          </tr></thead>
          <tbody>
            {beginBal.set&&!filterGrp&&!filterCat&&!search&&(
              <tr className="bb-row">
                <td style={{fontSize:11}}>{new Date(beginBal.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                <td colSpan={4} style={{color:'#6b8dc4'}}>💰 Beginning balance</td>
                <td className="fw credit-color">${beginBal.amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                <td></td>
              </tr>
            )}
            {filtered.map(t=>{
              const bal=bals[t.id];
              const ci=ALL_CATS[t.cat]||{color:'#6b7280',bg:'rgba(107,114,128,0.1)'};
              return(
                <tr key={t.id} style={{background:selectedTxIds.includes(t.id)?'rgba(26,111,212,0.06)':''}}>
                  <td style={{width:28,textAlign:'center'}}>
                    <input type="checkbox" checked={selectedTxIds.includes(t.id)} onChange={e=>{if(e.target.checked)setSelectedTxIds(s=>[...s,t.id]);else setSelectedTxIds(s=>s.filter(id=>id!==t.id));}} style={{accentColor:'#1a6fd4',width:13,height:13}}/>
                  </td>
                  <td style={{fontSize:11,whiteSpace:'nowrap'}}>{new Date(t.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                  <td>
                    <div style={{fontSize:12}}>{t.desc}</div>
                    {t.note&&<div style={{fontSize:10,color:'#6b8dc4',fontStyle:'italic'}}>📝 {t.note}</div>}
                    {t.refNum&&<div style={{fontSize:10,color:'#1a6fd4'}}>Ref: {t.refNum}</div>}
                    {t.recurring&&t.recurring!=='none'&&<div style={{fontSize:10,color:'#7c3aed'}}>🔁 {t.recurring}</div>}
                  </td>
                  <td><span className="grp-badge" style={{background:ci.bg,color:ci.color}}>{t.grp||'?'}</span></td>
                  <td className="debit-color">{t.type==='debit'?'$'+t.amt.toFixed(2):''}</td>
                  <td className="credit-color">{t.type==='credit'?'$'+t.amt.toFixed(2):''}</td>
                  <td className={`fw ${bal>=0?'credit-color':'debit-color'}`} style={{fontSize:12}}>${Math.abs(bal).toFixed(2)}</td>
                  <td><button className="btn-danger" onClick={()=>setTransactions(transactions.filter(x=>x.id!==t.id))}>✕</button></td>
                </tr>
              );
            })}
            {filtered.length===0&&<tr><td colSpan={7} className="empty-state">No transactions found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BillsTab({bills,setBills,billsPaid,onPayBill,onUnpayBill,subscriptions,setSubscriptions,transactions,goals,accounts,activeAccount,setAccounts,saveToFirebase,onMoveBill,onMoveSubscription}){
  const now=new Date();
  const monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const todayDay=now.getDate();
  const BILL_CATS=['Mortgage / rent','Electric bill','Water bill','Gas / heat bill','Internet','Cable / streaming','Phone bill','HOA fee','Auto insurance','Life insurance','Health insurance','Dental / vision','Home / renters ins.','Car payment','Student loan','Credit card payment','Personal loan','Gym membership','Subscriptions','Childcare / daycare','School tuition','Other fixed bill'];
  const [form,setForm]=useState({name:'',amount:'',dueDay:'1',category:'Electric bill',autopay:false});
  const [showForm,setShowForm]=useState(false);
  const [err,setErr]=useState({});
  const [editingBill,setEditingBill]=useState(null);
  const addBill=()=>{
    const e={};
    if(!form.name.trim())e.name=true;
    if(!form.amount||isNaN(parseFloat(form.amount))||parseFloat(form.amount)<=0)e.amount=true;
    if(Object.keys(e).length){setErr(e);return;}
    const updated=[...bills,{id:Date.now(),name:form.name.trim(),amount:parseFloat(form.amount),dueDay:parseInt(form.dueDay),category:form.category,autopay:form.autopay,createdAt:new Date().toISOString()}];
    updated.sort((a,b)=>a.dueDay-b.dueDay);
    setBills(updated);
    setForm({name:'',amount:'',dueDay:'1',category:'Electric bill',autopay:false});
    setErr({});setShowForm(false);
  };
  const isPaid=billId=>!!billsPaid[`${monthKey}_${billId}`];
  const paidAt=billId=>{const p=billsPaid[`${monthKey}_${billId}`];return p?new Date(p.paidAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}):null;};
  const getDueStatus=dueDay=>{if(dueDay<todayDay)return'overdue';if(dueDay-todayDay<=3)return'due-soon';return'upcoming';};
  const totalBills=bills.reduce((s,b)=>s+b.amount,0);
  const totalPaid=bills.filter(b=>isPaid(b.id)).reduce((s,b)=>s+b.amount,0);
  const totalUnpaid=totalBills-totalPaid;
  const paidCount=bills.filter(b=>isPaid(b.id)).length;
  const daySuffix=d=>{if(d>=11&&d<=13)return`${d}th`;const s=['th','st','nd','rd'];return`${d}${s[d%10]||'th'}`;};
  return(
    <>
      <div className="metric-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>
        <div className="metric-card"><div className="lbl">Total monthly bills</div><div className="val val-gold">${totalBills.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
        <div className="metric-card"><div className="lbl">Paid this month</div><div className="val val-green">${totalPaid.toFixed(2)}</div></div>
        <div className="metric-card"><div className="lbl">Still owed</div><div className={`val ${totalUnpaid>0?'val-red':'val-green'}`}>${totalUnpaid.toFixed(2)}</div></div>
        <div className="metric-card"><div className="lbl">Bills paid</div><div className="val val-teal">{paidCount} / {bills.length}</div></div>
      </div>
      <div style={{background:'rgba(26,111,212,0.06)',border:'1px solid rgba(26,111,212,0.15)',borderRadius:'var(--radius-md)',padding:'10px 14px',marginBottom:10,display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:18,flexShrink:0}}>💡</span>
        <div style={{fontSize:12,color:'#2d5a9e',lineHeight:1.5}}>
          <strong>Did you know?</strong> You can import your bank statement to automatically detect your fixed bills and subscriptions. Click <strong>📂 Import CSV</strong> in the header to get started!
        </div>
      </div>
      {bills.filter(b=>!isPaid(b.id)&&getDueStatus(b.dueDay)==='overdue').length>0&&<div className="alert-box alert-danger" style={{marginBottom:8}}>⚠️ <strong>{bills.filter(b=>!isPaid(b.id)&&getDueStatus(b.dueDay)==='overdue').length} bill(s) past due</strong></div>}
      {bills.filter(b=>!isPaid(b.id)&&getDueStatus(b.dueDay)==='due-soon').length>0&&<div className="alert-box alert-warning" style={{marginBottom:8}}>🔔 <strong>{bills.filter(b=>!isPaid(b.id)&&getDueStatus(b.dueDay)==='due-soon').length} bill(s) due within 3 days</strong></div>}
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:showForm?'1rem':0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div className="card-title" style={{marginBottom:0}}>Fixed bills</div>
            {bills.length>0&&<ClearBtn label="Clear all" onClear={()=>setBills([])} title="Clear all bills?" message="This will permanently delete all fixed bills." />}
          </div>
          <button className="btn-gold" style={{fontSize:12,padding:'6px 14px'}} onClick={()=>setShowForm(f=>!f)}>{showForm?'✕ Cancel':'+ Add bill'}</button>
        </div>
        {showForm&&(
          <div style={{borderTop:'1px solid #c7ddf7',paddingTop:'1rem'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Bill name</label><input placeholder="e.g. Car payment" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={err.name?{borderColor:'#dc2626'}:{}}/></div>
              <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Monthly amount</label><input type="number" placeholder="$0.00" min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={err.amount?{borderColor:'#dc2626'}:{}}/></div>
              <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Due day</label><select value={form.dueDay} onChange={e=>setForm(f=>({...f,dueDay:e.target.value}))}>{Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{daySuffix(d)} of the month</option>)}</select></div>
              <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Category</label><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{BILL_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:14,fontSize:13,color:'#2d5a9e'}}>
              <input type="checkbox" checked={form.autopay} onChange={e=>setForm(f=>({...f,autopay:e.target.checked}))} style={{width:15,height:15,accentColor:'#1a6fd4'}}/>
              This bill is on autopay
            </label>
            <button className="btn-gold" onClick={addBill}>Save bill</button>
          </div>
        )}
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {bills.length===0?(
          <div className="empty-state" style={{padding:'3rem'}}>No fixed bills yet. Add your first bill above.</div>
        ):(
          <table>
            <thead><tr>
              <th style={{padding:'12px 16px',width:180}}>Bill</th>
              <th style={{width:90}}>Category</th>
              <th style={{width:70,textAlign:'center'}}>Due</th>
              <th style={{width:80,textAlign:'right'}}>Amount</th>
              <th style={{width:120,textAlign:'center'}}>Status</th>
              <th style={{width:90,textAlign:'center'}}>Paid on</th>
              <th style={{width:40}}></th>
            </tr></thead>
            <tbody>
              {bills.map(bill=>{
                const paid=isPaid(bill.id);
                const status=paid?'paid':getDueStatus(bill.dueDay);
                const statusColors={paid:{bg:'rgba(22,163,74,0.1)',color:'#16a34a',label:'✓ Paid'},overdue:{bg:'rgba(220,38,38,0.1)',color:'#dc2626',label:'Overdue'},'due-soon':{bg:'rgba(217,119,6,0.1)',color:'#d97706',label:'Due soon'},upcoming:{bg:'rgba(107,114,128,0.08)',color:'#6b7280',label:'Upcoming'}};
                const sc=statusColors[status];
                return(
                  <tr key={bill.id} style={{opacity:paid?0.75:1}}>
                    <td style={{padding:'10px 16px'}}>
                      <div style={{fontWeight:600,fontSize:13,color:paid?'#6b8dc4':'#0f2a5e',textDecoration:paid?'line-through':'none'}}>{bill.name}</div>
                      {bill.autopay&&<div style={{fontSize:10,color:'#0ea5e9',fontWeight:600,marginTop:1}}>⚡ AUTOPAY</div>}
                    </td>
                    <td style={{fontSize:11,color:'#6b8dc4'}}>{bill.category}</td>
                    <td style={{textAlign:'center'}}><span style={{fontSize:12,fontWeight:600,color:paid?'#6b8dc4':status==='overdue'?'#dc2626':status==='due-soon'?'#d97706':'#2d5a9e'}}>{daySuffix(bill.dueDay)}</span></td>
                    <td style={{textAlign:'right',fontWeight:700,fontSize:13,color:paid?'#6b8dc4':'#0f2a5e'}}>${bill.amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td style={{textAlign:'center'}}>
                      {paid?(
                        <button onClick={()=>onUnpayBill(bill.id)} style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.color}40`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>{sc.label}</button>
                      ):(
                        <button onClick={()=>onPayBill(bill)} style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.color}40`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>{sc.label}</button>
                      )}
                    </td>
                    <td style={{textAlign:'center',fontSize:11,color:'#6b8dc4'}}>{paidAt(bill.id)||'—'}</td>
                    <td style={{textAlign:'center'}}>
                      <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                        <button onClick={()=>setEditingBill(bill)} style={{background:'rgba(26,111,212,0.1)',color:'#1a6fd4',border:'1px solid rgba(26,111,212,0.2)',borderRadius:'var(--radius-sm)',padding:'3px 7px',fontSize:11,cursor:'pointer'}}>✏️</button>
                        {accounts&&Object.keys(accounts).filter(k=>k!==activeAccount).length>0&&<MovePicker accounts={accounts} currentAccount={activeAccount} onMove={(targetKey)=>onMoveBill&&onMoveBill(bill,targetKey)} />}
                        <button className="btn-danger" onClick={()=>setBills(bills.filter(b=>b.id!==bill.id))}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {editingBill&&(
        <div className="modal-overlay" style={{zIndex:3000}}>
          <div className="modal-box slide-up" style={{maxWidth:480}}>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:'1.25rem',color:'#0f2a5e'}}>✏️ Edit Bill</h2>
            <EditBillForm bill={editingBill} billCats={BILL_CATS} onSave={(updated)=>{setBills(bills.map(b=>b.id===updated.id?updated:b));setEditingBill(null);}} onCancel={()=>setEditingBill(null)} />
          </div>
        </div>
      )}
      {bills.length>0&&(
        <div className="card">
          <div className="card-title">Monthly bill progress</div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b8dc4',marginBottom:6}}><span>{paidCount} of {bills.length} bills paid</span><span>${totalPaid.toFixed(2)} of ${totalBills.toFixed(2)}</span></div>
          <div style={{background:'#e8f1fd',borderRadius:6,height:10,overflow:'hidden'}}>
            <div style={{height:10,borderRadius:6,width:`${totalBills>0?Math.round((totalPaid/totalBills)*100):0}%`,background:paidCount===bills.length?'#16a34a':'linear-gradient(90deg, #1a6fd4, #5ba3f5)',transition:'width 0.4s ease'}}/>
          </div>
          {paidCount===bills.length&&bills.length>0&&<div style={{textAlign:'center',fontSize:12,color:'#16a34a',marginTop:8,fontWeight:600}}>🎉 All bills paid for {now.toLocaleDateString('en-US',{month:'long'})}!</div>}
        </div>
      )}
      <SubscriptionsSection subscriptions={subscriptions||[]} setSubscriptions={setSubscriptions} transactions={transactions} goals={goals} accounts={accounts} activeAccount={activeAccount} setAccounts={setAccounts} saveToFirebase={saveToFirebase} onMoveSubscription={onMoveSubscription} />
    </>
  );
}

function BudgetsTab({transactions,budgets,setBudgets}){
  const [localBudgets,setLocalBudgets]=useState({...budgets});
  const n=new Date();const m=n.getMonth();const y=n.getFullYear();
  const catTotals={};
  transactions.filter(t=>{const d=new Date(t.date+'T00:00:00');return t.type==='debit'&&d.getMonth()===m&&d.getFullYear()===y;}).forEach(t=>{catTotals[t.cat]=(catTotals[t.cat]||0)+t.amt;});
  const active=Object.keys({...catTotals,...localBudgets}).filter(c=>((catTotals[c]||0)>0||(localBudgets[c]||0)>0)&&ALL_CATS[c]);
  const maxVal=Math.max(...active.map(c=>Math.max(catTotals[c]||0,localBudgets[c]||0)),1);
  const byGrp={};active.forEach(c=>{const g=ALL_CATS[c]?.group||'Other';if(!byGrp[g])byGrp[g]=[];byGrp[g].push(c);});
  return(
    <>
      <div className="card">
        <div className="card-title">Monthly budget limits</div>
        <div style={{fontSize:12,color:'#6b8dc4',marginBottom:12}}>Set $0 to skip. You'll get an alert when you exceed a limit.</div>
        {Object.entries(GROUPS).filter(([g])=>g!=='Income'&&g!=='Savings').map(([g,v])=>(
          <div key={g} style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:v.color,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8,paddingBottom:4,borderBottom:'1px solid #e8f1fd'}}>{g}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
              {v.cats.map(c=>(
                <div key={c} style={{display:'flex',alignItems:'center',gap:6}}>
                  <label style={{fontSize:12,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#2d5a9e'}} title={c}>{c}</label>
                  <input type="number" value={localBudgets[c]||''} placeholder="$0" min="0" step="5" style={{width:80,flexShrink:0}} onChange={e=>setLocalBudgets(b=>({...b,[c]:parseFloat(e.target.value)||0}))}/>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="btn-gold" onClick={()=>setBudgets(localBudgets)}>Save all limits</button>
      </div>
      <div className="card">
        <div className="card-title">Budget vs. actual — this month</div>
        {active.length===0?<div className="empty-state">Add transactions and budget limits to see tracking.</div>:(
          Object.entries(byGrp).map(([g,cats])=>{
            const gv=GROUPS[g];
            return(
              <div key={g} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600,color:gv?.color||'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>{g}</div>
                {cats.map(c=>{
                  const spent=catTotals[c]||0;const limit=localBudgets[c]||0;const over=limit>0&&spent>limit;
                  return(
                    <div key={c} className="cat-row">
                      <div className="cat-label" title={c}>{c}</div>
                      <div className="cat-track">
                        <div className="cat-fill" style={{width:`${Math.round((spent/maxVal)*100)}%`,background:over?'#dc2626':ALL_CATS[c]?.color||'#6b7280'}}/>
                        {limit>0&&<div style={{position:'absolute',top:0,left:`${Math.round((limit/maxVal)*100)}%`,width:2,height:'100%',background:'rgba(0,0,0,0.2)'}}/>}
                      </div>
                      <div className="cat-val" style={over?{color:'#dc2626'}:{}}>${spent.toFixed(0)}{limit>0&&<span style={{color:'#6b8dc4'}}>/{limit.toFixed(0)}</span>}</div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function DebtsTab({debts,setDebts}){
  const [form,setForm]=useState({name:'',bal:'',rate:'',min:''});
  const addDebt=()=>{
    const {name,bal,rate,min}=form;
    if(!name.trim()||isNaN(parseFloat(bal))||isNaN(parseFloat(rate))||isNaN(parseFloat(min))){alert('Fill in all debt fields.');return;}
    setDebts([...debts,{id:Date.now(),name:name.trim(),bal:parseFloat(bal),rate:parseFloat(rate),min:parseFloat(min)}]);
    setForm({name:'',bal:'',rate:'',min:''});
  };
  const sorted=[...debts].sort((a,b)=>b.rate-a.rate);
  const maxBal=Math.max(...sorted.map(d=>d.bal),1);
  const totalMin=debts.reduce((s,d)=>s+d.min,0);
  return(
    <>
      <div className="card">
        <div className="card-title">Add debt</div>
        <div className="form-row r2">
          <input placeholder="Debt name (e.g. Visa, Car loan)" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <input type="number" placeholder="Balance owed ($)" min="0" step="0.01" value={form.bal} onChange={e=>setForm(f=>({...f,bal:e.target.value}))}/>
        </div>
        <div className="form-row r3">
          <input type="number" placeholder="Interest rate (%)" min="0" step="0.01" value={form.rate} onChange={e=>setForm(f=>({...f,rate:e.target.value}))}/>
          <input type="number" placeholder="Min. payment ($/mo)" min="0" step="0.01" value={form.min} onChange={e=>setForm(f=>({...f,min:e.target.value}))}/>
          <button className="btn-gold" style={{alignSelf:'end'}} onClick={addDebt}>+ Add debt</button>
        </div>
      </div>
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
          <div className="card-title" style={{marginBottom:0}}>Debt stacking order — avalanche method</div>
          {sorted.length>0&&<ClearBtn label="Clear all" onClear={()=>setDebts([])} title="Clear all debts?" message="This will permanently delete all debts from your debt stack." />}
        </div>
        {sorted.length===0?<div className="empty-state">Add your debts above to see the payoff strategy.</div>:(
          <>
            {sorted.map((d,i)=>{
              const labels=['Attack first','Attack next','Hold minimum'];
              const colors=['#dc2626','#d97706','#16a34a'];
              const bgs=['rgba(220,38,38,0.1)','rgba(217,119,6,0.1)','rgba(22,163,74,0.1)'];
              const label=i<2?labels[i]:labels[2];
              const color=i<2?colors[i]:colors[2];
              const bg=i<2?bgs[i]:bgs[2];
              return(
                <div key={d.id} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'12px 0',borderBottom:'1px solid #e8f1fd'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                      <span style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'#0f2a5e'}}>{d.name}</span>
                      <span style={{background:bg,color,fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10}}>{label}</span>
                    </div>
                    <div style={{fontSize:12,color:'#6b8dc4'}}>Min: ${d.min.toFixed(2)}/mo · {d.rate.toFixed(2)}% APR</div>
                    <div className="debt-bar-track"><div className="debt-bar-fill" style={{width:`${Math.round((d.bal/maxBal)*100)}%`,background:color}}/></div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,color:'#0f2a5e'}}>${d.bal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                    <button className="btn-danger" style={{marginTop:6}} onClick={()=>setDebts(debts.filter(x=>x.id!==d.id))}>✕ Remove</button>
                  </div>
                </div>
              );
            })}
            <div className="tip-box" style={{marginTop:12}}><strong>Avalanche strategy:</strong> Pay minimums on all debts. Put every extra dollar toward <em>{sorted[0].name}</em> ({sorted[0].rate.toFixed(2)}% APR). Total minimums: <strong>${totalMin.toFixed(2)}/mo</strong>.</div>
          </>
        )}
      </div>
    </>
  );
}

function SavingsTab({transactions,goals,setGoals}){
  const [form,setForm]=useState({name:'',target:'',saved:''});
  const n=new Date();const m=n.getMonth();const y=n.getFullYear();
  const savTxs=transactions.filter(t=>{const d=new Date(t.date+'T00:00:00');return t.grp==='Savings'&&t.type==='debit'&&d.getMonth()===m&&d.getFullYear()===y;});
  const monthSavings=savTxs.reduce((s,t)=>s+t.amt,0);
  const monthIncome=transactions.filter(t=>{const d=new Date(t.date+'T00:00:00');return t.type==='credit'&&d.getMonth()===m&&d.getFullYear()===y;}).reduce((s,t)=>s+t.amt,0);
  const savRate=monthIncome>0?(monthSavings/monthIncome*100):0;
  const totalGoalTarget=goals.reduce((s,g)=>s+g.target,0);
  const totalGoalSaved=goals.reduce((s,g)=>s+g.saved,0);
  const addGoal=()=>{
    const name=form.name.trim();const target=parseFloat(form.target);const saved=parseFloat(form.saved)||0;
    if(!name||isNaN(target)||target<=0){alert('Enter a goal name and target.');return;}
    setGoals([...goals,{id:Date.now(),name,target,saved}]);
    setForm({name:'',target:'',saved:''});
  };
  return(
    <>
      <div className="metric-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>
        <div className="metric-card"><div className="lbl">Saved this month</div><div className={`val ${monthSavings>0?'val-teal':'val-red'}`}>${monthSavings.toFixed(2)}</div></div>
        <div className="metric-card"><div className="lbl">Savings rate</div><div className={`val ${savRate>=20?'val-green':savRate>=5?'val-amber':'val-red'}`}>{savRate.toFixed(1)}%</div></div>
        <div className="metric-card"><div className="lbl">Goals funded</div><div className="val val-gold">${totalGoalSaved.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}</div></div>
        <div className="metric-card"><div className="lbl">Total targets</div><div className="val val-teal">${totalGoalTarget.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}</div></div>
      </div>
      {monthSavings===0&&<div className="alert-box alert-warning" style={{marginBottom:12}}>No savings logged this month. Add transactions under the <strong>Savings</strong> group.</div>}
      {savRate>=20&&<div className="alert-box alert-success" style={{marginBottom:12}}>Excellent! You're saving {savRate.toFixed(1)}% of income this month 🎉</div>}
      {savRate>0&&savRate<5&&<div className="alert-box alert-warning" style={{marginBottom:12}}>Savings rate is {savRate.toFixed(1)}% — try to reach at least 10–20% of income.</div>}
      <div className="card">
        <div className="card-title">Add savings goal</div>
        <div className="form-row r4">
          <input placeholder="Goal name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          <input type="number" placeholder="Target ($)" min="0" step="100" value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))}/>
          <input type="number" placeholder="Already saved ($)" min="0" step="1" value={form.saved} onChange={e=>setForm(f=>({...f,saved:e.target.value}))}/>
          <button className="btn-gold" style={{alignSelf:'end'}} onClick={addGoal}>+ Add goal</button>
        </div>
      </div>
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
          <div className="card-title" style={{marginBottom:0}}>Your savings goals</div>
          {goals.length>0&&<ClearBtn label="Clear all" onClear={()=>setGoals([])} title="Clear all goals?" message="This will permanently delete all your savings goals." />}
        </div>
        {goals.length===0?<div className="empty-state">Add a goal above — emergency fund, vacation, down payment…</div>:goals.map(g=>{
          const pct=Math.min(100,Math.round(g.saved/g.target*100));
          const barC=pct>=100?'#16a34a':pct>=50?'#1a6fd4':'#0ea5e9';
          return(
            <div key={g.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #e8f1fd'}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'#0f2a5e'}}>{g.name}</span>
                  <span style={{fontSize:12,color:'#6b8dc4'}}>${Math.max(0,g.target-g.saved).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})} to go</span>
                </div>
                <div style={{fontSize:12,color:'#6b8dc4',marginBottom:5}}>${g.saved.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})} of ${g.target.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
                <div className="goal-bar-track"><div className="goal-bar-fill" style={{width:`${pct}%`,background:barC}}/></div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:16,fontWeight:700,color:barC}}>{pct}%</div>
                <input type="number" defaultValue={g.saved} min="0" step="10" style={{width:80,fontSize:12,padding:'3px 8px',marginTop:4}} onBlur={e=>{const updated=goals.map(x=>x.id===g.id?{...x,saved:Math.max(0,parseFloat(e.target.value)||0)}:x);setGoals(updated);}} title="Update saved amount"/>
                <button className="btn-danger" style={{display:'block',marginTop:4,width:'100%'}} onClick={()=>setGoals(goals.filter(x=>x.id!==g.id))}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="card-title">Savings transactions — this month</div>
        {savTxs.length===0?<div className="empty-state">No savings transactions this month.</div>:(
          <table>
            <thead><tr><th style={{width:70}}>Date</th><th>Description</th><th style={{width:130}}>Category</th><th style={{width:90,textAlign:'right'}}>Amount</th></tr></thead>
            <tbody>
              {savTxs.map(t=>{
                const ci=ALL_CATS[t.cat]||{color:'#1a6fd4',bg:'rgba(26,111,212,0.1)'};
                return(<tr key={t.id}><td style={{fontSize:11}}>{new Date(t.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td><td>{t.desc}</td><td><span className="badge" style={{background:ci.bg,color:ci.color}}>{t.cat}</span></td><td style={{textAlign:'right',fontWeight:600,color:'#1a6fd4'}}>+${t.amt.toFixed(2)}</td></tr>);
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function CashPopup({onClose}){
  return(
    <div className="modal-overlay" style={{zIndex:2000}}>
      <div className="modal-box slide-up" style={{maxWidth:500}}>
        <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
          <div style={{fontSize:48,marginBottom:12}}>💵</div>
          <h2 style={{fontFamily:'var(--font-display)',fontSize:24,marginBottom:10,color:'#0f2a5e'}}>Cash Spending Tracker</h2>
          <p style={{fontSize:14,color:'#6b8dc4',lineHeight:1.7}}>Cash feels simple — but it's actually the <strong style={{color:'#0f2a5e'}}>hardest money to track.</strong></p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:'1.75rem'}}>
          <div style={{background:'rgba(14,165,233,0.06)',border:'1px solid rgba(14,165,233,0.2)',borderRadius:'var(--radius-md)',padding:'12px 16px',display:'flex',gap:12}}>
            <span style={{fontSize:20,flexShrink:0}}>🤔</span>
            <div style={{fontSize:13,color:'#2d5a9e',lineHeight:1.6}}>You pull $200 from the ATM. A week later it's gone. <strong style={{color:'#0f2a5e'}}>Where did it go?</strong></div>
          </div>
          <div style={{background:'rgba(22,163,74,0.06)',border:'1px solid rgba(22,163,74,0.15)',borderRadius:'var(--radius-md)',padding:'12px 16px',display:'flex',gap:12}}>
            <span style={{fontSize:20,flexShrink:0}}>✅</span>
            <div style={{fontSize:13,color:'#2d5a9e',lineHeight:1.6}}>This tab fixes that. <strong style={{color:'#16a34a'}}>Log every cash purchase here.</strong></div>
          </div>
          <div style={{background:'rgba(26,111,212,0.06)',border:'1px solid rgba(26,111,212,0.15)',borderRadius:'var(--radius-md)',padding:'12px 16px',display:'flex',gap:12}}>
            <span style={{fontSize:20,flexShrink:0}}>💡</span>
            <div style={{fontSize:13,color:'#2d5a9e',lineHeight:1.6}}><strong style={{color:'#1a6fd4'}}>Pro tip:</strong> Log cash right when you spend it. $3 coffee = $90/month.</div>
          </div>
        </div>
        <button className="btn-gold" style={{width:'100%',padding:'13px',fontSize:14}} onClick={onClose}>Got it — let me start tracking my cash 💪</button>
      </div>
    </div>
  );
}

function CashTab({transactions,setTransactions}){
  const CASH_CATS=GROUPS['Cash Spending'].cats;
  const [form,setForm]=useState({date:new Date().toISOString().split('T')[0],desc:'',cat:CASH_CATS[0],amt:''});
  const [err,setErr]=useState({});
  const n=new Date();const m=n.getMonth();const y=n.getFullYear();
  const cashTxs=transactions.filter(t=>t.grp==='Cash Spending'&&t.type==='debit');
  const monthCash=cashTxs.filter(t=>{const d=new Date(t.date+'T00:00:00');return d.getMonth()===m&&d.getFullYear()===y;});
  const totalMonth=monthCash.reduce((s,t)=>s+t.amt,0);
  const totalAll=cashTxs.reduce((s,t)=>s+t.amt,0);
  const catTotals={};monthCash.forEach(t=>{catTotals[t.cat]=(catTotals[t.cat]||0)+t.amt;});
  const catList=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  const maxVal=catList[0]?.[1]||1;
  const addCash=()=>{
    const e={};
    if(!form.date)e.date=true;
    if(!form.desc.trim())e.desc=true;
    if(!form.amt||isNaN(parseFloat(form.amt))||parseFloat(form.amt)<=0)e.amt=true;
    if(Object.keys(e).length){setErr(e);return;}
    const updated=[{id:Date.now(),date:form.date,desc:form.desc.trim(),type:'debit',grp:'Cash Spending',cat:form.cat,amt:parseFloat(form.amt),note:'',refNum:''},...transactions];
    updated.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
    setTransactions(updated);
    setForm(f=>({...f,desc:'',amt:''}));setErr({});
  };
  return(
    <>
      <div className="metric-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>
        <div className="metric-card"><div className="lbl">Cash spent this month</div><div className="val" style={{color:'#0ea5e9'}}>${totalMonth.toFixed(2)}</div></div>
        <div className="metric-card"><div className="lbl">Transactions (month)</div><div className="val val-gold">{monthCash.length}</div></div>
        <div className="metric-card"><div className="lbl">Total cash tracked</div><div className="val val-teal">${totalAll.toFixed(2)}</div></div>
      </div>
      <div className="card">
        <div className="card-title">Log a cash purchase</div>
        <div className="form-row r3">
          <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={err.date?{borderColor:'#dc2626'}:{}}/>
          <input type="text" placeholder="What did you buy?" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} style={err.desc?{borderColor:'#dc2626'}:{}} onKeyDown={e=>e.key==='Enter'&&addCash()}/>
          <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
            {CASH_CATS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input type="number" placeholder="Amount ($)" min="0" step="0.01" value={form.amt} onChange={e=>setForm(f=>({...f,amt:e.target.value}))} style={{maxWidth:180,...(err.amt?{borderColor:'#dc2626'}:{})}} onKeyDown={e=>e.key==='Enter'&&addCash()}/>
          <button className="btn-gold" onClick={addCash}>+ Log cash</button>
        </div>
      </div>
      {catList.length>0&&(
        <div className="card">
          <div className="card-title">Where your cash went this month</div>
          {catList.map(([cat,val])=>(
            <div key={cat} className="cat-row">
              <div className="cat-label" title={cat}>{cat.replace('Cash - ','')}</div>
              <div className="cat-track"><div className="cat-fill" style={{width:`${Math.round((val/maxVal)*100)}%`,background:'#0ea5e9'}}/></div>
              <div className="cat-val" style={{color:'#0ea5e9'}}>${val.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
          <div className="card-title" style={{marginBottom:0}}>Cash purchase history</div>
          {cashTxs.length>0&&<ClearBtn label="Clear all" onClear={()=>setTransactions(transactions.filter(t=>t.grp!=='Cash Spending'))} title="Clear all cash transactions?" message="This will permanently delete all cash purchase history." />}
        </div>
        {cashTxs.length===0?<div className="empty-state">No cash purchases logged yet!</div>:(
          <table>
            <thead><tr><th style={{width:70}}>Date</th><th>Description</th><th style={{width:140}}>Category</th><th style={{width:80,textAlign:'right'}}>Amount</th><th style={{width:28}}></th></tr></thead>
            <tbody>
              {cashTxs.map(t=>(
                <tr key={t.id}>
                  <td style={{fontSize:11}}>{new Date(t.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                  <td>{t.desc}</td>
                  <td><span className="badge" style={{background:'rgba(14,165,233,0.1)',color:'#0ea5e9'}}>{t.cat.replace('Cash - ','')}</span></td>
                  <td style={{textAlign:'right',fontWeight:600,color:'#0ea5e9'}}>${t.amt.toFixed(2)}</td>
                  <td><button className="btn-danger" onClick={()=>setTransactions(transactions.filter(x=>x.id!==t.id))}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function TimelineTab({debts, extraPayment, setExtraPayment}){
  const extra = extraPayment || '';
  const setExtra = setExtraPayment;
  const extraAmt=parseFloat(extra)||0;
  const sorted=[...debts].sort((a,b)=>b.rate-a.rate);
  let freed=0;
  const results=sorted.map((d,i)=>{
    const mr=d.rate/100/12;const pmt=d.min+(i===0?extraAmt:0)+freed;
    let bal=d.bal,months=0,totalPaid=0;
    if(mr===0){months=Math.ceil(bal/pmt);totalPaid=months*pmt;}
    else{while(bal>0&&months<600){const int=bal*mr;const prin=Math.min(pmt-int,bal);if(prin<=0){months=9999;break;}bal-=prin;totalPaid+=pmt;months++;}}
    freed+=d.min;
    return{name:d.name,months,interest:Math.max(0,totalPaid-d.bal),rate:d.rate,min:d.min};
  });
  const tm=results[results.length-1]?.months||0;
  const ti=results.reduce((s,r)=>s+r.interest,0);
  const fmtMo=m=>m>=9999?'Never':m>12?`${Math.floor(m/12)}y ${m%12}mo`:`${m}mo`;
  return(
    <>
      <div className="card">
        <div className="card-title">Extra monthly payment toward top debt</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <input type="number" placeholder="Extra payment ($/mo)" min="0" step="10" value={extra} style={{maxWidth:220}} onChange={e=>setExtra(e.target.value)}/>
          <span style={{fontSize:13,color:'#6b8dc4'}}>beyond minimums</span>
        </div>
      </div>
      {debts.length===0?<div className="card"><div className="empty-state">Add debts in the Debt Stack tab first.</div></div>:(
        <div className="card">
          <div className="card-title">Payoff timeline</div>
          <div className="metric-grid" style={{gridTemplateColumns:'1fr 1fr',marginBottom:'1.25rem'}}>
            <div className="metric-card"><div className="lbl">Debt-free in</div><div className={`val ${tm>=9999?'val-red':'val-green'}`}>{fmtMo(tm)}</div></div>
            <div className="metric-card"><div className="lbl">Total interest paid</div><div className="val val-red">${ti.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})}</div></div>
          </div>
          {results.map((r,i)=>(
            <div key={i} style={{display:'flex',alignItems:'baseline',gap:10,padding:'8px 0',borderBottom:'1px solid #e8f1fd'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,color:'#1a6fd4',minWidth:32}}>#{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'#0f2a5e'}}>{r.name}</div>
                <div style={{fontSize:12,color:'#6b8dc4'}}>{r.rate.toFixed(2)}% APR · min ${r.min.toFixed(2)}/mo</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:700,color:'#0f2a5e'}}>{fmtMo(r.months)}</div>
                <div style={{fontSize:12,fontWeight:600,color:'#16a34a'}}>${r.interest.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0})} interest</div>
              </div>
            </div>
          ))}
          <div className="tip-box" style={{marginTop:12}}>Add an extra payment above to accelerate payoff and see how much interest you save.</div>
        </div>
      )}
    </>
  );
}

function SpendingTab({transactions,periodMode,setPeriodMode,periodOffset,setPeriodOffset}){
  const getPeriodBounds=(mode,offset)=>{
    const now=new Date();let start,end,label;
    if(mode==='monthly'){const d=new Date(now.getFullYear(),now.getMonth()+offset,1);start=new Date(d.getFullYear(),d.getMonth(),1);end=new Date(d.getFullYear(),d.getMonth()+1,0);label=start.toLocaleDateString('en-US',{month:'long',year:'numeric'});}
    else if(mode==='quarterly'){const bq=Math.floor(now.getMonth()/3)+offset;const yr=now.getFullYear()+Math.floor(bq/4);const q=((bq%4)+4)%4;start=new Date(yr,q*3,1);end=new Date(yr,q*3+3,0);label=`${'Q1Q2Q3Q4'.substr(q*2,2)} ${yr}`;}
    else{const yr=now.getFullYear()+offset;start=new Date(yr,0,1);end=new Date(yr,11,31);label=`${yr}`;}
    return{start,end,label};
  };
  const{start,end,label}=getPeriodBounds(periodMode,periodOffset);
  const txDebits=transactions.filter(t=>{const d=new Date(t.date+'T00:00:00');return t.type==='debit'&&d>=start&&d<=end;});
  const txCredits=transactions.filter(t=>{const d=new Date(t.date+'T00:00:00');return t.type==='credit'&&d>=start&&d<=end;});
  const curr={};const counts={};
  txDebits.forEach(t=>{curr[t.cat]=(curr[t.cat]||0)+t.amt;counts[t.cat]=(counts[t.cat]||0)+1;});
  const totalSpent=Object.values(curr).reduce((s,v)=>s+v,0);
  const totalIncome=txCredits.reduce((s,t)=>s+t.amt,0);
  const net=totalIncome-totalSpent;
  const cats=Object.entries(curr).sort((a,b)=>b[1]-a[1]);
  const byGrp={};cats.forEach(([cat,val])=>{const g=ALL_CATS[cat]?.group||'Other';if(!byGrp[g])byGrp[g]=[];byGrp[g].push([cat,val]);});
  const maxV=cats[0]?.[1]||1;
  const count=periodMode==='yearly'?5:6;
  const trendData=[];
  for(let i=-(count-1);i<=0;i++){
    const{start:s,end:e,label:l}=getPeriodBounds(periodMode,periodOffset+i);
    const tot=transactions.filter(t=>{const d=new Date(t.date+'T00:00:00');return t.type==='debit'&&d>=s&&d<=e;}).reduce((s,t)=>s+t.amt,0);
    trendData.push({label:l.replace(' 20',"'"),value:parseFloat(tot.toFixed(2)),current:i===0});
  }
  const maxTrend=Math.max(...trendData.map(d=>d.value),1);

  const exportMonthlySummary=()=>{
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>MoneyMap Summary — ${label}</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#0f2a5e;background:#fff}h1{color:#1a6fd4;border-bottom:2px solid #1a6fd4;padding-bottom:10px}h2{color:#2d5a9e;margin-top:24px;font-size:16px}.metric{display:inline-block;background:#f0f6ff;border:1px solid #c7ddf7;border-radius:8px;padding:12px 20px;margin:6px;text-align:center}.metric .val{font-size:24px;font-weight:800;color:#1a6fd4}.metric .lbl{font-size:11px;color:#6b8dc4;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#f0f6ff;padding:8px;text-align:left;font-size:12px;color:#6b8dc4;text-transform:uppercase}td{padding:8px;border-bottom:1px solid #e8f1fd;font-size:13px}.green{color:#16a34a}.red{color:#dc2626}</style></head><body><h1>💰 MoneyMap Monthly Summary</h1><h2>${label}</h2><div><div class="metric"><div class="val">$${totalIncome.toFixed(2)}</div><div class="lbl">Income</div></div><div class="metric"><div class="val red">$${totalSpent.toFixed(2)}</div><div class="lbl">Spent</div></div><div class="metric"><div class="val ${net>=0?'green':'red'}">${net<0?'-':''}$${Math.abs(net).toFixed(2)}</div><div class="lbl">Net ${net>=0?'Surplus':'Deficit'}</div></div></div><h2>Spending by Category</h2><table><tr><th>Category</th><th>Group</th><th>Transactions</th><th>Total</th><th>% of Spending</th></tr>${cats.map(([cat,val])=>`<tr><td>${cat}</td><td>${ALL_CATS[cat]?.group||'Other'}</td><td>${counts[cat]||0}</td><td>$${val.toFixed(2)}</td><td>${totalSpent>0?((val/totalSpent)*100).toFixed(1):0}%</td></tr>`).join('')}</table><p style="margin-top:30px;font-size:11px;color:#6b8dc4;text-align:center">Generated by MoneyMap — ${new Date().toLocaleDateString()}</p></body></html>`;
    const blob=new Blob([html],{type:'text/html'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`MoneyMap_${label.replace(' ','_')}.html`;a.click();
  };

  return(
    <>
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:'1rem'}}>
          <div className="card-title" style={{marginBottom:0}}>Spending report</div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <div className="pb-bar">
              {['monthly','quarterly','yearly'].map(mode=>(
                <button key={mode} className={`pb ${periodMode===mode?'active':''}`} onClick={()=>{setPeriodMode(mode);setPeriodOffset(0);}}>{mode.charAt(0).toUpperCase()+mode.slice(1)}</button>
              ))}
            </div>
            <button className="btn-outline" style={{fontSize:11}} onClick={exportMonthlySummary}>📤 Export Summary</button>
          </div>
        </div>
        <div className="period-nav">
          <button onClick={()=>setPeriodOffset(o=>o-1)}>‹</button>
          <div className="period-label">{label}</div>
          <button onClick={()=>setPeriodOffset(o=>o+1)}>›</button>
        </div>
      </div>
      <div className="metric-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}>
        <div className="metric-card"><div className="lbl">Total spent</div><div className="val val-red">${totalSpent.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
        <div className="metric-card"><div className="lbl">Income</div><div className={`val ${totalIncome>0?'val-green':'val-red'}`}>${totalIncome.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
        <div className="metric-card"><div className="lbl">Net {net>=0?'surplus':'deficit'}</div><div className={`val ${net>=0?'val-teal':'val-red'}`}>{net<0?'-':''}${Math.abs(net).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
      </div>
      <div className="card">
        <div className="card-title">Spending by category — {label}</div>
        {cats.length===0?<div className="empty-state">No expenses in this period.</div>:(
          Object.entries(byGrp).map(([g,items])=>{
            const gv=GROUPS[g];
            return(
              <div key={g} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600,color:gv?.color||'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>{g}</div>
                {items.map(([cat,val])=>(
                  <div key={cat} className="cat-row">
                    <div className="cat-label" title={cat}>{cat}</div>
                    <div className="cat-track"><div className="cat-fill" style={{width:`${Math.round((val/maxV)*100)}%`,background:ALL_CATS[cat]?.color||'#6b7280'}}/></div>
                    <div className="cat-val">${val.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
      <div className="card">
        <div className="card-title">Category breakdown</div>
        <table>
          <thead><tr><th>Group</th><th>Category</th><th style={{width:50}}>Count</th><th style={{width:82,textAlign:'right'}}>Total</th><th style={{width:56,textAlign:'right'}}>%</th></tr></thead>
          <tbody>
            {cats.length===0?<tr><td colSpan={5} className="empty-state">No data for this period.</td></tr>:cats.map(([cat,val])=>{
              const g=ALL_CATS[cat]?.group||'Other';const gv=GROUPS[g];
              return(<tr key={cat}><td><span className="grp-badge" style={{background:gv?.bg||'rgba(107,114,128,0.1)',color:gv?.color||'#6b7280'}}>{g}</span></td><td style={{fontSize:12}}>{cat}</td><td>{counts[cat]||0}</td><td style={{textAlign:'right',fontWeight:600}}>${val.toFixed(2)}</td><td style={{textAlign:'right'}}>{totalSpent>0?((val/totalSpent)*100).toFixed(1):0}%</td></tr>);
            })}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="card-title">Spending trend</div>
        {trendData.every(d=>d.value===0)?(
          <div className="empty-state">Add transactions to see your spending trend.</div>
        ):(
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:160,padding:'0 4px'}}>
            {trendData.map((d,i)=>(
              <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                <div style={{fontSize:9,color:'#6b8dc4',fontWeight:600}}>${d.value>999?`${(d.value/1000).toFixed(1)}k`:d.value.toFixed(0)}</div>
                <div style={{width:'100%',borderRadius:'4px 4px 0 0',background:d.current?'#1a6fd4':'rgba(26,111,212,0.25)',height:`${Math.max(4,Math.round((d.value/maxTrend)*120))}px`,transition:'height 0.4s ease',minHeight:4}}/>
                <div style={{fontSize:9,color:d.current?'#1a6fd4':'#6b8dc4',fontWeight:d.current?700:400,textAlign:'center',whiteSpace:'nowrap'}}>{d.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function MovePicker({accounts,currentAccount,onMove}){
  const [show,setShow]=useState(false);
  const [menuPos,setMenuPos]=useState({top:0,left:0,right:'auto'});
  const btnRef=useRef(null);
  const menuRef=useRef(null);
  const others=Object.entries(accounts).filter(([k])=>k!==currentAccount);

  useEffect(()=>{
    if(!show)return;
    const reposition=()=>{
      if(!btnRef.current)return;
      const rect=btnRef.current.getBoundingClientRect();
      const menuWidth=150;
      const menuHeight=others.length*36+30;
      const vw=window.innerWidth;
      const vh=window.innerHeight;
      let left=rect.left;
      let top=rect.bottom+4;
      // flip right if overflows right edge
      if(left+menuWidth>vw-8) left=rect.right-menuWidth;
      // clamp left edge
      if(left<8) left=8;
      // flip above if overflows bottom
      if(top+menuHeight>vh-8) top=rect.top-menuHeight-4;
      setMenuPos({top,left});
    };
    reposition();
    window.addEventListener('scroll',reposition,true);
    window.addEventListener('resize',reposition);
    return()=>{
      window.removeEventListener('scroll',reposition,true);
      window.removeEventListener('resize',reposition);
    };
  },[show,others.length]);

  useEffect(()=>{
    if(!show)return;
    const handleClick=e=>{
      if(btnRef.current&&btnRef.current.contains(e.target))return;
      if(menuRef.current&&menuRef.current.contains(e.target))return;
      setShow(false);
    };
    document.addEventListener('mousedown',handleClick);
    return()=>document.removeEventListener('mousedown',handleClick);
  },[show]);

  if(others.length===0)return null;

  if(others.length===1){
    return(
      <button onClick={()=>onMove(others[0][0])} style={{background:'rgba(124,58,237,0.1)',color:'#7c3aed',border:'1px solid rgba(124,58,237,0.2)',borderRadius:'var(--radius-sm)',padding:'3px 7px',fontSize:11,cursor:'pointer'}} title={`Move to ${others[0][1].name}`}>↗</button>
    );
  }

  return(
    <div style={{display:'inline-block'}}>
      <button ref={btnRef} onClick={()=>setShow(s=>!s)} style={{background:'rgba(124,58,237,0.1)',color:'#7c3aed',border:'1px solid rgba(124,58,237,0.2)',borderRadius:'var(--radius-sm)',padding:'3px 7px',fontSize:11,cursor:'pointer'}}>↗</button>
      {show&&(
        <div ref={menuRef} style={{position:'fixed',top:menuPos.top,left:menuPos.left,background:'#fff',border:'1px solid #c7ddf7',borderRadius:'var(--radius-md)',boxShadow:'0 4px 20px rgba(26,111,212,0.15)',zIndex:9999,minWidth:150,marginTop:0}}>
          <div style={{fontSize:10,color:'#6b8dc4',padding:'6px 10px 4px',fontWeight:600,textTransform:'uppercase',borderBottom:'1px solid #e8f1fd'}}>Move to</div>
          {others.map(([k,a])=>(
            <div key={k} onMouseDown={()=>{onMove(k);setShow(false);}} style={{padding:'9px 12px',fontSize:12,color:'#0f2a5e',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background='#f0f6ff'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              {a.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function EditBillForm({bill,billCats,onSave,onCancel}){
  const [form,setForm]=useState({...bill});
  const daySuffix=d=>{if(d>=11&&d<=13)return`${d}th`;const s=['th','st','nd','rd'];return`${d}${s[d%10]||'th'}`;};
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Bill name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
        <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Amount</label><input type="number" value={form.amount} min="0" step="0.01" onChange={e=>setForm(f=>({...f,amount:parseFloat(e.target.value)||0}))}/></div>
        <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Due day</label><select value={form.dueDay} onChange={e=>setForm(f=>({...f,dueDay:parseInt(e.target.value)}))}>{Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{daySuffix(d)} of the month</option>)}</select></div>
        <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Category</label><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{billCats.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      </div>
      <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:16,fontSize:13,color:'#2d5a9e'}}>
        <input type="checkbox" checked={form.autopay||false} onChange={e=>setForm(f=>({...f,autopay:e.target.checked}))} style={{width:15,height:15,accentColor:'#1a6fd4'}}/>
        This bill is on autopay
      </label>
      <div style={{display:'flex',gap:10}}>
        <button className="btn-outline" style={{flex:1}} onClick={onCancel}>Cancel</button>
        <button className="btn-gold" style={{flex:1}} onClick={()=>onSave(form)}>Save changes</button>
      </div>
    </div>
  );
}

function EditSubForm({sub,categories,onSave,onCancel}){
  const [form,setForm]=useState({...sub});
  const daySuffix=d=>{if(d>=11&&d<=13)return`${d}th`;const s=['th','st','nd','rd'];return`${d}${s[d%10]||'th'}`;};
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Service name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
        <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Amount</label><input type="number" value={form.amount} min="0" step="0.01" onChange={e=>setForm(f=>({...f,amount:parseFloat(e.target.value)||0}))}/></div>
        <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Billing cycle</label><select value={form.cycle} onChange={e=>setForm(f=>({...f,cycle:e.target.value}))}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
        <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Category</label><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Due day</label><select value={form.dueDay||1} onChange={e=>setForm(f=>({...f,dueDay:parseInt(e.target.value)}))}>{Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{daySuffix(d)} of the month</option>)}</select></div>
        <div style={{display:'flex',alignItems:'flex-end',paddingBottom:4}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'#2d5a9e'}}>
            <input type="checkbox" checked={form.autopay||false} onChange={e=>setForm(f=>({...f,autopay:e.target.checked}))} style={{width:15,height:15,accentColor:'#1a6fd4'}}/>
            Autopay
          </label>
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn-outline" style={{flex:1}} onClick={onCancel}>Cancel</button>
        <button className="btn-gold" style={{flex:1}} onClick={()=>onSave(form)}>Save changes</button>
      </div>
    </div>
  );
}


function SubscriptionsSection({subscriptions,setSubscriptions,transactions,goals,accounts,activeAccount,setAccounts,saveToFirebase,onMoveSubscription}){
  const now=new Date();
  const monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const todayDay=now.getDate();
  const [form,setForm]=useState({name:'',amount:'',cycle:'monthly',category:'Streaming',dueDay:'1',autopay:false});
  const [showForm,setShowForm]=useState(false);
  const [err,setErr]=useState({});
  const [paySubModal,setPaySubModal]=useState(null);
  const [editingSub,setEditingSub]=useState(null);
  const CATEGORIES=['Streaming','Music','Gaming','Fitness','Software','News','Food / Delivery','Education','Other'];
  const daySuffix=d=>{if(d>=11&&d<=13)return`${d}th`;const s=['th','st','nd','rd'];return`${d}${s[d%10]||'th'}`;};

  const addSub=()=>{
    const e={};
    if(!form.name.trim())e.name=true;
    if(!form.amount||isNaN(parseFloat(form.amount))||parseFloat(form.amount)<=0)e.amount=true;
    if(Object.keys(e).length){setErr(e);return;}
    const updated=[...subscriptions,{id:Date.now(),name:form.name.trim(),amount:parseFloat(form.amount),cycle:form.cycle,category:form.category,dueDay:parseInt(form.dueDay),autopay:form.autopay,subsPaid:{}}];
    setSubscriptions(updated);
    setForm({name:'',amount:'',cycle:'monthly',category:'Streaming',dueDay:'1',autopay:false});
    setErr({});setShowForm(false);
  };

  const isPaid=sub=>!!(sub.subsPaid&&sub.subsPaid[monthKey]);
  const paidAt=sub=>{const p=sub.subsPaid&&sub.subsPaid[monthKey];return p?new Date(p.paidAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}):null;};
  const getDueStatus=dueDay=>{if(dueDay<todayDay)return'overdue';if(dueDay-todayDay<=3)return'due-soon';return'upcoming';};

  const handlePaySub=(sub)=>setPaySubModal(sub);

  const handlePaySubConfirm=(selectedAccountKey,deduct)=>{
    const sub=paySubModal;
    const key=monthKey;
    const updated=subscriptions.map(s=>{
      if(s.id!==sub.id)return s;
      return{...s,subsPaid:{...(s.subsPaid||{}),[key]:{paidAt:new Date().toISOString()}}};
    });
    if(deduct&&accounts&&selectedAccountKey){
      const targetAcct=accounts[selectedAccountKey];
      const newTx={id:Date.now(),date:now.toISOString().split('T')[0],desc:sub.name,type:'debit',grp:'Personal',cat:'Subscriptions',amt:sub.amount,note:'Subscription',refNum:''};
      const updatedTxs=[newTx,...(targetAcct.transactions||[])];
      updatedTxs.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
      const updatedAccounts={...accounts,[activeAccount]:{...accounts[activeAccount],subscriptions:updated},[selectedAccountKey]:{...accounts[selectedAccountKey],transactions:updatedTxs}};
      setAccounts(updatedAccounts);
      saveToFirebase(updatedAccounts);
    } else {
      setSubscriptions(updated);
    }
    setPaySubModal(null);
  };

  const handleUnpaySub=subId=>{
    const updated=subscriptions.map(s=>{
      if(s.id!==subId)return s;
      const newPaid={...(s.subsPaid||{})};
      delete newPaid[monthKey];
      return{...s,subsPaid:newPaid};
    });
    setSubscriptions(updated);
  };

  const monthlyTotal=subscriptions.reduce((s,sub)=>s+(sub.cycle==='yearly'?sub.amount/12:sub.amount),0);
  const yearlyTotal=subscriptions.reduce((s,sub)=>s+(sub.cycle==='yearly'?sub.amount:sub.amount*12),0);
  const paidCount=subscriptions.filter(s=>isPaid(s)).length;
  const totalPaid=subscriptions.filter(s=>isPaid(s)).reduce((s,sub)=>s+(sub.cycle==='yearly'?sub.amount/12:sub.amount),0);

  const warnings=[];
  if(subscriptions.length>=3&&subscriptions.length<5){
    warnings.push({type:'warning',msg:'You have '+subscriptions.length+' subscriptions totaling $'+monthlyTotal.toFixed(2)+'/month — that\'s $'+yearlyTotal.toFixed(0)+' per year! Small amounts add up fast.'});
  }
  if(subscriptions.length>=5){
    warnings.push({type:'danger',msg:'⚠️ '+subscriptions.length+' subscriptions at $'+monthlyTotal.toFixed(2)+'/month. What if you redirected even $30 of that to your emergency fund every month?'});
  }
  if(monthlyTotal>=50){
    const goal=goals&&goals.length>0?goals[0]:null;
    const goalMsg=goal?' That\'s enough to fund your '+goal.name+' goal in '+Math.ceil(Math.max(0,goal.target-goal.saved)/monthlyTotal)+' months!':'';
    warnings.push({type:'danger',msg:'🚨 You\'re spending $'+monthlyTotal.toFixed(2)+'/month on subscriptions. That same money earning compound interest over 20 years could grow significantly.'+goalMsg+' Your future self will thank you for redirecting even part of this!'});
  }

  const statusColors={
    paid:{bg:'rgba(22,163,74,0.1)',color:'#16a34a',label:'✓ Paid'},
    overdue:{bg:'rgba(220,38,38,0.1)',color:'#dc2626',label:'Overdue'},
    'due-soon':{bg:'rgba(217,119,6,0.1)',color:'#d97706',label:'Due soon'},
    upcoming:{bg:'rgba(107,114,128,0.08)',color:'#6b7280',label:'Upcoming'},
  };

  return(
    <>
      {editingSub&&(
        <div className="modal-overlay" style={{zIndex:3000}}>
          <div className="modal-box slide-up" style={{maxWidth:480}}>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:'1.25rem',color:'#0f2a5e'}}>✏️ Edit Subscription</h2>
            <EditSubForm sub={editingSub} categories={['Streaming','Music','Gaming','Fitness','Software','News','Food / Delivery','Education','Other']} onSave={(updated)=>{setSubscriptions(subscriptions.map(s=>s.id===updated.id?updated:s));setEditingSub(null);}} onCancel={()=>setEditingSub(null)} />
          </div>
        </div>
      )}
      {paySubModal&&(
        <div className="modal-overlay" style={{zIndex:3000}}>
          <div className="modal-box slide-up" style={{maxWidth:420}}>
            <div style={{textAlign:'center',marginBottom:'1.25rem'}}>
              <div style={{fontSize:36,marginBottom:8}}>📱</div>
              <h2 style={{fontFamily:'var(--font-display)',fontSize:20,marginBottom:6,color:'#0f2a5e'}}>Mark "{paySubModal.name}" as paid</h2>
              <p style={{fontSize:13,color:'#6b8dc4'}}>${paySubModal.amount.toFixed(2)}</p>
            </div>
            {accounts&&(
              <PaySubAccountSelector accounts={accounts} sub={paySubModal} onConfirm={handlePaySubConfirm} onCancel={()=>setPaySubModal(null)} />
            )}
          </div>
        </div>
      )}

      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:showForm?'1rem':0,flexWrap:'wrap',gap:8}}>
          <div>
            <div className="card-title" style={{marginBottom:2}}>📱 Subscriptions</div>
            <div style={{fontSize:12,color:'#6b8dc4'}}>Track recurring subscriptions separately from bills</div>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {subscriptions.length>0&&<ClearBtn label="Clear all" onClear={()=>setSubscriptions([])} title="Clear all subscriptions?" message="This will permanently delete all subscriptions." />}
            <button className="btn-gold" style={{fontSize:12,padding:'6px 14px'}} onClick={()=>setShowForm(f=>!f)}>{showForm?'✕ Cancel':'+ Add subscription'}</button>
          </div>
        </div>
        {showForm&&(
          <div style={{borderTop:'1px solid #c7ddf7',paddingTop:'1rem'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Service name</label><input placeholder="e.g. Netflix, Spotify" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={err.name?{borderColor:'#dc2626'}:{}}/></div>
              <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Amount</label><input type="number" placeholder="$0.00" min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} style={err.amount?{borderColor:'#dc2626'}:{}}/></div>
              <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Billing cycle</label><select value={form.cycle} onChange={e=>setForm(f=>({...f,cycle:e.target.value}))}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
              <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Category</label><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:4}}>Due day</label><select value={form.dueDay} onChange={e=>setForm(f=>({...f,dueDay:e.target.value}))}>{Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{daySuffix(d)} of the month</option>)}</select></div>
              <div style={{display:'flex',alignItems:'flex-end',paddingBottom:4}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'#2d5a9e'}}>
                  <input type="checkbox" checked={form.autopay} onChange={e=>setForm(f=>({...f,autopay:e.target.checked}))} style={{width:15,height:15,accentColor:'#1a6fd4'}}/>
                  Autopay
                </label>
              </div>
            </div>
            <button className="btn-gold" onClick={addSub}>Save subscription</button>
          </div>
        )}
      </div>

      {warnings.map((w,i)=>(
        <div key={i} className={'alert-box alert-'+w.type} style={{marginBottom:8}}>{w.msg}</div>
      ))}

      {subscriptions.filter(s=>!isPaid(s)&&getDueStatus(s.dueDay)==='overdue').length>0&&<div className="alert-box alert-danger" style={{marginBottom:8}}>⚠️ <strong>{subscriptions.filter(s=>!isPaid(s)&&getDueStatus(s.dueDay)==='overdue').length} subscription(s) past due</strong></div>}
      {subscriptions.filter(s=>!isPaid(s)&&getDueStatus(s.dueDay)==='due-soon').length>0&&<div className="alert-box alert-warning" style={{marginBottom:8}}>🔔 <strong>{subscriptions.filter(s=>!isPaid(s)&&getDueStatus(s.dueDay)==='due-soon').length} subscription(s) due within 3 days</strong></div>}

      {subscriptions.length>0&&(
        <>
          <div className="metric-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))',marginBottom:'1rem'}}>
            <div className="metric-card"><div className="lbl">Monthly cost</div><div className="val val-red">${monthlyTotal.toFixed(2)}</div></div>
            <div className="metric-card"><div className="lbl">Yearly cost</div><div className="val" style={{color:'#dc2626'}}>${yearlyTotal.toFixed(0)}</div></div>
            <div className="metric-card"><div className="lbl">Paid this month</div><div className="val val-green">${totalPaid.toFixed(2)}</div></div>
            <div className="metric-card"><div className="lbl">Paid</div><div className="val val-teal">{paidCount} / {subscriptions.length}</div></div>
          </div>

          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table>
              <thead><tr>
                <th style={{padding:'12px 16px'}}>Service</th>
                <th style={{width:90}}>Category</th>
                <th style={{width:70,textAlign:'center'}}>Due</th>
                <th style={{width:80,textAlign:'right'}}>Amount</th>
                <th style={{width:120,textAlign:'center'}}>Status</th>
                <th style={{width:90,textAlign:'center'}}>Paid on</th>
                <th style={{width:40}}></th>
              </tr></thead>
              <tbody>
                {subscriptions.map(sub=>{
                  const paid=isPaid(sub);
                  const status=paid?'paid':getDueStatus(sub.dueDay);
                  const sc=statusColors[status];
                  return(
                    <tr key={sub.id} style={{opacity:paid?0.75:1}}>
                      <td style={{padding:'10px 16px'}}>
                        <div style={{fontWeight:600,fontSize:13,color:paid?'#6b8dc4':'#0f2a5e',textDecoration:paid?'line-through':'none'}}>{sub.name}</div>
                        <div style={{fontSize:10,color:'#7c3aed',fontWeight:600,marginTop:1}}>{sub.cycle==='yearly'?'📅 YEARLY':'🔄 MONTHLY'}{sub.autopay?' · ⚡ AUTOPAY':''}</div>
                      </td>
                      <td style={{fontSize:11,color:'#6b8dc4'}}>{sub.category}</td>
                      <td style={{textAlign:'center'}}><span style={{fontSize:12,fontWeight:600,color:paid?'#6b8dc4':status==='overdue'?'#dc2626':status==='due-soon'?'#d97706':'#2d5a9e'}}>{daySuffix(sub.dueDay)}</span></td>
                      <td style={{textAlign:'right',fontWeight:700,fontSize:13,color:paid?'#6b8dc4':'#0f2a5e'}}>${sub.amount.toFixed(2)}</td>
                      <td style={{textAlign:'center'}}>
                        {paid?(
                          <button onClick={()=>handleUnpaySub(sub.id)} style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.color}40`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>{sc.label}</button>
                        ):(
                          <button onClick={()=>handlePaySub(sub)} style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.color}40`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>{sc.label}</button>
                        )}
                      </td>
                      <td style={{textAlign:'center',fontSize:11,color:'#6b8dc4'}}>{paidAt(sub)||'—'}</td>
                      <td style={{textAlign:'center'}}>
                        <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                          <button onClick={()=>setEditingSub(sub)} style={{background:'rgba(26,111,212,0.1)',color:'#1a6fd4',border:'1px solid rgba(26,111,212,0.2)',borderRadius:'var(--radius-sm)',padding:'3px 7px',fontSize:11,cursor:'pointer'}}>✏️</button>
                          {accounts&&Object.keys(accounts).filter(k=>k!==activeAccount).length>0&&<MovePicker accounts={accounts} currentAccount={activeAccount} onMove={(targetKey)=>onMoveSubscription&&onMoveSubscription(sub,targetKey)} />}
                          <button className="btn-danger" onClick={()=>setSubscriptions(subscriptions.filter(s=>s.id!==sub.id))}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-title">Subscription progress — {now.toLocaleDateString('en-US',{month:'long'})}</div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#6b8dc4',marginBottom:6}}><span>{paidCount} of {subscriptions.length} paid</span><span>${totalPaid.toFixed(2)} of ${monthlyTotal.toFixed(2)}</span></div>
            <div style={{background:'#e8f1fd',borderRadius:6,height:10,overflow:'hidden'}}>
              <div style={{height:10,borderRadius:6,width:`${subscriptions.length>0?Math.round((paidCount/subscriptions.length)*100):0}%`,background:paidCount===subscriptions.length?'#16a34a':'linear-gradient(90deg,#7c3aed,#a78bfa)',transition:'width 0.4s ease'}}/>
            </div>
            {paidCount===subscriptions.length&&subscriptions.length>0&&<div style={{textAlign:'center',fontSize:12,color:'#16a34a',marginTop:8,fontWeight:600}}>🎉 All subscriptions paid for {now.toLocaleDateString('en-US',{month:'long'})}!</div>}
          </div>

          <div className="tip-box" style={{marginBottom:'1rem'}}>
            💡 <strong>Pay your future self first.</strong> Consider redirecting even one subscription toward your savings goals. Compound interest means money saved today is worth significantly more tomorrow.
          </div>
        </>
      )}
    </>
  );
}

function PaySubAccountSelector({accounts,sub,onConfirm,onCancel}){
  const [selectedAccount,setSelectedAccount]=useState(Object.keys(accounts)[0]||'main');
  const [deduct,setDeduct]=useState(true);
  return(
    <>
      <div style={{marginBottom:16}}>
        <label style={{fontSize:12,color:'#6b8dc4',display:'block',marginBottom:6,fontWeight:500}}>Deduct from which account?</label>
        <select value={selectedAccount} onChange={e=>setSelectedAccount(e.target.value)} style={{marginBottom:10}}>
          {Object.entries(accounts).map(([key,acct])=><option key={key} value={key}>{acct.name}</option>)}
        </select>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,color:'#2d5a9e'}}>
          <input type="checkbox" checked={deduct} onChange={e=>setDeduct(e.target.checked)} style={{width:15,height:15,accentColor:'#1a6fd4'}}/>
          Automatically add debit transaction to this account
        </label>
      </div>
      <div style={{background:'#f0f6ff',borderRadius:'var(--radius-md)',padding:'10px 14px',marginBottom:16,fontSize:12,color:'#2d5a9e'}}>
        {deduct?`A debit of $${sub.amount.toFixed(2)} will be added to "${accounts[selectedAccount]?.name}" register.`:'Subscription will be marked paid without affecting any account balance.'}
      </div>
      <div style={{display:'flex',gap:10}}>
        <button className="btn-outline" style={{flex:1}} onClick={onCancel}>Cancel</button>
        <button className="btn-gold" style={{flex:1}} onClick={()=>onConfirm(selectedAccount,deduct)}>✓ Mark as Paid</button>
      </div>
    </>
  );
}


function exportCSV(transactions,beginBal){
  const sorted=[...transactions].sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id);
  const rows=[['Date','Description','Group','Category','Type','Amount','Balance','Note','Ref #','Recurring']];
  let runBal=beginBal.amount||0;
  if(beginBal.set)rows.push([beginBal.date,'Beginning Balance','—','—','credit',beginBal.amount.toFixed(2),runBal.toFixed(2),'','','']);
  sorted.forEach(t=>{runBal+=t.type==='credit'?t.amt:-t.amt;rows.push([t.date,`"${t.desc}"`,t.grp||'',t.cat,t.type,t.amt.toFixed(2),runBal.toFixed(2),t.note||'',t.refNum||'',t.recurring||'none']);});
  const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='moneymap_register.csv';a.click();
}

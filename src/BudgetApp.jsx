import React, { useState, useEffect, useRef } from 'react';
import AppTour, { useTour } from './AppTour';
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
          <p style={{ fontSize:13, color:'#6b8dc4', lineHeight:1.7 }}>
            Are you sure you want to cancel, {firstName}? Your email and PIN will be deactivated and all your data will be removed. <strong style={{ color:'#0f2a5e' }}>This cannot be undone.</strong>
          </p>
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
        <p style={{ fontSize:14, color:'#6b8dc4', lineHeight:1.7, marginBottom:16 }}>Your account has been cancelled. Your email and PIN are no longer active.</p>
        <div style={{ background:'rgba(26,111,212,0.06)', border:'1px solid rgba(26,111,212,0.2)', borderRadius:'var(--radius-md)', padding:'14px 16px', marginBottom:16 }}>
          <p style={{ fontSize:13, color:'#2d5a9e', lineHeight:1.6 }}>💙 You're always welcome back. Just sign up again — it's always free.</p>
        </div>
        <p style={{ fontSize:12, color:'#6b8dc4' }}>Redirecting you in a moment…</p>
      </div>
    </div>
  );
}

export default function BudgetApp({ lead, firebaseUser, onSignOut, onDeleteAccount }) {
  const uid = firebaseUser?.uid;
  const [activeAccount, setActiveAccount] = useState('main');
  const [accounts, setAccounts] = useState({ main: { name:'Main Account', transactions:[], debts:[], budgets:{}, beginBal:{amount:0,date:'',set:false}, goals:[], bills:[], billsPaid:{} } });
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
  const { showTour, completeTour, resetTour } = useTour();

  useEffect(() => {
    if (!uid) return;
    const docRef = doc(db, 'users', uid, 'data', 'budgetData');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.accounts) setAccounts(data.accounts);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  const saveToFirebase = async (updatedAccounts) => {
    if (!uid) return;
    try {
      const docRef = doc(db, 'users', uid, 'data', 'budgetData');
      await setDoc(docRef, { accounts: updatedAccounts }, { merge: true });
      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 1800);
    } catch (err) { console.error('Save error:', err); }
  };

  const updateAccount = (field, value) => {
    const updated = { ...accounts, [activeAccount]: { ...accounts[activeAccount], [field]: value } };
    setAccounts(updated);
    saveToFirebase(updated);
  };

  const acct = accounts[activeAccount] || accounts.main;
  const { transactions, debts, budgets, beginBal, goals, bills, billsPaid } = acct;

  const txs = v => updateAccount('transactions', v);
  const dbs = v => updateAccount('debts', v);
  const bgs = v => updateAccount('budgets', v);
  const bbs = v => updateAccount('beginBal', v);
  const gls = v => updateAccount('goals', v);
  const bls = v => updateAccount('bills', v);
  const bps = v => updateAccount('billsPaid', v);

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
    const updated = { ...accounts, [key]: { name:newAccountName.trim(), transactions:[], debts:[], budgets:{}, beginBal:{amount:0,date:'',set:false}, goals:[], bills:[], billsPaid:{} } };
    setAccounts(updated);
    saveToFirebase(updated);
    setActiveAccount(key);
    setNewAccountName('');
    setShowAddAccount(false);
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
      {showVideo && <WelcomeVideoModal lead={lead} onClose={closeVideo} />}
      {showCashPopup && <CashPopup onClose={closeCashPopup} />}
      {showDeleteModal && <DeleteAccountModal lead={lead} onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} />}
      {showGoodbye && <GoodbyeModal lead={lead} />}

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #c7ddf7', padding:'0.875rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, boxShadow:'0 2px 8px rgba(26,111,212,0.08)' }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'#1a6fd4' }}>MoneyMap</div>
          <div style={{ fontSize:12, color:'#6b8dc4' }}>Welcome back, {firstName} 👋</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          {savedMsg && <span style={{ fontSize:12, color:'#16a34a' }}>✓ {savedMsg}</span>}
          <button className="btn-outline" style={{ fontSize:11 }} onClick={resetTour}>🗺 Tour</button>
          <button className="btn-outline" style={{ fontSize:11 }} onClick={() => exportCSV(transactions, beginBal)}>⬇ CSV</button>
          <button className="btn-outline" style={{ fontSize:11 }} onClick={onSignOut}>Sign out</button>
          <button onClick={() => setShowDeleteModal(true)} style={{ background:'none', border:'none', color:'#6b8dc4', fontSize:11, cursor:'pointer', textDecoration:'underline' }}>Cancel account</button>
        </div>
      </div>

      {/* Account tabs */}
      <div style={{ background:'#fff', borderBottom:'1px solid #c7ddf7', padding:'0.5rem 1.5rem', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
        {Object.entries(accounts).map(([key, acctData]) => (
          <button key={key} onClick={() => setActiveAccount(key)} style={{ padding:'5px 14px', fontSize:12, fontWeight:600, borderRadius:20, cursor:'pointer', border:`1px solid ${activeAccount===key?'#1a6fd4':'#c7ddf7'}`, background: activeAccount===key?'rgba(26,111,212,0.1)':'transparent', color: activeAccount===key?'#1a6fd4':'#6b8dc4', fontFamily:'var(--font-display)', transition:'all 0.2s' }}>
            {acctData.name}
          </button>
        ))}
        {showAddAccount ? (
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <input value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="Account name" style={{ padding:'4px 10px', fontSize:12, width:150, borderRadius:20 }} onKeyDown={e => e.key==='Enter'&&addNewAccount()} autoFocus />
            <button className="btn-gold" style={{ padding:'5px 12px', fontSize:12 }} onClick={addNewAccount}>Add</button>
            <button className="btn-outline" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => setShowAddAccount(false)}>✕</button>
          </div>
        ) : (
          <button onClick={() => setShowAddAccount(true)} style={{ padding:'5px 12px', fontSize:11, borderRadius:20, cursor:'pointer', border:'1px dashed #c7ddf7', background:'transparent', color:'#6b8dc4', transition:'all 0.2s' }}>+ Add account</button>
        )}
      </div>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'1.25rem 1rem 4rem' }}>
        <MetricsBar transactions={transactions} debts={debts} beginBal={beginBal} />
        <AlertsBar transactions={transactions} budgets={budgets} />
        <div className="tabs">
          {tabs.map(t => (
            <button key={t.id} className={`tab ${activeTab===t.id?'active':''}`} onClick={() => handleTabSwitch(t.id)}>
              <span style={{ marginRight:4 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        {activeTab==='register' && <RegisterTab transactions={transactions} setTransactions={txs} beginBal={beginBal} setBeginBal={bbs} />}
        {activeTab==='bills' && <BillsTab bills={bills} setBills={bls} billsPaid={billsPaid} setBillsPaid={bps} />}
        {activeTab==='budgets' && <BudgetsTab transactions={transactions} budgets={budgets} setBudgets={bgs} />}
        {activeTab==='debts' && <DebtsTab debts={debts} setDebts={dbs} />}
        {activeTab==='savings' && <SavingsTab transactions={transactions} goals={goals} setGoals={gls} />}
        {activeTab==='cash' && <CashTab transactions={transactions} setTransactions={txs} />}
        {activeTab==='timeline' && <TimelineTab debts={debts} />}
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

function RegisterTab({transactions,setTransactions,beginBal,setBeginBal}){
  const [form,setForm]=useState({date:new Date().toISOString().split('T')[0],desc:'',type:'debit',grp:'',cat:'',amt:''});
  const [bbEdit,setBbEdit]=useState(false);
  const [bbForm,setBbForm]=useState({date:beginBal.date||new Date().toISOString().split('T')[0],amount:beginBal.amount||''});
  const [filterGrp,setFilterGrp]=useState('');
  const [filterCat,setFilterCat]=useState('');
  const [err,setErr]=useState({});
  const grpCats=form.grp?GROUPS[form.grp]?.cats||[]:[];
  const addTx=()=>{
    const e={};
    if(!form.date)e.date=true;
    if(!form.desc.trim())e.desc=true;
    if(!form.cat)e.cat=true;
    if(!form.amt||isNaN(parseFloat(form.amt))||parseFloat(form.amt)<=0)e.amt=true;
    if(Object.keys(e).length){setErr(e);return;}
    const updated=[{id:Date.now(),date:form.date,desc:form.desc.trim(),type:form.type,grp:form.grp,cat:form.cat,amt:parseFloat(form.amt)},...transactions];
    updated.sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
    setTransactions(updated);
    setForm(f=>({...f,desc:'',amt:''}));
    setErr({});
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
            <button className="btn-outline" style={{fontSize:12}} onClick={()=>setBbEdit(true)}>Edit</button>
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
          <input type="text" placeholder="Description" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} style={err.desc?{borderColor:'#dc2626'}:{}}/>
        </div>
        <div className="form-row r4" style={{marginBottom:12}}>
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
        <button className="btn-gold" onClick={addTx}>+ Add entry</button>
      </div>
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
          <div className="card-title" style={{marginBottom:0}}>Register</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
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
            <th style={{width:64}}>Date</th><th>Description</th><th style={{width:112}}>Category</th>
            <th style={{width:66}}>Debit</th><th style={{width:66}}>Credit</th><th style={{width:72}}>Balance</th><th style={{width:28}}></th>
          </tr></thead>
          <tbody>
            {beginBal.set&&!filterGrp&&!filterCat&&(
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
                <tr key={t.id}>
                  <td style={{fontSize:11,whiteSpace:'nowrap'}}>{new Date(t.date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                  <td title={t.desc} style={{fontSize:12}}>{t.desc}</td>
                  <td><span className="grp-badge" style={{background:ci.bg,color:ci.color}}>{t.grp||'?'}</span><span style={{fontSize:11,color:'#6b8dc4'}}>{t.cat}</span></td>
                  <td className="debit-color">{t.type==='debit'?'$'+t.amt.toFixed(2):''}</td>
                  <td className="credit-color">{t.type==='credit'?'$'+t.amt.toFixed(2):''}</td>
                  <td className={`fw ${bal>=0?'credit-color':'debit-color'}`} style={{fontSize:12}}>${Math.abs(bal).toFixed(2)}</td>
                  <td><button className="btn-danger" onClick={()=>setTransactions(transactions.filter(x=>x.id!==t.id))}>✕</button></td>
                </tr>
              );
            })}
            {filtered.length===0&&<tr><td colSpan={7} className="empty-state">No transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BillsTab({bills,setBills,billsPaid,setBillsPaid}){
  const now=new Date();
  const monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const todayDay=now.getDate();
  const BILL_CATS=['Mortgage / rent','Electric bill','Water bill','Gas / heat bill','Internet','Cable / streaming','Phone bill','HOA fee','Auto insurance','Life insurance','Health insurance','Dental / vision','Home / renters ins.','Car payment','Student loan','Credit card payment','Personal loan','Gym membership','Subscriptions','Childcare / daycare','School tuition','Other fixed bill'];
  const [form,setForm]=useState({name:'',amount:'',dueDay:'1',category:'Electric bill',autopay:false});
  const [showForm,setShowForm]=useState(false);
  const [err,setErr]=useState({});
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
  const togglePaid=billId=>{
    const key=`${monthKey}_${billId}`;
    const updated={...billsPaid};
    if(updated[key])delete updated[key];
    else updated[key]={paidAt:new Date().toISOString()};
    setBillsPaid(updated);
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
      {bills.filter(b=>!isPaid(b.id)&&getDueStatus(b.dueDay)==='overdue').length>0&&<div className="alert-box alert-danger" style={{marginBottom:8}}>⚠️ <strong>{bills.filter(b=>!isPaid(b.id)&&getDueStatus(b.dueDay)==='overdue').length} bill(s) past due</strong></div>}
      {bills.filter(b=>!isPaid(b.id)&&getDueStatus(b.dueDay)==='due-soon').length>0&&<div className="alert-box alert-warning" style={{marginBottom:8}}>🔔 <strong>{bills.filter(b=>!isPaid(b.id)&&getDueStatus(b.dueDay)==='due-soon').length} bill(s) due within 3 days</strong></div>}
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:showForm?'1rem':0}}>
          <div className="card-title" style={{marginBottom:0}}>Fixed bills</div>
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
              <th style={{width:100,textAlign:'center'}}>Status</th>
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
                      <button onClick={()=>togglePaid(bill.id)} style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.color}40`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>{sc.label}</button>
                    </td>
                    <td style={{textAlign:'center',fontSize:11,color:'#6b8dc4'}}>{paidAt(bill.id)||'—'}</td>
                    <td style={{textAlign:'center'}}><button className="btn-danger" onClick={()=>setBills(bills.filter(b=>b.id!==bill.id))}>✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
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
        <div className="card-title">Debt stacking order — avalanche method</div>
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
        <div className="card-title">Your savings goals</div>
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
            <div style={{fontSize:13,color:'#2d5a9e',lineHeight:1.6}}>You pull $200 from the ATM. A week later it's gone. <strong style={{color:'#0f2a5e'}}>Where did it go?</strong> Most people have no idea.</div>
          </div>
          <div style={{background:'rgba(22,163,74,0.06)',border:'1px solid rgba(22,163,74,0.15)',borderRadius:'var(--radius-md)',padding:'12px 16px',display:'flex',gap:12}}>
            <span style={{fontSize:20,flexShrink:0}}>✅</span>
            <div style={{fontSize:13,color:'#2d5a9e',lineHeight:1.6}}>This tab fixes that. Log every cash purchase here. <strong style={{color:'#16a34a'}}>Including the money you thought just disappeared.</strong></div>
          </div>
          <div style={{background:'rgba(26,111,212,0.06)',border:'1px solid rgba(26,111,212,0.15)',borderRadius:'var(--radius-md)',padding:'12px 16px',display:'flex',gap:12}}>
            <span style={{fontSize:20,flexShrink:0}}>💡</span>
            <div style={{fontSize:13,color:'#2d5a9e',lineHeight:1.6}}><strong style={{color:'#1a6fd4'}}>Pro tip:</strong> Log cash purchases right when you spend them. Even $3 for coffee adds up to $90 a month.</div>
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
    const updated=[{id:Date.now(),date:form.date,desc:form.desc.trim(),type:'debit',grp:'Cash Spending',cat:form.cat,amt:parseFloat(form.amt)},...transactions];
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
        <div className="card-title">Cash purchase history</div>
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

function TimelineTab({debts}){
  const [extra,setExtra]=useState('');
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
  return(
    <>
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:'1rem'}}>
          <div className="card-title" style={{marginBottom:0}}>Spending report</div>
          <div className="pb-bar">
            {['monthly','quarterly','yearly'].map(mode=>(
              <button key={mode} className={`pb ${periodMode===mode?'active':''}`} onClick={()=>{setPeriodMode(mode);setPeriodOffset(0);}}>{mode.charAt(0).toUpperCase()+mode.slice(1)}</button>
            ))}
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

function exportCSV(transactions,beginBal){
  const sorted=[...transactions].sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id);
  const rows=[['Date','Description','Group','Category','Type','Amount','Balance']];
  let runBal=beginBal.amount||0;
  if(beginBal.set)rows.push([beginBal.date,'Beginning Balance','—','—','credit',beginBal.amount.toFixed(2),runBal.toFixed(2)]);
  sorted.forEach(t=>{runBal+=t.type==='credit'?t.amt:-t.amt;rows.push([t.date,`"${t.desc}"`,t.grp||'',t.cat,t.type,t.amt.toFixed(2),runBal.toFixed(2)]);});
  const blob=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='moneymap_register.csv';a.click();
}

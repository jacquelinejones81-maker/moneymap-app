import React, { useState, useEffect } from 'react';

export default function AdminPanel({ onBack }) {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('mm_leads') || '[]');
    setLeads(stored);
  }, []);

  const saveLeads = (updated) => { setLeads(updated); localStorage.setItem('mm_leads', JSON.stringify(updated)); };

  const toggle = (id, field) => {
    const updated = leads.map(l => l.id === id ? { ...l, [field]: !l[field] } : l);
    saveLeads(updated);
    if (selected?.id === id) setSelected(updated.find(l => l.id === id));
  };

  const deleteLead = (id) => {
    if (!window.confirm('Delete this lead?')) return;
    const updated = leads.filter(l => l.id !== id);
    saveLeads(updated);
    if (selected?.id === id) setSelected(null);
  };

  const exportCSV = () => {
    const rows = [['Name','Email','Phone','Wants Review','CRM Added','Book Sent','Review Called','Submitted At']];
    leads.forEach(l => rows.push([l.name, l.email, l.phone, l.wantsReview?'Yes':'No', l.crmAdded?'Yes':'No', l.bookSent?'Yes':'No', l.reviewCalled?'Yes':'No', new Date(l.submittedAt).toLocaleString()]));
    const blob = new Blob([rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'moneymap_leads.csv'; a.click();
  };

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchFilter = filter==='all' || (filter==='review'&&l.wantsReview) || (filter==='pending'&&(!l.crmAdded||!l.bookSent||(l.wantsReview&&!l.reviewCalled)));
    return matchSearch && matchFilter;
  });

  const pendingCount = leads.filter(l => !l.crmAdded||!l.bookSent||(l.wantsReview&&!l.reviewCalled)).length;
  const reviewCount = leads.filter(l => l.wantsReview).length;

  return (
    <div style={{ minHeight:'100vh', padding:'1.5rem' }}>
      <div style={{ maxWidth:960, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, marginBottom:4 }}>📋 Lead Dashboard</h1>
            <p style={{ color:'var(--text-muted)', fontSize:13 }}>MoneyMap — all signups in one place</p>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn-outline" onClick={exportCSV}>⬇ Export CSV</button>
            <button className="btn-outline" onClick={onBack}>← Back to app</button>
          </div>
        </div>

        <div className="metric-grid">
          <div className="metric-card"><div className="lbl">Total leads</div><div className="val val-gold">{leads.length}</div></div>
          <div className="metric-card"><div className="lbl">Want review</div><div className="val val-teal">{reviewCount}</div></div>
          <div className="metric-card"><div className="lbl">Action needed</div><div className="val val-red">{pendingCount}</div></div>
          <div className="metric-card"><div className="lbl">Fully processed</div><div className="val val-green">{leads.length - pendingCount}</div></div>
        </div>

        <div className="card">
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <input type="text" placeholder="Search by name, email, or phone…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex:1, minWidth:200 }} />
            <div style={{ display:'flex', gap:6 }}>
              {['all','review','pending'].map(f => (
                <button key={f} className={`pb ${filter===f?'active':''}`} onClick={() => setFilter(f)} style={{ fontSize:12 }}>
                  {f==='all'?'All':f==='review'?'🗓 Wants review':'⚠ Action needed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:selected?'1fr 340px':'1fr', gap:'1rem', alignItems:'start' }}>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ padding:'3rem' }}>
                {leads.length === 0 ? 'No leads yet. Share your landing page to start collecting signups.' : 'No leads match your search.'}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ padding:'12px 16px' }}>Name</th>
                    <th>Email</th>
                    <th style={{ width:110 }}>Phone</th>
                    <th style={{ width:70, textAlign:'center' }}>Review</th>
                    <th style={{ width:90, textAlign:'center' }}>Status</th>
                    <th style={{ width:60, textAlign:'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => {
                    const allDone = l.crmAdded && l.bookSent && (!l.wantsReview || l.reviewCalled);
                    const isSelected = selected?.id === l.id;
                    return (
                      <tr key={l.id} style={{ cursor:'pointer', background:isSelected?'rgba(201,168,76,0.05)':undefined }} onClick={() => setSelected(isSelected?null:l)}>
                        <td style={{ padding:'10px 16px', fontWeight:600, color:'var(--text-primary)' }}>{l.name}</td>
                        <td style={{ color:'var(--text-secondary)' }}>{l.email}</td>
                        <td>{l.phone}</td>
                        <td style={{ textAlign:'center' }}>
                          {l.wantsReview ? <span style={{ background:'rgba(14,165,160,0.15)', color:'var(--teal-light)', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600 }}>Yes</span> : <span style={{ color:'var(--text-muted)', fontSize:12 }}>—</span>}
                        </td>
                        <td style={{ textAlign:'center' }}>
                          {allDone ? <span style={{ color:'#4ade80', fontSize:13 }}>✓ Done</span> : <span style={{ color:'#fbbf24', fontSize:13 }}>⏳ Pending</span>}
                        </td>
                        <td style={{ textAlign:'center' }}>
                          <button className="btn-danger" onClick={e => { e.stopPropagation(); deleteLead(l.id); }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {selected && (
            <div className="card slide-up" style={{ position:'sticky', top:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:700 }}>{selected.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{new Date(selected.submittedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <button className="btn-outline" style={{ padding:'4px 10px', fontSize:12 }} onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:'1.25rem' }}>
                <ContactRow icon="📧" label="Email" value={selected.email} />
                <ContactRow icon="📞" label="Phone" value={selected.phone} />
                <ContactRow icon="📝" label="Wants review" value={selected.wantsReview?'Yes — schedule a call':'No'} highlight={selected.wantsReview} />
              </div>
              <div style={{ borderTop:'1px solid var(--navy-border)', paddingTop:'1.25rem' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Follow-up checklist</div>
                <CheckItem checked={selected.crmAdded} label="Added to CRM" note="Log this contact in your CRM" onChange={() => toggle(selected.id,'crmAdded')} />
                <CheckItem checked={selected.bookSent} label="Book sent" note="Sent 'How Money Works' to their email" onChange={() => toggle(selected.id,'bookSent')} />
                {selected.wantsReview && <CheckItem checked={selected.reviewCalled} label="Review scheduled" note="Called to schedule financial review" onChange={() => toggle(selected.id,'reviewCalled')} />}
              </div>
              <div style={{ marginTop:'1rem', display:'flex', gap:8 }}>
                <button className="btn-outline" style={{ flex:1, fontSize:12 }} onClick={() => navigator.clipboard.writeText(`${selected.name}\n${selected.email}\n${selected.phone}`)}>📋 Copy info</button>
                <button className="btn-danger" style={{ fontSize:12 }} onClick={() => deleteLead(selected.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value, highlight }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
      <div>
        <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>{label}</div>
        <div style={{ fontSize:13, color:highlight?'var(--teal-light)':'var(--text-primary)', fontWeight:highlight?600:400 }}>{value}</div>
      </div>
    </div>
  );
}

function CheckItem({ checked, label, note, onChange }) {
  return (
    <label style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(30,45,74,0.5)', cursor:'pointer' }}>
      <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${checked?'#4ade80':'var(--navy-border)'}`, background:checked?'rgba(74,222,128,0.2)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, transition:'all 0.2s' }}>
        {checked && <span style={{ color:'#4ade80', fontSize:12, fontWeight:700 }}>✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display:'none' }} />
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:checked?'#4ade80':'var(--text-primary)', transition:'color 0.2s' }}>{label}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{note}</div>
      </div>
    </label>
  );
}
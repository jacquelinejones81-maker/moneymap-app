import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function AdminPanel({ onBack }) {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const snap = await getDocs(collection(db, 'leads'));
      const data = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
      data.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setLeads(data);
    } catch (err) {
      console.error('Load error:', err);
      setError('Could not load leads. Check your Firestore rules.');
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (docId, updates) => {
    try {
      await updateDoc(doc(db, 'leads', docId), updates);
      setLeads(leads.map(l => l.docId === docId ? { ...l, ...updates } : l));
    } catch (err) { console.error('Update error:', err); }
  };

  const deleteLead = async (docId) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await deleteDoc(doc(db, 'leads', docId));
      setLeads(leads.filter(l => l.docId !== docId));
    } catch (err) { console.error('Delete error:', err); }
  };

  const exportCSV = () => {
    const rows = [['Name', 'Email', 'Phone', 'Wants Review', 'CRM Added', 'Book Sent', 'Review Scheduled', 'Date']];
    leads.forEach(l => rows.push([l.name, l.email, l.phone, l.wantsReview ? 'Yes' : 'No', l.crmAdded ? 'Yes' : 'No', l.bookSent ? 'Yes' : 'No', l.reviewCalled ? 'Yes' : 'No', new Date(l.submittedAt).toLocaleDateString()]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'moneymap_leads.csv'; a.click();
  };

  const copyContact = (lead) => {
    navigator.clipboard.writeText(`${lead.name} | ${lead.email} | ${lead.phone}`);
    alert('Copied!');
  };

  let filtered = leads;
  if (search) filtered = filtered.filter(l => `${l.name} ${l.email} ${l.phone}`.toLowerCase().includes(search.toLowerCase()));
  if (filter === 'review') filtered = filtered.filter(l => l.wantsReview);
  if (filter === 'action') filtered = filtered.filter(l => !l.crmAdded || !l.bookSent || !l.reviewCalled);

  const totalReview = leads.filter(l => l.wantsReview).length;
  const totalAction = leads.filter(l => !l.crmAdded || !l.bookSent || !l.reviewCalled).length;
  const totalDone = leads.filter(l => l.crmAdded && l.bookSent && l.reviewCalled).length;

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>📋 Lead Dashboard</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>MoneyMap — all signups in one place</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-outline" onClick={loadLeads}>↻ Refresh</button>
            <button className="btn-outline" onClick={exportCSV}>⬇ Export CSV</button>
            <button className="btn-outline" onClick={onBack}>← Back to app</button>
          </div>
        </div>

        <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))', marginBottom: '1.5rem' }}>
          <div className="metric-card"><div className="lbl">Total leads</div><div className="val val-gold">{leads.length}</div></div>
          <div className="metric-card"><div className="lbl">Want review</div><div className="val val-teal">{totalReview}</div></div>
          <div className="metric-card"><div className="lbl">Action needed</div><div className="val val-red">{totalAction}</div></div>
          <div className="metric-card"><div className="lbl">Fully processed</div><div className="val val-green">{totalDone}</div></div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'review', 'action'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 20, cursor: 'pointer', border: `1px solid ${filter === f ? 'var(--gold)' : 'var(--navy-border)'}`, background: filter === f ? 'rgba(201,168,76,0.15)' : 'transparent', color: filter === f ? 'var(--gold)' : 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  {f === 'all' ? 'All' : f === 'review' ? '📅 Wants review' : '⚠️ Action needed'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card"><div className="empty-state">Loading leads...</div></div>
        ) : error ? (
          <div className="card">
            <div className="alert-box alert-danger">{error}</div>
            <button className="btn-gold" style={{ marginTop: 12 }} onClick={loadLeads}>Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card"><div className="empty-state">No leads yet. Share your link to start collecting signups!</div></div>
        ) : (
          filtered.map(lead => (
            <div key={lead.docId} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>{lead.name}</span>
                    {lead.wantsReview && <span style={{ background: 'rgba(14,165,160,0.12)', color: 'var(--teal-light)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>Wants review</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(lead.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>📧 {lead.email}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📞 {lead.phone}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => copyContact(lead)}>Copy</button>
                  <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => deleteLead(lead.docId)}>✕</button>
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--navy-border)', marginTop: 12, paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['crmAdded', 'CRM Added'], ['bookSent', 'Book Sent'], ['reviewCalled', 'Review Scheduled']].map(([field, label]) => (
                  <button key={field} onClick={() => updateLead(lead.docId, { [field]: !lead[field] })}
                    style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer', border: `1px solid ${lead[field] ? '#4ade80' : 'var(--navy-border)'}`, background: lead[field] ? 'rgba(74,222,128,0.12)' : 'transparent', color: lead[field] ? '#4ade80' : 'var(--text-muted)', transition: 'all 0.2s' }}>
                    {lead[field] ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
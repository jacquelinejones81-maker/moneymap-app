import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function AdminPanel({ onBack }) {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [repFilter, setRepFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadLeads(); }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const snap = await getDocs(collection(db, 'leads'));
      const data = snap.docs
        .map(d => ({ ...d.data(), docId: d.id }))
        .filter(d => !d.archived);
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
    const rows = [['Name', 'Email', 'Phone', 'Referred By', 'Wants Review', 'CRM Added', 'Book Sent', 'Review Scheduled', 'Date']];
    filtered.forEach(l => rows.push([
      l.name, l.email, l.phone,
      l.referredBy || 'Direct',
      l.wantsReview ? 'Yes' : 'No',
      l.crmAdded ? 'Yes' : 'No',
      l.bookSent ? 'Yes' : 'No',
      l.reviewCalled ? 'Yes' : 'No',
      new Date(l.submittedAt).toLocaleDateString()
    ]));
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'moneymap_leads.csv'; a.click();
  };

  const copyContact = (lead) => {
    navigator.clipboard.writeText(`${lead.name} | ${lead.email} | ${lead.phone}`);
    alert('Copied!');
  };

  // Get unique rep names for filter dropdown
  const allReps = [...new Set(leads.map(l => l.referredBy).filter(Boolean))];

  let filtered = leads;
  if (search) filtered = filtered.filter(l => `${l.name} ${l.email} ${l.phone} ${l.referredBy||''}`.toLowerCase().includes(search.toLowerCase()));
  if (filter === 'review') filtered = filtered.filter(l => l.wantsReview);
  if (filter === 'action') filtered = filtered.filter(l => !l.crmAdded || !l.bookSent || !l.reviewCalled);
  if (repFilter) filtered = filtered.filter(l => (l.referredBy || '') === repFilter);

  const totalReview = leads.filter(l => l.wantsReview).length;
  const totalAction = leads.filter(l => !l.crmAdded || !l.bookSent || !l.reviewCalled).length;
  const totalDone = leads.filter(l => l.crmAdded && l.bookSent && l.reviewCalled).length;

  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1.5rem', background: '#f0f6ff' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, marginBottom: 4, color: '#0f2a5e' }}>📋 Lead Dashboard</h1>
            <p style={{ fontSize: 13, color: '#6b8dc4' }}>MoneyMap — all signups in one place</p>
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
            <input placeholder="Search by name, email, phone, or rep..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
            <select value={repFilter} onChange={e => setRepFilter(e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '8px 12px' }}>
              <option value="">All reps</option>
              <option value="">Direct (no rep)</option>
              {allReps.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'review', 'action'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 20, cursor: 'pointer', border: `1px solid ${filter === f ? '#1a6fd4' : '#c7ddf7'}`, background: filter === f ? 'rgba(26,111,212,0.1)' : 'transparent', color: filter === f ? '#1a6fd4' : '#6b8dc4', fontFamily: 'var(--font-display)' }}>
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
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#0f2a5e' }}>{lead.name}</span>
                    {lead.wantsReview && <span style={{ background: 'rgba(26,111,212,0.1)', color: '#1a6fd4', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>Wants review</span>}
                    {lead.referredBy && (
                      <span style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
                        👤 {lead.referredBy}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: '#6b8dc4' }}>{new Date(lead.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#2d5a9e', marginBottom: 2 }}>📧 {lead.email}</div>
                  <div style={{ fontSize: 13, color: '#2d5a9e', marginBottom: 2 }}>📞 {lead.phone}</div>
                  <div style={{ fontSize: 12, color: '#6b8dc4' }}>
                    👤 Referred by: <strong style={{ color: lead.referredBy ? '#7c3aed' : '#6b8dc4' }}>{lead.referredBy || 'Direct signup'}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => copyContact(lead)}>Copy</button>
                  <button className="btn-danger" style={{ fontSize: 11 }} onClick={() => deleteLead(lead.docId)}>✕</button>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #e8f1fd', marginTop: 12, paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['crmAdded', 'CRM Added'], ['bookSent', 'Book Sent'], ['reviewCalled', 'Review Scheduled']].map(([field, label]) => (
                  <button key={field} onClick={() => updateLead(lead.docId, { [field]: !lead[field] })}
                    style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer', border: `1px solid ${lead[field] ? '#16a34a' : '#c7ddf7'}`, background: lead[field] ? 'rgba(22,163,74,0.1)' : 'transparent', color: lead[field] ? '#16a34a' : '#6b8dc4', transition: 'all 0.2s' }}>
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

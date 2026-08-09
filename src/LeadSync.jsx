import { useEffect } from 'react';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// ── LEAD SYNC ──
// This module handles all Firebase writes from MoneyMap to the leads collection.
// It ensures the lead document exists and stays current so the NextLevel Hub
// pipeline can display specific interest notifications.

export async function syncLeadToFirebase(lead, uid) {
  if (!lead || !uid) return;
  try {
    const docId = uid;
    await setDoc(doc(db, 'leads', docId), {
      ...lead,
      docId,
      lastLoginAt: new Date().toISOString(),
    }, { merge: true });
    // Store docId back into lead object for use by other components
    lead.docId = docId;
  } catch (e) {
    console.error('LeadSync: lead sync error', e);
  }
}

export async function recordContactRequest(lead, uid, requestInfo) {
  // requestInfo = { icon, label, detail, source }
  if (!uid) {
    console.warn('LeadSync: no uid, skipping contact request');
    return;
  }

  const docId = lead?.docId || uid;

  const CATEGORY_MAP = {
    'Life Insurance':        'interest_life_ins_1',
    'Savings':               'interest_savings_1',
    'Debt':                  'interest_debt_1',
    'Debt Help':             'interest_debt_1',
    'Budgeting':             'interest_budget_1',
    'Identity Protection':   'interest_identity_1',
    'Legal Protection':      'interest_legal_1',
    'Mortgage':              'interest_mortgage_1',
    'Wealth Building':       'interest_wealth_1',
    'Emergency Account setup':        'interest_savings_1',
    'Short-Term Account setup':       'interest_savings_1',
    'Wealth Building Account setup':  'interest_wealth_1',
  };

  const interestKey = CATEGORY_MAP[requestInfo.label] || CATEGORY_MAP[requestInfo.source] || null;

  const update = {
    docId,
    lastInterestTopic: requestInfo.label,
    lastInterestAt: new Date().toISOString(),
  };

  if (interestKey) update[interestKey] = true;

  // Build contactRequests array entry
  const entry = {
    icon: requestInfo.icon || '💬',
    label: requestInfo.label,
    detail: requestInfo.detail || '',
    requestedAt: new Date().toISOString(),
    source: requestInfo.source || 'app',
  };

  try {
    // Use setDoc with merge so it works even if document doesn't exist yet
    const leadRef = doc(db, 'leads', docId);
    
    // First write the non-array fields
    await setDoc(leadRef, update, { merge: true });
    
    // Then append to contactRequests using a second write
    // (arrayUnion requires importing from firestore — we do it inline)
    const { arrayUnion } = await import('firebase/firestore');
    await setDoc(leadRef, {
      contactRequests: arrayUnion(entry),
    }, { merge: true });

    console.log('LeadSync: contact request recorded', requestInfo.label, 'for', docId);
  } catch (e) {
    console.error('LeadSync: contact request write error', e, 'docId:', docId);
  }
}

// Hook version for components that need to sync on mount
export function useLeadSync(lead, uid) {
  useEffect(() => {
    if (lead && uid) {
      syncLeadToFirebase(lead, uid);
    }
  }, [uid]);
}

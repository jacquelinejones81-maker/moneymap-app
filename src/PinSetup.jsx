import React, { useState, useRef, useEffect } from 'react';

export default function PinSetup({ lead, onComplete }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState('create');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);
  const confirmRefs = useRef([]);
  const firstName = lead?.name?.split(' ')[0] || 'there';

  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  useEffect(() => {
    if (step === 'confirm') {
      setTimeout(() => confirmRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handleDigit = (val, idx, arr, setArr, refs, nextAction) => {
    if (!/^\d*$/.test(val)) return;
    const updated = [...arr];
    updated[idx] = val.slice(-1);
    setArr(updated);
    setError('');
    if (val && idx < 3) refs.current[idx + 1]?.focus();
    if (val && idx === 3) {
      const full = [...updated].join('');
      if (full.length === 4) nextAction(full);
    }
  };

  const handleKeyDown = (e, idx, refs, arr, setArr) => {
    if (e.key === 'Backspace' && !arr[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handleCreateDone = (full) => { setStep('confirm'); };

  const handleConfirmDone = (full) => {
    const created = pin.join('');
    if (full !== created) {
      setError("PINs don't match. Let's try again.");
      setConfirmPin(['', '', '', '']);
      setShake(true);
      setTimeout(() => { setShake(false); confirmRefs.current[0]?.focus(); }, 600);
      return;
    }
    onComplete(full);
  };

  const resetAll = () => {
    setPin(['', '', '', '']);
    setConfirmPin(['', '', '', '']);
    setStep('create');
    setError('');
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="slide-up" style={{ background: 'var(--navy-card)', border: '1px solid var(--navy-border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem 2rem', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--gold)', marginBottom: '1.75rem' }}>MoneyMap</div>
        <div style={{ fontSize: 44, marginBottom: 12 }}>{step === 'create' ? '🔒' : '✅'}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>
          {step === 'create' ? `Secure your account, ${firstName}` : 'Confirm your PIN'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
          {step === 'create' ? "Create a 4-digit PIN. You'll use this every time you log in." : 'Enter your PIN one more time to confirm it.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: '1.5rem' }}>
          {(step === 'create' ? pin : confirmPin).map((d, i) => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: d ? 'var(--gold)' : 'transparent', border: `2px solid ${d ? 'var(--gold)' : 'var(--navy-border)'}`, transition: 'all 0.15s ease' }} />
          ))}
        </div>
        <div className={shake ? 'shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: '1.5rem' }}>
          {(step === 'create' ? pin : confirmPin).map((d, i) => (
            <input
              key={i}
              ref={el => step === 'create' ? (inputRefs.current[i] = el) : (confirmRefs.current[i] = el)}
              type="password" inputMode="numeric" maxLength={1} value={d}
              style={{ width: 52, height: 58, textAlign: 'center', fontSize: 24, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${d ? 'var(--gold)' : 'var(--navy-border)'}`, borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', caretColor: 'transparent', transition: 'border-color 0.2s' }}
              onChange={e => step === 'create' ? handleDigit(e.target.value, i, pin, setPin, inputRefs, handleCreateDone) : handleDigit(e.target.value, i, confirmPin, setConfirmPin, confirmRefs, handleConfirmDone)}
              onKeyDown={e => step === 'create' ? handleKeyDown(e, i, inputRefs, pin, setPin) : handleKeyDown(e, i, confirmRefs, confirmPin, setConfirmPin)}
            />
          ))}
        </div>
        {error && <div className="alert-box alert-danger" style={{ marginBottom: 16, textAlign: 'left' }}>{error}</div>}
        {step === 'confirm' && <button className="btn-outline" style={{ fontSize: 12, width: '100%' }} onClick={resetAll}>← Start over</button>}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 20, lineHeight: 1.5 }}>🔒 Your PIN is stored securely on your device.</p>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} } .shake{animation:shake 0.5s ease}`}</style>
    </div>
  );
}
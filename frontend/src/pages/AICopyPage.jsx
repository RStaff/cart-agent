import React, { useState } from 'react';
import { generateDemoCopy } from '../services/api';

export default function AICopyPage() {
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');
  const [subject, setSubject]   = useState('');
  const [total, setTotal]       = useState(0);
  const [items, setItems]       = useState([]);

  async function onGenerate() {
    setLoading(true);
    setErr('');
    try {
      const payload = await generateDemoCopy();
      setSubject(payload.subject || '(no subject)');
      setTotal(Number.isFinite(payload.total) ? payload.total : 0);
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (e) {
      console.error(e);
      setErr('Could not generate copy. Check API logs / CORS.');
      setSubject('');
      setTotal(0);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setErr('');
    setSubject('');
    setTotal(0);
    setItems([]);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>AI Copy Generator</h1>
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <button onClick={onGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate demo'}
        </button>
        <button onClick={onReset}>Reset</button>
      </div>

      {err && <div style={{ color: 'crimson', marginBottom: 12 }}>{err}</div>}

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, maxWidth: 720 }}>
        {subject && <p><strong>Subject:</strong> {subject}</p>}
        <p><strong>Computed Total:</strong> ${total.toFixed(2)}</p>
        <p><strong>Line Items</strong></p>
        <ul>
          {items.length > 0
            ? items.map((it, i) => (
                <li key={i}>
                  {it.title} × {it.quantity} @ ${
                    Number(it.unitPrice ?? it.price ?? 0).toFixed(2)
                  }
                </li>
              ))
            : <li>No items parsed.</li>}
        </ul>
      </div>
    </div>
  );
}

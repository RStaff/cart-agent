import React, {useState} from 'react'

export default function AICopyGenerator({ backendBase = "" }) {
  const [itemsText, setItemsText] = useState("T-Shirt x1\nJeans x1")
  const [tone, setTone] = useState("Friendly")
  const [brand, setBrand] = useState("Default")
  const [goal, setGoal] = useState("recover")
  const [total, setTotal] = useState("0")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  const handleGenerate = async () => {
    setLoading(true); setError(""); setResult(null)
    try {
      const items = itemsText.split("\n").map(s => s.trim()).filter(Boolean)
      const res = await fetch(`${backendBase || ""}/api/generate-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, tone, brand, goal, total: Number(total||0) })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{display:'grid', gap:16}}>
      <div style={{display:'grid', gap:8, gridTemplateColumns:'repeat(3, minmax(0,1fr))'}}>
        <div>
          <label style={{fontSize:12, fontWeight:600}}>Tone</label>
          <select value={tone} onChange={e=>setTone(e.target.value)} style={{width:'100%', padding:'8px'}}>
            <option>Friendly</option>
            <option>Urgent</option>
            <option>Luxury</option>
            <option>Casual</option>
            <option>Minimal</option>
          </select>
        </div>
        <div>
          <label style={{fontSize:12, fontWeight:600}}>Brand</label>
          <input value={brand} onChange={e=>setBrand(e.target.value)} style={{width:'100%', padding:'8px'}} />
        </div>
        <div>
          <label style={{fontSize:12, fontWeight:600}}>Goal</label>
          <select value={goal} onChange={e=>setGoal(e.target.value)} style={{width:'100%', padding:'8px'}}>
            <option value="recover">Recover Cart</option>
            <option value="upsell">Upsell</option>
          </select>
        </div>
      </div>

      <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 150px 150px'}}>
        <div>
          <label style={{fontSize:12, fontWeight:600}}>Items (one per line)</label>
          <textarea value={itemsText} onChange={e=>setItemsText(e.target.value)} style={{width:'100%', minHeight:100, padding:'8px'}} />
        </div>
        <div>
          <label style={{fontSize:12, fontWeight:600}}>Total ($)</label>
          <input inputMode="decimal" value={total} onChange={e=>setTotal(e.target.value)} style={{width:'100%', padding:'8px'}} />
        </div>
        <div style={{display:'flex', alignItems:'end'}}>
          <button onClick={handleGenerate} disabled={loading} style={{width:'100%', padding:'10px 12px', background:'black', color:'white', borderRadius:8, opacity: loading?0.6:1}}>
            {loading ? 'Generating…' : 'Generate Copy'}
          </button>
        </div>
      </div>

      {error && <div style={{color:'#b91c1c', fontSize:12}}>{error}</div>}

      {result && (
        <div style={{border:'1px solid #e5e7eb', borderRadius:12, padding:16, display:'grid', gap:8}}>
          {result.subject && <div style={{fontWeight:600}}>Subject: {result.subject}</div>}
          <pre style={{whiteSpace:'pre-wrap', fontSize:14, lineHeight:1.6, margin:0}}>{result.body}</pre>
          <div style={{fontSize:12, color:'#6b7280'}}>Provider: {result.provider}</div>
        </div>
      )}
    </div>
  )
}

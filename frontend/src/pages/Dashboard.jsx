import React from 'react'
import AICopyGenerator from '../components/AICopyGenerator.jsx'

export default function Dashboard() {
  return (
    <div style={{padding: '24px', maxWidth: 900, margin: '0 auto'}}>
      <h1 style={{fontSize: 24, fontWeight: 700, marginBottom: 16}}>AI Copy Generator</h1>
      <AICopyGenerator backendBase={import.meta.env.VITE_BACKEND_BASE || ""} />
    </div>
  )
}

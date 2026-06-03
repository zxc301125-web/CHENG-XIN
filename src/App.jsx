import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import Properties from './pages/Properties'
import Tenants from './pages/Tenants'
import Leases from './pages/Leases'
import ClientNeeds from './pages/ClientNeeds'
import Maintenance from './pages/Maintenance'
import Admin from './pages/Admin'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) {
        fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)
    let tries = 0
    let data = null
    while (tries < 3 && !data) {
      const res = await supabase.from('profiles').select('*').eq('id', userId).single()
      data = res.data
      if (!data) {
        await new Promise(r => setTimeout(r, 800))
      }
      tries++
    }
    setProfile(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f4f0' }}>
        <p style={{ color: '#7b1c3e', fontSize: '14px' }}>載入中...</p>
      </div>
    )
  }

  if (!session) return <Login onLogin={() => {}} />

  if (!profile) {
    return <StatusScreen icon='⚠️' title='無法讀取帳號資料' message='請聯絡管理員協助處理。' onLogout={handleLogout} />
  }

  if (profile.status === 'pending') {
    return <StatusScreen icon='⏳' title='帳號審核中' message='正等待管理員審核通過' onLogout={handleLogout} />
  }

  if (profile.status === 'rejected') {
    return <StatusScreen icon='🚫' title='帳號未通過審核' message='您的帳號未通過審核,如有疑問請聯絡管理員。' onLogout={handleLogout} />
  }

  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path='/' element={<Home profile={profile} />} />
          <Route path='/properties' element={<Properties />} />
          <Route path='/tenants' element={<Tenants />} />
          <Route path='/leases' element={<Leases />} />
          <Route path='/client-needs' element={<ClientNeeds />} />
          <Route path='/maintenance' element={<Maintenance />} />
          <Route path='/admin' element={profile.role === 'admin' ? <Admin /> : <Navigate to='/' replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function StatusScreen({ icon, title, message, email, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #7b1c3e 0%, #b52d56 50%, #9d2449 100%)', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '40px 32px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', maxWidth: '380px', width: '100%' }}>
        <div style={{ fontSize: '52px', marginBottom: '14px', lineHeight: 1 }}>{icon}</div>
        <h2 style={{ color: '#7b1c3e', margin: '0 0 10px', fontSize: '20px' }}>{title}</h2>
        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 14px', lineHeight: 1.6 }}>{message}</p>
        {email && (
          <p style={{ color: '#999', fontSize: '12px', margin: '0 0 22px', padding: '6px 12px', background: '#f9f5f0', borderRadius: '8px', display: 'inline-block' }}>{email}</p>
        )}
        <div>
          <button onClick={onLogout} style={{ padding: '10px 28px', borderRadius: '8px', background: '#7b1c3e', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>返回登入</button>
        </div>
      </div>
    </div>
  )
}

export default App

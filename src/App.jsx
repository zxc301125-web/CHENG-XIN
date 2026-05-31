import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import Properties from './pages/Properties'
import Tenants from './pages/Tenants'
import Leases from './pages/Leases'
import ClientNeeds from './pages/ClientNeeds'
import Maintenance from './pages/Maintenance'
import Payments from './pages/Payments'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>載入中...</p></div>
  if (!session) return <Login onLogin={() => {}} />

  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/properties' element={<Properties />} />
          <Route path='/tenants' element={<Tenants />} />
          <Route path='/leases' element={<Leases />} />
          <Route path='/payments' element={<Payments />} />
          <Route path='/client-needs' element={<ClientNeeds />} />
          <Route path='/maintenance' element={<Maintenance />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App

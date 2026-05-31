const fs = require('fs')

const code = `import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleLogin() {
    if (!email || !password) return setError('\u8acb\u586b\u5beb\u4fe1\u7b31\u548c\u5bc6\u78bc')
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('\u4fe1\u7b31\u6216\u5bc6\u78bc\u932f\u8aa4')
    else onLogin()
    setLoading(false)
  }

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) return setError('\u8acb\u586b\u5beb\u6240\u6709\u6b04\u4f4d')
    if (password !== confirmPassword) return setError('\u5169\u6b21\u5bc6\u78bc\u4e0d\u4e00\u81f4')
    if (password.length < 6) return setError('\u5bc6\u78bc\u81f3\u5c11\u9700\u8981 6 \u500b\u5b57\u5143')
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (error) setError('\u65b0\u589e\u5931\u6557\uff1a' + error.message)
    else { setSuccess('\u54e1\u5de5\u5e33\u865f\u5df2\u5efa\u7acb\uff01'); setName(''); setEmail(''); setPassword(''); setConfirmPassword('') }
    setLoading(false)
  }

  function switchMode(m) {
    setMode(m); setError(''); setSuccess(''); setEmail(''); setPassword(''); setConfirmPassword(''); setName('')
  }

  const inp = { width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e8c8d0', fontSize: '15px', boxSizing: 'border-box' }
  const lbl = { display: 'block', fontSize: '13px', color: '#7b1c3e', fontWeight: '600', marginBottom: '6px' }
  const eye = { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0' }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #7b1c3e 0%, #b52d56 50%, #9d2449 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', padding: '40px 32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>\u2728</div>
          <h1 style={{ margin: '0 0 4px', color: '#7b1c3e', fontSize: '22px' }}>\u6f84\u65b0\u623f\u5c4b</h1>
          <p style={{ margin: 0, color: '#999', fontSize: '13px', letterSpacing: '2px' }}>CHENG XIN REAL ESTATE</p>
        </div>
        <div style={{ display: 'flex', background: '#f8f0f3', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
          <button onClick={() => switchMode('login')} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: mode === 'login' ? '#7b1c3e' : 'transparent', color: mode === 'login' ? '#fff' : '#999', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>\u54e1\u5de5\u767b\u5165</button>
          <button onClick={() => switchMode('register')} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: mode === 'register' ? '#7b1c3e' : 'transparent', color: mode === 'register' ? '#fff' : '#999', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>\u65b0\u589e\u54e1\u5de5</button>
        </div>
        {mode === 'login' ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>\u96fb\u5b50\u4fe1\u7b31</label>
              <input type='email' style={inp} placeholder='employee@example.com' value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={lbl}>\u5bc6\u78bc</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} style={{ ...inp, paddingRight: '44px' }} placeholder='\u8acb\u8f38\u5165\u5bc6\u78bc' value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                <button onClick={() => setShowPassword(!showPassword)} style={eye}>{showPassword ? '\ud83d\ude48' : '\ud83d\udc41\ufe0f'}</button>
              </div>
            </div>
            {error && <div style={{ background: '#fdf0f3', border: '1px solid #e8a0b0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#9d2449', textAlign: 'center' }}>\u26a0\ufe0f {error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: loading ? '#ccc' : '#7b1c3e', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? '\u767b\u5165\u4e2d...' : '\u767b\u5165'}</button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>\u54e1\u5de5\u59d3\u540d</label>
              <input style={inp} placeholder='\u8acb\u8f38\u5165\u54e1\u5de5\u59d3\u540d' value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>\u96fb\u5b50\u4fe1\u7b31</label>
              <input type='email' style={inp} placeholder='employee@example.com' value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>\u5bc6\u78bc</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} style={{ ...inp, paddingRight: '44px' }} placeholder='\u81f3\u5c11 6 \u500b\u5b57\u5143' value={password} onChange={e => setPassword(e.target.value)} />
                <button onClick={() => setShowPassword(!showPassword)} style={eye}>{showPassword ? '\ud83d\ude48' : '\ud83d\udc41\ufe0f'}</button>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={lbl}>\u78ba\u8a8d\u5bc6\u78bc</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPassword ? 'text' : 'password'} style={{ ...inp, paddingRight: '44px' }} placeholder='\u518d\u6b21\u8f38\u5165\u5bc6\u78bc' value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eye}>{showConfirmPassword ? '\ud83d\ude48' : '\ud83d\udc41\ufe0f'}</button>
              </div>
            </div>
            {error && <div style={{ background: '#fdf0f3', border: '1px solid #e8a0b0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#9d2449', textAlign: 'center' }}>\u26a0\ufe0f {error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #a0e0b0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#2d7a49', textAlign: 'center' }}>\u2705 {success}</div>}
            <button onClick={handleRegister} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: loading ? '#ccc' : '#7b1c3e', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? '\u5efa\u7acb\u4e2d...' : '\u5efa\u7acb\u54e1\u5de5\u5e33\u865f'}</button>
          </>
        )}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#bbb', marginTop: '20px', marginBottom: 0 }}>\u50c5\u9650\u6388\u6b0a\u54e1\u5de5\u4f7f\u7528</p>
      </div>
    </div>
  )
}`

fs.writeFileSync('src/pages/Login.jsx', code, 'utf8')
console.log('done')

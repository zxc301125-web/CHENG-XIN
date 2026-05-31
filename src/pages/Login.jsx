import { useState } from 'react'
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
    if (!email || !password) return setError('請填寫信箱和密碼')
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('信箱或密碼錯誤')
    else onLogin()
    setLoading(false)
  }

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) return setError('請填寫所有欄位')
    if (password !== confirmPassword) return setError('兩次密碼不一致')
    if (password.length < 6) return setError('密碼至少需要 6 個字元')
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (error) setError('新增失敗：' + error.message)
    else { setSuccess('員工帳號已建立！'); setName(''); setEmail(''); setPassword(''); setConfirmPassword('') }
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
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>✨</div>
          <h1 style={{ margin: '0 0 4px', color: '#7b1c3e', fontSize: '22px' }}>澄新房屋</h1>
          <p style={{ margin: 0, color: '#999', fontSize: '13px', letterSpacing: '2px' }}>CHENG XIN REAL ESTATE</p>
        </div>
        <div style={{ display: 'flex', background: '#f8f0f3', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
          <button onClick={() => switchMode('login')} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: mode === 'login' ? '#7b1c3e' : 'transparent', color: mode === 'login' ? '#fff' : '#999', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>員工登入</button>
          <button onClick={() => switchMode('register')} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: mode === 'register' ? '#7b1c3e' : 'transparent', color: mode === 'register' ? '#fff' : '#999', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>新增員工</button>
        </div>
        {mode === 'login' ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={lbl}>電子信箱</label>
              <input type='email' style={inp} placeholder='employee@example.com' value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={lbl}>密碼</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} style={{ ...inp, paddingRight: '44px' }} placeholder='請輸入密碼' value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                <button onClick={() => setShowPassword(!showPassword)} style={eye}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
            {error && <div style={{ background: '#fdf0f3', border: '1px solid #e8a0b0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#9d2449', textAlign: 'center' }}>⚠️ {error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: loading ? '#ccc' : '#7b1c3e', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? '登入中...' : '登入'}</button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>員工姓名</label>
              <input style={inp} placeholder='請輸入員工姓名' value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>電子信箱</label>
              <input type='email' style={inp} placeholder='employee@example.com' value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>密碼</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} style={{ ...inp, paddingRight: '44px' }} placeholder='至少 6 個字元' value={password} onChange={e => setPassword(e.target.value)} />
                <button onClick={() => setShowPassword(!showPassword)} style={eye}>{showPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={lbl}>確認密碼</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPassword ? 'text' : 'password'} style={{ ...inp, paddingRight: '44px' }} placeholder='再次輸入密碼' value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eye}>{showConfirmPassword ? '🙈' : '👁️'}</button>
              </div>
            </div>
            {error && <div style={{ background: '#fdf0f3', border: '1px solid #e8a0b0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#9d2449', textAlign: 'center' }}>⚠️ {error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #a0e0b0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#2d7a49', textAlign: 'center' }}>✅ {success}</div>}
            <button onClick={handleRegister} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: loading ? '#ccc' : '#7b1c3e', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? '建立中...' : '建立員工帳號'}</button>
          </>
        )}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#bbb', marginTop: '20px', marginBottom: 0 }}>僅限授權員工使用</p>
      </div>
    </div>
  )
}
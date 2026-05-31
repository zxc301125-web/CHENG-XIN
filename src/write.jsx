const fs = require('fs')

const code = `import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Link } from 'react-router-dom'

export default function Home() {
  const [stats, setStats] = useState({ properties: 0, tenants: 0, leases: 0, maintenance: 0, clients: 0, rented: 0 })
  const [announcements, setAnnouncements] = useState([])
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', content: '', important: false })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [p, t, l, m, c, a] = await Promise.all([
      supabase.from('properties').select('id, status'),
      supabase.from('tenants').select('id'),
      supabase.from('leases').select('id'),
      supabase.from('maintenance').select('id'),
      supabase.from('client_needs').select('id'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false })
    ])
    const rented = (p.data || []).filter(x => x.status === '已租').length
    setStats({ properties: (p.data||[]).length, tenants: (t.data||[]).length, leases: (l.data||[]).length, maintenance: (m.data||[]).length, clients: (c.data||[]).length, rented })
    setAnnouncements(a.data || [])
  }

  async function handleAddAnn() {
    if (!annForm.title || !annForm.content) return alert('請填寫標題和內容')
    await supabase.from('announcements').insert([annForm])
    setAnnForm({ title: '', content: '', important: false })
    setShowAnnForm(false)
    fetchAll()
  }

  async function handleDeleteAnn(id) {
    if (!window.confirm('確定刪除此公告？')) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchAll()
  }

  const cards = [
    { label: '房源管理', value: stats.properties, sub: '已租 ' + stats.rented + ' 間', to: '/properties', color: '#7b1c3e', icon: '🏠' },
    { label: '租管', value: stats.tenants, sub: '租客資料', to: '/tenants', color: '#9d2449', icon: '👤' },
    { label: '租約管理', value: stats.leases, sub: '租約筆數', to: '/leases', color: '#b52d56', icon: '📄' },
    { label: '客需', value: stats.clients, sub: '客戶需求', to: '/payments', color: '#7b1c3e', icon: '💰' },
    { label: '維修記錄', value: stats.maintenance, sub: '維修筆數', to: '/maintenance', color: '#9d2449', icon: '🔧' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8f4f0' }}>
      <div style={{ background: 'linear-gradient(135deg, #7b1c3e 0%, #b52d56 50%, #9d2449 100%)', padding: '40px 32px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-20px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', position: 'relative' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>✨</div>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '24px', fontWeight: '700', letterSpacing: '2px' }}>澄新房屋</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '12px', letterSpacing: '3px' }}>CHENG XIN REAL ESTATE</p>
          </div>
        </div>
        <p style={{ margin: '16px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '13px', position: 'relative' }}>租買 買賣 管理</p>
      </div>

      <div style={{ padding: '24px', marginTop: '-20px' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(123,28,62,0.08)' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#9d2449', fontWeight: '500' }}>今日概況</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#7b1c3e' }}>{stats.properties}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999' }}>總房源</p>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#f0e8ec' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#9d2449' }}>{stats.rented}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999' }}>已出租</p>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#f0e8ec' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#b52d56' }}>{stats.properties - stats.rented}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999' }}>空置</p>
            </div>
            <div style={{ width: '1px', height: '40px', background: '#f0e8ec' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#7b1c3e' }}>{stats.clients}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#999' }}>客需</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(123,28,62,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📣</span>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#7b1c3e' }}>重大公告</p>
            </div>
            <button onClick={() => setShowAnnForm(!showAnnForm)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', background: '#7b1c3e', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>+ 新增公告</button>
          </div>

          {showAnnForm && (
            <div style={{ background: '#fdf8f9', border: '1px solid #f0d8df', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#7b1c3e', marginBottom: '4px', fontWeight: '500' }}>公告標題 *</label>
                <input style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8c8d0', fontSize: '14px', boxSizing: 'border-box' }} placeholder="請輸入公告標題" value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#7b1c3e', marginBottom: '4px', fontWeight: '500' }}>公告內容 *</label>
                <textarea style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8c8d0', fontSize: '14px', boxSizing: 'border-box', height: '80px', resize: 'vertical' }} placeholder="請輸入公告內容" value={annForm.content} onChange={e => setAnnForm({...annForm, content: e.target.value})} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input type="checkbox" id="important" checked={annForm.important} onChange={e => setAnnForm({...annForm, important: e.target.checked})} />
                <label htmlFor="important" style={{ fontSize: '13px', color: '#7b1c3e', cursor: 'pointer' }}>標記為重要公告</label>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddAnn} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#7b1c3e', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>發布公告</button>
                <button onClick={() => setShowAnnForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e8c8d0', background: '#fff', color: '#7b1c3e', fontSize: '13px', cursor: 'pointer' }}>取消</button>
              </div>
            </div>
          )}

          {announcements.length === 0 ? (
            <p style={{ color: '#bbb', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>目前沒有公告</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map(ann => (
                <div key={ann.id} style={{ border: ann.important ? '1px solid #e8a0b0' : '1px solid #f0e8ec', borderRadius: '10px', padding: '14px 16px', background: ann.important ? '#fdf0f3' : '#fdfafb', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {ann.important && <span style={{ background: '#7b1c3e', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '500' }}>重要</span>}
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#3d1020' }}>{ann.title}</p>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.6' }}>{ann.content}</p>
                      <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#bbb' }}>{new Date(ann.created_at).toLocaleDateString('zh-TW')}</p>
                    </div>
                    <button onClick={() => handleDeleteAnn(ann.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '16px', padding: '0 0 0 8px' }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#9d2449', fontWeight: '500' }}>功能選單</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {cards.map(card => (
            <Link key={card.to} to={card.to} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: '14px', padding: '18px 16px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)', borderLeft: '4px solid ' + card.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#888' }}>{card.label}</p>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: card.color }}>{card.value}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#aaa' }}>{card.sub}</p>
                  </div>
                  <span style={{ fontSize: '24px' }}>{card.icon}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}`

fs.writeFileSync('src/pages/Home.jsx', code, 'utf8')
console.log('done')
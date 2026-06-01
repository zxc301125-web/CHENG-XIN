import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Admin() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('全部')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setList(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    const labels = { approved: '批准', rejected: '拒絕', pending: '重設為待審' }
    if (!window.confirm(`確定要${labels[status]}此帳號?`)) return
    await supabase.from('profiles').update({ status }).eq('id', id)
    fetchData()
  }

  async function updateRole(id, role) {
    if (!window.confirm(`確定變更角色為「${role === 'admin' ? '管理員' : '一般員工'}」?`)) return
    await supabase.from('profiles').update({ role }).eq('id', id)
    fetchData()
  }

  const statusMap = {
    pending: { bg: '#fef9c3', color: '#854d0e', label: '待審核' },
    approved: { bg: '#dcfce7', color: '#166534', label: '已通過' },
    rejected: { bg: '#fde2e2', color: '#991b1b', label: '已拒絕' }
  }

  const filtered = filter === '全部' ? list : list.filter(p => {
    if (filter === '待審核') return p.status === 'pending'
    if (filter === '已通過') return p.status === 'approved'
    if (filter === '已拒絕') return p.status === 'rejected'
    return true
  })

  const pendingCount = list.filter(p => p.status === 'pending').length

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#7b1c3e', fontSize: '14px', cursor: 'pointer', padding: '6px 0', fontWeight: '500' }}>
          ← 回主頁
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ margin: 0 }}>👥 員工管理</h2>
        {pendingCount > 0 && (
          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#fef9c3', color: '#854d0e', fontSize: '13px', fontWeight: '600' }}>
            ⏳ {pendingCount} 筆待審
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['全部', '待審核', '已通過', '已拒絕'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            fontSize: '13px',
            background: filter === s ? '#7b1c3e' : '#fff',
            color: filter === s ? '#fff' : '#374151'
          }}>{s}</button>
        ))}
      </div>

      {loading ? <p>載入中...</p> : filtered.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>沒有符合的員工。</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map(item => {
            const sm = statusMap[item.status] || statusMap.pending
            return (
              <div key={item.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fdf0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#7b1c3e', flexShrink: 0 }}>
                      {item.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', wordBreak: 'break-all' }}>{item.email}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999' }}>建立於 {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: sm.bg, color: sm.color, whiteSpace: 'nowrap', flexShrink: 0 }}>{sm.label}</span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    background: item.role === 'admin' ? '#fef0f4' : '#f3f4f6',
                    color: item.role === 'admin' ? '#7b1c3e' : '#6b7280',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {item.role === 'admin' ? '👑 管理員' : '👤 一般員工'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {item.status !== 'approved' && (
                    <button onClick={() => updateStatus(item.id, 'approved')} style={btn('#22c55e')}>批准</button>
                  )}
                  {item.status !== 'rejected' && (
                    <button onClick={() => updateStatus(item.id, 'rejected')} style={btn('#ef4444')}>拒絕</button>
                  )}
                  {item.status === 'rejected' && (
                    <button onClick={() => updateStatus(item.id, 'pending')} style={btn('#f59e0b')}>重設待審</button>
                  )}
                  {item.role !== 'admin' ? (
                    <button onClick={() => updateRole(item.id, 'admin')} style={btn('#7b1c3e')}>設為管理員</button>
                  ) : (
                    <button onClick={() => updateRole(item.id, 'user')} style={btn('#6b7280')}>取消管理員</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const btn = (bg) => ({ padding: '6px 12px', borderRadius: '6px', border: 'none', background: bg, color: '#fff', cursor: 'pointer', fontSize: '12px' })

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const empty = { name: '', phone: '', id_number: '', note: '', project_name: '', area: '', manager: '', lease_term: '', rent_date: '' }

export default function Tenants() {
  const [list, setList] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('tenants').select('*').order('created_at')
    setList(data || [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.name || !form.phone) return alert('請填寫姓名和電話')
    if (editId) {
      await supabase.from('tenants').update(form).eq('id', editId)
    } else {
      await supabase.from('tenants').insert([form])
    }
    setForm(empty)
    setEditId(null)
    setShowForm(false)
    fetchData()
  }

  async function handleDelete(id) {
    if (!window.confirm('確定刪除此租客？')) return
    await supabase.from('tenants').delete().eq('id', id)
    fetchData()
  }

  function handleEdit(item) {
    setForm({ name: item.name, phone: item.phone, id_number: item.id_number || '', note: item.note || '', project_name: item.project_name || '', area: item.area || '', manager: item.manager || '', lease_term: item.lease_term || '', rent_date: item.rent_date || '' })
    setEditId(item.id)
    setShowForm(true)
  }

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#7b1c3e', fontSize: '14px', cursor: 'pointer', padding: '6px 0', fontWeight: '500' }}>
          ← 回主頁
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>👤 租管</h2>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} style={btnStyle('#2563eb')}>+ 新增租客</button>
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>{editId ? '編輯租客' : '新增租客'}</h3>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: 0 }}>基本資料</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>姓名 *</label>
              <input style={inputStyle} placeholder="如：王小明" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>電話 *</label>
              <input style={inputStyle} placeholder="如：0912345678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>身份證號</label>
              <input style={inputStyle} placeholder="如：A123456789" value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>備註</label>
              <input style={inputStyle} placeholder="其他備註..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '16px' }}>租屋資料</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>建案名稱</label>
              <input style={inputStyle} placeholder="如：台北花園" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>地區</label>
              <input style={inputStyle} placeholder="如：新竹市北區" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>代管人員</label>
              <input style={inputStyle} placeholder="如：陳小華" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>租期</label>
              <input style={inputStyle} placeholder="如：2024/01 ~ 2025/01" value={form.lease_term} onChange={e => setForm({ ...form, lease_term: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>收租日</label>
              <input style={inputStyle} placeholder="如：每月5號" value={form.rent_date} onChange={e => setForm({ ...form, rent_date: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleSubmit} style={btnStyle('#2563eb')}>{editId ? '儲存修改' : '確認新增'}</button>
            <button onClick={() => setShowForm(false)} style={btnStyle('#6b7280')}>取消</button>
          </div>
        </div>
      )}

      {loading ? <p>載入中...</p> : list.length === 0 ? (
        <p style={{ color: '#6b7280' }}>尚未新增任何租客，點擊「新增租客」開始使用。</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {list.map(item => (
            <div key={item.id} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', fontSize: '16px', color: '#1d4ed8' }}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '500', fontSize: '16px' }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>📞 {item.phone}</p>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {item.project_name && <p style={infoStyle}>🏢 {item.project_name}</p>}
                {item.area && <p style={infoStyle}>📍 {item.area}</p>}
                {item.manager && <p style={infoStyle}>👨‍💼 {item.manager}</p>}
                {item.lease_term && <p style={infoStyle}>📅 {item.lease_term}</p>}
                {item.rent_date && <p style={infoStyle}>💰 {item.rent_date}</p>}
                {item.id_number && <p style={infoStyle}>🪪 {item.id_number}</p>}
                {item.note && <p style={{ ...infoStyle, gridColumn: '1 / -1' }}>📝 {item.note}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => handleEdit(item)} style={btnStyle('#f59e0b')}>編輯</button>
                <button onClick={() => handleDelete(item.id)} style={btnStyle('#ef4444')}>刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }
const infoStyle = { margin: '2px 0', fontSize: '13px', color: '#6b7280' }
const btnStyle = (bg) => ({ padding: '8px 16px', borderRadius: '8px', border: 'none', background: bg, color: '#fff', cursor: 'pointer', fontSize: '14px' })



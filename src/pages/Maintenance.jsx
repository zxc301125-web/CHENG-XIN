import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const empty = { property_id: '', date: '', description: '', cost: 0 }

export default function Maintenance() {
  const [list, setList] = useState([])
  const [properties, setProperties] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [m, p] = await Promise.all([
      supabase.from('maintenance').select('*, properties(name, address)').order('date', { ascending: false }),
      supabase.from('properties').select('id, name, address')
    ])
    setList(m.data || [])
    setProperties(p.data || [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.property_id || !form.date || !form.description) return alert('請填寫所有必填欄位')
    if (editId) { await supabase.from('maintenance').update(form).eq('id', editId) }
    else { await supabase.from('maintenance').insert([form]) }
    setForm(empty); setEditId(null); setShowForm(false); fetchAll()
  }

  async function handleDelete(id) {
    if (!window.confirm('確定刪除？')) return
    await supabase.from('maintenance').delete().eq('id', id)
    fetchAll()
  }

  function handleEdit(item) {
    setForm({ property_id: item.property_id, date: item.date, description: item.description, cost: item.cost || 0 })
    setEditId(item.id); setShowForm(true)
  }

  const totalCost = list.reduce((sum, item) => sum + (Number(item.cost) || 0), 0)

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#7b1c3e', fontSize: '14px', cursor: 'pointer', padding: '6px 0', fontWeight: '500' }}>
          ← 回主頁
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>🔧 維修記錄</h2>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} style={bs('#2563eb')}>+ 新增維修</button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 24px', flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>維修筆數</p>
          <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '600' }}>{list.length}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 24px', flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>總費用</p>
          <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '600' }}>NT$ {totalCost.toLocaleString()}</p>
        </div>
      </div>

      {showForm && (
        <div style={cs}>
          <h3 style={{ marginTop: 0 }}>{editId ? '編輯維修' : '新增維修'}</h3>
          <div style={g2}>
            <div>
              <label style={ls}>房源 *</label>
              <select style={is} value={form.property_id} onChange={e => setForm({...form, property_id: e.target.value})}>
                <option value="">-- 選擇房源 --</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={ls}>維修日期 *</label>
              <input style={is} type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={ls}>維修內容 *</label>
              <textarea style={{...is, height: '80px', resize: 'vertical'}} placeholder="請描述維修內容..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div>
              <label style={ls}>費用（元）</label>
              <input style={is} type="number" placeholder="0" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleSubmit} style={bs('#2563eb')}>{editId ? '儲存修改' : '確認新增'}</button>
            <button onClick={() => setShowForm(false)} style={bs('#6b7280')}>取消</button>
          </div>
        </div>
      )}

      {loading ? <p>載入中...</p> : list.length === 0 ? (
        <p style={{ color: '#6b7280' }}>尚未新增任何維修記錄。</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {list.map(item => (
            <div key={item.id} style={cs}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: '600' }}>{item.properties?.name}</p>
                  <p style={{ margin: '2px 0', fontSize: '12px', color: '#6b7280' }}>{item.date}</p>
                </div>
                <span style={{ fontWeight: '600', color: '#ef4444' }}>NT$ {Number(item.cost).toLocaleString()}</span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#374151' }}>{item.description}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleEdit(item)} style={{...bs('#f59e0b'), fontSize: '12px', padding: '4px 10px'}}>編輯</button>
                <button onClick={() => handleDelete(item.id)} style={{...bs('#ef4444'), fontSize: '12px', padding: '4px 10px'}}>刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const cs = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }
const is = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }
const ls = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }
const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
const bs = (bg) => ({ padding: '8px 16px', borderRadius: '8px', border: 'none', background: bg, color: '#fff', cursor: 'pointer', fontSize: '14px' })
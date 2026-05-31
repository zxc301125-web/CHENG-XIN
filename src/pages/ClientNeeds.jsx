import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const empty = { name: '', phone: '', move_in_date: '', residents: '', age: '', gender_relation: '', occupation: '', smoking: '否', pets: '', budget: '', area_priority: '', special_needs: '', status: '待處理' }

export default function ClientNeeds() {
  const [list, setList] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('全部')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('client_needs').select('*').order('created_at', { ascending: false })
    setList(data || [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.name || !form.phone) return alert('請填寫姓名和電話')
    if (editId) { await supabase.from('client_needs').update(form).eq('id', editId) }
    else { await supabase.from('client_needs').insert([form]) }
    setForm(empty); setEditId(null); setShowForm(false); fetchData()
  }

  async function handleDelete(id) {
    if (!window.confirm('確定刪除？')) return
    await supabase.from('client_needs').delete().eq('id', id)
    fetchData()
  }

  async function handleStatus(id, status) {
    await supabase.from('client_needs').update({ status }).eq('id', id)
    fetchData()
  }

  function handleEdit(item) {
    setForm({ name: item.name, phone: item.phone, move_in_date: item.move_in_date||'', residents: item.residents||'', age: item.age||'', gender_relation: item.gender_relation||'', occupation: item.occupation||'', smoking: item.smoking||'否', pets: item.pets||'', budget: item.budget||'', area_priority: item.area_priority||'', special_needs: item.special_needs||'', status: item.status })
    setEditId(item.id); setShowForm(true)
  }

  const sc = { '待處理': { bg: '#fef9c3', color: '#854d0e' }, '已配對': { bg: '#dbeafe', color: '#1e40af' }, '已成交': { bg: '#dcfce7', color: '#166534' } }
  const filtered = filter === '全部' ? list : list.filter(i => i.status === filter)

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#7b1c3e', fontSize: '14px', cursor: 'pointer', padding: '6px 0', fontWeight: '500' }}>
          ← 回主頁
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>客需管理</h2>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true) }} style={bs('#2563eb')}>+ 新增客需</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {['全部','待處理','已配對','已成交'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '13px', background: filter===s?'#2563eb':'#fff', color: filter===s?'#fff':'#374151' }}>{s}</button>
        ))}
      </div>
      {showForm && (
        <div style={cs}>
          <h3 style={{ marginTop: 0 }}>{editId ? '編輯客需' : '新增客需'}</h3>
          <div style={g2}>
            <div><label style={ls}>姓名 *</label><input style={is} placeholder="客戶姓名" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label style={ls}>聯絡電話 *</label><input style={is} placeholder="0912345678" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div><label style={ls}>入住時間</label><input style={is} placeholder="2024/06/01" value={form.move_in_date} onChange={e => setForm({...form, move_in_date: e.target.value})} /></div>
            <div><label style={ls}>居住人數</label><input style={is} type="number" value={form.residents} onChange={e => setForm({...form, residents: e.target.value})} /></div>
            <div><label style={ls}>年齡</label><input style={is} placeholder="30歲" value={form.age} onChange={e => setForm({...form, age: e.target.value})} /></div>
            <div><label style={ls}>性別關係</label><input style={is} placeholder="男、夫妻" value={form.gender_relation} onChange={e => setForm({...form, gender_relation: e.target.value})} /></div>
            <div><label style={ls}>職業類別</label><input style={is} placeholder="上班族" value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} /></div>
            <div><label style={ls}>有無抽菸</label><select style={is} value={form.smoking} onChange={e => setForm({...form, smoking: e.target.value})}><option>否</option><option>是</option></select></div>
            <div><label style={ls}>有無寵物</label><input style={is} placeholder="無、貓咪" value={form.pets} onChange={e => setForm({...form, pets: e.target.value})} /></div>
            <div><label style={ls}>租金預算</label><input style={is} placeholder="15000~20000" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} /></div>
            <div style={{ gridColumn:'1/-1' }}><label style={ls}>需求區域排序</label><input style={is} placeholder="新竹北區 > 竹北" value={form.area_priority} onChange={e => setForm({...form, area_priority: e.target.value})} /></div>
            <div style={{ gridColumn:'1/-1' }}><label style={ls}>基本特別需求</label><textarea style={{...is, height:'80px', resize:'vertical'}} placeholder="需要停車位..." value={form.special_needs} onChange={e => setForm({...form, special_needs: e.target.value})} /></div>
            <div><label style={ls}>狀態</label><select style={is} value={form.status} onChange={e => setForm({...form, status: e.target.value})}><option>待處理</option><option>已配對</option><option>已成交</option></select></div>
          </div>
          <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
            <button onClick={handleSubmit} style={bs('#2563eb')}>{editId ? '儲存修改' : '確認新增'}</button>
            <button onClick={() => setShowForm(false)} style={bs('#6b7280')}>取消</button>
          </div>
        </div>
      )}
      {loading ? <p>載入中...</p> : filtered.length === 0 ? (
        <p style={{ color:'#6b7280' }}>沒有符合的客需記錄。</p>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'16px' }}>
          {filtered.map(item => (
            <div key={item.id} style={cs}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'600', color:'#1d4ed8' }}>{item.name.charAt(0)}</div>
                  <div><p style={{ margin:0, fontWeight:'600' }}>{item.name}</p><p style={{ margin:0, fontSize:'12px', color:'#6b7280' }}>{item.phone}</p></div>
                </div>
                <span style={{ padding:'2px 10px', borderRadius:'20px', fontSize:'12px', background:sc[item.status]?.bg, color:sc[item.status]?.color }}>{item.status}</span>
              </div>
              <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:'8px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px' }}>
                {item.move_in_date && <p style={inf}>入住 {item.move_in_date}</p>}
                {item.residents && <p style={inf}>人數 {item.residents}</p>}
                {item.budget && <p style={inf}>預算 {item.budget}</p>}
                {item.occupation && <p style={inf}>職業 {item.occupation}</p>}
                {item.area_priority && <p style={{...inf, gridColumn:'1/-1'}}>區域 {item.area_priority}</p>}
                {item.special_needs && <p style={{...inf, gridColumn:'1/-1'}}>需求 {item.special_needs}</p>}
              </div>
              <div style={{ display:'flex', gap:'6px', marginTop:'12px', flexWrap:'wrap' }}>
                {item.status !== '已配對' && <button onClick={() => handleStatus(item.id,'已配對')} style={{...bs('#3b82f6'), fontSize:'12px', padding:'4px 10px'}}>已配對</button>}
                {item.status !== '已成交' && <button onClick={() => handleStatus(item.id,'已成交')} style={{...bs('#22c55e'), fontSize:'12px', padding:'4px 10px'}}>已成交</button>}
                <button onClick={() => handleEdit(item)} style={{...bs('#f59e0b'), fontSize:'12px', padding:'4px 10px'}}>編輯</button>
                <button onClick={() => handleDelete(item.id)} style={{...bs('#ef4444'), fontSize:'12px', padding:'4px 10px'}}>刪除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const cs = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'20px', marginBottom:'16px' }
const is = { width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'14px', boxSizing:'border-box' }
const ls = { display:'block', fontSize:'13px', color:'#6b7280', marginBottom:'4px' }
const inf = { margin:'2px 0', fontSize:'13px', color:'#6b7280' }
const g2 = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }
const bs = (bg) => ({ padding:'8px 16px', borderRadius:'8px', border:'none', background:bg, color:'#fff', cursor:'pointer', fontSize:'14px' })


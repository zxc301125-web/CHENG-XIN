import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Link } from 'react-router-dom'
import HelpBox from '../components/HelpBox'

export default function Leases() {
  const [leases, setLeases] = useState([])
  const [properties, setProperties] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    property_id: '',
    tenant_name: '',
    start_date: '',
    end_date: '',
    rent: '',
    notes: ''
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [l, p] = await Promise.all([
      supabase.from('leases').select('*, properties(name), tenants(name)').order('created_at', { ascending: false }),
      supabase.from('properties').select('id, name').order('name')
    ])
    setLeases(l.data || [])
    setProperties(p.data || [])
  }

  function resetForm() {
    setForm({ property_id: '', tenant_name: '', start_date: '', end_date: '', rent: '', notes: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(lease) {
    setForm({
      property_id: lease.property_id || '',
      tenant_name: lease.tenants?.name || '',
      start_date: lease.start_date || '',
      end_date: lease.end_date || '',
      rent: lease.rent || '',
      notes: lease.notes || ''
    })
    setEditingId(lease.id)
    setShowForm(true)
  }

  // 取得或建立 tenant_id（依名字)
  async function getOrCreateTenantId(rawName) {
    const name = rawName.trim()
    if (!name) return null

    // 1. 查是否已有同名租客
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', name)
      .limit(1)

    if (existing && existing.length > 0) return existing[0].id

    // 2. 沒有則新增（phone 填空白，待之後到「租管」補資料）
    const { data: newRow, error } = await supabase
      .from('tenants')
      .insert([{ name, phone: '' }])
      .select('id')
      .single()

    if (error) {
      alert('建立租客資料失敗：' + error.message)
      return null
    }
    return newRow.id
  }

  async function handleSubmit() {
    if (!form.property_id || !form.tenant_name.trim() || !form.start_date || !form.end_date || !form.rent) {
      return alert('請填寫所有必填欄位')
    }
    if (form.end_date < form.start_date) {
      return alert('結束日不能早於開始日')
    }

    const tenantId = await getOrCreateTenantId(form.tenant_name)
    if (!tenantId) return

    // 編輯模式:記下原本的 property_id (避免改房源後舊房源還掛著「已租」)
    let originalPropertyId = null
    if (editingId) {
      const originalLease = leases.find(l => l.id === editingId)
      originalPropertyId = originalLease?.property_id
    }

    const payload = {
      property_id: form.property_id,
      tenant_id: tenantId,
      start_date: form.start_date,
      end_date: form.end_date,
      rent: Number(form.rent),
      notes: form.notes
    }
    const { error } = editingId
      ? await supabase.from('leases').update(payload).eq('id', editingId)
      : await supabase.from('leases').insert([payload])
    if (error) return alert('儲存失敗：' + error.message)

    // ★ 自動把選的房源標記為「已租」
    await supabase.from('properties').update({ status: '已租' }).eq('id', form.property_id)

    // ★ 編輯時改了房源,把舊房源視情況釋放
    if (originalPropertyId && originalPropertyId !== form.property_id) {
      await releasePropertyIfNoActiveLease(originalPropertyId)
    }

    resetForm()
    fetchAll()
  }

  async function handleDelete(id) {
    if (!window.confirm('確定刪除此租約？相關的應收記錄也會被刪除。')) return
    const lease = leases.find(l => l.id === id)

    await supabase.from('payments').delete().eq('lease_id', id)
    await supabase.from('leases').delete().eq('id', id)

    // ★ 刪除後,如該房源沒其他進行中租約,把狀態改回「空房」
    if (lease?.property_id) {
      await releasePropertyIfNoActiveLease(lease.property_id)
    }

    fetchAll()
  }

  // 若指定房源沒有任何進行中(未過期)的租約,把它狀態改回「空房」
  async function releasePropertyIfNoActiveLease(propertyId) {
    const today = new Date().toISOString().slice(0, 10)
    const { data: activeLeases } = await supabase
      .from('leases')
      .select('id')
      .eq('property_id', propertyId)
      .gte('end_date', today)

    if (!activeLeases || activeLeases.length === 0) {
      await supabase.from('properties').update({ status: '空房' }).eq('id', propertyId)
    }
  }

  // 計算剩餘天數
  function daysUntil(endDate) {
    const today = new Date(new Date().toISOString().slice(0, 10))
    const end = new Date(endDate)
    return Math.round((end - today) / 86400000)
  }

  // 判斷租約狀態（依剩餘天數自動分類）
  function leaseStatus(lease) {
    const left = daysUntil(lease.end_date)
    if (left < 0) return { label: `已過期 ${Math.abs(left)} 天`, color: '#999', bg: '#f0f0f0' }
    if (left <= 30) return { label: `剩 ${left} 天`, color: '#d48b00', bg: '#fff8e0' }
    return { label: `剩 ${left} 天`, color: '#2eaa5c', bg: '#e8f7ed' }
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #e8c8d0',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  }
  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    color: '#7b1c3e',
    marginBottom: '4px',
    fontWeight: '500'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f4f0' }}>
      <div style={{ background: 'linear-gradient(135deg, #7b1c3e 0%, #b52d56 50%, #9d2449 100%)', padding: '30px 24px 50px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
          <Link to='/' style={{ color: '#fff', fontSize: '18px', textDecoration: 'none', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)' }}>‹</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '22px', fontWeight: '700', letterSpacing: '1px' }}>
              租約管理
              <HelpBox title="租約管理使用說明">
                <p style={{ margin: '0 0 6px' }}>建立並追蹤所有合約,系統自動依結束日提醒。</p>
                <ol style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                  <li>點「+ 新增租約」,選房源與租客。</li>
                  <li>填入起迄日與月租金。</li>
                  <li>列表自動顯示剩餘天數,30 天內以橘色提示。</li>
                  <li>建立後到「應收記錄」一鍵產生每月應收。</li>
                </ol>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#a08850' }}>
                  ※ 刪除合約會同時清掉相關應收記錄。
                </p>
              </HelpBox>
            </h1>
            <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>共 {leases.length} 筆租約</p>
          </div>
          <Link to='/payments' style={{ padding: '8px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', fontSize: '12px', textDecoration: 'none' }}>應收記錄 →</Link>
        </div>
      </div>

      <div style={{ padding: '20px', marginTop: '-20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#9d2449', fontWeight: '500' }}>租約列表</p>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#7b1c3e', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
            {showForm ? '取消' : '+ 新增租約'}
          </button>
        </div>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(123,28,62,0.08)' }}>
            <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '600', color: '#7b1c3e' }}>{editingId ? '編輯租約' : '新增租約'}</p>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>房源 *</label>
              <select style={inputStyle} value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })}>
                <option value=''>請選擇房源</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>租客姓名 *</label>
              <input
                type='text'
                style={inputStyle}
                placeholder='直接輸入租客姓名,如:王小明'
                value={form.tenant_name}
                onChange={e => setForm({ ...form, tenant_name: e.target.value })}
              />
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#a08850' }}>
                ℹ️ 若是新租客,送出後會自動建立到「租管」,可之後再補電話等資料。
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>開始日 *</label>
                <input type='date' style={inputStyle} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>結束日 *</label>
                <input type='date' style={inputStyle} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>月租金 (NT$) *</label>
              <input type='number' style={inputStyle} placeholder='例：15000' value={form.rent} onChange={e => setForm({ ...form, rent: e.target.value })} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>備註</label>
              <textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} placeholder='選填' value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSubmit} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#7b1c3e', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                {editingId ? '更新' : '新增'}
              </button>
              <button onClick={resetForm} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e8c8d0', background: '#fff', color: '#7b1c3e', fontSize: '14px', cursor: 'pointer' }}>
                取消
              </button>
            </div>
          </div>
        )}

        {leases.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
            目前沒有租約，點擊上方「新增租約」開始
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {leases.map(lease => {
              const status = leaseStatus(lease)
              return (
                <div key={lease.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#3d1020' }}>
                          {lease.properties?.name || '未指定房源'}
                        </p>
                        <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#666' }}>
                        租客：{lease.tenants?.name || '未指定'}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                        {lease.start_date} ~ {lease.end_date}
                      </p>
                      {lease.notes && (
                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>{lease.notes}</p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#7b1c3e' }}>NT${Number(lease.rent).toLocaleString()}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#999' }}>每月</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', borderTop: '1px solid #f0e8ec', paddingTop: '10px' }}>
                    <button onClick={() => handleEdit(lease)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #e8c8d0', background: '#fff', color: '#7b1c3e', fontSize: '12px', cursor: 'pointer' }}>編輯</button>
                    <button onClick={() => handleDelete(lease.id)} style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #f0d0d0', background: '#fff', color: '#e24b4a', fontSize: '12px', cursor: 'pointer' }}>刪除</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

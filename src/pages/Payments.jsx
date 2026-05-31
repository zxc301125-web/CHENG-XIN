import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Link } from 'react-router-dom'
import HelpBox from '../components/HelpBox'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchPayments() }, [filterMonth])

  async function fetchPayments() {
    const { data } = await supabase
      .from('payments')
      .select('*, leases(rent, start_date, end_date, properties(name), tenants(name))')
      .eq('month', filterMonth)
      .order('paid', { ascending: true })
    setPayments(data || [])
  }

  // 為當前選擇的月份自動產生應收記錄
  async function generateMonth() {
    if (!window.confirm(`為 ${filterMonth} 自動產生所有有效租約的應收記錄？`)) return
    setLoading(true)

    // 此月的第一天與最後一天
    const [y, m] = filterMonth.split('-').map(Number)
    const firstDay = `${filterMonth}-01`
    const lastDay = new Date(y, m, 0).toISOString().slice(0, 10)

    // 抓所有此月內有效的租約（start_date <= 月底 且 end_date >= 月初）
    const { data: leases, error: e1 } = await supabase
      .from('leases')
      .select('id, rent')
      .lte('start_date', lastDay)
      .gte('end_date', firstDay)

    if (e1) { setLoading(false); return alert('讀取租約失敗：' + e1.message) }
    if (!leases || leases.length === 0) {
      setLoading(false)
      return alert(`${filterMonth} 沒有有效的租約`)
    }

    // 查本月已存在的 payments，避免重複
    const { data: existing } = await supabase
      .from('payments')
      .select('lease_id')
      .eq('month', filterMonth)
      .in('lease_id', leases.map(l => l.id))

    const existingSet = new Set((existing || []).map(p => p.lease_id))
    const toInsert = leases
      .filter(l => !existingSet.has(l.id))
      .map(l => ({
        lease_id: l.id,
        month: filterMonth,
        amount: Number(l.rent),
        paid: false
      }))

    if (toInsert.length === 0) {
      setLoading(false)
      return alert(`${filterMonth} 的應收記錄已全部產生過了`)
    }

    const { error: e2 } = await supabase.from('payments').insert(toInsert)
    setLoading(false)
    if (e2) return alert('產生失敗：' + e2.message)
    alert(`已產生 ${toInsert.length} 筆應收記錄`)
    fetchPayments()
  }

  async function togglePaid(payment) {
    const newPaid = !payment.paid
    await supabase
      .from('payments')
      .update({
        paid: newPaid,
        paid_date: newPaid ? new Date().toISOString().slice(0, 10) : null
      })
      .eq('id', payment.id)
    fetchPayments()
  }

  async function handleDelete(id) {
    if (!window.confirm('確定刪除此筆應收？')) return
    await supabase.from('payments').delete().eq('id', id)
    fetchPayments()
  }

  // 統計
  const totalDue = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const totalPaid = payments.filter(p => p.paid).reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const unpaidCount = payments.filter(p => !p.paid).length
  const fmt = n => 'NT$' + Math.round(n || 0).toLocaleString()

  return (
    <div style={{ minHeight: '100vh', background: '#f8f4f0' }}>
      <div style={{ background: 'linear-gradient(135deg, #7b1c3e 0%, #b52d56 50%, #9d2449 100%)', padding: '30px 24px 50px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
          <Link to='/' style={{ color: '#fff', fontSize: '18px', textDecoration: 'none', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)' }}>‹</Link>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '22px', fontWeight: '700', letterSpacing: '1px' }}>
              應收 / 實收
              <HelpBox title="應收 / 實收使用說明">
                <p style={{ margin: '0 0 6px' }}>系統依租約自動產生每月應收。</p>
                <ol style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                  <li>選要查看的月份(預設本月)。</li>
                  <li>點「🔄 自動產生本月應收」依現有租約建立。</li>
                  <li>收到錢勾 checkbox 標記已繳(自動記錄繳費日)。</li>
                  <li>頂端即時統計應收、實收、未繳筆數。</li>
                </ol>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#a08850' }}>
                  ※ 同月重複產生不會重複建立,會自動跳過。
                </p>
              </HelpBox>
            </h1>
            <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{filterMonth}</p>
          </div>
          <Link to='/leases' style={{ padding: '8px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', fontSize: '12px', textDecoration: 'none' }}>← 租約</Link>
        </div>
      </div>

      <div style={{ padding: '20px', marginTop: '-20px' }}>

        {/* 月份切換 + 操作 */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type='month'
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            style={{ flex: '1 1 140px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e8c8d0', fontSize: '14px', fontFamily: 'inherit' }}
          />
          <button
            onClick={generateMonth}
            disabled={loading}
            style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: loading ? '#aaa' : '#7b1c3e', color: '#fff', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500' }}
          >
            {loading ? '處理中...' : '🔄 自動產生本月應收'}
          </button>
        </div>

        {/* 統計卡 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#aaa', fontWeight: '500' }}>應收</p>
            <p style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#7b1c3e' }}>{fmt(totalDue)}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#aaa', fontWeight: '500' }}>實收</p>
            <p style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#2eaa5c' }}>{fmt(totalPaid)}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#aaa', fontWeight: '500' }}>未繳</p>
            <p style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#e24b4a' }}>{unpaidCount}</p>
          </div>
        </div>

        {/* 列表 */}
        {payments.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '40px 20px', textAlign: 'center', color: '#bbb', fontSize: '13px' }}>
            <p style={{ margin: '0 0 8px' }}>{filterMonth} 沒有應收記錄</p>
            <p style={{ margin: 0, fontSize: '12px' }}>點擊上方「自動產生本月應收」依現有租約建立</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {payments.map(p => {
              const propName = p.leases?.properties?.name || '未指定房源'
              const tenName = p.leases?.tenants?.name || '未指定租客'
              return (
                <div key={p.id} style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  boxShadow: '0 2px 8px rgba(123,28,62,0.06)',
                  borderLeft: '4px solid ' + (p.paid ? '#2eaa5c' : '#e24b4a'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <input
                    type='checkbox'
                    checked={p.paid}
                    onChange={() => togglePaid(p)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#2eaa5c' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: '600', color: '#3d1020', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {propName}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                      {tenName}{p.paid && p.paid_date ? ` · 已繳於 ${p.paid_date}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: p.paid ? '#2eaa5c' : '#7b1c3e' }}>
                      {fmt(p.amount)}
                    </p>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{ marginTop: '4px', background: 'none', border: 'none', color: '#ccc', fontSize: '11px', cursor: 'pointer' }}
                    >
                      刪除
                    </button>
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

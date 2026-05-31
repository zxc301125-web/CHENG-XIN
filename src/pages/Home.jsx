import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Link } from 'react-router-dom'
import HelpBox from '../components/HelpBox'

export default function Home() {
  const [stats, setStats] = useState({ properties: 0, tenants: 0, leases: 0, maintenance: 0, clients: 0, rented: 0 })
  const [finance, setFinance] = useState({
    monthlyIncome: 0,
    prevIncome: 0,
    repairCost: 0,
    totalCollected: 0,
    totalDue: 0,
    unpaidCount: 0,
    expiringCount: 0,
    nextExpiryDate: null,
    nextExpiryDays: null,
    rooms: [],
    rented: 0,
    vacant: 0,
    repair: 0,
  })
  const [announcements, setAnnouncements] = useState([])
  const [showAnnForm, setShowAnnForm] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', content: '', important: false })

  useEffect(() => { fetchAll() }, [])

  // ── 把 properties.status 分成三類 ──
  function classifyStatus(s) {
    const v = (s || '').trim()
    if (v === '已租' || v === '出租中' || v === '已出租') return 'rented'
    if (v.includes('維修') || v.includes('整修')) return 'repair'
    return 'vacant'
  }

  async function fetchAll() {
    // 計算本月與上月字串（payments.month 假設格式 YYYY-MM）
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const thisMonth = `${yyyy}-${mm}`
    const prev = new Date(yyyy, today.getMonth() - 1, 1)
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    const todayStr = today.toISOString().slice(0, 10)
    const thisMonthStart = `${thisMonth}-01`

    const [p, t, l, m, c, a, paysThis, paysPrev, futureLeases, maint] = await Promise.all([
      supabase.from('properties').select('id, name, status'),
      supabase.from('tenants').select('id'),
      supabase.from('leases').select('id'),
      supabase.from('maintenance').select('id'),
      supabase.from('client_needs').select('id'),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('amount, paid').eq('month', thisMonth),
      supabase.from('payments').select('amount, paid').eq('month', prevMonth),
      // 抓所有未到期的合約，依到期日由近到遠排序
      supabase.from('leases').select('id, end_date').gte('end_date', todayStr).order('end_date', { ascending: true }),
      supabase.from('maintenance').select('cost, created_at').gte('created_at', thisMonthStart),
    ])

    // ── 房源分類 ──
    const allProps = p.data || []
    const rooms = allProps.map(x => ({ name: x.name || '未命名', status: classifyStatus(x.status) }))
    const rented = rooms.filter(r => r.status === 'rented').length
    const vacant = rooms.filter(r => r.status === 'vacant').length
    const repair = rooms.filter(r => r.status === 'repair').length

    // ── 收支計算 ──
    const thisList = paysThis.data || []
    const prevList = paysPrev.data || []
    const monthlyIncome = thisList.filter(x => x.paid).reduce((s, x) => s + (Number(x.amount) || 0), 0)
    const prevIncome    = prevList.filter(x => x.paid).reduce((s, x) => s + (Number(x.amount) || 0), 0)
    const totalDue       = thisList.reduce((s, x) => s + (Number(x.amount) || 0), 0)
    const totalCollected = monthlyIncome
    const unpaidCount    = thisList.filter(x => !x.paid).length

    // ── 維修支出（若無 cost 欄位則為 0，不會 crash） ──
    const repairCost = (maint.data || []).reduce((s, x) => s + (Number(x.cost) || 0), 0)

    // ── 抓最近一筆到期合約（futureLeases 已按 end_date 排序，首筆即為最近）──
    const futureList = futureLeases.data || []
    const nextLease = futureList[0]
    const nextExpiryDate = nextLease ? nextLease.end_date : null
    const nextExpiryDays = nextLease
      ? Math.round((new Date(nextLease.end_date) - new Date(todayStr)) / 86400000)
      : null

    setStats({
      properties: allProps.length,
      tenants: (t.data || []).length,
      leases: (l.data || []).length,
      maintenance: (m.data || []).length,
      clients: (c.data || []).length,
      rented,
    })
    setFinance({
      monthlyIncome, prevIncome, repairCost,
      totalCollected, totalDue, unpaidCount,
      expiringCount: futureList.length,
      nextExpiryDate, nextExpiryDays,
      rooms, rented, vacant, repair,
    })
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

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const cards = [
    { label: '房源管理', value: stats.properties, sub: '已租 ' + stats.rented + ' 間', to: '/properties', color: '#7b1c3e', icon: '🏠' },
    { label: '租管', value: stats.tenants, sub: '租客資料', to: '/tenants', color: '#9d2449', icon: '👤' },
    { label: '租約管理', value: stats.leases, sub: '租約筆數', to: '/leases', color: '#b52d56', icon: '📄' },
    { label: '客需', value: stats.clients, sub: '客戶需求', to: '/client-needs', color: '#7b1c3e', icon: '💰' },
    { label: '維修記錄', value: stats.maintenance, sub: '維修筆數', to: '/maintenance', color: '#9d2449', icon: '🔧' },
  ]

  // ── 收益概覽用的格式化函式 ──
  const fmt = n => 'NT$' + Math.round(n || 0).toLocaleString()
  const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0
  const occPct = pct(finance.rented, stats.properties)
  const collectPct = pct(finance.totalCollected, finance.totalDue)
  const momChg = finance.prevIncome > 0
    ? +((finance.monthlyIncome - finance.prevIncome) / finance.prevIncome * 100).toFixed(1)
    : null

  const statusStyle = {
    rented: { bg: '#e8f7ed', color: '#2eaa5c', dot: '#2eaa5c', label: '出租中' },
    vacant: { bg: '#fff8e0', color: '#d48b00', dot: '#d48b00', label: '空房' },
    repair: { bg: '#eef2fc', color: '#5b7dda', dot: '#5b7dda', label: '維修中' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f4f0' }}>
      <div style={{ background: 'linear-gradient(135deg, #7b1c3e 0%, #b52d56 50%, #9d2449 100%)', padding: '40px 32px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-20px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', position: 'relative' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>✨</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '24px', fontWeight: '700', letterSpacing: '2px' }}>
              澄新房屋
              <HelpBox title="首頁總覽說明">
                <p style={{ margin: '0 0 6px' }}>這裡集中呈現你最關鍵的經營指標。</p>
                <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                  <li><b>本月租金收入</b>:已收到的租金總和。</li>
                  <li><b>出租率</b>:已出租 / 總間數。</li>
                  <li><b>實收 / 應收</b>:本月繳費比例。</li>
                  <li><b>下一個合約到期</b>:最早到期的日期與剩餘天數。</li>
                </ul>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#a08850' }}>
                  ※ 記得先在「房源」「租約」「應收」建立資料。
                </p>
              </HelpBox>
            </h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '12px', letterSpacing: '3px' }}>CHENG XIN REAL ESTATE</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: 'rgba(255,255,255,0.9)', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>登出</button>
        </div>
        <p style={{ margin: '16px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '13px', position: 'relative' }}>租買 買賣 管理</p>
      </div>

      <div style={{ padding: '24px', marginTop: '-20px' }}>

        {/* ★ 收益概覽（取代「今日概況」）★ */}
        <div style={{ background: 'linear-gradient(135deg, #7b1c3e 0%, #9d2449 60%, #b52d56 100%)', borderRadius: '18px', padding: '22px 22px 18px', color: '#fff', position: 'relative', overflow: 'hidden', marginBottom: '12px', boxShadow: '0 6px 20px rgba(123,28,62,0.25)' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: '-35px', right: '50px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.8, fontWeight: '500', letterSpacing: '0.03em', position: 'relative' }}>本月租金收入</p>
          <p style={{ margin: '0 0 10px', fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px', position: 'relative' }}>{fmt(finance.monthlyIncome)}</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', position: 'relative' }}>
            {momChg !== null && (
              <span style={{
                fontSize: '11px', fontWeight: '500',
                background: momChg >= 0 ? 'rgba(160,240,192,0.2)' : 'rgba(255,180,180,0.2)',
                color: momChg >= 0 ? '#a0f0c0' : '#ffb4b4',
                borderRadius: '20px', padding: '4px 11px'
              }}>
                {momChg >= 0 ? '↑ ' : '↓ '}{Math.abs(momChg)}% 較上月
              </span>
            )}
            <span style={{ fontSize: '11px', fontWeight: '500', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 11px' }}>
              年估 {fmt(finance.monthlyIncome * 12)}
            </span>
          </div>
        </div>

        {/* 四格指標 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#aaa', letterSpacing: '0.05em' }}>🏠 出租率</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#7b1c3e' }}>{occPct}%</p>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#bbb' }}>{finance.rented} 間出租 / 共 {stats.properties} 間</p>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#aaa', letterSpacing: '0.05em' }}>💰 實收 / 應收</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#2eaa5c' }}>{collectPct}%</p>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#bbb' }}>{finance.unpaidCount === 0 ? '本月無逾期' : finance.unpaidCount + ' 筆未繳'}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#aaa', letterSpacing: '0.05em' }}>🔧 維修支出</p>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#d48b00' }}>{fmt(finance.repairCost)}</p>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#bbb' }}>淨收 {fmt(finance.monthlyIncome - finance.repairCost)}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 8px rgba(123,28,62,0.06)' }}>
            <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#aaa', letterSpacing: '0.05em' }}>📋 下一個合約到期</p>
            {finance.nextExpiryDate ? (
              <>
                <p style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#e24b4a' }}>{finance.nextExpiryDate}</p>
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#bbb' }}>
                  {finance.nextExpiryDays === 0 ? '今天到期' : finance.nextExpiryDays > 0 ? `還剩 ${finance.nextExpiryDays} 天` : '已過期'}
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#bbb' }}>—</p>
                <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#bbb' }}>無進行中合約</p>
              </>
            )}
          </div>
        </div>

        {/* 出租狀況 */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 12px rgba(123,28,62,0.08)', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '700', color: '#7b1c3e', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏘️</span>出租狀況
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#999' }}>整體出租率</p>
              <p style={{ margin: 0, fontSize: '30px', fontWeight: '700', color: '#7b1c3e' }}>{occPct}%</p>
            </div>
            <div style={{ fontSize: '12px', color: '#777', textAlign: 'right', lineHeight: '1.8' }}>
              出租中 <strong>{finance.rented}</strong> 間<br />
              空房 <strong>{finance.vacant}</strong> 間<br />
              維修中 <strong>{finance.repair}</strong> 間
            </div>
          </div>
          <div style={{ height: '8px', borderRadius: '5px', background: '#f0e8ec', overflow: 'hidden', marginBottom: '14px' }}>
            <div style={{ height: '100%', borderRadius: '5px', background: 'linear-gradient(90deg, #7b1c3e, #b52d56)', width: occPct + '%', transition: 'width 0.6s ease' }} />
          </div>
          {finance.rooms.length === 0 ? (
            <p style={{ color: '#bbb', fontSize: '13px', textAlign: 'center', padding: '12px 0', margin: 0 }}>目前沒有房源</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              {finance.rooms.map((r, i) => {
                const s = statusStyle[r.status]
                return (
                  <div key={i} style={{ background: '#faf5f7', borderRadius: '10px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                    <div style={{ fontSize: '13px', fontWeight: '500', flex: 1, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    <div style={{ fontSize: '11px', fontWeight: '600', borderRadius: '20px', padding: '2px 8px', background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {/* ★ 收益概覽結束 ★ */}

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
                <div key={ann.id} style={{ border: ann.important ? '1px solid #e8a0b0' : '1px solid #f0e8ec', borderRadius: '10px', padding: '14px 16px', background: ann.important ? '#fdf0f3' : '#fdfafb' }}>
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
}

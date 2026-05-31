import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const empty = { name: '', address: '', rent: '', status: '空置', client_name: '', client_phone: '', move_in_date: '', residents: '', age: '', gender_relation: '', occupation: '', smoking: '否', pets: '', budget: '', area_priority: '', special_needs: '', photos: [] }

async function compressImage(file, maxWidth = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width)
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        }, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function Properties() {
  const [list, setList] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [previewPhotos, setPreviewPhotos] = useState([])

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data } = await supabase.from('properties').select('*').order('created_at')
    setList(data || [])
    setLoading(false)
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const urls = []
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`壓縮並上傳第 ${i + 1} / ${files.length} 張...`)
      const compressed = await compressImage(files[i])
      const fileName = Date.now() + '_' + i + '.jpg'
      const { error } = await supabase.storage.from('property-photos').upload(fileName, compressed)
      if (!error) {
        const { data } = supabase.storage.from('property-photos').getPublicUrl(fileName)
        urls.push(data.publicUrl)
      }
    }
    const newPhotos = [...(form.photos || []), ...urls]
    setForm({ ...form, photos: newPhotos })
    setPreviewPhotos(newPhotos)
    setUploading(false)
    setUploadProgress('')
  }

  function handleRemovePhoto(url) {
    const newPhotos = (form.photos || []).filter(p => p !== url)
    setForm({ ...form, photos: newPhotos })
    setPreviewPhotos(newPhotos)
  }

  async function handleSubmit() {
    if (!form.name || !form.address || !form.rent) return alert('請填寫房間名稱、地址和租金')
    if (editId) {
      await supabase.from('properties').update(form).eq('id', editId)
    } else {
      await supabase.from('properties').insert([form])
    }
    setForm(empty)
    setEditId(null)
    setShowForm(false)
    setPreviewPhotos([])
    fetchData()
  }

  async function handleDelete(id) {
    if (!window.confirm('確定刪除此房源？')) return
    await supabase.from('properties').delete().eq('id', id)
    fetchData()
  }

  function handleEdit(item) {
    setForm({ name: item.name, address: item.address, rent: item.rent, status: item.status, client_name: item.client_name || '', client_phone: item.client_phone || '', move_in_date: item.move_in_date || '', residents: item.residents || '', age: item.age || '', gender_relation: item.gender_relation || '', occupation: item.occupation || '', smoking: item.smoking || '否', pets: item.pets || '', budget: item.budget || '', area_priority: item.area_priority || '', special_needs: item.special_needs || '', photos: item.photos || [] })
    setPreviewPhotos(item.photos || [])
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 16px' }}>
        <h2 style={{ margin: 0 }}>🏠 房源管理</h2>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true); setPreviewPhotos([]) }} style={btnStyle('#2563eb')}>+ 新增房源</button>
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>{editId ? '編輯房源' : '新增房源'}</h3>

          <p style={sectionTitle}>🏠 房源資料</p>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>房間名稱 *</label>
              <input style={inputStyle} placeholder="如：101室" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>月租金（元）*</label>
              <input style={inputStyle} type="number" placeholder="如：15000" value={form.rent} onChange={e => setForm({ ...form, rent: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>地址 *</label>
              <input style={inputStyle} placeholder="如：台北市大安區XX路1號" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>狀態</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option>空置</option>
                <option>已租</option>
              </select>
            </div>
          </div>

          <p style={sectionTitle}>📸 房源照片（自動壓縮）</p>
          <div>
            <label style={{ ...labelStyle, cursor: uploading ? 'not-allowed' : 'pointer', display: 'inline-block', padding: '8px 16px', background: uploading ? '#e5e7eb' : '#f0f4ff', border: '1px dashed #2563eb', borderRadius: '8px', color: uploading ? '#9ca3af' : '#2563eb' }}>
              {uploading ? uploadProgress : '+ 選擇照片（可多選）'}
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>照片會自動壓縮至約 200-400KB，節省儲存空間</p>

            {uploading && (
              <div style={{ marginTop: '8px', padding: '10px 14px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', fontSize: '13px', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⏳ {uploadProgress}，請勿關閉頁面或點擊確認，等待上傳完成！
              </div>
            )}

            {previewPhotos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {previewPhotos.map((url, i) => (
                  <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <img src={url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />
                    <a href={url} download target="_blank" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', background: '#f0f4ff', padding: '2px 6px', borderRadius: '4px' }}>下載</a>
                    <button onClick={() => handleRemovePhoto(url)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p style={sectionTitle}>👤 客戶資料</p>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>姓名</label>
              <input style={inputStyle} placeholder="客戶姓名" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>聯絡電話</label>
              <input style={inputStyle} placeholder="如：0912345678" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>入住時間</label>
              <input style={inputStyle} placeholder="如：2024/06/01" value={form.move_in_date} onChange={e => setForm({ ...form, move_in_date: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>居住人數</label>
              <input style={inputStyle} type="number" placeholder="如：2" value={form.residents} onChange={e => setForm({ ...form, residents: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>年齡</label>
              <input style={inputStyle} placeholder="如：30歲" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>性別／關係</label>
              <input style={inputStyle} placeholder="如：男、夫妻、家庭" value={form.gender_relation} onChange={e => setForm({ ...form, gender_relation: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>職業類別</label>
              <input style={inputStyle} placeholder="如：上班族、學生" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>有無抽菸</label>
              <select style={inputStyle} value={form.smoking} onChange={e => setForm({ ...form, smoking: e.target.value })}>
                <option>否</option>
                <option>是</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>有無寵物／品種</label>
              <input style={inputStyle} placeholder="如：無、貓咪" value={form.pets} onChange={e => setForm({ ...form, pets: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>租金預算</label>
              <input style={inputStyle} placeholder="如：15000~20000" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>需求區域排序</label>
              <input style={inputStyle} placeholder="如：新竹北區 > 竹北 > 東區" value={form.area_priority} onChange={e => setForm({ ...form, area_priority: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>基本／特別需求</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="如：需要停車位、近捷運站..." value={form.special_needs} onChange={e => setForm({ ...form, special_needs: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleSubmit} disabled={uploading} style={btnStyle(uploading ? '#9ca3af' : '#2563eb')}>{uploading ? '⏳ 照片上傳中...' : editId ? '儲存修改' : '確認新增'}</button>
            <button onClick={() => { setShowForm(false); setPreviewPhotos([]) }} style={btnStyle('#6b7280')}>取消</button>
          </div>
        </div>
      )}

      {loading ? <p>載入中...</p> : list.length === 0 ? (
        <p style={{ color: '#6b7280', padding: '0 16px' }}>尚未新增任何房源，點擊「新增房源」開始使用。</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', padding: '0 16px' }}>
          {list.map(item => (
            <div key={item.id} style={cardStyle}>
              {item.photos && item.photos.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {item.photos.map((url, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <img src={url} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />
                        <a href={url} download target="_blank" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', background: '#f0f4ff', padding: '2px 6px', borderRadius: '4px' }}>下載</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: '0 0 8px' }}>{item.name}</h3>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', background: item.status === '已租' ? '#dcfce7' : '#fef9c3', color: item.status === '已租' ? '#166534' : '#854d0e' }}>{item.status}</span>
              </div>
              <p style={infoStyle}>📍 {item.address}</p>
              <p style={{ ...infoStyle, fontWeight: '500' }}>💰 NT$ {Number(item.rent).toLocaleString()} / 月</p>
              {item.client_name && <p style={infoStyle}>👤 {item.client_name} {item.client_phone && '| ' + item.client_phone}</p>}
              {item.move_in_date && <p style={infoStyle}>🗓 入住：{item.move_in_date}</p>}
              {item.budget && <p style={infoStyle}>💲 預算：{item.budget}</p>}
              {item.special_needs && <p style={infoStyle}>📋 {item.special_needs}</p>}
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
const infoStyle = { margin: '4px 0', fontSize: '13px', color: '#6b7280' }
const sectionTitle = { fontSize: '13px', fontWeight: '600', color: '#374151', margin: '16px 0 8px', paddingBottom: '6px', borderBottom: '1px solid #f3f4f6' }
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }
const btnStyle = (bg) => ({ padding: '8px 16px', borderRadius: '8px', border: 'none', background: bg, color: '#fff', cursor: 'pointer', fontSize: '14px' })

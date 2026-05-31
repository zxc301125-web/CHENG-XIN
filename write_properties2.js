const fs = require('fs')

const code = `import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const empty = { name: '', address: '', rent: '', status: '\u7a7a\u7f6e', client_name: '', client_phone: '', move_in_date: '', residents: '', age: '', gender_relation: '', occupation: '', smoking: '\u5426', pets: '', budget: '', area_priority: '', special_needs: '', photos: [] }

export default function Properties() {
  const [list, setList] = useState([])
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
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
    for (const file of files) {
      const fileName = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.]/g, '_')
      const { error } = await supabase.storage.from('property-photos').upload(fileName, file)
      if (!error) {
        const { data } = supabase.storage.from('property-photos').getPublicUrl(fileName)
        urls.push(data.publicUrl)
      }
    }
    const newPhotos = [...(form.photos || []), ...urls]
    setForm({ ...form, photos: newPhotos })
    setPreviewPhotos(newPhotos)
    setUploading(false)
  }

  function handleRemovePhoto(url) {
    const newPhotos = (form.photos || []).filter(p => p !== url)
    setForm({ ...form, photos: newPhotos })
    setPreviewPhotos(newPhotos)
  }

  async function handleSubmit() {
    if (!form.name || !form.address || !form.rent) return alert('\u8acb\u586b\u5beb\u623f\u9593\u540d\u7a31\u3001\u5730\u5740\u548c\u79df\u91d1')
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
    if (!window.confirm('\u78ba\u5b9a\u522a\u9664\u6b64\u623f\u6e90\uff1f')) return
    await supabase.from('properties').delete().eq('id', id)
    fetchData()
  }

  function handleEdit(item) {
    setForm({ name: item.name, address: item.address, rent: item.rent, status: item.status, client_name: item.client_name || '', client_phone: item.client_phone || '', move_in_date: item.move_in_date || '', residents: item.residents || '', age: item.age || '', gender_relation: item.gender_relation || '', occupation: item.occupation || '', smoking: item.smoking || '\u5426', pets: item.pets || '', budget: item.budget || '', area_priority: item.area_priority || '', special_needs: item.special_needs || '', photos: item.photos || [] })
    setPreviewPhotos(item.photos || [])
    setEditId(item.id)
    setShowForm(true)
  }

  return (
    <div>
      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#7b1c3e', fontSize: '14px', cursor: 'pointer', padding: '6px 0', fontWeight: '500' }}>
          \u2190 \u56de\u4e3b\u9801
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 16px' }}>
        <h2 style={{ margin: 0 }}>\ud83c\udfe0 \u623f\u6e90\u7ba1\u7406</h2>
        <button onClick={() => { setForm(empty); setEditId(null); setShowForm(true); setPreviewPhotos([]) }} style={btnStyle('#2563eb')}>+ \u65b0\u589e\u623f\u6e90</button>
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>{editId ? '\u7de8\u8f2f\u623f\u6e90' : '\u65b0\u589e\u623f\u6e90'}</h3>

          <p style={sectionTitle}>\ud83c\udfe0 \u623f\u6e90\u8cc7\u6599</p>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>\u623f\u9593\u540d\u7a31 *</label>
              <input style={inputStyle} placeholder="\u5982\uff1a101\u5ba4" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u6708\u79df\u91d1\uff08\u5143\uff09*</label>
              <input style={inputStyle} type="number" placeholder="\u5982\uff1a15000" value={form.rent} onChange={e => setForm({ ...form, rent: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>\u5730\u5740 *</label>
              <input style={inputStyle} placeholder="\u5982\uff1a\u53f0\u5317\u5e02\u5927\u5b89\u5340XX\u8def1\u865f" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u72c0\u614b</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option>\u7a7a\u7f6e</option>
                <option>\u5df2\u79df</option>
              </select>
            </div>
          </div>

          <p style={sectionTitle}>\ud83d\udcf8 \u623f\u6e90\u7167\u7247</p>
          <div>
            <label style={{ ...labelStyle, cursor: 'pointer', display: 'inline-block', padding: '8px 16px', background: '#f0f4ff', border: '1px dashed #2563eb', borderRadius: '8px', color: '#2563eb' }}>
              {uploading ? '\u4e0a\u50b3\u4e2d...' : '+ \u9078\u64c7\u7167\u7247'}
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            {previewPhotos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                {previewPhotos.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                    <button onClick={() => handleRemovePhoto(url)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>\u00d7</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p style={sectionTitle}>\ud83d\udc64 \u5ba2\u6236\u8cc7\u6599</p>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>\u59d3\u540d</label>
              <input style={inputStyle} placeholder="\u5ba2\u6236\u59d3\u540d" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u806f\u7d61\u96fb\u8a71</label>
              <input style={inputStyle} placeholder="\u5982\uff1a0912345678" value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u5165\u4f4f\u6642\u9593</label>
              <input style={inputStyle} placeholder="\u5982\uff1a2024/06/01" value={form.move_in_date} onChange={e => setForm({ ...form, move_in_date: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u5c45\u4f4f\u4eba\u6578</label>
              <input style={inputStyle} type="number" placeholder="\u5982\uff1a2" value={form.residents} onChange={e => setForm({ ...form, residents: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u5e74\u9f61</label>
              <input style={inputStyle} placeholder="\u5982\uff1a30\u6b72" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u6027\u5225 / \u95dc\u4fc2</label>
              <input style={inputStyle} placeholder="\u5982\uff1a\u7537\u3001\u592b\u59bb\u3001\u5bb6\u5ead" value={form.gender_relation} onChange={e => setForm({ ...form, gender_relation: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u8077\u696d\u985e\u5225</label>
              <input style={inputStyle} placeholder="\u5982\uff1a\u4e0a\u73ed\u65cf\u3001\u5b78\u751f" value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u6709\u7121\u62bd\u83f8</label>
              <select style={inputStyle} value={form.smoking} onChange={e => setForm({ ...form, smoking: e.target.value })}>
                <option>\u5426</option>
                <option>\u662f</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>\u6709\u7121\u5bf5\u7269 / \u54c1\u7a2e</label>
              <input style={inputStyle} placeholder="\u5982\uff1a\u7121\u3001\u8c93\u548c" value={form.pets} onChange={e => setForm({ ...form, pets: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>\u79df\u91d1\u9810\u7b97</label>
              <input style={inputStyle} placeholder="\u5982\uff1a15000~20000" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>\u9700\u6c42\u5340\u57df\u6392\u5e8f</label>
              <input style={inputStyle} placeholder="\u5982\uff1a\u65b0\u7afe\u5317\u5340 > \u7af9\u5317 > \u6771\u5340" value={form.area_priority} onChange={e => setForm({ ...form, area_priority: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>\u57fa\u672c / \u7279\u5225\u9700\u6c42</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} placeholder="\u5982\uff1a\u9700\u8981\u505c\u8eca\u4f4d\u3001\u8fd1\u6377\u904b\u7ad9..." value={form.special_needs} onChange={e => setForm({ ...form, special_needs: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button onClick={handleSubmit} style={btnStyle('#2563eb')}>{editId ? '\u5132\u5b58\u4fee\u6539' : '\u78ba\u8a8d\u65b0\u589e'}</button>
            <button onClick={() => { setShowForm(false); setPreviewPhotos([]) }} style={btnStyle('#6b7280')}>\u53d6\u6d88</button>
          </div>
        </div>
      )}

      {loading ? <p>\u8f09\u5165\u4e2d...</p> : list.length === 0 ? (
        <p style={{ color: '#6b7280', padding: '0 16px' }}>\u5c1a\u672a\u65b0\u589e\u4efb\u4f55\u623f\u6e90\uff0c\u9ede\u64ca\u300c\u65b0\u589e\u623f\u6e90\u300d\u958b\u59cb\u4f7f\u7528\u3002</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', padding: '0 16px' }}>
          {list.map(item => (
            <div key={item.id} style={cardStyle}>
              {item.photos && item.photos.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {item.photos.map((url, i) => (
                      <img key={i} src={url} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: '0 0 8px' }}>{item.name}</h3>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', background: item.status === '\u5df2\u79df' ? '#dcfce7' : '#fef9c3', color: item.status === '\u5df2\u79df' ? '#166534' : '#854d0e' }}>{item.status}</span>
              </div>
              <p style={infoStyle}>\ud83d\udccd {item.address}</p>
              <p style={{ ...infoStyle, fontWeight: '500' }}>\ud83d\udcb0 NT$ {Number(item.rent).toLocaleString()} / \u6708</p>
              {item.client_name && <p style={infoStyle}>\ud83d\udc64 {item.client_name} {item.client_phone && '| ' + item.client_phone}</p>}
              {item.move_in_date && <p style={infoStyle}>\ud83d\uddd3 \u5165\u4f4f\uff1a{item.move_in_date}</p>}
              {item.budget && <p style={infoStyle}>\ud83d\udcb2 \u9810\u7b97\uff1a{item.budget}</p>}
              {item.special_needs && <p style={infoStyle}>\ud83d\udccb {item.special_needs}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => handleEdit(item)} style={btnStyle('#f59e0b')}>\u7de8\u8f2f</button>
                <button onClick={() => handleDelete(item.id)} style={btnStyle('#ef4444')}>\u522a\u9664</button>
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
`

fs.writeFileSync('src/pages/Properties.jsx', code, 'utf8')
console.log('done')

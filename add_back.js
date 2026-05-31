const fs = require('fs')
const pages = ['Properties', 'Tenants', 'Leases', 'ClientNeeds', 'Maintenance']
const backButton = `
      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => window.location.href = '/'} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#7b1c3e', fontSize: '14px', cursor: 'pointer', padding: '6px 0', fontWeight: '500' }}>
          \u2190 \u56de\u4e3b\u9801
        </button>
      </div>`
pages.forEach(page => {
  const path = `src/pages/${page}.jsx`
  try {
    let content = fs.readFileSync(path, 'utf8')
    if (content.includes('\u56de\u4e3b\u9801')) { console.log(page + ': skip'); return }
    const divIndex = content.indexOf('return (')
    const divPos = content.indexOf('<div', divIndex)
    const divEnd = content.indexOf('>', divPos) + 1
    const newContent = content.slice(0, divEnd) + backButton + content.slice(divEnd)
    fs.writeFileSync(path, newContent, 'utf8')
    console.log(page + ': done')
  } catch(e) { console.log(page + ': error - ' + e.message) }
})
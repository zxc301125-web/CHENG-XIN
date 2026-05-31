import { useState } from 'react'

/**
 * 使用說明 Tooltip
 *
 * 滑鼠移到 ⓘ 圖示上會顯示說明,離開即消失。
 *
 * Props:
 *   title       - 說明標題
 *   children    - 說明內容
 *   inline      - true: 內嵌在標題旁(預設) / false: 浮在右上角
 *
 * 用法:
 * <HelpBox title="租約管理">
 *   <p>說明內容...</p>
 * </HelpBox>
 */
export default function HelpBox({ title, children, inline = true }) {
  const [show, setShow] = useState(false)

  const wrapStyle = inline
    ? { display: 'inline-block', position: 'relative', marginLeft: '6px', verticalAlign: 'middle' }
    : { position: 'absolute', top: '14px', right: '14px', zIndex: 10 }

  return (
    <span
      style={wrapStyle}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: show ? '#7b1c3e' : '#f0d99a',
          color: show ? '#fff' : '#9b7610',
          fontSize: '12px',
          fontWeight: '700',
          cursor: 'help',
          transition: 'all 0.15s',
          userSelect: 'none'
        }}
      >
        ?
      </span>
      {show && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: inline ? 'auto' : 0,
            left: inline ? '50%' : 'auto',
            transform: inline ? 'translateX(-50%)' : 'none',
            minWidth: '260px',
            maxWidth: '320px',
            background: '#fffaeb',
            border: '1px solid #f0d99a',
            borderLeft: '4px solid #d4a850',
            borderRadius: '10px',
            padding: '12px 14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 1000,
            textAlign: 'left',
            pointerEvents: 'none'
          }}
        >
          {title && (
            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#9b7610',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              📖 {title}
            </div>
          )}
          <div style={{
            fontSize: '12px',
            color: '#7a5a10',
            lineHeight: '1.6'
          }}>
            {children}
          </div>
        </div>
      )}
    </span>
  )
}

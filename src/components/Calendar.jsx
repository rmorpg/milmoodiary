import React, { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { todayStr } from '../lib/dataModel.js'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function Calendar({ index, selectedDate, onSelectDate }) {
  const auth = useAuth()
  const today = todayStr()
  const [cursor, setCursor] = useState(() => {
    const [y, m] = (selectedDate || today).split('-').map(Number)
    return { year: y, month: m - 1 } // month: 0-11
  })

  const weeks = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])

  function shiftMonth(delta) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  // ★ 오늘로 즉시 복귀하는 함수
  function goToToday() {
    const [y, m] = today.split('-').map(Number)
    setCursor({ year: y, month: m - 1 })
    onSelectDate(today)
  }

  return (
    <div className="calendar card">
      {/* ★ 최우측 상단 '오늘' 버튼 & < 2026년 9월 > 중앙 정렬 레이아웃 */}
      <div
        className="calendar-header"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '14px',
          minHeight: '36px',
        }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => shiftMonth(-1)}
          style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ‹
        </button>

        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
          {cursor.year}년 {cursor.month + 1}월
        </h2>

        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => shiftMonth(1)}
          style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ›
        </button>

        {/* ★ 우측 상단 모서리에 독립된 '오늘' 버튼 */}
        <button
          type="button"
          className="btn btn-small"
          onClick={goToToday}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '3px 9px',
            fontSize: '11px',
            fontWeight: '700',
            borderRadius: '999px',
            background: 'var(--surface-sunken)',
            color: 'var(--ink-soft)',
            border: '1px solid var(--line)',
            cursor: 'pointer',
          }}
        >
          오늘
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
      </div>

      <div className="calendar-grid">
        {weeks.flat().map((cell, i) => {
          if (!cell) return <div key={i} className="calendar-cell empty" />
          const authors = index[cell] || []
          const isSelected = cell === selectedDate
          const isToday = cell === today
          return (
            <button
              key={cell}
              type="button"
              className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => onSelectDate(cell)}
            >
              <span className="calendar-day-num">{Number(cell.split('-')[2])}</span>
              <span className="calendar-dots">
                {authors.map((id) => {
                  const m = auth.members.find((mm) => mm.id === id)
                  return <span key={id} className="calendar-dot" style={{ background: m?.color || '#ccc' }} />
                })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    cells.push(`${year}-${mm}-${dd}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

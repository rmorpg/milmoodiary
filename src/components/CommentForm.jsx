import React, { useRef, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { addCustomEmoji, removeCustomEmoji, makeCommentId } from '../lib/dataModel.js'
import { resizeStickerToDataUrl } from '../lib/image.js'
export default function CommentForm({ onSubmit }) {
  const auth = useAuth()
  const [text, setText] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(null) // { id, name, image }
  const [showPicker, setShowPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  // 새 이모티콘 등록 상태
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newEmojiFile, setNewEmojiFile] = useState(null)
  const [newEmojiPreview, setNewEmojiPreview] = useState(null)
  const [newEmojiName, setNewEmojiName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const wrapRef = useRef(null)
  const fileInputRef = useRef(null)
  // 저장소에 등록된 통합 이모티콘 목록
  const customEmojis = auth.config?.customEmojis || []
  // 검색어에 따른 필터링
  const filteredEmojis = customEmojis.filter((e) =>
    (e.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
  )
  // 외부 클릭 시 이모티콘 팝오버 닫기
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowPicker(false)
        setIsAddingNew(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  function handlePickFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setNewEmojiFile(f)
    setNewEmojiPreview(URL.createObjectURL(f))
    if (!newEmojiName.trim()) {
      const baseName = f.name.split('.')[0].replace(/[^a-zA-Z0-9_가-힣-]/g, '')
      setNewEmojiName(baseName || '이모티콘')
    }
  }
  async function handleCreateEmoji(e) {
    e.preventDefault()
    if (!newEmojiFile) return
    setUploading(true)
    try {
      // 130x130 선명하고 가벼운 스티커로 변환하여 저장
      const dataUrl = await resizeStickerToDataUrl(newEmojiFile, 130)
      const emoji = {
        id: makeCommentId(),
        name: newEmojiName.trim() || '이모티콘',
        image: dataUrl,
      }
      const updated = await addCustomEmoji(auth.client, auth.config, auth.configSha, emoji)
      auth.setConfig(updated)
      await auth.refreshConfig()
      // 방금 만든 이모티콘을 즉시 댓글 스티커로 선택
      setSelectedEmoji(emoji)
      setIsAddingNew(false)
      setShowPicker(false)
      setNewEmojiFile(null)
      setNewEmojiPreview(null)
      setNewEmojiName('')
    } catch (err) {
      alert(err.message || '이모티콘 등록에 실패했어요.')
    } finally {
      setUploading(false)
    }
  }
  async function handleDeleteEmoji(e, emojiId, emojiName) {
    e.stopPropagation()
    if (deletingId) return
    if (!window.confirm(`':${emojiName}:' 이모티콘을 삭제할까요? 모두의 이모티콘 목록에서 사라집니다.`)) {
      return
    }
    setDeletingId(emojiId)
    try {
      if (typeof removeCustomEmoji === 'function') {
        const updated = await removeCustomEmoji(auth.client, auth.config, auth.configSha, emojiId)
        auth.setConfig(updated)
        await auth.refreshConfig()
      } else {
        // removeCustomEmoji 헬퍼가 없는 경우 config 직접 갱신 fallback
        const nextCustom = (auth.config.customEmojis || []).filter((item) => item.id !== emojiId)
        const updated = { ...auth.config, customEmojis: nextCustom }
        auth.setConfig(updated)
        await auth.refreshConfig()
      }
      if (selectedEmoji?.id === emojiId) {
        setSelectedEmoji(null)
      }
    } catch (err) {
      alert(err.message || '이모티콘 삭제에 실패했어요.')
    } finally {
      setDeletingId(null)
    }
  }
  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() && !selectedEmoji) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit({ text: text.trim(), emoji: selectedEmoji })
      setText('')
      setSelectedEmoji(null)
      setShowPicker(false)
    } catch (err) {
      setError(err.message || '댓글을 남기지 못했어요.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="comment-form" onSubmit={handleSubmit} style={{ position: 'relative' }}>
      {/* 선택된 이모티콘 스티커 미리보기 */}
      {selectedEmoji && (
        <div className="comment-form-preview" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '10px', width: 'fit-content', marginBottom: '6px' }}>
          <img
            src={selectedEmoji.image}
            alt={selectedEmoji.name}
            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px' }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600 }}>:{selectedEmoji.name}:</span>
          <button type="button" className="remove-preview" onClick={() => setSelectedEmoji(null)} style={{ border: 'none', background: '#e2e8f0', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}>
            ✕
          </button>
        </div>
      )}
      <div className="comment-form-row">
        <input
          type="text"
          placeholder="댓글을 남겨보세요..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {/* 이모티콘 팝오버 열기 버튼 */}
        <div ref={wrapRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => {
              setShowPicker((v) => !v)
              setIsAddingNew(false)
            }}
          >
            이모티콘
          </button>
          {/* 통합 이모티콘 선택창 */}
          {showPicker && (
            <div
              className="reaction-picker"
              style={{
                position: 'absolute',
                top: 'auto',
                bottom: 'calc(100% + 12px)',
                right: 0,
                left: 'auto',
                zIndex: 9999,
                width: 'min(320px, calc(100vw - 32px))',
                maxHeight: '420px',
                overflowY: 'auto',
                background: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
                border: '1px solid #e2e8f0',
                padding: '14px',
                boxSizing: 'border-box',
              }}
            >
              {!isAddingNew ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink, #2e2c26)' }}>
                      이모티콘 ({customEmojis.length})
                    </div>
                    <button
                      type="button"
                      className="reaction-picker-add-link"
                      style={{
                        fontSize: '12px',
                        color: 'var(--current-user-color, var(--accent, #7cb342))',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                      }}
                      onClick={() => setIsAddingNew(true)}
                    >
                      + 등록
                    </button>
                  </div>
                  {/* 이모티콘 실시간 검색창 */}
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="이모티콘 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 28px 7px 10px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          border: 'none',
                          background: 'none',
                          fontSize: '12px',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                        title="검색어 초기화"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {customEmojis.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--ink-soft, #6b6a60)', margin: '22px 0', textAlign: 'center', lineHeight: 1.6 }}>
                      아직 등록된 이모티콘이 없어요.<br />
                      아래 버튼을 눌러 사진이나 짤을 등록해보세요!
                    </div>
                  ) : filteredEmojis.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--ink-soft, #6b6a60)', margin: '22px 0', textAlign: 'center', lineHeight: 1.6 }}>
                      '{searchQuery}' 검색 결과가 없어요.
                    </div>
                  ) : (
                    <div className="reaction-picker-grid" style={{ maxHeight: '200px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '2px' }}>
                      {filteredEmojis.map((e) => (
                        <div key={e.id} className="reaction-picker-cell" style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="reaction-picker-item"
                            title={':' + e.name + ':'}
                            style={{ width: '100%', height: '56px', padding: '4px', cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedEmoji(e)
                              setShowPicker(false)
                            }}
                          >
                            <img src={e.image} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          </button>
                          {/* 이모티콘 삭제 버튼: 사용자 지정 색으로 바뀌지 않고, 테두리만 더 빨갛게 강조됨 */}
                          <button
                            type="button"
                            className="reaction-picker-delete"
                            title={`'${e.name}' 이모티콘 삭제`}
                            disabled={deletingId === e.id}
                            onClick={(ev) => handleDeleteEmoji(ev, e.id, e.name)}
                          >
                            {deletingId === e.id ? '…' : '✕'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    className="reaction-upload-btn btn"
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      padding: '10px',
                      cursor: 'pointer',
                      display: 'block',
                      borderRadius: '12px',
                      background: 'color-mix(in srgb, var(--current-user-color) 12%, #ffffff)',
                      color: 'var(--current-user-color)',
                      border: '1px solid color-mix(in srgb, var(--current-user-color) 35%, transparent)',
                      fontSize: '13px',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                    onClick={() => setIsAddingNew(true)}
                  >
                    이모티콘 등록하기
                  </button>
                </>
              ) : (
                <div className="reaction-sticker-form">
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--ink, #2e2c26)' }}>새 이모티콘 등록</div>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>
                    등록한 이모티콘은 참가자 모두가 공유하여 댓글에 사용할 수 있어요.
                  </p>
                  {newEmojiPreview ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                      <img src={newEmojiPreview} alt="미리보기" style={{ width: '90px', height: '90px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    </div>
                  ) : (
                    <label
                      className="reaction-upload-btn"
                      style={{
                        width: '100%',
                        cursor: 'pointer',
                        textAlign: 'center',
                        padding: '16px',
                        border: '2px dashed color-mix(in srgb, var(--current-user-color) 40%, #cbd5e1)',
                        borderRadius: '12px',
                        display: 'block',
                        marginBottom: '10px',
                        fontSize: '12px',
                        background: 'color-mix(in srgb, var(--current-user-color) 6%, #ffffff)',
                        color: 'var(--ink, #2e2c26)',
                        boxSizing: 'border-box',
                      }}
                    >
                      📁 사진 또는 짤 이미지 선택
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickFile} hidden />
                    </label>
                  )}
                  <input
                    type="text"
                    placeholder="이모티콘 이름 (예: 냥이, 축하)"
                    value={newEmojiName}
                    onChange={(e) => setNewEmojiName(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }}
                  />
                  <div className="reaction-sticker-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setIsAddingNew(false)
                        setNewEmojiFile(null)
                        setNewEmojiPreview(null)
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      style={{
                        flex: 1,
                        background: 'var(--current-user-color) !important',
                        borderColor: 'var(--current-user-color) !important',
                        color: '#ffffff !important',
                      }}
                      disabled={uploading || !newEmojiFile}
                      onClick={handleCreateEmoji}
                    >
                      {uploading ? '등록 중...' : '등록'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={busy || (!text.trim() && !selectedEmoji)}
        >
          {busy ? '올리는 중...' : '등록'}
        </button>
      </div>
      {error && <p className="setup-error">{error}</p>}
    </form>
  )
}
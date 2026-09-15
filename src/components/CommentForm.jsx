import React, { useRef, useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { addCustomEmoji, removeCustomEmoji, makeCommentId } from '../lib/dataModel.js'
import { resizeStickerToDataUrl } from '../lib/image.js'

export default function CommentForm({ onSubmit }) {
  const auth = useAuth()
  const [text, setText] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newEmojiFile, setNewEmojiFile] = useState(null)
  const [newEmojiPreview, setNewEmojiPreview] = useState(null)
  const [newEmojiName, setNewEmojiName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const wrapRef = useRef(null)
  const fileInputRef = useRef(null)

  const customEmojis = auth.config?.customEmojis || []

  const filteredEmojis = customEmojis.filter((e) =>
    (e.name || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowPicker(false)
        setIsAddingNew(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handlePickFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setNewEmojiFile(file)
    setNewEmojiPreview(URL.createObjectURL(file))
    if (!newEmojiName) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').slice(0, 10)
      setNewEmojiName(baseName)
    }
  }

  async function handleCreateEmoji() {
    if (!newEmojiFile) return
    setUploading(true)
    try {
      const dataUrl = await resizeStickerToDataUrl(newEmojiFile, 130)
      const emoji = {
        id: makeCommentId(),
        name: newEmojiName.trim() || '이모티콘',
        image: dataUrl,
      }
      const updated = await addCustomEmoji(auth.client, auth.config, auth.configSha, emoji)
      auth.setConfig(updated)
      await auth.refreshConfig()

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

  async function handleDeleteEmoji(ev, emojiId, emojiName) {
    ev.stopPropagation()
    if (!window.confirm(`':${emojiName}:' 이모티콘을 삭제할까요?`)) return
    setDeletingId(emojiId)
    try {
      const updated = await removeCustomEmoji(auth.client, auth.config, auth.configSha, emojiId)
      auth.setConfig(updated)
      await auth.refreshConfig()
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
      {selectedEmoji && (
        <div className="comment-form-preview" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '10px', width: 'fit-content', marginBottom: '6px' }}>
          <img
            src={selectedEmoji.image}
            alt={selectedEmoji.name}
            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px' }}
          />
          <span style={{ fontSize: '12px', color: '#64748b' }}>:{selectedEmoji.name}:</span>
          <button type="button" className="remove-preview" onClick={() => setSelectedEmoji(null)} style={{ border: 'none', background: '#e2e8f0', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px' }}>
            ✕
          </button>
        </div>
      )}

      <div className="comment-form-row" style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="댓글을 남겨보세요..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

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

          {/* ★ 모바일에서는 화면 중앙에 시원하게 뜨고 절대 짤리지 않는 이모티콘 팝오버 */}
          {showPicker && (
            <div className="reaction-picker">
              {!isAddingNew ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink, #2e2c26)', whiteSpace: 'nowrap' }}>
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
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => setIsAddingNew(true)}
                    >
                      + 등록
                    </button>
                  </div>

                  {/* 검색창 */}
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="이모티콘 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 28px 6px 10px',
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

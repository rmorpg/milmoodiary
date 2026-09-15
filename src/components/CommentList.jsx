import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from './Avatar.jsx'

export default function CommentList({
  comments = [],
  onUpdateComment,
  onDeleteComment,
  isEntryOwner = false,
}) {
  const auth = useAuth()
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editEmoji, setEditEmoji] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!comments || comments.length === 0) return null

  function startEdit(comment) {
    setEditingId(comment.id)
    setEditText(comment.text || '')
    setEditEmoji(comment.emoji || null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
    setEditEmoji(null)
  }

  async function handleSave(commentId) {
    if (!editText.trim() && !editEmoji) {
      window.alert('댓글 내용 또는 스티커를 입력해주세요.')
      return
    }
    setBusy(true)
    try {
      await onUpdateComment?.(commentId, {
        text: editText.trim(),
        emoji: editEmoji,
      })
      cancelEdit()
    } catch (e) {
      window.alert(e.message || '댓글 수정에 실패했어요.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(commentId) {
    if (!window.confirm('정말 이 댓글을 삭제할까요? 되돌릴 수 없어요.')) return
    try {
      await onDeleteComment?.(commentId)
    } catch (e) {
      window.alert(e.message || '댓글 삭제에 실패했어요.')
    }
  }

  return (
    <ul className="comment-list">
      {comments.map((c) => {
        const author = auth.members?.find((m) => m.id === c.author)
        const isMyComment = auth.currentMember?.id === c.author
        // ★ 오직 댓글 작성자 본인만 삭제 가능 (게시글 주인이라도 타인 댓글 삭제 불가)
        const canDelete = isMyComment
        const isEditing = editingId === c.id

        return (
          <li key={c.id} className="comment-item">
            <Avatar member={author} size={28} />
            <div className="comment-body">
              <div className="comment-meta">
                <div className="comment-meta-left">
                  <span className="comment-author">{author?.displayName || c.author}</span>
                  <span className="comment-time">{c.createdAt ? formatTime(c.createdAt) : ''}</span>
                  {c.updatedAt && <span className="comment-edited-mark">(수정됨)</span>}
                </div>

                {!isEditing && (
                  <div className="comment-actions">
                    {isMyComment && (
                      <button
                        type="button"
                        className="comment-action-btn"
                        onClick={() => startEdit(c)}
                      >
                        수정
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="comment-action-btn delete"
                        onClick={() => handleDelete(c.id)}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="comment-edit-form">
                  <textarea
                    rows={2}
                    className="comment-edit-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="수정할 댓글 내용을 입력하세요..."
                    autoFocus
                  />
                  {editEmoji && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                      <img
                        src={editEmoji.image}
                        alt={editEmoji.name}
                        style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>:{editEmoji.name}:</span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-small"
                        style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--danger, #ef4444)' }}
                        onClick={() => setEditEmoji(null)}
                      >
                        스티커 제거
                      </button>
                    </div>
                  )}
                  <div className="comment-edit-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-small"
                      onClick={cancelEdit}
                      disabled={busy}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => handleSave(c.id)}
                      disabled={busy}
                    >
                      {busy ? '저장 중…' : '저장'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {c.text && <p className="comment-text">{c.text}</p>}
                  {c.emoji && (
                    <div className="comment-emoji-wrap" style={{ marginTop: '6px' }}>
                      <img
                        src={c.emoji.image}
                        alt={c.emoji.name}
                        className="comment-emoji comment-sticker"
                        style={{
                          width: '130px',
                          height: '130px',
                          maxWidth: '130px',
                          maxHeight: '130px',
                          objectFit: 'contain',
                          display: 'block',
                          borderRadius: '8px',
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function formatTime(isoStr) {
  try {
    const d = new Date(isoStr)
    const m = d.getMonth() + 1
    const day = d.getDate()
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${m}.${day} ${h}:${min}`
  } catch {
    return ''
  }
}
// 1. 일기 본문 첨부 이미지 리사이즈 (EntryEditor.jsx 연동)
export function resizeImageFile(file, maxDim = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('파일이 없습니다.'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요.'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('이미지를 불러오지 못했어요.'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('캔버스 생성 실패'))
          return
        }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(mime, quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 2. 130x130 선명한 스티커 변환 유틸리티 (EmojiPicker.jsx 연동)
export function resizeStickerToDataUrl(file, maxDim = 130, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('파일이 없습니다.'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요.'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('이미지를 불러오지 못했어요.'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('캔버스 생성 실패'))
          return
        }
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // 투명 배경 유지를 위해 png 또는 고품질 webp
        const mime = file.type === 'image/png' ? 'image/png' : 'image/webp'
        resolve(canvas.toDataURL(mime, quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// 3. 파일 -> DataURL 변환 헬퍼 (호환용)
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요.'))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

// 별칭 export (혹시 모를 호환성 대비)
export { resizeImageFile as resizeImage }

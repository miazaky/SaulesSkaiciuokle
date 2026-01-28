import React, { useState, useMemo } from 'react'

function CreateQuestion() {
  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState('choose_one')
  const [imageFile, setImageFile] = useState(null)

  const [choicesText, setChoicesText] = useState('')
  const [intervalMin, setIntervalMin] = useState('')
  const [intervalMax, setIntervalMax] = useState('')

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return null
    return URL.createObjectURL(imageFile)
  }, [imageFile])

  const onSubmit = (e) => {
    e.preventDefault()

    const payload = {
      questionText,
      questionType,
      imageFile,
      ...(questionType === 'choose_one'
        ? { choices: choicesText.split('\n').map(s => s.trim()).filter(Boolean) }
        : {}),
      ...(questionType === 'interval'
        ? { min: intervalMin === '' ? null : Number(intervalMin), max: intervalMax === '' ? null : Number(intervalMax) }
        : {}),
    }
    console.log('Question payload:', payload)
    setQuestionText('')
    setQuestionType('choose_one')
    setImageFile(null)
    setChoicesText('')
    setIntervalMin('')
    setIntervalMax('')
  }

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', padding: 16 }}>
      <h1>Create question</h1>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6}}>
          <span>Question</span>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question..."
            rows={4}
            style= {{resize: 'none'}}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Picture (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          {imagePreviewUrl && (
            <img
              src={imagePreviewUrl}
              alt="Uploaded preview"
              style={{ maxWidth: '50%', height: 'auto', border: '1px solid #ddd', borderRadius: 6 }}
              onLoad={() => URL.revokeObjectURL(imagePreviewUrl)}
            />
          )}
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Question type</span>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
          >
            <option value="choose_one">Choose one</option>
            <option value="interval">Interval (user typed)</option>
            <option value="free_text">User typed (free text)</option>
          </select>
        </label>

        {questionType === 'choose_one' && (
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Choices (one per line)</span>
            <textarea
              value={choicesText}
              onChange={(e) => setChoicesText(e.target.value)}
              placeholder={`Option A\nOption B\nOption C`}
              rows={4}
            />
          </label>
        )}

        {questionType === 'interval' && (
          <div style={{ display: 'grid', gap: 6 }}>
            <span>Interval bounds</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                value={intervalMin}
                onChange={(e) => setIntervalMin(e.target.value)}
                placeholder="Min"
                style={{ flex: 1 }}
              />
              <input
                type="number"
                value={intervalMax}
                onChange={(e) => setIntervalMax(e.target.value)}
                placeholder="Max"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        )}

        <button type="submit">Save</button>
      </form>
    </div>
  )
}

export default CreateQuestion
import React, { useState } from 'react'
import styles from './viewers.module.css'
import FeedbackExplanation from './FeedbackExplanation.jsx'

const LETTERS = ['A', 'B', 'C', 'D']

function getOptionCardClass(letter, selectedAnswer, showCorrect, answer, disabled) {
  const classes = [styles.optionCard]
  const isSelected = letter === selectedAnswer
  const isCorrect = showCorrect && letter === answer
  const isWrong = showCorrect && selectedAnswer && selectedAnswer !== answer && letter === selectedAnswer
  if (isCorrect) {
    classes.push(styles.optionCardCorrect)
  } else if (isWrong) {
    classes.push(styles.optionCardWrong)
  } else if (isSelected) {
    classes.push(styles.optionCardSelected)
  }
  if (disabled) {
    classes.push(styles.optionCardDisabled)
  }
  return classes.join(' ')
}

function renderPassageWithBlanks(passageText, questionNumber) {
  if (!passageText) return null
  const parts = []
  const regex = /【(\d+)】/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(passageText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(passageText.slice(lastIndex, match.index))
    }
    const num = parseInt(match[1], 10)
    const isCurrent = num === questionNumber
    parts.push(
      React.createElement(
        'mark',
        {
          key: `blank-${num}-${match.index}`,
          className: isCurrent ? styles.blankCurrent : styles.blankOther,
        },
        '【',
        num,
        '】'
      )
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < passageText.length) {
    parts.push(passageText.slice(lastIndex))
  }
  return parts
}

export default function ClozePassageViewer(props) {
  const question = props.question
  const selectedAnswer = props.selectedAnswer
  const onSelect = props.onSelect
  const showCorrect = props.showCorrect !== undefined ? props.showCorrect : false
  const disabled = props.disabled !== undefined ? props.disabled : false
  const [isCollapsed, setIsCollapsed] = useState(true)
  const options = question.options || {}
  const qn = question.question_number != null ? question.question_number : ''

  const handleToggle = () => setIsCollapsed(!isCollapsed)

  return (
    <div className={styles.viewerContainer}>
      <div className={styles.twoColumnLayout}>
        <div className={styles.passagePanel}>
          <div className={styles.passageHeader}>
            <div className={styles.passageHeaderLeft}>
              <span className={styles.badgePassageType}>文章の文法</span>
              <span className={styles.passageHeaderTitle}>Konteks Bacaan</span>
            </div>
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={handleToggle}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? '▼ Tampilkan' : '▲ Sembunyikan'}
            </button>
          </div>

          {!isCollapsed && (
            <div className={styles.cardBody}>
              <div className={styles.passageBody}>
                {renderPassageWithBlanks(question.passage_text, qn)}
              </div>
            </div>
          )}
        </div>

        <div className={styles.questionPanel}>
          <span className={styles.badgeClozeBlank}>
            空欄 【{qn}】
          </span>

          <ul className={styles.optionsList}>
            {LETTERS.map((letter) => {
              const text = options[letter] != null ? options[letter] : ''
              const cardClass = getOptionCardClass(
                letter,
                selectedAnswer,
                showCorrect,
                question.answer,
                disabled
              )
              const handleClick = () => {
                if (!disabled) onSelect(letter)
              }
              const handleKey = (e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                  e.preventDefault()
                  onSelect(letter)
                }
              }
              return (
                <li key={letter}>
                  <div
                    className={cardClass}
                    onClick={handleClick}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={handleKey}
                  >
                    <div className={styles.optionLabelBox}>{letter}</div>
                    <div className={styles.optionText}>{text}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <FeedbackExplanation
        question={question}
        selectedAnswer={selectedAnswer}
        showCorrect={showCorrect}
      />
    </div>
  )
}

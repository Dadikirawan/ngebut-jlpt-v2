import { useState } from 'react'
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

function renderTable(tableData) {
  if (!tableData || !tableData.headers || !tableData.rows) return null
  const { headers, rows } = tableData
  if (headers.length === 0 || rows.length === 0) return null

  return (
    <div className={styles.passageTableCard}>
      <table className={styles.passageTable}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={`th-${i}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={`row-${rIdx}`}>
              {headers.map((h, cIdx) => (
                <td key={`cell-${rIdx}-${cIdx}`}>{row[h] ?? ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderFootnotes(footnotes) {
  if (!footnotes || footnotes.length === 0) return null
  return (
    <ul className={styles.footnotesList}>
      {footnotes.map((fn, i) => (
        <li key={`fn-${i}`} className={styles.footnoteItem}>
          {fn}
        </li>
      ))}
    </ul>
  )
}

export default function ReadingPassageViewer({
  question,
  selectedAnswer,
  onSelect,
  showCorrect = false,
  disabled = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const options = question.options || {}
  const qn = question.question_number ?? ''

  return (
    <div className={styles.viewerContainer} translate="no">
      <div className={styles.twoColumnLayout}>
        <div className={styles.passagePanel}>
          <div className={styles.passageHeader}>
            <div className={styles.passageHeaderLeft}>
              <span className={styles.badgePassageType}>読解</span>
              <span className={styles.passageHeaderTitle}>Bacaan</span>
            </div>
            <button
              type="button"
              className={styles.collapseToggle}
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? '▼ Tampilkan' : '▲ Sembunyikan'}
            </button>
          </div>

          <div style={{ display: isCollapsed ? 'none' : 'block' }}>
            <div className={styles.cardBody}>
              <div className={styles.readingBody}>{question.passage_text}</div>
            </div>

            {renderTable(question.table_data)}
            {renderFootnotes(question.footnotes)}
          </div>
        </div>

        <div className={styles.questionPanel}>
          <div className={styles.topBar}>
            <span className={styles.badgeQuestion}>質問 {qn}</span>
          </div>

          <div className={styles.readingPrompt}>{question.prompt}</div>

          <ul className={styles.optionsList}>
            {LETTERS.map((letter) => {
              const text = options[letter] ?? ''
              const cardClass = getOptionCardClass(
                letter,
                selectedAnswer,
                showCorrect,
                question.answer,
                disabled
              )
              return (
                <li key={letter}>
                  <div
                    className={cardClass}
                    onClick={() => {
                      if (!disabled) onSelect(letter)
                    }}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                        e.preventDefault()
                        onSelect(letter)
                      }
                    }}
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

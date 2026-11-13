import styles from './viewers.module.css'
import FeedbackExplanation from './FeedbackExplanation.jsx'
import Furi from './Furi.jsx'

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

export default function SentenceOrderViewer({
  question,
  selectedAnswer,
  onSelect,
  showCorrect = false,
  disabled = false,
}) {
  const fragments = question.fragments || {}
  const qn = question.question_number ?? ''

  return (
    <div className={styles.viewerContainer} translate="no">
      <div className={styles.topBar}>
        <span className={styles.badgeQuestion} translate="no">問題 {qn}</span>
        <span className={styles.pillType} translate="no">文の組み立て ★</span>
      </div>

      <div className={styles.promptTemplate} translate="no">
        <Furi question={question} text={question.prompt_template} />
      </div>

      <div className={styles.instructionLabel}>
        Pilih posisi huruf yang masuk ke bagian ＿★＿ (bintang) — atau susun urutan 4 pilihan di
        bawah.
      </div>

      <ul className={styles.optionsList}>
        {LETTERS.map((letter) => {
          const text = fragments[letter] ?? ''
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
                <div className={styles.optionText} translate="no">
                  <Furi question={question} text={text} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className={styles.fragmentRow}>
        {LETTERS.map((letter) => {
          const text = fragments[letter] ?? ''
          return (
            <div key={letter} className={styles.fragmentCard} translate="no">
              <span className={styles.fragmentLabel}>{letter}.</span>
              <Furi question={question} text={text} />
            </div>
          )
        })}
      </div>

      {showCorrect && question.correct_order && (
        <div className={styles.correctOrderText} translate="no">Urutan benar: {question.correct_order}</div>
      )}

      <FeedbackExplanation
        question={question}
        selectedAnswer={selectedAnswer}
        showCorrect={showCorrect}
      />
    </div>
  )
}

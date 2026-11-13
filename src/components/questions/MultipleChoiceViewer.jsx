import styles from './viewers.module.css'
import FeedbackExplanation from './FeedbackExplanation.jsx'
import Furi from './Furi.jsx'
import { furiSegments, renderSegments, useFuriganaEnabled } from '../../utils/furigana.js'

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

function renderPrompt(question, enabled) {
  const prompt = question.prompt
  const underlineTarget = question.underline_target
  const segs = furiSegments(question, prompt, enabled)

  if (!underlineTarget) {
    return segs ? renderSegments(segs) : prompt
  }

  const index = prompt.indexOf(underlineTarget)
  if (index === -1) {
    return segs ? renderSegments(segs) : prompt
  }

  if (segs) {
    const end = index + underlineTarget.length
    return (
      <>
        {renderSegments(segs, 0, index)}
        <u className={styles.underlineTarget} translate="no">{renderSegments(segs, index, end)}</u>
        {renderSegments(segs, end)}
      </>
    )
  }

  const before = prompt.slice(0, index)
  const target = prompt.slice(index, index + underlineTarget.length)
  const after = prompt.slice(index + underlineTarget.length)

  return (
    <>
      {before}
      <u className={styles.underlineTarget} translate="no">{target}</u>
      {after}
    </>
  )
}

export default function MultipleChoiceViewer({
  question,
  selectedAnswer,
  onSelect,
  showCorrect = false,
  disabled = false,
}) {
  const options = question.options || {}
  const qn = question.question_number ?? ''
  const furiEnabled = useFuriganaEnabled()

  return (
    <div className={styles.viewerContainer} translate="no">
      <div className={styles.topBar}>
        <span className={styles.badgeQuestion} translate="no">問題 {qn}</span>
        <span className={styles.pillType} translate="no">4択</span>
      </div>

      <div className={styles.promptText} translate="no">
        {renderPrompt(question, furiEnabled)}
      </div>

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
                <div className={styles.optionText} translate="no">
                  <Furi question={question} text={text} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <FeedbackExplanation
        question={question}
        selectedAnswer={selectedAnswer}
        showCorrect={showCorrect}
      />
    </div>
  )
}

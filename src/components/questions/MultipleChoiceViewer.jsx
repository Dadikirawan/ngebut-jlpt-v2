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

function renderPrompt(prompt, underlineTarget) {
  if (!underlineTarget) {
    return prompt
  }

  const index = prompt.indexOf(underlineTarget)
  if (index === -1) {
    return prompt
  }

  const before = prompt.slice(0, index)
  const target = prompt.slice(index, index + underlineTarget.length)
  const after = prompt.slice(index + underlineTarget.length)

  return (
    <>
      {before}
      <u className={styles.underlineTarget}>{target}</u>
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

  return (
    <div className={styles.viewerContainer}>
      <div className={styles.topBar}>
        <span className={styles.badgeQuestion}>問題 {qn}</span>
        <span className={styles.pillType}>4択</span>
      </div>

      <div className={styles.promptText}>
        {renderPrompt(question.prompt, question.underline_target)}
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
                <div className={styles.optionText}>{text}</div>
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

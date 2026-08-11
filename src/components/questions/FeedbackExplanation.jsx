import styles from './viewers.module.css'

export default function FeedbackExplanation({
  question,
  selectedAnswer,
  showCorrect,
  mode = 'full',
}) {
  if (!showCorrect || !question) return null

  const correctLetter = question.answer
  const isCorrect = selectedAnswer === correctLetter
  const options = question.options || question.fragments || {}
  const correctText = correctLetter != null ? options[correctLetter] : null

  const promptText =
    question.prompt_template ||
    (typeof question.prompt === 'string' ? question.prompt : null)

  const bannerClass = isCorrect
    ? `${styles.feedbackBanner} ${styles.feedbackBannerCorrect}`
    : `${styles.feedbackBanner} ${styles.feedbackBannerWrong}`

  return (
    <>
      <div className={bannerClass} role="status" aria-live="polite">
        <span className={styles.feedbackEmoji} aria-hidden="true">
          {isCorrect ? '✅' : '❌'}
        </span>
        <div className={styles.feedbackContent}>
          <div className={styles.feedbackTitle}>
            {isCorrect ? 'Jawabanmu BENAR!' : 'Jawabanmu KURANG TEPAT'}
          </div>
          <div className={styles.feedbackDetail}>
            {isCorrect
              ? 'Bagus — lanjutkan ke soal berikutnya untuk menambah XP-mu.'
              : selectedAnswer
                ? `Kamu memilih ${selectedAnswer}. Jawaban seharusnya adalah ${correctLetter}. Perhatikan pembahasan di bawah.`
                : `Soal ini tidak dijawab. Jawaban benar adalah ${correctLetter}.`}
          </div>
        </div>
      </div>

      {mode !== 'banner-only' && (
        <div className={styles.explanationCard}>
          <div className={styles.explanationHeader}>📝 Pembahasan Singkat</div>

          {promptText && (
            <div className={styles.explanationPromptBlock}>
              <span className={styles.explanationPromptLabel}>Soal</span>
              {promptText}
            </div>
          )}

          <div className={styles.explanationCorrectRow}>
            <span className={styles.explanationCorrectLabel}>Jawaban Benar</span>
            {correctLetter != null && (
              <span className={styles.explanationCorrectPill}>
                <strong>{correctLetter}</strong>
              </span>
            )}
            {correctText != null && (
              <span className={styles.explanationCorrectText}>{correctText}</span>
            )}
          </div>

          {question.correct_order && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
              Urutan kalimat benar: {question.correct_order}
            </div>
          )}

          {question.explanation && (
            <div className={styles.explanationReasonBlock}>
              <span className={styles.explanationReasonLabel}>💡 Alasan</span>
              <div className={styles.explanationReasonText}>{question.explanation}</div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

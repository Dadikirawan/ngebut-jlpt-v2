import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import styles from './tryout.module.css'
import { getRandomQuizSet, getQuestionsByProblemType, getQuestionsByLevel, getQuestionsByProblem } from '../../data/loadQuestions.js'
import MultipleChoiceViewer from '../../components/questions/MultipleChoiceViewer.jsx'
import SentenceOrderViewer from '../../components/questions/SentenceOrderViewer.jsx'
import ClozePassageViewer from '../../components/questions/ClozePassageViewer.jsx'
import ReadingPassageViewer from '../../components/questions/ReadingPassageViewer.jsx'
import { setFuriganaEnabled, useFuriganaEnabled } from '../../utils/furigana.js'
import { getProblemMeta } from '../../utils/problemMeta.js'
import { appendHistory } from '../../utils/storage.js'

const TYPE_LABEL_MAP = {
  vocab_grammar_choice: 'Pilihan Ganda',
  sentence_order: 'Susunan Kalimat',
  cloze_passage: 'Lengkapi Bacaan',
  reading: 'Pemahaman Bacaan',
}

function _getQuestionsFor(level, mode, problemNumber, problemType, count) {
  if (mode === 'full') {
    return getQuestionsByLevel(level)
  }
  if (mode === 'random') {
    const safeCount = Number.isInteger(count) && count > 0 ? count : 20
    return getRandomQuizSet(level, safeCount)
  }
  if (mode === 'type') {
    const safeType = problemType || 'vocab_grammar_choice'
    try {
      return getQuestionsByProblemType(level, safeType)
    } catch {
      return getQuestionsByProblemType(level, 'vocab_grammar_choice')
    }
  }
  if (mode === 'problem') {
    return getQuestionsByProblem(level, problemNumber)
  }
  return getRandomQuizSet(level, 20)
}

export default function TryOut({
  level,
  mode = 'random',
  problemType = null,
  problemNumber = null,
  count = 20,
  attemptId = null,
  onNavigate,
  onComplete,
}) {
  const paramKey = useMemo(
    () => `${level}-${mode}-${problemType ?? ''}-${problemNumber ?? ''}-${count}-${attemptId ?? 'x'}`,
    [level, mode, problemType, problemNumber, count, attemptId]
  )

  const furiEnabled = useFuriganaEnabled()
  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [answeredLocked, setAnsweredLocked] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [resultObj, setResultObj] = useState(null)
  const lastParamRef = useRef(paramKey)

  useEffect(() => {
    if (lastParamRef.current === paramKey && questions.length > 0) {
      return
    }
    lastParamRef.current = paramKey

    setStartedAt(new Date().toISOString())

    const timer = setTimeout(() => {
      let qs
      try {
        qs = _getQuestionsFor(level, mode, problemNumber, problemType, count)
      } catch {
        qs = []
      }
      setQuestions(qs)
      setCurrentIdx(0)
      setAnswers({})
      setAnsweredLocked({})
      setSubmitted(false)
      setResultObj(null)
      setLoading(false)
    }, 50)

    return () => clearTimeout(timer)
  }, [level, mode, problemType, problemNumber, count, paramKey, questions.length])

  const total = questions.length
  const currentQ = questions[currentIdx]

  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter(
      (k) => answers[k] !== null && answers[k] !== undefined && answers[k] !== ''
    ).length
  }, [answers])

  const handleSelect = useCallback(
    (value) => {
      if (submitted || !currentQ) return
      const qn = currentQ.question_number
      if (answeredLocked[qn]) return
      setAnswers((prev) => ({ ...prev, [qn]: value }))
      setAnsweredLocked((prev) => ({ ...prev, [qn]: true }))
    },
    [submitted, currentQ, answeredLocked]
  )

  const goPrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setCurrentIdx((i) => Math.min(total - 1, i + 1))
  }, [total])

  const goTo = useCallback((idx) => {
    setCurrentIdx((i) => (idx >= 0 && idx < questions.length ? idx : i))
  }, [questions.length])

  useEffect(() => {
    const handler = (e) => {
      if (confirmSubmitModal || submitted) return
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goPrev, goNext, confirmSubmitModal, submitted])

  const handleSubmitRequest = () => {
    setConfirmSubmitModal(true)
  }

  const handleCloseModal = () => {
    setConfirmSubmitModal(false)
  }

  const handleConfirmSubmit = () => {
    _submit()
  }

  const _submit = () => {
    const finishedAt = new Date().toISOString()
    const answeredArr = questions.map((q) => {
      const userAnswer = answers[q.question_number] ?? null
      return {
        question_number: q.question_number,
        problem_number: q.problem_number,
        problem_type: q.problem_type,
        userAnswer,
        answer: q.answer,
        correct: userAnswer === q.answer,
      }
    })

    const correctCount = answeredArr.filter((a) => a.correct).length
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0

    const typeMap = new Map()
    for (const a of answeredArr) {
      if (!typeMap.has(a.problem_type)) {
        typeMap.set(a.problem_type, { type: a.problem_type, total: 0, correct: 0 })
      }
      const entry = typeMap.get(a.problem_type)
      entry.total += 1
      if (a.correct) entry.correct += 1
    }
    const typeBreakdown = [...typeMap.values()]

    const result = {
      id: `${Date.now()}`,
      startedAt,
      finishedAt,
      level,
      mode,
      problemType: problemType ?? null,
      problemNumber: problemNumber ?? null,
      totalQuestions: total,
      answered: answeredArr,
      correctCount,
      scorePercent,
      typeBreakdown,
    }

    setSubmitted(true)
    setConfirmSubmitModal(false)
    setResultObj(result)

    try {
      appendHistory(level, result)
    } catch {
      // ignore storage errors
    }

    if (typeof onComplete === 'function') {
      try {
        onComplete(result)
      } catch {
        // ignore
      }
    }
  }

  const handleBack = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('dashboard')
    }
  }

  const handleViewResults = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('results', resultObj)
    }
  }

  const currentProblemMeta = useMemo(() => {
    if (!currentQ) return null
    try {
      return getProblemMeta(level, currentQ.problem_number)
    } catch {
      return null
    }
  }, [currentQ, level])

  const currentTypeLabel = currentQ
    ? TYPE_LABEL_MAP[currentQ.problem_type] || 'Soal'
    : ''

  const renderViewer = () => {
    if (!currentQ) return null
    const qn = currentQ.question_number
    const instantShowCorrect = Boolean(answeredLocked[qn] || submitted)
    const instantDisabled = Boolean(answeredLocked[qn] || submitted)
    const commonProps = {
      question: currentQ,
      selectedAnswer: answers[qn],
      onSelect: handleSelect,
      showCorrect: instantShowCorrect,
      disabled: instantDisabled,
    }

    switch (currentQ.problem_type) {
      case 'vocab_grammar_choice':
        return <MultipleChoiceViewer {...commonProps} />
      case 'sentence_order':
        return <SentenceOrderViewer {...commonProps} />
      case 'cloze_passage':
        return <ClozePassageViewer {...commonProps} />
      case 'reading':
        return <ReadingPassageViewer {...commonProps} />
      default:
        return <MultipleChoiceViewer {...commonProps} />
    }
  }

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingWrap}>
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Memuat soal...</p>
        </div>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingWrap}>
          <p className={styles.loadingText}>Memuat soal...</p>
          <button className={styles.backBtnSmall} onClick={handleBack}>
            ← Kembali
          </button>
        </div>
      </div>
    )
  }

  const progressPercent = ((currentIdx + 1) / total) * 100
  const unanswered = total - answeredCount

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleBack}
          >
            ←
          </button>
          <h2 className={styles.pageTitle}>Try-out JLPT {level}</h2>
        </div>

        <div className={styles.topBarMiddle}>
          <div className={styles.progressContainer}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className={styles.progressBadge}>
            {currentIdx + 1} / {total}
          </div>
        </div>

        <div className={styles.topBarRight}>
          <div className={styles.typePills}>
            {currentProblemMeta && (
              <span className={styles.pillProblem} translate="no">
                {currentProblemMeta.titleJp || `P${currentQ?.problem_number}`}
              </span>
            )}
            <span className={styles.pillType} translate="no">{currentTypeLabel}</span>
          </div>
          <button
            type="button"
            className={`${styles.furiToggle} ${furiEnabled ? styles.furiToggleOn : ''}`}
            onClick={() => setFuriganaEnabled(!furiEnabled)}
            aria-pressed={furiEnabled}
            translate="no"
            title="Tampilkan / sembunyikan furigana (bacaan di atas kanji)"
          >
            Furigana: {furiEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            className={styles.finishBtn}
            onClick={handleSubmitRequest}
          >
            Selesai
          </button>
        </div>
      </div>

      <div className={styles.navStrip}>
        <div className={styles.navGrid}>
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIdx
            const hasAnswer =
              answers[q.question_number] !== null &&
              answers[q.question_number] !== undefined &&
              answers[q.question_number] !== ''
            const isLocked = Boolean(answeredLocked[q.question_number])
            const classes = [styles.navBox]
            if (isCurrent) {
              classes.push(styles.navBoxCurrent)
            } else if (isLocked) {
              const isCorrect = answers[q.question_number] === q.answer
              if (isCorrect) classes.push(styles.navBoxCorrect)
              else classes.push(styles.navBoxWrong)
            } else if (hasAnswer) {
              classes.push(styles.navBoxAnswered)
            } else {
              classes.push(styles.navBoxUnanswered)
            }
            return (
              <button
                key={`nav-${idx}`}
                type="button"
                className={classes.join(' ')}
                onClick={() => goTo(idx)}
                title={`Soal ${idx + 1}`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.questionArea}>
        {renderViewer()}

        {submitted && resultObj && (
          <div className={styles.resultPanel}>
            <div className={styles.resultLeft}>
              <div className={styles.resultScoreLabel}>Skor Kamu</div>
              <div className={styles.resultScoreValue}>
                {resultObj.scorePercent}%
              </div>
              <div className={styles.resultScoreDetail}>
                {resultObj.correctCount} benar dari {resultObj.totalQuestions} soal.
              </div>
            </div>
            <div className={styles.resultRight}>
              <button
                type="button"
                className={styles.viewResultsBtn}
                onClick={handleViewResults}
              >
                Lihat Pembahasan →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.bottomNav}>
        <button
          type="button"
          className={styles.navBtnSecondary}
          onClick={goPrev}
          disabled={currentIdx === 0}
        >
          Soal Sebelumnya
        </button>

        {currentIdx === total - 1 ? (
          <button
            type="button"
            className={styles.navBtnPrimary}
            onClick={handleSubmitRequest}
          >
            Selesaikan Sesi
          </button>
        ) : (
          <button
            type="button"
            className={styles.navBtnPlumSoft}
            onClick={goNext}
            disabled={!answers[currentQ?.question_number]}
          >
            Soal Berikutnya
          </button>
        )}
      </div>

      {confirmSubmitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Yakin mau selesaikan sesi?</h3>
            <p className={styles.modalBody}>
              Kamu sudah menjawab {answeredCount} dari {total} soal. {unanswered}{' '}
              soal belum dijawab — akan dihitung salah.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalBtnSecondary}
                onClick={handleCloseModal}
              >
                Tutup, lanjut kerjakan
              </button>
              <button
                type="button"
                className={styles.modalBtnPrimary}
                onClick={handleConfirmSubmit}
              >
                Ya, selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

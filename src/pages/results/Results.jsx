import { useState, useMemo } from 'react'
import styles from './results.module.css'
import { loadProgress } from '../../utils/storage.js'
import { getProblemMeta } from '../../utils/problemMeta.js'
import { getQuestionsByLevel } from '../../data/loadQuestions.js'
import MultipleChoiceViewer from '../../components/questions/MultipleChoiceViewer.jsx'
import SentenceOrderViewer from '../../components/questions/SentenceOrderViewer.jsx'
import ClozePassageViewer from '../../components/questions/ClozePassageViewer.jsx'
import ReadingPassageViewer from '../../components/questions/ReadingPassageViewer.jsx'

const TYPE_META = {
  vocab_grammar_choice: {
    jp: '文字・語彙・文法',
    id: 'Pilihan Ganda',
    icon: '✅',
    header: 'plum',
  },
  sentence_order: {
    jp: '文の組み立て',
    id: 'Susunan Kalimat',
    icon: '★',
    header: 'plum',
  },
  cloze_passage: {
    jp: '文章の文法',
    id: 'Lengkapi Bacaan',
    icon: '📄',
    header: 'navy',
  },
  reading: {
    jp: '読解',
    id: 'Pemahaman Bacaan',
    icon: '📰',
    header: 'navy',
  },
}

const TYPE_PILL_LABEL = {
  vocab_grammar_choice: '4択',
  sentence_order: '文の組立て',
  cloze_passage: '文章の文法',
  reading: '読解',
}

function getTypeBreakdownMap(typeBreakdown) {
  const map = {}
  if (Array.isArray(typeBreakdown)) {
    for (const tb of typeBreakdown) {
      if (tb && tb.type) {
        map[tb.type] = { correct: tb.correct || 0, total: tb.total || 0 }
      }
    }
  }
  return map
}

function computeTypePct(correct, total) {
  if (!total) return 0
  return Math.round((correct / total) * 100)
}

function renderQuestionViewer(problemType, question, userAnswer) {
  const commonProps = {
    question,
    selectedAnswer: userAnswer,
    showCorrect: true,
    disabled: true,
    onSelect: () => {},
  }
  switch (problemType) {
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

function buildQuestionLookup(level) {
  const map = new Map()
  try {
    const questions = getQuestionsByLevel(level)
    for (const q of questions) {
      const key = `${q.problem_number}-${q.question_number}`
      map.set(key, q)
    }
  } catch {
    // ignore
  }
  return map
}

export default function Results({
  level = 'N1',
  historyResult,
  onNavigate,
  onRetry,
}) {
  const safeLevel = level === 'N1' || level === 'N2' ? level : 'N1'
  const safeOnNavigate = typeof onNavigate === 'function' ? onNavigate : () => {}
  const safeOnRetry = typeof onRetry === 'function' ? onRetry : () => safeOnNavigate('tryout')

  const [resultData] = useState(() => {
    if (historyResult && typeof historyResult === 'object') {
      return historyResult
    }
    try {
      const fromStorage = loadProgress(safeLevel)
      if (fromStorage && Array.isArray(fromStorage.histories) && fromStorage.histories.length > 0) {
        return fromStorage.histories[fromStorage.histories.length - 1]
      }
    } catch {
      // ignore
    }
    return null
  })

  const [filter, setFilter] = useState('all')
  const [expandedMap, setExpandedMap] = useState({})

  const resultLevel = resultData?.level || safeLevel

  const questionLookup = useMemo(() => buildQuestionLookup(resultLevel), [resultLevel])

  const typeBreakdownMap = useMemo(
    () => getTypeBreakdownMap(resultData?.typeBreakdown),
    [resultData]
  )

  const filteredAnswered = useMemo(() => {
    const list = resultData?.answered || []
    if (filter === 'correct') return list.filter((a) => a.correct)
    if (filter === 'wrong') return list.filter((a) => !a.correct)
    return list
  }, [resultData, filter])

  const toggleExpand = (idx) => {
    setExpandedMap((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  if (!resultData) {
    return (
      <main className={styles.resultsContainer}>
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>📭</div>
          <h2 className={styles.emptyTitle}>Belum ada riwayat try-out</h2>
          <p className={styles.emptySub}>
            Kamu belum menyelesaikan try-out untuk level {safeLevel}.
            Yuk mulai sesi pertama dan ukur kemampuanmu!
          </p>
          <button
            type="button"
            className={styles.ctaPrimary}
            onClick={() => safeOnNavigate('tryout')}
          >
            Mulai Try-out Sekarang
          </button>
        </div>
      </main>
    )
  }

  const {
    scorePercent = 0,
    correctCount = 0,
    totalQuestions = 0,
    finishedAt,
  } = resultData

  const formattedDate = finishedAt
    ? new Date(finishedAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  const typeOrder = ['vocab_grammar_choice', 'sentence_order', 'cloze_passage', 'reading']

  return (
    <main className={styles.resultsContainer}>
      <section className={styles.heroCard}>
        <div className={styles.heroTop}>
          <span className={styles.levelBadge}>🏆 {resultLevel}</span>
          <span className={styles.finishedDate}>{formattedDate}</span>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.scoreCircleWrap}>
            <div
              className={styles.scoreCircle}
              style={{ ['--score-pct']: scorePercent }}
            >
              <div className={styles.scoreInner}>
                <div className={styles.scorePercent}>{scorePercent}%</div>
                <div className={styles.scoreRatio}>
                  {correctCount}/{totalQuestions} Benar
                </div>
              </div>
            </div>
          </div>

          <div className={styles.typeStatsList}>
            {typeOrder.map((type) => {
              const meta = TYPE_META[type]
              const bd = typeBreakdownMap[type]
              if (!bd) return null
              return (
                <div key={type} className={styles.typeStatItem}>
                  <div className={styles.typeStatLabel}>
                    <span className={styles.typeStatIcon}>{meta.icon}</span>
                    <span>{meta.jp}</span>
                  </div>
                  <span className={styles.typeStatRatio}>
                    {bd.correct}/{bd.total}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className={styles.typeSummarySection}>
        <div className={styles.sectionTitle}>Ringkasan per Tipe Soal</div>
        <div className={styles.typeSummaryGrid}>
          {typeOrder.map((type) => {
            const meta = TYPE_META[type]
            const bd = typeBreakdownMap[type] || { correct: 0, total: 0 }
            const pct = computeTypePct(bd.correct, bd.total)
            const headerClass =
              meta.header === 'plum'
                ? `${styles.typeCardHeader} ${styles.typeCardHeaderPlum}`
                : `${styles.typeCardHeader} ${styles.typeCardHeaderNavy}`
            const fillClass =
              meta.header === 'plum'
                ? styles.typeProgressFillPlum
                : styles.typeProgressFillNavy
            return (
              <div key={type} className={styles.typeSummaryCard}>
                <div className={headerClass}>
                  <div className={styles.typeCardLabelJp}>{meta.jp}</div>
                  <div className={styles.typeCardLabelId}>{meta.id}</div>
                </div>
                <div className={styles.typeCardBody}>
                  <div className={styles.typeScoreRow}>
                    <div className={styles.typeScorePct}>{pct}%</div>
                    <div className={styles.typeScoreRatio}>
                      {bd.correct}/{bd.total} Benar
                    </div>
                  </div>
                  <div className={styles.typeProgressBar}>
                    <div
                      className={fillClass}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div className={styles.reviewTitleRow}>
            <h2 className={styles.reviewTitle}>Pembahasan Detail</h2>
            <div className={styles.filterPills}>
              <button
                type="button"
                className={`${styles.filterPill} ${filter === 'all' ? styles.filterPillActive : ''}`}
                onClick={() => setFilter('all')}
              >
                🔍 Semua
              </button>
              <button
                type="button"
                className={`${styles.filterPill} ${filter === 'correct' ? styles.filterPillActive : ''}`}
                onClick={() => setFilter('correct')}
              >
                ✅ Benar
              </button>
              <button
                type="button"
                className={`${styles.filterPill} ${filter === 'wrong' ? styles.filterPillActive : ''}`}
                onClick={() => setFilter('wrong')}
              >
                ❌ Salah
              </button>
            </div>
          </div>
        </div>

        <div className={styles.reviewList}>
          {filteredAnswered.map((ans, idx) => {
            const mapKey = `${idx}-${ans.question_number}-${ans.problem_number}`
            const isExpanded = expandedMap[mapKey]
            const pillLabel = TYPE_PILL_LABEL[ans.problem_type] || 'Soal'
            const lookupKey = `${ans.problem_number}-${ans.question_number}`
            const questionObj = questionLookup.get(lookupKey) || {
              question_number: ans.question_number,
              answer: ans.answer,
              options: {},
            }
            const problemMeta = getProblemMeta(resultLevel, ans.problem_number)
            return (
              <div key={mapKey} className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <div className={styles.reviewCardHeaderLeft}>
                    <span className={styles.badgeQuestion}>問題{ans.question_number}</span>
                    <span className={styles.typePill}>{pillLabel}</span>
                    {ans.correct ? (
                      <span className={styles.badgeCorrect}>CORRECT</span>
                    ) : (
                      <span className={styles.badgeWrong}>SALAH</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.expandBtn}
                    onClick={() => toggleExpand(mapKey)}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? '🔼' : '🔽'}
                  </button>
                </div>
                {isExpanded && (
                  <div className={styles.reviewCardBody}>
                    {renderQuestionViewer(ans.problem_type, questionObj, ans.userAnswer)}
                    <div className={styles.answerSummary}>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Pilihanmu:</span>
                        <span
                          className={
                            ans.correct
                              ? styles.summaryValueCorrect
                              : styles.summaryValueWrong
                          }
                        >
                          {ans.userAnswer || '— (Tidak dijawab)'}
                        </span>
                      </div>
                      <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Jawaban benar:</span>
                        <span className={styles.summaryValueCorrect}>{ans.answer}</span>
                      </div>
                      {problemMeta?.titleId && (
                        <div className={styles.summarySectionInfo}>
                          💡 Bagian: P{ans.problem_number} {problemMeta.titleJp} — {problemMeta.titleId}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <div className={styles.ctaBottomBar}>
        <button
          type="button"
          className={styles.ctaBack}
          onClick={() => safeOnNavigate('dashboard')}
        >
          ← Kembali ke Dasbor
        </button>
        <div className={styles.ctaRightGroup}>
          <button
            type="button"
            className={styles.ctaSecondary}
            onClick={safeOnRetry}
          >
            🔁 Coba Lagi
          </button>
          <button
            type="button"
            className={styles.ctaPrimary}
            onClick={() => safeOnNavigate('progress')}
          >
            📊 Cek Progress
          </button>
        </div>
      </div>
    </main>
  )
}

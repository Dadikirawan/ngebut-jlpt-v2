import { useState, useMemo } from 'react'
import styles from './progress.module.css'
import { loadProgress } from '../../utils/storage.js'
import { LEVEL_INFO } from '../../utils/problemMeta.js'

const LEVELS = ['N1', 'N2']

const TYPE_ACHIEVEMENTS = [
  {
    type: 'vocab_grammar_choice',
    icon: '✅',
    label: '文字・語彙・文法',
    desc: 'Pilihan Ganda Kosakata & Tata Bahasa',
  },
  {
    type: 'sentence_order',
    icon: '★',
    label: '文の組み立て',
    desc: 'Susunan Kalimat dengan Tanda Bintang',
  },
  {
    type: 'cloze_passage',
    icon: '📄',
    label: '文章の文法',
    desc: 'Lengkapi Bagian Kosong pada Bacaan',
  },
  {
    type: 'reading',
    icon: '📰',
    label: '読解',
    desc: 'Pemahaman Bacaan (Pendek & Panjang)',
  },
]

const TYPE_LABELS_SHORT = {
  vocab_grammar_choice: '語彙文法',
  sentence_order: '文組立',
  cloze_passage: '文章文法',
  reading: '読解',
}

function getScoreBadgeClass(score) {
  if (score >= 80) return `${styles.scoreBadge} ${styles.scoreBadgePlum}`
  if (score >= 60) return `${styles.scoreBadge} ${styles.scoreBadgeNavy}`
  return `${styles.scoreBadge} ${styles.scoreBadgeWarn}`
}

function getSortedHistories(histories) {
  if (!Array.isArray(histories)) return []
  return [...histories].sort((a, b) => {
    const at = a.finishedAt ? new Date(a.finishedAt).getTime() : 0
    const bt = b.finishedAt ? new Date(b.finishedAt).getTime() : 0
    return bt - at
  })
}

function getLearningTips(avgScore) {
  if (avgScore === 0 || avgScore < 50) {
    return [
      'Fokus pelajari 漢字読み dan 文法形式の判断 dasar dulu sebelum ke reading panjang.',
      'Kerjakan 10-15 soal vocab/grammar setiap hari, ulang yang salah sampai hafal pola.',
      'Gunakan teknik spaced repetition untuk menghafal kosakata dan pola tata bahasa.',
    ]
  }
  if (avgScore >= 50 && avgScore <= 75) {
    return [
      'Tambah latihan 読解 dan 情報検索 — kerjakan parsing tabel secara teliti.',
      'Latih 文の組み立て dengan mengenali pola kalimat standar (SVO, wa/ga, dll).',
      'Coba kerjakan satu set penuh 文章の文法 setiap hari untuk meningkatkan kecepatan.',
    ]
  }
  return [
    'Bagus! Fokus ke soal 長文 dan coba simulasi full 言語知識(文字・語彙・文法)・読解 110 menit.',
    'Tingkatkan pemahaman 主張理解 — biasakan mencari thesis statement di awal/akhir paragraf.',
    'Ulangi simulasi dengan timer; pastikan sisa 10-15 menit untuk cross-check jawaban reading.',
  ]
}

export default function Progress({ level, onNavigate }) {
  const initialLevel = LEVELS.includes(level) ? level : 'N1'
  const [selectedLevel, setSelectedLevel] = useState(initialLevel)
  const safeOnNavigate = typeof onNavigate === 'function' ? onNavigate : () => {}

  const progressData = useMemo(() => {
    try {
      return loadProgress(selectedLevel)
    } catch {
      return { histories: [], aggregate: {} }
    }
  }, [selectedLevel])

  const aggregate = progressData?.aggregate || {}
  const histories = useMemo(
    () => getSortedHistories(progressData?.histories).slice(0, 10),
    [progressData]
  )

  const {
    totalCompleted = 0,
    bestScore = 0,
    avgScore = 0,
    attemptedTypes = [],
  } = aggregate

  const levelDesc = LEVEL_INFO?.[selectedLevel]?.desc || ''

  const statsCards = [
    {
      label: '📋 Total Sesi',
      value: `${totalCompleted}`,
      sub: totalCompleted > 0 ? 'Try-out selesai.' : 'Belum ada sesi.',
    },
    {
      label: '🏆 Skor Tertinggi',
      value: bestScore > 0 ? `${bestScore}%` : '—',
      sub: bestScore > 0 ? 'Prestasi terbaikmu.' : 'Belum ada data.',
    },
    {
      label: '📊 Rata-rata',
      value: avgScore > 0 ? `${avgScore}%` : '—',
      sub: 'Rata-rata semua sesi.',
    },
    {
      label: '🎯 Tipe Dicoba',
      value: `${attemptedTypes.length}/4`,
      sub: 'Tipe soal yang sudah dikerjakan.',
    },
  ]

  const tipsList = getLearningTips(avgScore)

  return (
    <main className={styles.progressContainer}>
      <section className={styles.levelTabsSection}>
        <div className={styles.levelTabsHeader}>
          <h1 className={styles.levelTabsTitle}>Progress Tracker</h1>
          <p className={styles.levelTabsSub}>
            Pantau pencapaian dan riwayat belajar JLPT per level.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div className={styles.levelPillGroup}>
            {LEVELS.map((lvl) => {
              const isActive = lvl === selectedLevel
              return (
                <button
                  key={lvl}
                  className={`${styles.levelPill} ${isActive ? styles.levelPillActive : ''}`}
                  onClick={() => setSelectedLevel(lvl)}
                >
                  {lvl}
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', flex: 1, minWidth: 220 }}>
            {levelDesc}
          </div>
        </div>
      </section>

      <section className={styles.statsGridSection}>
        <div className={styles.sectionTitle}>Ringkasan {selectedLevel}</div>
        <div className={styles.statsGrid}>
          {statsCards.map((s) => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statSub}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.typesProgressSection}>
        <div className={styles.sectionTitle}>Tipe Soal Tercapai</div>
        <div className={styles.typesGrid}>
          {TYPE_ACHIEVEMENTS.map((ta) => {
            const isDone = attemptedTypes.includes(ta.type)
            return (
              <div
                key={ta.type}
                className={`${styles.typeAchievementCard} ${isDone ? styles.typeAchievementCardDone : ''}`}
              >
                <div className={styles.typeCardTop}>
                  <span className={styles.typeCardIcon}>
                    {isDone ? '✅' : '⚪'}
                  </span>
                  <span className={styles.typeCardLabel}>{ta.label}</span>
                </div>
                <div className={styles.typeCardDesc}>{ta.desc}</div>
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>Riwayat Try-out {selectedLevel}</h2>
          <p className={styles.historySub}>
            Menampilkan {histories.length} dari total {totalCompleted} riwayat (terbaru di atas).
          </p>
        </div>

        {histories.length === 0 ? (
          <div className={styles.emptyHistory}>
            <div className={styles.emptyHistoryIcon}>📭</div>
            <p className={styles.emptyHistoryText}>
              Belum ada riwayat untuk level {selectedLevel}.
              Ayo mulai try-out pertama!
            </p>
            <button
              type="button"
              className={styles.ctaPrimary}
              onClick={() => safeOnNavigate('tryout')}
            >
              🚀 Mulai Try-out
            </button>
          </div>
        ) : (
          <div className={styles.historyList}>
            {histories.map((h, idx) => {
              const dateStr = h.finishedAt
                ? new Date(h.finishedAt).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Tidak ada tanggal'
              const scorePct = h.scorePercent || 0
              const mode = h.mode || 'full'
              const totalQ = h.totalQuestions || 0
              const tb = Array.isArray(h.typeBreakdown) ? h.typeBreakdown : []
              return (
                <div
                  key={`${h.id || idx}-${idx}`}
                  className={styles.historyCard}
                  onClick={() => safeOnNavigate('results')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      safeOnNavigate('results')
                    }
                  }}
                >
                  <div className={styles.historyRow1}>
                    <span className={styles.historyDate}>{dateStr}</span>
                    <span className={getScoreBadgeClass(scorePct)}>
                      {scorePct}%
                    </span>
                  </div>
                  <div className={styles.historyRow2}>
                    <span className={styles.historyMode}>{mode}</span>
                    <span className={styles.historyTotal}>
                      {h.correctCount || 0}/{totalQ} soal benar.
                    </span>
                  </div>
                  <div className={styles.historyRow3}>
                    {tb.map((t) => (
                      <span key={t.type} className={styles.miniTypeBreakdown}>
                        <span className={styles.miniTypeLabel}>
                          {TYPE_LABELS_SHORT[t.type] || t.type}
                        </span>
                        <span>{t.correct || 0}/{t.total || 0}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className={styles.tipsSection}>
        <div className={styles.sectionTitle}>Saran Belajar</div>
        <div className={styles.tipsCard}>
          <h3 className={styles.tipsTitle}>💡 Tips Belajar JLPT Efektif</h3>
          <ul className={styles.tipsList}>
            {tipsList.map((tip, i) => (
              <li key={i} className={styles.tipsListItem}>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}

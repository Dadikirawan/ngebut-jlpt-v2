import { useMemo } from 'react'
import styles from './dashboard.module.css'
import { PROBLEM_META } from '../../utils/problemMeta.js'
import { getQuestionsByLevel } from '../../data/loadQuestions.js'

function computeTotalQuestions(selectedLevel) {
  const fallbackByLevel = { N1: 127, N2: 112 }
  try {
    if (typeof getQuestionsByLevel === 'function') {
      const list = getQuestionsByLevel(selectedLevel)
      if (Array.isArray(list) && list.length > 0) {
        return list.length
      }
    }
  } catch {
    // ignore
  }
  const staticMeta = PROBLEM_META?.[selectedLevel]
  if (staticMeta) {
    const total = Object.values(staticMeta).reduce(
      (sum, m) => sum + (Number(m?.questionCount) || 0),
      0
    )
    if (total > 0) return total
  }
  return fallbackByLevel[selectedLevel] || 0
}

export default function StatsGrid({ selectedLevel, userStats }) {
  const learnerLevel = Number(userStats?.learnerLevel) || 1
  const streakDays = Number(userStats?.streakDays) || 0
  const totalAttempts = Number(userStats?.totalAttempts) || 0
  const currentLevel = selectedLevel === 'N1' || selectedLevel === 'N2' ? selectedLevel : 'N1'

  const totalQuestions = useMemo(() => computeTotalQuestions(currentLevel), [currentLevel])

  const stats = [
    {
      label: '🎓 Learner Level',
      value: `Level ${learnerLevel}`,
      sub: 'Aktif belajar',
    },
    {
      label: '🔥 Study Streak',
      value: `${streakDays} hari`,
      sub: 'Konsistensi adalah kunci.',
    },
    {
      label: '📋 Question Pool',
      value: `${totalQuestions}`,
      sub: `Soal ${currentLevel} tersedia.`,
    },
    {
      label: '✅ Sesi Selesai',
      value: `${totalAttempts} sesi`,
      sub: 'Percobaan selesai.',
    },
  ]

  return (
    <section className={styles.statsGridSection}>
      <div className={styles.sectionTitle}>Ringkasan Belajar</div>
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statSub}>{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

import { useRef } from 'react'
import styles from '../dashboard/dashboard.module.css'
import LevelSelector from '../dashboard/LevelSelector.jsx'
import ProblemTypeList from '../dashboard/ProblemTypeList.jsx'

export default function Quiz({
  selectedLevel,
  onSelectLevel,
  onStartType,
  onOpenProblem,
}) {
  const problemListRef = useRef(null)
  const safeLevel = selectedLevel === 'N1' || selectedLevel === 'N2' ? selectedLevel : 'N1'
  const safeOnSelectLevel = typeof onSelectLevel === 'function' ? onSelectLevel : () => {}
  const safeOnStartType = typeof onStartType === 'function' ? onStartType : () => {}
  const safeOnOpenProblem = typeof onOpenProblem === 'function' ? onOpenProblem : () => {}

  return (
    <main className={styles.dashboardContainer}>
      <section className={styles.dashboardSection} aria-labelledby="quiz-page-title">
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1.2,
                color: 'var(--navy-ink, #0b2948)',
                marginBottom: 8,
              }}
              id="quiz-page-title"
            >
              🧩 Pilih Tipe Soal untuk Latihan Quiz
            </div>
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: 'rgba(11, 41, 72, 0.72)',
                maxWidth: 720,
              }}
            >
              Pilih kategori spesifik yang ingin kamu asah. Setiap tipe soal hanya berisi
              soal dari kategori itu saja — fokus latihan satu keahlian dalam satu sesi.
            </div>
          </div>
        </div>

        <div
          className={styles.profileAndLevelRow}
          style={{ marginTop: 28 }}
        >
          <LevelSelector
            selectedLevel={safeLevel}
            onSelectLevel={safeOnSelectLevel}
          />
        </div>
      </section>

      <section aria-label="Daftar tipe soal">
        <ProblemTypeList
          ref={problemListRef}
          selectedLevel={safeLevel}
          onStartType={safeOnStartType}
          onOpenProblem={safeOnOpenProblem}
        />
      </section>
    </main>
  )
}

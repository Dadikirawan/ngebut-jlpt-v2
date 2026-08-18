import { useRef, useCallback } from 'react'
import styles from './dashboard.module.css'
import HeroSection from './HeroSection.jsx'
import LearnerProfileCard from './LearnerProfileCard.jsx'
import LevelSelector from './LevelSelector.jsx'
import StatsGrid from './StatsGrid.jsx'
import ProblemTypeList from './ProblemTypeList.jsx'

export default function Dashboard({
  selectedLevel,
  onSelectLevel,
  onStartQuick,
  onStartType,
  onOpenProblem,
  userStats,
}) {
  const safeStats = userStats || {}
  const safeLevel = selectedLevel === 'N1' || selectedLevel === 'N2' ? selectedLevel : 'N1'
  const safeOnSelectLevel = typeof onSelectLevel === 'function' ? onSelectLevel : () => {}
  const safeOnStartQuick = typeof onStartQuick === 'function' ? onStartQuick : () => {}
  const safeOnStartType = typeof onStartType === 'function' ? onStartType : () => {}
  const safeOnOpenProblem = typeof onOpenProblem === 'function' ? onOpenProblem : () => {}

  const problemListRef = useRef(null)

  const handleBrowseTypes = useCallback(() => {
    if (problemListRef.current && typeof problemListRef.current.scrollIntoView === 'function') {
      problemListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <main className={styles.dashboardContainer}>
      <HeroSection onStartQuick={safeOnStartQuick} onBrowseTypes={handleBrowseTypes} />

      <div className={styles.profileAndLevelRow}>
        <LearnerProfileCard userStats={safeStats} />
        <LevelSelector
          selectedLevel={safeLevel}
          onSelectLevel={safeOnSelectLevel}
        />
      </div>

      <StatsGrid selectedLevel={safeLevel} userStats={safeStats} />

      <ProblemTypeList
        ref={problemListRef}
        selectedLevel={safeLevel}
        onStartType={safeOnStartType}
        onOpenProblem={safeOnOpenProblem}
      />
    </main>
  )
}

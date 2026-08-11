import { useRef, useCallback, useEffect } from 'react'
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
  initialBrowseFocus,
  onBrowseFocused,
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

  useEffect(() => {
    if (!initialBrowseFocus) return undefined
    const safeReset = typeof onBrowseFocused === 'function' ? onBrowseFocused : () => {}
    let raf1 = 0
    let raf2 = 0
    let timer = 0
    const fire = () => {
      handleBrowseTypes()
      safeReset()
    }
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        timer = window.setTimeout(fire, 60)
      })
    })
    return () => {
      if (raf1) window.cancelAnimationFrame(raf1)
      if (raf2) window.cancelAnimationFrame(raf2)
      if (timer) window.clearTimeout(timer)
    }
  }, [initialBrowseFocus, handleBrowseTypes, onBrowseFocused])

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

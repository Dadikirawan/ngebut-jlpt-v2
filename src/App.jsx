import { useState, useMemo, useCallback } from 'react'
import './App.css'
import Layout from './components/shell/Layout.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import TryOut from './pages/tryout/TryOut.jsx'
import Results from './pages/results/Results.jsx'
import Progress from './pages/progress/Progress.jsx'
import { getAggregateAllLevels } from './utils/storage.js'

function App() {
  const [route, setRoute] = useState('dashboard')
  const [selectedLevel, setSelectedLevel] = useState('N1')
  const [tryoutConfig, setTryoutConfig] = useState({
    level: 'N1',
    mode: 'random',
    problemType: null,
    problemNumber: null,
    count: 20,
  })
  const [lastResult, setLastResult] = useState(null)

  const userStats = useMemo(() => {
    const agg = getAggregateAllLevels()
    const n1 = agg.N1 || {}
    const n2 = agg.N2 || {}
    const totalCompleted = (n1.totalCompleted || 0) + (n2.totalCompleted || 0)
    const bestScore = Math.max(n1.bestScore || 0, n2.bestScore || 0)
    const xp = totalCompleted * 150
    const learnerLevel = Math.floor(xp / 500) + 1
    const nextLevelXp = learnerLevel * 500
    const n1Tried = (n1.attemptedTypes || []).length > 0
    const n2Tried = (n2.attemptedTypes || []).length > 0
    let levelLabel = 'N5'
    if (n1Tried) levelLabel = 'N1'
    else if (n2Tried) levelLabel = 'N2'
    return {
      streakDays: Math.min(7 + totalCompleted, 30),
      xp,
      levelLabel,
      learnerLevel,
      nextLevelXp,
      currentXp: xp - (learnerLevel - 1) * 500,
      name: 'Pembelajar JLPT',
      totalAttempts: totalCompleted,
      bestScore,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult])

  const handleNavigate = useCallback((targetRoute) => {
    if (!['dashboard', 'tryout', 'results', 'progress'].includes(targetRoute)) {
      setRoute('dashboard')
      return
    }
    setRoute(targetRoute)
  }, [])

  return (
    <Layout
      currentRoute={route}
      onNavigate={handleNavigate}
      userStats={userStats}
    >
      {route === 'dashboard' && (
        <Dashboard
          selectedLevel={selectedLevel}
          onSelectLevel={(lvl) => setSelectedLevel(lvl)}
          onStartQuick={() => {
            setTryoutConfig({ level: selectedLevel, mode: 'random', problemType: null, problemNumber: null, count: 20 })
            setRoute('tryout')
          }}
          onStartType={(lvl, type) => {
            const safeLevel = lvl && (lvl === 'N1' || lvl === 'N2') ? lvl : selectedLevel
            setTryoutConfig({ level: safeLevel, mode: 'type', problemType: type, problemNumber: null, count: 999 })
            setRoute('tryout')
          }}
          onOpenProblem={(pnum) => {
            setTryoutConfig({ level: selectedLevel, mode: 'problem', problemType: null, problemNumber: pnum, count: 999 })
            setRoute('tryout')
          }}
          userStats={userStats}
        />
      )}
      {route === 'tryout' && (
        <TryOut
          level={tryoutConfig.level || selectedLevel}
          mode={tryoutConfig.mode}
          problemType={tryoutConfig.problemType || null}
          problemNumber={tryoutConfig.problemNumber}
          count={tryoutConfig.count}
          onNavigate={handleNavigate}
          onComplete={(result) => {
            setLastResult(result)
            setRoute('results')
          }}
        />
      )}
      {route === 'results' && (
        <Results
          level={lastResult?.level || selectedLevel}
          historyResult={lastResult}
          onNavigate={handleNavigate}
          onRetry={() => {
            const lvl = lastResult?.level || selectedLevel
            setTryoutConfig({ level: lvl, mode: 'random', problemNumber: null, count: 20 })
            setRoute('tryout')
          }}
        />
      )}
      {route === 'progress' && (
        <Progress
          level={selectedLevel}
          onNavigate={handleNavigate}
        />
      )}
    </Layout>
  )
}

export default App

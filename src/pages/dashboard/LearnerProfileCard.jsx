import styles from './dashboard.module.css'

function getInitials(name) {
  if (!name) return '👤'
  const clean = String(name).trim()
  if (!clean) return '👤'
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function LearnerProfileCard({ userStats }) {
  const name = userStats?.name || 'Pebelajar JLPT'
  const xp = Number(userStats?.xp) || 0
  const nextLevelXp = Number(userStats?.nextLevelXp) || 100
  const learnerLevel = Number(userStats?.learnerLevel) || 1
  const streakDays = Number(userStats?.streakDays) || 0

  const safeNextXp = nextLevelXp > 0 ? nextLevelXp : 100
  const clampedXp = Math.max(0, Math.min(xp, safeNextXp))
  const progressPercent = (clampedXp / safeNextXp) * 100
  const remainingXp = Math.max(0, safeNextXp - clampedXp)
  const nextLevel = learnerLevel + 1

  const initials = getInitials(name)

  return (
    <div className={styles.learnerCard}>
      <div className={styles.learnerRow}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.learnerInfo}>
          <div className={styles.learnerName}>Halo, {name}!</div>
          <div className={styles.learnerSubtitle}>
            Level {learnerLevel} • {streakDays} hari belajar berturut-turut
          </div>
        </div>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPercent}%` }}
          />
          <div className={styles.progressLabel}>
            {clampedXp} / {safeNextXp} XP
          </div>
        </div>
        <div className={styles.progressHint}>
          Sisa {remainingXp} XP menuju Level {nextLevel}.
        </div>
      </div>
    </div>
  )
}

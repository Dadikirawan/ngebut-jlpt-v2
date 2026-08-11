import styles from './shell.module.css'

function Header({ userStats, onToggleNav }) {
  const { streakDays, xp, levelLabel } = userStats

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={onToggleNav}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <div className={styles.headerBrand}>
          <div className={styles.headerBrandLogo}>NJ</div>
          <span>NgebutJLPT v2</span>
        </div>
        <div className={styles.mobileHeaderBrand}>
          <div className={styles.mobileHeaderBrandLogo}>NJ</div>
          <span>NgebutJLPT v2</span>
        </div>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.badges}>
          <div className={`${styles.badge} ${styles.streakBadge}`}>
            <span>🔥</span>
            <span>{streakDays} hari</span>
          </div>

          <div className={`${styles.badge} ${styles.xpBadge}`}>
            <span>⭐</span>
            <span>{xp.toLocaleString()} XP</span>
          </div>

          <div className={`${styles.badge} ${styles.levelBadge}`}>
            <span>🏆</span>
            <span>{levelLabel}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

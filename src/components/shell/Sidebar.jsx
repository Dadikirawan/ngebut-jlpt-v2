import styles from './shell.module.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'vocab', label: 'Vocab', icon: '📚' },
  { id: 'quiz', label: 'Quiz', icon: '🧩' },
  { id: 'tryout', label: 'Try-out', icon: '📝' },
  { id: 'progress', label: 'Progress', icon: '📊' },
]

const mapRouteToActive = (route) => {
  if (route === 'home') return 'dashboard'
  return route
}

function Sidebar({ currentRoute, onNavigate, userStats, isOpen, onCloseNav }) {
  void userStats
  const activeId = mapRouteToActive(currentRoute)
  const safeOnNavigate = typeof onNavigate === 'function' ? onNavigate : () => {}

  const handleNavClick = (itemId) => {
    safeOnNavigate(itemId)
    if (onCloseNav) onCloseNav()
  }

  return (
    <aside className={`${styles.sidebar} ${isOpen === false ? styles.sidebarHidden : ''}`}>
      <div>
        <div className={styles.brand} translate="no">
          <div className={styles.brandLogo}>NJ</div>
          <span>NgebutJLPT v2</span>
        </div>
        <p className={styles.tagline} translate="no">Try-out Soal JLPT Resmi</p>
      </div>

      <div>
        <div className={styles.navGroup}>Menu</div>
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id
            return (
              <li
                key={item.id}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => handleNavClick(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleNavClick(item.id)
                }}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </li>
            )
          })}
        </ul>
      </div>

      <footer className={styles.sidebarFooter}>
        © 2026 Dadik Irawan. All rights reserved.
      </footer>
    </aside>
  )
}

export default Sidebar

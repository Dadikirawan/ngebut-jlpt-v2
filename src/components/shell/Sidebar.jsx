import { useState, useCallback } from 'react'
import styles from './shell.module.css'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'vocab', label: 'Vocab', icon: '📚', disabled: true, badge: 'Coming soon' },
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
  const [vocabToast, setVocabToast] = useState(false)
  const safeOnNavigate = typeof onNavigate === 'function' ? onNavigate : () => {}

  const showVocabNotice = useCallback(() => {
    setVocabToast(true)
    const t = window.setTimeout(() => setVocabToast(false), 3200)
    return () => window.clearTimeout(t)
  }, [])

  const handleNavClick = (itemId) => {
    if (itemId === 'vocab') {
      showVocabNotice()
      if (onCloseNav) onCloseNav()
      return
    }
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
            const isActive = activeId === item.id && !item.disabled
            const disabledCls = item.disabled ? styles.navItemDisabled : ''
            return (
              <li
                key={item.id}
                className={`${styles.navItem} ${disabledCls} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => handleNavClick(item.id)}
                role={item.disabled ? 'note' : 'button'}
                tabIndex={item.disabled ? -1 : 0}
                aria-disabled={item.disabled || undefined}
                onKeyDown={(e) => {
                  if (item.disabled) return
                  if (e.key === 'Enter' || e.key === ' ') handleNavClick(item.id)
                }}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className={styles.comingSoonPill}>{item.badge}</span>
                )}
              </li>
            )
          })}
        </ul>

        {vocabToast && (
          <div className={styles.toastNotice} role="status" aria-live="polite">
            🚧 Fitur <strong>Vocab Flashcard</strong> sedang dalam pengembangan.
            Saat ini fokus ke simulasi <em>try-out</em> soal JLPT N1/N2.
            Nantikan pembaruan berikutnya!
          </div>
        )}
      </div>

      <footer className={styles.sidebarFooter}>
        © 2026 Dadik Irawan. All rights reserved.
      </footer>
    </aside>
  )
}

export default Sidebar

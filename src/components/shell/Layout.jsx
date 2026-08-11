import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import styles from './shell.module.css'

function Layout({ children, currentRoute, onNavigate, onFocusBrowseTypes, userStats }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleToggleNav = () => {
    setMobileNavOpen((prev) => !prev)
  }

  const handleCloseNav = () => {
    setMobileNavOpen(false)
  }

  return (
    <div className={styles.layout}>
      {mobileNavOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={handleCloseNav}
          aria-hidden="true"
        />
      )}

      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        onFocusBrowseTypes={onFocusBrowseTypes}
        userStats={userStats}
        isOpen={mobileNavOpen}
        onCloseNav={handleCloseNav}
      />

      <div className={styles.main}>
        <Header userStats={userStats} onToggleNav={handleToggleNav} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}

export default Layout

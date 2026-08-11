import styles from './dashboard.module.css'
import { LEVEL_INFO } from '../../utils/problemMeta.js'

const LEVELS = ['N1', 'N2']

export default function LevelSelector({ selectedLevel, onSelectLevel }) {
  const currentLevel = LEVELS.includes(selectedLevel) ? selectedLevel : 'N1'
  const levelDesc = LEVEL_INFO?.[currentLevel]?.desc || ''

  return (
    <div className={styles.levelSelectorWrap}>
      <div className={styles.levelSelectorHeader}>
        <div className={styles.levelSelectorTitle}>Pilih Level</div>
        <div className={styles.levelSelectorSub}>
          Fokus latihan sesuai target kemampuanmu.
        </div>
      </div>

      <div className={styles.levelToggleContainer}>
        <div className={styles.levelPillGroup}>
          {LEVELS.map((lvl) => {
            const isActive = lvl === currentLevel
            return (
              <button
                key={lvl}
                className={`${styles.levelPill} ${isActive ? styles.levelPillActive : ''}`}
                onClick={() => onSelectLevel(lvl)}
              >
                {lvl}
              </button>
            )
          })}
        </div>
        <div className={styles.levelDesc}>{levelDesc}</div>
      </div>
    </div>
  )
}

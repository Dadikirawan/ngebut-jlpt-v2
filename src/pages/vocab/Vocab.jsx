import { useMemo, useState, useCallback } from 'react'
import styles from './vocab.module.css'
import dashStyles from '../dashboard/dashboard.module.css'
import {
  VOCAB_LEVELS,
  getVocabThemes,
  getVocabCount,
  isVocabAvailable,
} from '../../data/loadVocab.js'

const MOTION_STORAGE_KEY = 'ngebut-v2-reduce-motion'

function systemPrefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function loadReduceMotion() {
  try {
    const saved = window.localStorage.getItem(MOTION_STORAGE_KEY)
    if (saved === 'on') return true
    if (saved === 'off') return false
  } catch {
    // localStorage tidak tersedia: pakai pengaturan sistem
  }
  return systemPrefersReducedMotion()
}

function saveReduceMotion(value) {
  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, value ? 'on' : 'off')
  } catch {
    // abaikan
  }
}

function normalize(text) {
  return String(text || '').toLowerCase().replace(/\s+/g, '')
}

function VocabCard({ word, reduceMotion }) {
  const [flipped, setFlipped] = useState(false)
  const label = flipped
    ? `Arti ${word.kanji}: ${word.meaning}. Tekan untuk kembali ke depan.`
    : `${word.kanji}, dibaca ${word.kana}. Tekan untuk melihat arti.`

  return (
    <button
      type="button"
      className={`${styles.card} ${flipped ? styles.cardFlipped : ''}`}
      onClick={() => setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-label={label}
      data-reduce-motion={reduceMotion ? 'true' : 'false'}
    >
      <span className={styles.cardInner} aria-hidden="true">
        <span className={`${styles.face} ${styles.front}`}>
          <span className={styles.kanji} lang="ja">{word.kanji}</span>
          <span className={styles.kana} lang="ja">{word.kana}</span>
          <span className={styles.hint}>Ketuk untuk arti</span>
        </span>
        <span className={`${styles.face} ${styles.back}`}>
          <span className={styles.backKanji} lang="ja">{word.kanji}</span>
          <span className={styles.meaning}>{word.meaning}</span>
          <span className={styles.hint}>Ketuk untuk kembali</span>
        </span>
      </span>
    </button>
  )
}

export default function Vocab() {
  const [level, setLevel] = useState(() => VOCAB_LEVELS.find((l) => isVocabAvailable(l)) || VOCAB_LEVELS[0])
  const [query, setQuery] = useState('')
  const [themeId, setThemeId] = useState('all')
  const [reduceMotion, setReduceMotion] = useState(() => loadReduceMotion())

  const available = isVocabAvailable(level)
  const themes = useMemo(() => getVocabThemes(level), [level])
  const total = getVocabCount(level)

  const handleLevel = useCallback((next) => {
    setLevel(next)
    setThemeId('all')
    setQuery('')
  }, [])

  const handleMotionToggle = useCallback((event) => {
    const next = event.target.checked
    setReduceMotion(next)
    saveReduceMotion(next)
  }, [])

  const visibleThemes = useMemo(() => {
    const q = normalize(query)
    return themes
      .filter((theme) => themeId === 'all' || theme.id === themeId)
      .map((theme) => ({
        ...theme,
        words: q
          ? theme.words.filter((w) =>
              [w.kanji, w.kana, w.meaning].some((field) => normalize(field).includes(q)),
            )
          : theme.words,
      }))
      .filter((theme) => theme.words.length > 0)
  }, [themes, themeId, query])

  const shown = visibleThemes.reduce((sum, theme) => sum + theme.words.length, 0)

  return (
    <div className={styles.page} translate="no">
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Vocab Flashcard</h1>
          <p className={styles.subtitle}>
            Ketuk kartu untuk melihat arti. Kosakata disusun per tema.
          </p>
        </div>
        <label className={styles.motionToggle}>
          <input type="checkbox" checked={reduceMotion} onChange={handleMotionToggle} />
          <span>Kurangi animasi</span>
        </label>
      </header>

      <div className={dashStyles.levelSelectorWrap}>
        <div className={dashStyles.levelSelectorHeader}>
          <div className={dashStyles.levelSelectorTitle}>Pilih Level</div>
          <div className={dashStyles.levelSelectorSub}>Daftar kosakata sesuai level JLPT.</div>
        </div>
        <div className={dashStyles.levelPillGroup} role="group" aria-label="Pilih level vocab">
          {VOCAB_LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              className={`${dashStyles.levelPill} ${lvl === level ? dashStyles.levelPillActive : ''}`}
              aria-pressed={lvl === level}
              onClick={() => handleLevel(lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {!available && (
        <div className={styles.empty} role="status">
          Kosakata {level} segera hadir.
        </div>
      )}

      {available && (
        <>
          <div className={styles.controls}>
            <input
              type="search"
              className={styles.search}
              placeholder="Cari kanji, bacaan, atau arti"
              aria-label="Cari kosakata"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className={styles.chips} role="group" aria-label="Filter tema">
              <button
                type="button"
                className={`${styles.chip} ${themeId === 'all' ? styles.chipActive : ''}`}
                aria-pressed={themeId === 'all'}
                onClick={() => setThemeId('all')}
              >
                Semua ({total})
              </button>
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className={`${styles.chip} ${themeId === theme.id ? styles.chipActive : ''}`}
                  aria-pressed={themeId === theme.id}
                  onClick={() => setThemeId(theme.id)}
                >
                  {theme.label} ({theme.words.length})
                </button>
              ))}
            </div>
            <p className={styles.count} role="status" aria-live="polite">
              Menampilkan {shown} dari {total} kata
            </p>
          </div>

          {shown === 0 && (
            <div className={styles.empty}>Tidak ada kata yang cocok dengan pencarianmu.</div>
          )}

          {visibleThemes.map((theme) => (
            <section key={theme.id} className={styles.themeSection}>
              <h2 className={styles.themeTitle}>
                <span lang="ja">{theme.label}</span>
                <span className={styles.themeSub}>{theme.labelId}</span>
              </h2>
              <div className={styles.grid}>
                {theme.words.map((word) => (
                  <VocabCard key={word.id} word={word} reduceMotion={reduceMotion} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}

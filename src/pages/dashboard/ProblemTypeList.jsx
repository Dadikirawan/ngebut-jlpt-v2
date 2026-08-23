import { useMemo, forwardRef } from 'react'
import styles from './dashboard.module.css'
import { PROBLEM_META, getProblemMeta } from '../../utils/problemMeta.js'

const TYPE_ICON = {
  vocab_grammar_choice: '📖',
  sentence_order: '★',
  cloze_passage: '📄',
  reading: '📰',
}

const CATEGORY_TO_TYPE = {
  'Pilihan Ganda': 'vocab_grammar_choice',
  'Susunan Kalimat': 'sentence_order',
  'Lengkapi Bacaan': 'cloze_passage',
  'Pemahaman Bacaan': 'reading',
}

const TYPE_DESC = {
  vocab_grammar_choice:
    'Kumpulan soal pilihan ganda kosakata, kanji, sinonim, penggunaan kata, dan bentuk tata bahasa.',
  sentence_order:
    'Latihan menyusun fragmen kata menjadi kalimat yang benar dan menentukan posisi tanda ★.',
  cloze_passage:
    'Lengkapi bagian kosong dalam sebuah bacaan panjang dengan tata bahasa atau kosakata yang tepat.',
  reading:
    'Soal pemahaman bacaan: teks pendek, teks sedang, teks panjang, perbandingan multi-teks, dan pencarian informasi tabel.',
}

function resolveTypeKeyForMeta(meta, level, problemKey) {
  try {
    const detailed = getProblemMeta(level, problemKey)
    const categoryLabel = detailed?.categoryLabel || meta?.categoryLabel
    if (categoryLabel && CATEGORY_TO_TYPE[categoryLabel]) return CATEGORY_TO_TYPE[categoryLabel]
  } catch {
    // ignore
  }
  const fallback = CATEGORY_TO_TYPE[meta?.categoryLabel]
  return fallback || 'vocab_grammar_choice'
}

function iconForType(typeKey) {
  return TYPE_ICON[typeKey] || '📖'
}

const ProblemTypeList = forwardRef(function ProblemTypeList(
  { selectedLevel, onStartType, onOpenProblem },
  ref
) {
  const currentLevel = selectedLevel === 'N1' || selectedLevel === 'N2' ? selectedLevel : 'N1'

  const safeOnStartType = typeof onStartType === 'function' ? onStartType : () => {}
  const safeOnOpenProblem = typeof onOpenProblem === 'function' ? onOpenProblem : () => {}

  const typeGroups = useMemo(() => {
    const levelMeta = PROBLEM_META?.[currentLevel] || {}
    const keys = Object.keys(levelMeta).sort((a, b) => {
      const na = parseInt(String(a).replace(/^P/i, ''), 10) || 0
      const nb = parseInt(String(b).replace(/^P/i, ''), 10) || 0
      return na - nb
    })

    const grouped = new Map()

    for (const key of keys) {
      const meta = levelMeta[key] || {}
      const pNum = parseInt(String(key).replace(/^P/i, ''), 10) || 0
      const typeKey = resolveTypeKeyForMeta(meta, currentLevel, key)
      const typeLabel = meta?.categoryLabel || 'Soal'
      let resolvedCount = Number(meta?.questionCount) || 0
      try {
        const detailed = getProblemMeta(currentLevel, key)
        resolvedCount = Number(detailed?.questionCount) || resolvedCount
      } catch {
        // ignore
      }
      if (!grouped.has(typeKey)) {
        grouped.set(typeKey, {
          typeKey,
          typeLabel,
          icon: iconForType(typeKey),
          description: TYPE_DESC[typeKey] || 'Soal pilihan ganda JLPT.',
          totalQuestions: 0,
          problems: [],
        })
      }
      const group = grouped.get(typeKey)
      group.totalQuestions += resolvedCount
      group.problems.push({
        key,
        pNum,
        titleJp: meta?.titleJp || '',
        titleId: meta?.titleId || '',
        questionCount: resolvedCount,
      })
    }

    return [...grouped.values()]
  }, [currentLevel])

  return (
    <section ref={ref} className={styles.problemListSection}>
      <div className={styles.problemListHeader}>
        <h2 className={styles.problemListTitle}>Daftar Tipe Soal Try-out {currentLevel}</h2>
        <p className={styles.problemListSub}>
          Klik kartu tipe soal untuk memulai sesi latihan khusus hanya untuk tipe itu.
          Kamu juga bisa klik nomor bagian (P1/P2/dst) di bawah deskripsi untuk mencoba satu
          bagian saja.
        </p>
      </div>

      <div className={styles.problemGrid}>
        {typeGroups.map((group) => (
          <div
            key={group.typeKey}
            className={styles.problemCard}
            onClick={() => safeOnStartType(currentLevel, group.typeKey)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                safeOnStartType(currentLevel, group.typeKey)
              }
            }}
          >
            <div className={styles.problemCardTop}>
              <span className={styles.typePill}>
                <span aria-hidden="true">{group.icon}</span>
                <span>{group.typeLabel}</span>
              </span>
              <span className={styles.questionCount}>{group.totalQuestions} soal</span>
            </div>
            <div className={styles.problemTitleJp} translate="no">
              {group.problems.map((p) => p.titleJp).filter(Boolean).join(' ・ ')}
            </div>
            <div className={styles.problemTitleId}>
              {group.problems.map((p) => p.titleId).filter(Boolean).join(', ')}
            </div>
            <div className={styles.problemDescription}>{group.description}</div>
            <div
              className={styles.problemCardBottom}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  width: '100%',
                }}
              >
                {group.problems.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    className={styles.problemBadge}
                    style={{
                      cursor: 'pointer',
                      border: 'none',
                      fontFamily: 'inherit',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      safeOnOpenProblem(p.pNum)
                    }}
                    title={`Buka bagian ${p.titleId || p.titleJp || p.key} saja`}
                  >
                    P{p.pNum}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
})

export default ProblemTypeList

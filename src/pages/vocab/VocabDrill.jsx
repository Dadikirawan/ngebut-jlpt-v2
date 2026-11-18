import { useEffect, useRef, useState } from 'react'
import styles from './vocabDrill.module.css'
import { VOCAB_LEVELS, getVocabWords, isVocabAvailable } from '../../data/loadVocab.js'
import {
  DRILL_DIRECTIONS,
  DRILL_MIN_FOR_WEAK,
  DRILL_SESSION_SIZE,
  applyDrillResult,
  buildDrillSession,
  createDrillContext,
  dirEligible,
  drillDirStats,
  getWordStatus,
  loadDrillStore,
  resetDrillLevel,
  saveDrillStore,
  weakestDirection,
} from '../../utils/vocabDrill.js'

// Semua level yang punya data, supaya pilihan jawaban bisa dilengkapi dari level lain bila perlu
const DRILL_CTX = createDrillContext(
  Object.fromEntries(VOCAB_LEVELS.filter((l) => isVocabAvailable(l)).map((l) => [l, getVocabWords(l)])),
)

const DIR_LABEL = Object.fromEntries(DRILL_DIRECTIONS.map((d) => [d.key, d.label]))
const OPTION_LANG = { k2r: 'ja', r2k: 'ja', k2m: undefined, m2k: 'ja' }
const PROMPT_LANG = { k2r: 'ja', r2k: 'ja', k2m: 'ja', m2k: undefined }

function DrillMenu({ level, items, onStart, onReset }) {
  const words = DRILL_CTX.vocabByLevel[level] || []
  const weak = weakestDirection(items, level, words)
  let seen = 0
  let mastered = 0
  words.forEach((w) => {
    const st = getWordStatus(items, level, w, DRILL_CTX)
    if (st.seen) seen += 1
    if (st.mastered) mastered += 1
  })

  return (
    <>
      <section className={styles.card}>
        <p className={styles.caption}>Latihan Kosakata</p>
        <h2 className={styles.title}>{level} · uji dari berbagai arah</h2>
        <p className={styles.note}>
          Satu sesi berisi {DRILL_SESSION_SIZE} kata. Jawabanmu dicatat per kata per arah di perangkat ini,
          jadi kata dan arah yang sering salah muncul lebih sering.
        </p>
        <p className={styles.note}>
          Pernah dicoba: <strong>{seen}</strong> dari {words.length} kata · Hafal: <strong>{mastered}</strong>
        </p>
        {weak ? (
          <p className={styles.note}>
            <strong>Arah terlemahmu: {weak.label}</strong> ({weak.pct}% salah dari {weak.total} jawaban).
            Review Prioritas akan mengutamakan arah ini.
          </p>
        ) : (
          <p className={styles.note}>
            Jawab minimal {DRILL_MIN_FOR_WEAK} soal di satu arah untuk melihat arah terlemahmu.
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => onStart('priority')}>
            Review Prioritas
          </button>
        </div>
      </section>

      <section className={styles.dirGrid} aria-label="Pilih arah latihan">
        {DRILL_DIRECTIONS.map((dir) => {
          const eligible = words.filter((w) => dirEligible(dir.key, w, DRILL_CTX)).length
          const st = drillDirStats(items, level, words, dir.key)
          const acc = st.total
            ? `${Math.round((st.ok / st.total) * 100)}% benar · ${st.total} jawaban`
            : 'Belum dicoba'
          return (
            <button key={dir.key} type="button" className={styles.dirCard} onClick={() => onStart(dir.key)}>
              <span className={styles.dirLabel}>{dir.label}</span>
              <span className={styles.dirAcc}>{acc}</span>
              <span className={styles.dirHint}>
                {dir.hint}. {eligible} kata tersedia.
              </span>
            </button>
          )
        })}
      </section>

      <section className={styles.card}>
        <p className={styles.caption}>Cara kerja</p>
        <h2 className={styles.title}>Kotak hafalan 1–4</h2>
        <p className={styles.note}>
          Tiap kata punya kotak per arah. Jawaban benar menaikkan kotak (muncul lebih jarang), jawaban salah
          mengembalikannya ke kotak 1 (muncul lebih sering). Review Prioritas memilih kata dari kotak rendah,
          yang sering salah, dan dari arah yang paling lemah. Catatan hanya tersimpan di perangkat ini.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onReset}>
            Reset catatan latihan {level}
          </button>
        </div>
      </section>
    </>
  )
}

function DrillSession({ level, session, onAnswer, onNext, onExit }) {
  const q = session.questions[session.index]
  const fb = session.feedback
  const total = session.questions.length
  const percent = Math.round(((session.index + (fb ? 1 : 0)) / total) * 100)
  const promptRef = useRef(null)
  const nextRef = useRef(null)

  useEffect(() => {
    if (fb) nextRef.current?.focus()
    else promptRef.current?.focus()
  }, [session.index, fb])

  return (
    <>
      <section className={styles.card}>
        <p className={styles.caption}>Latihan Kosakata · {level}</p>
        <h2 className={styles.title}>{session.dirKey === 'priority' ? 'Review Prioritas' : DIR_LABEL[q.dirKey]}</h2>
        <div className={styles.chips}>
          <span className={styles.chip}>Soal {session.index + 1}/{total}</span>
          <span className={styles.chip}>Benar {session.correct}</span>
          {session.dirKey === 'priority' && <span className={styles.chip}>{DIR_LABEL[q.dirKey]}</span>}
        </div>
        <div
          className={styles.progress}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Kemajuan sesi"
        >
          <div className={styles.progressFill} style={{ width: `${percent}%` }} />
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onExit}>Keluar sesi</button>
        </div>
      </section>

      <section className={styles.card}>
        <div ref={promptRef} tabIndex={-1} className={styles.promptBox}>
          <p className={styles.promptMain} lang={PROMPT_LANG[q.dirKey]}>{q.promptMain}</p>
          <p className={styles.promptSub}>{q.promptSub}</p>
        </div>
      </section>

      <section className={styles.options} aria-label="Pilihan jawaban">
        {q.options.map((opt) => {
          const cls = [styles.option]
          if (fb && opt.id === q.correctId) cls.push(styles.optionCorrect)
          else if (fb && opt.id === fb.selectedId) cls.push(styles.optionWrong)
          return (
            <button
              key={opt.id}
              type="button"
              className={cls.join(' ')}
              disabled={Boolean(fb)}
              onClick={() => onAnswer(opt.id)}
            >
              <span className={styles.optionTag} aria-hidden="true">{opt.id}</span>
              <span className={styles.optionText} lang={OPTION_LANG[q.dirKey]}>{opt.text}</span>
            </button>
          )
        })}
      </section>

      {fb && (
        <section className={`${styles.card} ${fb.isCorrect ? styles.fbOk : styles.fbNg}`} role="status">
          <h3 className={styles.fbTitle}>{fb.isCorrect ? 'Jawaban benar' : 'Belum tepat'}</h3>
          <p className={styles.note}>
            {!fb.isCorrect && (
              <>
                Jawaban yang benar: <strong lang={OPTION_LANG[q.dirKey]}>{q.correctText}</strong>.{' '}
              </>
            )}
            Kotak {fb.change.from} → {fb.change.to} untuk arah ini.
          </p>
          <dl className={styles.detail}>
            <div><dt>Kata</dt><dd lang="ja"><strong>{q.item.kanji}</strong></dd></div>
            <div><dt>Bacaan</dt><dd lang="ja">{q.item.kana}</dd></div>
            <div><dt>Arti</dt><dd>{q.item.meaning || '—'}</dd></div>
          </dl>
          <div className={styles.actions}>
            <button ref={nextRef} type="button" className={styles.btnPrimary} onClick={onNext}>
              {session.index + 1 >= total ? 'Lihat Hasil' : 'Lanjut'}
            </button>
          </div>
        </section>
      )}
    </>
  )
}

function DrillSummary({ level, session, items, onStart, onExit }) {
  const total = session.questions.length
  const pct = total ? Math.round((session.correct / total) * 100) : 0
  const words = DRILL_CTX.vocabByLevel[level] || []
  const weak = weakestDirection(items, level, words)
  const headingRef = useRef(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <>
      <section className={styles.card}>
        <p className={styles.caption}>Hasil Latihan · {level}</p>
        <h2 ref={headingRef} tabIndex={-1} className={styles.title}>
          {session.correct} dari {total} benar ({pct}%)
        </h2>
        {weak && (
          <p className={styles.note}>
            Arah terlemahmu saat ini: <strong>{weak.label}</strong> ({weak.pct}% salah dari {weak.total} jawaban).
          </p>
        )}
        <dl className={styles.detail}>
          {DRILL_DIRECTIONS.filter((d) => session.perDir[d.key]).map((d) => (
            <div key={d.key}>
              <dt>{d.label}</dt>
              <dd>{session.perDir[d.key].ok} benar · {session.perDir[d.key].ng} salah</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.card}>
        <p className={styles.caption}>Perlu diulang</p>
        <h2 className={styles.title}>Kata yang salah</h2>
        <dl className={styles.detail}>
          {session.missed.length === 0 && (
            <div><dt>Tidak ada</dt><dd>Semua jawaban benar di sesi ini.</dd></div>
          )}
          {session.missed.map((m, i) => (
            <div key={`${m.item.kanji}-${i}`}>
              <dt lang="ja">
                {m.item.kanji}
                {m.item.kanji !== m.item.kana ? ` (${m.item.kana})` : ''}
              </dt>
              <dd>{m.item.meaning || '—'}</dd>
            </div>
          ))}
        </dl>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => onStart(session.dirKey)}>Latihan lagi</button>
          <button type="button" className={styles.btnSecondary} onClick={() => onStart('priority')}>Review Prioritas</button>
          <button type="button" className={styles.btnGhost} onClick={onExit}>Kembali ke menu</button>
        </div>
      </section>
    </>
  )
}

export default function VocabDrill({ level }) {
  const [items, setItems] = useState(() => loadDrillStore())
  const [session, setSession] = useState(null)

  const start = (dirKey) => {
    const questions = buildDrillSession(items, level, DRILL_CTX, dirKey)
    if (!questions.length) return
    setSession({
      phase: 'session',
      dirKey,
      questions,
      index: 0,
      correct: 0,
      missed: [],
      perDir: {},
      feedback: null,
    })
  }

  const answer = (optionId) => {
    if (!session || session.phase !== 'session' || session.feedback) return
    const q = session.questions[session.index]
    if (!q || !q.options.some((o) => o.id === optionId)) return
    const isCorrect = optionId === q.correctId
    const result = applyDrillResult(items, level, q.item, q.dirKey, isCorrect, Date.now())
    setItems(result.items)
    saveDrillStore(result.items)
    const prev = session.perDir[q.dirKey] || { ok: 0, ng: 0 }
    setSession({
      ...session,
      correct: session.correct + (isCorrect ? 1 : 0),
      missed: isCorrect ? session.missed : [...session.missed, q],
      perDir: {
        ...session.perDir,
        [q.dirKey]: { ok: prev.ok + (isCorrect ? 1 : 0), ng: prev.ng + (isCorrect ? 0 : 1) },
      },
      feedback: { selectedId: optionId, isCorrect, change: result.change },
    })
  }

  const next = () => {
    if (!session || session.phase !== 'session' || !session.feedback) return
    const index = session.index + 1
    setSession({
      ...session,
      index,
      feedback: null,
      phase: index >= session.questions.length ? 'summary' : 'session',
    })
  }

  const exit = () => setSession(null)

  const reset = () => {
    if (!window.confirm(`Hapus semua catatan Latihan Kosakata untuk ${level}? Ini tidak bisa dibatalkan.`)) return
    const cleared = resetDrillLevel(items, level)
    setItems(cleared)
    saveDrillStore(cleared)
    setSession(null)
  }

  return (
    <div className={styles.wrap}>
      {!session && <DrillMenu level={level} items={items} onStart={start} onReset={reset} />}
      {session && session.phase === 'session' && (
        <DrillSession level={level} session={session} onAnswer={answer} onNext={next} onExit={exit} />
      )}
      {session && session.phase === 'summary' && (
        <DrillSummary level={level} session={session} items={items} onStart={start} onExit={exit} />
      )}
    </div>
  )
}

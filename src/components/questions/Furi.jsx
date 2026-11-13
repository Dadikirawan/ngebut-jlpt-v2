import { furiSegments, renderSegments, useFuriganaEnabled } from '../../utils/furigana.js'

// Tampilkan teks dengan furigana (bila aktif & berlaku untuk soal ini).
export default function Furi({ question, text }) {
  const enabled = useFuriganaEnabled()
  const segs = furiSegments(question, text, enabled)
  if (!segs) return text ?? null
  return <>{renderSegments(segs)}</>
}

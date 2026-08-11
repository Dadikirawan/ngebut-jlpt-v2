import styles from './dashboard.module.css'

export default function HeroSection({ onStartQuick, onBrowseTypes }) {
  return (
    <section className={styles.heroSection}>
      <h1 className={styles.heroHeadline}>
        Latihan Konsisten, Hasil Ujian Maksimal. Try-Out JLPT N1/N2 dengan Skor &amp; Progres Real-Time.
      </h1>
      <p className={styles.heroSubtext}>
        Coba soal N1/N2 pilihan ganda, tata bahasa susun kalimat, hingga bacaan panjang — dalam format try-out simulasi ujian JLPT sesungguhnya.
      </p>
      <div className={styles.heroCtaRow}>
        <button className={styles.ctaPrimary} onClick={onStartQuick}>
          🚀 Mulai Try-out Sekarang
        </button>
        <button className={styles.ctaSecondary} onClick={onBrowseTypes}>
          📚 Lihat Daftar Soal
        </button>
      </div>
    </section>
  )
}

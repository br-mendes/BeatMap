'use client'

import styles from './BeatMapLogo.module.css'

export const BeatMapLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const sizeClass = size === 'sm' ? styles.sm : size === 'lg' ? styles.lg : size === 'xl' ? styles.xl : styles.md
  const textClass = size === 'sm' ? styles.textSm : size === 'lg' ? styles.textLg : size === 'xl' ? styles.textXl : styles.textMd

  return (
    <div className={styles.wrap}>
      <div className={`${styles.mark} ${sizeClass}`}>
        <div className={styles.glow} />
        <div className={styles.tile}>
          <div className={styles.grid} />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.icon}
            aria-hidden="true"
          >
            <path d="M2 12h3l3-8 5 16 3-8h6" />
          </svg>
          <div className={styles.shine} />
        </div>
      </div>

      <span className={`${styles.word} ${textClass}`}>
        Beat<span className={styles.wordAccent}>Map</span>
      </span>
    </div>
  );
};

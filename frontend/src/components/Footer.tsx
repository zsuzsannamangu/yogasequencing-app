import styles from '@/styles/Footer.module.scss';

export default function Footer() {
    return (
      <footer className={styles.footer}>
        © {new Date().getFullYear()} MoveMosaic. All rights reserved.
      </footer>
    );
  }
  
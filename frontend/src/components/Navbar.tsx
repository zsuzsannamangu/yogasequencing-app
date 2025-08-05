'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/Navbar.module.scss';

export default function Navbar() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <Image 
          src="/logo/movemosaiclogo.png" 
          alt="YogaFlow Logo" 
          width={100} 
          height={20}
          priority
        />
      </Link>
      <nav className={styles.nav}>
        <Link href="/upload" className={styles.navLink}>Upload</Link>
        <Link href="/#contact" className={styles.navLink}>Contact</Link>
        <Link href="/register" className={styles.navLink}>Register</Link>
        <Link href="/login" className={styles.navLink}>Login</Link>
      </nav>
    </header>
  );
}

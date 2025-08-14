'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import styles from '../styles/Navbar.module.scss';

interface NavbarProps {
  showUserMenu?: boolean;
  firstName?: string;
  lastName?: string;
  profileImage?: string | null;
}

export default function Navbar({ showUserMenu = false, firstName = '', lastName = '', profileImage }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <Link href="/" className={styles.logo}>
        <Image 
          src="/logo/logonew.png" 
          alt="MoveMosaic Logo" 
          width={120} 
          height={40}
          priority
        />
      </Link>
      {showUserMenu ? (
        <UserMenu firstName={firstName} lastName={lastName} profileImage={profileImage} />
      ) : (
        <nav className={styles.nav}>
          {isHomepage ? (
            <button 
              className={styles.navLink}
              onClick={() => {
                document.getElementById('upload')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              Upload
            </button>
          ) : (
            <Link href="/upload" className={styles.navLink}>Upload</Link>
          )}
          <Link href="/#contact" className={styles.navLink}>Contact</Link>
          <Link href="/register" className={styles.navLink}>Register</Link>
          <Link href="/login" className={styles.navLink}>Login</Link>
        </nav>
      )}
    </header>
  );
}

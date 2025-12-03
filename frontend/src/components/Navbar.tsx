'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import UserMenu from './UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import styles from '../styles/Navbar.module.scss';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <Link href="/" className={styles.logo} onClick={closeMobileMenu}>
        <Image 
          src="/logo/logonew.png" 
          alt="SequencePrint Logo" 
          width={120} 
          height={40}
          priority
        />
      </Link>
      
      {/* Desktop Navigation */}
      <nav className={styles.nav}>
        {!isAuthenticated && (
          <>
            <Link href="/browse" className={styles.navLink}>Browse</Link>
            <Link href="/#contact" className={styles.navLink}>Contact</Link>
          </>
        )}
        {isAuthenticated && user ? (
          <UserMenu 
            firstName={user.first_name} 
            lastName={user.last_name} 
            profileImage={user.profile_image ? 
              (user.profile_image.startsWith('http') ? 
                user.profile_image : 
                `http://localhost:8000/${user.profile_image}`) : 
              null
            } 
          />
        ) : (
          <>
            <Link href="/register" className={styles.navLink}>Register</Link>
            <Link href="/login" className={styles.navLink}>Login</Link>
          </>
        )}
      </nav>

      {/* Mobile Menu Button */}
      <button 
        className={styles.mobileMenuButton}
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile Menu */}
      <nav className={`${styles.mobileNav} ${isMobileMenuOpen ? styles.open : ''}`}>
        {!isAuthenticated && (
          <>
            <Link href="/browse" className={styles.mobileNavLink} onClick={closeMobileMenu}>Browse</Link>
            <Link href="/#contact" className={styles.mobileNavLink} onClick={closeMobileMenu}>Contact</Link>
            <Link href="/register" className={styles.mobileNavLink} onClick={closeMobileMenu}>Register</Link>
            <Link href="/login" className={styles.mobileNavLink} onClick={closeMobileMenu}>Login</Link>
          </>
        )}
        {isAuthenticated && user && (
          <>
            <div className={styles.mobileUserInfo}>
              {user.profile_image && (
                <Image 
                  src={user.profile_image.startsWith('http') ? 
                    user.profile_image : 
                    `http://localhost:8000/${user.profile_image}`} 
                  alt={`${user.first_name} ${user.last_name}`}
                  className={styles.mobileProfileImage}
                  width={40}
                  height={40}
                />
              )}
              <span>{user.first_name} {user.last_name}</span>
            </div>
            <Link href="/" className={styles.mobileNavLink} onClick={closeMobileMenu}>Home</Link>
            <Link href="/dashboard" className={styles.mobileNavLink} onClick={closeMobileMenu}>Dashboard</Link>
            <Link href="/upload" className={styles.mobileNavLink} onClick={closeMobileMenu}>Upload Video</Link>
            <Link href="/sequences" className={styles.mobileNavLink} onClick={closeMobileMenu}>View Sequences</Link>
            <Link href="/browse" className={styles.mobileNavLink} onClick={closeMobileMenu}>Browse</Link>
            <Link href="/help" className={styles.mobileNavLink} onClick={closeMobileMenu}>Help & Support</Link>
            <Link href="/settings" className={styles.mobileNavLink} onClick={closeMobileMenu}>Account Settings</Link>
          </>
        )}
      </nav>
    </header>
  );
}

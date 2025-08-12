'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload, BookOpen, HelpCircle, Settings, LogOut, List } from 'lucide-react';
import styles from '@/styles/UserMenu.module.scss';

interface UserMenuProps {
  firstName: string;
  lastName: string;
  profileImage?: string | null;
  onLogout?: () => void;
}

export default function UserMenu({ firstName, lastName, profileImage, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && !(event.target as Element).closest(`.${styles.userMenu}`)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.userMenu}>
      <div 
        className={styles.userInitials}
        onClick={toggleMenu}
      >
        {profileImage && profileImage !== '/images/default-avatar.png' ? (
          <img 
            src={profileImage} 
            alt={`${firstName} ${lastName}`}
            className={styles.profileImage}
          />
        ) : (
          <span>{userInitials}</span>
        )}
      </div>
      
      <div className={`${styles.menuDropdown} ${isOpen ? styles.open : ''}`}>
        <Link href="/dashboard" className={styles.menuItem} onClick={closeMenu}>
          <BookOpen size={20} />
          <span>Dashboard</span>
        </Link>
        
        <Link href="/upload" className={styles.menuItem} onClick={closeMenu}>
          <Upload size={20} />
          <span>Upload Video</span>
        </Link>
        
        <Link href="/sequences" className={styles.menuItem} onClick={closeMenu}>
          <List size={20} />
          <span>View Sequences</span>
        </Link>
        
        <Link href="/help" className={styles.menuItem} onClick={closeMenu}>
          <HelpCircle size={20} />
          <span>Help & Support</span>
        </Link>
        
        <Link href="/settings" className={styles.menuItem} onClick={closeMenu}>
          <Settings size={20} />
          <span>Account Settings</span>
        </Link>
        
        <button className={styles.menuItem} onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

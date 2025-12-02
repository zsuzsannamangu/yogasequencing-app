'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Upload, BookOpen, HelpCircle, Settings, LogOut, List, Search, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import styles from '@/styles/UserMenu.module.scss';

interface UserMenuProps {
  firstName: string;
  lastName: string;
  profileImage?: string | null;
  location?: string;
}

export default function UserMenu({ firstName, lastName, profileImage, location }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#b8336a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        logout();
        setIsOpen(false);
        
        // Show success message
        Swal.fire({
          title: 'Logged out',
          text: 'You have been successfully logged out.',
          icon: 'success',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
        
        // Redirect to home page
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
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
          <Image 
            src={profileImage} 
            alt={`${firstName} ${lastName}`}
            width={40}
            height={40}
            className={styles.profileImage}
            unoptimized={profileImage.startsWith('http')}
          />
        ) : (
          <span>{userInitials}</span>
        )}
      </div>
      
      <div className={`${styles.menuDropdown} ${isOpen ? styles.open : ''}`}>
        {location && (
          <div className={styles.userInfo}>
            <span className={styles.userName}>{firstName} {lastName}</span>
            <span className={styles.userLocation}>{location}</span>
          </div>
        )}
        <Link href="/" className={styles.menuItem} onClick={closeMenu}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        
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
        
        <Link href="/browse" className={styles.menuItem} onClick={closeMenu}>
          <Search size={20} />
          <span>Browse</span>
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

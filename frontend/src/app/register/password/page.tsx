'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/RegisterFlow.module.scss';

export default function PasswordSetupPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password setup logic here
    console.log('Password setup:', { password });
    // Navigate to next step
    router.push('/register/business');
  };

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasLength = password.length >= 8;

  const isFormValid = hasLetter && hasDigit && hasLength;

  return (
    <main className={styles.main}>
      <Navbar />
      
      <section className={styles.flowSection}>
        <div className={styles.flowContainer}>
          <div className={styles.header}>
            <Link href="/register" className={styles.backButton}>
              ←
            </Link>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '33%' }}></div>
            </div>
          </div>

          <h1 className={styles.title}>Password Setup</h1>
          <p className={styles.subtitle}>Enter the password for your business profile.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                PASSWORD
              </label>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={styles.input}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.showPassword}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div className={styles.requirements}>
              <h3>The password must contain:</h3>
              <div className={styles.requirement}>
                <span className={`${styles.checkmark} ${hasLetter ? styles.valid : ''}`}>
                  {hasLetter ? '✓' : '○'}
                </span>
                <span className={hasLetter ? styles.valid : ''}>at least one letter</span>
              </div>
              <div className={styles.requirement}>
                <span className={`${styles.checkmark} ${hasDigit ? styles.valid : ''}`}>
                  {hasDigit ? '✓' : '○'}
                </span>
                <span className={hasDigit ? styles.valid : ''}>at least one number</span>
              </div>
              <div className={styles.requirement}>
                <span className={`${styles.checkmark} ${hasLength ? styles.valid : ''}`}>
                  {hasLength ? '✓' : '○'}
                </span>
                <span className={hasLength ? styles.valid : ''}>8 characters or more</span>
              </div>
            </div>

            <button 
              type="submit" 
              className={`${styles.primaryButton} ${!isFormValid ? styles.disabled : ''}`}
              disabled={!isFormValid}
            >
              CONTINUE
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}

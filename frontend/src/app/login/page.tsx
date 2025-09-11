'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import styles from '@/styles/Auth.module.scss';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;
    
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      
      // Show success message
      Swal.fire({
        title: 'Welcome back!',
        text: 'You have successfully logged in.',
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
      
      // The useEffect will handle the redirect when isAuthenticated becomes true
      
    } catch (error: any) {
      Swal.fire({
        title: 'Login Failed',
        text: error.message || 'Invalid email or password',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <Navbar />
      
      <section className={styles.authSection}>
        <div className={styles.authContainer}>
          <div className={styles.tabs}>
            <Link href="/login" className={`${styles.tab} ${styles.activeTab}`}>
              Login
            </Link>
            <Link href="/register" className={styles.tab}>
              Sign up
            </Link>
          </div>

          <h1 className={styles.title}>Welcome back</h1>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                E-MAIL ADDRESS
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
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

            <button 
              type="submit" 
              className="btn-secondary"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? 'LOGGING IN...' : 'LOG IN WITH EMAIL'}
            </button>

            <Link href="/forgot-password" className={styles.forgotPassword}>
              Forgot password?
            </Link>

            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <div className={styles.socialButtons}>
              <button type="button" className={styles.socialButton}>
                <span className={styles.facebookIcon}>
                  <svg viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </span>
                Continue with Facebook
              </button>
              <button type="button" className={styles.socialButton}>
                <span className={styles.googleIcon}>
                  <svg viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </span>
                Continue with Google
              </button>
            </div>



            <p className={styles.terms}>
              By signing up I agree to the{' '}
              <Link href="/terms" className={styles.link}>Terms & Conditions</Link>{' '}
              and to the{' '}
              <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
            </p>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}

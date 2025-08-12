'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/RegisterFlow.module.scss';

export default function AboutYouPage() {
  const [businessName, setBusinessName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle final registration logic here
    console.log('Registration complete:', { businessName, firstName, lastName, phonePrefix, phoneNumber });
    // Navigate to payment page
    router.push('/register/payment');
  };

  const isFormValid = businessName.trim() && firstName.trim() && lastName.trim() && phoneNumber.trim();

  return (
    <main className={styles.main}>
      <Navbar />
      
      <section className={styles.flowSection}>
        <div className={styles.flowContainer}>
          <div className={styles.header}>
            <Link href="/register/business" className={styles.backButton}>
              ←
            </Link>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '100%' }}></div>
            </div>
          </div>

          <h1 className={styles.title}>About You</h1>
          <p className={styles.subtitle}>Tell us more about yourself and your business.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="businessName" className={styles.label}>
                BUSINESS NAME
              </label>
              <input
                type="text"
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business name"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="firstName" className={styles.label}>
                FIRST NAME
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="lastName" className={styles.label}>
                LAST NAME
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="phone" className={styles.label}>
                PHONE NUMBER
              </label>
              <div className={styles.phoneInput}>
                <div className={styles.prefixSelect}>
                  <span className={styles.flag}>🇺🇸</span>
                  <select
                    value={phonePrefix}
                    onChange={(e) => setPhonePrefix(e.target.value)}
                    className={styles.prefix}
                  >
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+33">+33</option>
                    <option value="+49">+49</option>
                    <option value="+81">+81</option>
                  </select>
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Your phone number"
                  className={styles.phoneNumber}
                  required
                />
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

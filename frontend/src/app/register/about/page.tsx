'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import styles from '@/styles/RegisterFlow.module.scss';

export default function AboutYouPage() {
  const [businessName, setBusinessName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if we have the required data from previous steps
    const email = sessionStorage.getItem('registration_email');
    const password = sessionStorage.getItem('registration_password');
    const businessCategory = sessionStorage.getItem('registration_business_category');
    
    if (!email || !password || !businessCategory) {
      // Redirect back to register if missing data
      router.push('/register');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;
    
    setIsSubmitting(true);
    
    try {
      // Get data from sessionStorage
      const email = sessionStorage.getItem('registration_email') || '';
      const password = sessionStorage.getItem('registration_password') || '';
      const businessCategoryId = sessionStorage.getItem('registration_business_category') || '';
      
      // Convert category ID to full name
      const businessCategories = [
        { id: 'yoga-teachers', name: 'Yoga Teachers & Therapists' },
        { id: 'pilates-instructors', name: 'Pilates Instructors' },
        { id: 'physical-therapists', name: 'Physical Therapists & Rehab Specialists' },
        { id: 'occupational-therapists', name: 'Occupational Therapists' },
        { id: 'dance-teachers', name: 'Dance Teachers & Choreographers' },
        { id: 'personal-trainers', name: 'Personal Trainers & Fitness Coaches' }
      ];
      
      const selectedCategory = businessCategories.find(cat => cat.id === businessCategoryId);
      const businessCategoryName = selectedCategory ? selectedCategory.name : businessCategoryId;
      
      // Prepare registration data
      const registrationData = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone: `${phonePrefix} ${phoneNumber}`.trim(),
        business_name: businessName,
        business_category: businessCategoryName,
        location: '', // Optional field
        bio: '', // Optional field
      };
      
      // Register the user
      await register(registrationData);
      
      // Clear session storage
      sessionStorage.removeItem('registration_email');
      sessionStorage.removeItem('registration_password');
      sessionStorage.removeItem('registration_business_category');
      
      // Show success message
      Swal.fire({
        title: 'Welcome to MoveMosaic!',
        text: 'Your account has been created successfully.',
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'Get Started',
      });
      
      // Navigate to home page
      router.push('/');
      
    } catch (error: any) {
      Swal.fire({
        title: 'Registration Failed',
        text: error.message || 'Failed to create account. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    } finally {
      setIsSubmitting(false);
    }
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
              className={`btn-secondary ${!isFormValid || isSubmitting || isLoading ? 'disabled' : ''}`}
              disabled={!isFormValid || isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}

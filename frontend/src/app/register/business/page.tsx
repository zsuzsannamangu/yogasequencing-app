'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '@/styles/RegisterFlow.module.scss';

const businessCategories = [
  { id: 'yoga-teachers', name: 'Yoga Teachers & Therapists', icon: '🧘‍♀️' },
  { id: 'pilates-instructors', name: 'Pilates Instructors', icon: '💪' },
  { id: 'physical-therapists', name: 'Physical Therapists & Rehab Specialists', icon: '🏥' },
  { id: 'occupational-therapists', name: 'Occupational Therapists', icon: '🔄' },
  { id: 'dance-teachers', name: 'Dance Teachers & Choreographers', icon: '💃' },
  { id: 'personal-trainers', name: 'Personal Trainers & Fitness Coaches', icon: '🏋️‍♀️' }
];

const otherCategories = [
  'Martial Arts Instructors',
  'Athletic Trainers & Sports Coaches',
  'Chiropractors & Bodywork Professionals',
  'Occupational Therapists',
  'Dance Teachers & Choreographers',
  'Personal Trainers & Fitness Coaches',
  'Other'
];

export default function BusinessCategoryPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const router = useRouter();

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleContinue = () => {
    if (selectedCategory) {
      // Store business category in sessionStorage
      sessionStorage.setItem('registration_business_category', selectedCategory);
      // Navigate to next step
      router.push('/register/about');
    }
  };

  return (
    <main className={styles.main}>
      <Navbar />
      
      <section className={styles.flowSection}>
        <div className={styles.flowContainer}>
          <div className={styles.header}>
            <Link href="/register/password" className={styles.backButton}>
              ←
            </Link>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '66%' }}></div>
            </div>
          </div>

          <h1 className={styles.title}>What's your business?</h1>
          <p className={styles.subtitle}>Select the category you feel best represents your business.</p>

          <div className={styles.categoryGrid}>
            {businessCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.selected : ''}`}
                onClick={() => handleCategorySelect(category.id)}
              >
                <div className={styles.categoryIcon}>{category.icon}</div>
                <span className={styles.categoryName}>{category.name}</span>
              </button>
            ))}
          </div>

          <div className={styles.otherCategories}>
            <h3>Other categories</h3>
            <div className={styles.otherList}>
              {otherCategories.map((category, index) => (
                <button
                  key={index}
                  type="button"
                  className={styles.otherCategory}
                  onClick={() => handleCategorySelect(category.toLowerCase().replace(/\s+/g, '-'))}
                >
                  <span>{category}</span>
                  <span className={styles.arrow}>→</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleContinue}
            className={`btn-primary ${!selectedCategory ? 'disabled' : ''}`}
            disabled={!selectedCategory}
          >
            CONTINUE
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}

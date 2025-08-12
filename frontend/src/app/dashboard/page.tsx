'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import UserMenu from '@/components/UserMenu';
import styles from '@/styles/Dashboard.module.scss';

export default function DashboardPage() {
  // Mock user data - in real app this would come from authentication context
  const firstName = "John"; // This would be dynamic
  const userInitials = "JD"; // This would be dynamic

  return (
            <main className={styles.main}>
          <Navbar showUserMenu={true} firstName={firstName} lastName="Doe" profileImage={null} />
          <section className={styles.dashboardSection}>
            <div className={styles.dashboardContainer}>

          <div className={styles.header}>
            <h1 className={styles.title}>Hello, {firstName}</h1>
            <p className={styles.subtitle}>Create, manage, and share your movement sequences</p>
          </div>

          <div className={styles.quickActions}>
            <h2>Quick Actions</h2>
            <div className={styles.actionGrid}>
              <Link href="/upload" className={styles.actionCard}>
                <div className={styles.actionIcon}>📹</div>
                <h3>Upload Video</h3>
                <p>Create a new sequence from your video</p>
              </Link>
              
              <Link href="/sequences" className={styles.actionCard}>
                <div className={styles.actionIcon}>📚</div>
                <h3>View Sequences</h3>
                <p>Browse your saved sequences</p>
              </Link>
              
              <Link href="/help" className={styles.actionCard}>
                <div className={styles.actionIcon}>❓</div>
                <h3>Help & Support</h3>
                <p>Get help with using MoveMosaic</p>
              </Link>
            </div>
          </div>

          <div className={styles.stats}>
            <h2>Your Activity</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>0</div>
                <div className={styles.statLabel}>Sequences Created</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>0</div>
                <div className={styles.statLabel}>Videos Uploaded</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statNumber}>0</div>
                <div className={styles.statLabel}>PDFs Downloaded</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

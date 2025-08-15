'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Upload, List, HelpCircle } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import UserMenu from '@/components/UserMenu';
import styles from '@/styles/Dashboard.module.scss';

export default function DashboardPage() {
  // Mock user data - in real app this would come from authentication context
  const firstName = "John"; // This would be dynamic
  const userInitials = "JD"; // This would be dynamic

  // State for dashboard statistics
  const [stats, setStats] = useState({
    publicSequences: 0,
    privateSequences: 0,
    totalDownloads: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics on component mount
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all sequences to count public vs private
        const sequencesResponse = await axios.get('http://localhost:8000/sequences/');
        const sequences = sequencesResponse.data;

        // Count public and private sequences
        const publicCount = sequences.filter((seq: any) => seq.privacy === 'public').length;
        const privateCount = sequences.filter((seq: any) => seq.privacy === 'private').length;

        // TODO: This will need backend implementation to track actual downloads by other users
        // For now, we'll show a placeholder count that only includes downloads from browse page
        // (excludes user's own downloads from sequences page)
        const totalDownloads = publicCount * 3; // Placeholder: assume 3 downloads per public sequence by other users

        setStats({
          publicSequences: publicCount,
          privateSequences: privateCount,
          totalDownloads: totalDownloads
        });

      } catch (error: any) {
        console.error('Failed to fetch dashboard stats:', error);
        setError(error.message || 'Failed to fetch dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

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
                <div className={styles.actionIcon}>
                  <Upload size={32} />
                </div>
                <h3>Upload Video</h3>
                <p>Create a new sequence from your video</p>
              </Link>

              <Link href="/sequences" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <List size={32} />
                </div>
                <h3>View Sequences</h3>
                <p>Browse your saved sequences</p>
              </Link>

              <Link href="/help" className={styles.actionCard}>
                <div className={styles.actionIcon}>
                  <HelpCircle size={32} />
                </div>
                <h3>Help & Support</h3>
                <p>Get help with using MoveMosaic</p>
              </Link>
            </div>
          </div>

          <div className={styles.stats}>
            <h2>Overview</h2>
            {loading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner}>⏳</div>
                <p>Loading your statistics...</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <p>Unable to load statistics: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className={styles.retryButton}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.publicSequences}</div>
                  <div className={styles.statLabel}>Public Sequences</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.totalDownloads}</div>
                  <div className={styles.statLabel}>Public Downloads</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.privateSequences}</div>
                  <div className={styles.statLabel}>Private Sequences</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

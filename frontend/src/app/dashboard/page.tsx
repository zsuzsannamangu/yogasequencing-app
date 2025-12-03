'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Upload, List, HelpCircle } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api';
import styles from '@/styles/Dashboard.module.scss';

interface SequencePrivacy {
  privacy?: 'public' | 'private';
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Get user data from authentication context
  const firstName = user?.first_name || "User";
  const lastName = user?.last_name || "";

  // Check if profile is complete
  const isProfileComplete = user?.location && user?.bio && user?.profile_image;

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
        const sequencesResponse = await axios.get(apiUrl('sequences/'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const sequences = sequencesResponse.data as SequencePrivacy[];

        // Count public and private sequences
        const publicCount = sequences.filter((seq) => seq.privacy === 'public').length;
        const privateCount = sequences.filter((seq) => seq.privacy === 'private').length;

        // Get actual download count for user's public sequences from browse page
        let totalDownloads = 0;
        try {
          const downloadStatsResponse = await axios.get(apiUrl('sequences/my-download-stats'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          totalDownloads = downloadStatsResponse.data.total_downloads;
          console.log('Download stats response:', downloadStatsResponse.data);
        } catch (downloadError) {
          console.error('Failed to fetch download stats:', downloadError);
          // Fallback to 0 if download stats fail
          totalDownloads = 0;
        }

        setStats({
          publicSequences: publicCount,
          privateSequences: privateCount,
          totalDownloads: totalDownloads
        });

      } catch (error: unknown) {
        console.error('Failed to fetch dashboard stats:', error);
        const errorMessage = (error as { message?: string })?.message || 'Failed to fetch dashboard statistics';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <main className={styles.main}>
      <Navbar />
      <section className={styles.dashboardSection}>
        <div className={styles.dashboardContainer}>

          <div className={styles.header}>
            <h1 className={styles.title}>Hello, {firstName}</h1>
            <p className={styles.subtitle}>Create, manage, and share your movement sequences</p>
          </div>

          {/* Profile Setup Notice - Only show if profile is incomplete */}
          {!isProfileComplete && (
            <div className={styles.profileSetupNotice}>
              <div className={styles.noticeContent}>
                <h3>Complete Your Profile</h3>
                <p>Add your location, bio, and profile image to build credibility and attract more students to your sequences.</p>
                <Link href="/settings" className={styles.setupButton}>
                  Set Up Profile
                </Link>
              </div>
            </div>
          )}

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
                <p>Get help with using Sequ</p>
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

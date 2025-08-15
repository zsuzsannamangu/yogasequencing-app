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
    sequencesCreated: 0,
    videosUploaded: 0,
    pdfsDownloaded: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics on component mount
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch sequences count
        const sequencesResponse = await axios.get('http://localhost:8000/sequences/');
        const sequencesCount = sequencesResponse.data.length;
        
        // For now, we'll use sequences count as videos uploaded since each sequence comes from a video
        // In the future, you might want to track actual video uploads separately
        const videosCount = sequencesCount;
        
        // PDFs downloaded - this would need to be tracked separately in the future
        // For now, we'll show a placeholder or estimate based on sequences
        const pdfsCount = Math.floor(sequencesCount * 0.8); // Estimate 80% of sequences get PDFs
        
        setStats({
          sequencesCreated: sequencesCount,
          videosUploaded: videosCount,
          pdfsDownloaded: pdfsCount
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
            <h2>Your Activity</h2>
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
                  <div className={styles.statNumber}>{stats.sequencesCreated}</div>
                  <div className={styles.statLabel}>Sequences Created</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.videosUploaded}</div>
                  <div className={styles.statLabel}>Videos Uploaded</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.pdfsDownloaded}</div>
                  <div className={styles.statLabel}>PDFs Downloaded</div>
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

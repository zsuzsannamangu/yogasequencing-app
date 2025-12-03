'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, Calendar, MapPin, Building, User, Download, Eye, Clock, Layers, Tag, List } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import styles from '@/styles/Profile.module.scss';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  location?: string;
  bio?: string;
  business_name?: string;
  business_category?: string;
  profile_image?: string;
  created_at: string;
}

interface Sequence {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  duration: string;
  poseCount: number;
  category?: string;
  industryLabel?: string;
  privacy: 'private' | 'public';
}

interface ProfilePageProps {
  params: {
    userId: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const userResponse = await axios.get(`http://localhost:8000/auth/users/${resolvedParams.userId}`);
        setUser(userResponse.data);

        // Fetch user's public sequences
        const sequencesResponse = await axios.get(`http://localhost:8000/sequences/user/${resolvedParams.userId}/public`);
        setSequences(sequencesResponse.data);

      } catch (error: any) {
        console.error('Failed to fetch profile:', error);
        setError(error.response?.data?.detail || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [resolvedParams.userId]);

  if (loading) {
    return (
      <main className={styles.main}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading profile...</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className={styles.main}>
        <Navbar />
        <div className={styles.errorContainer}>
          <h1>Profile Not Found</h1>
          <p>{error || 'The requested profile could not be found.'}</p>
          <Link href="/browse" className={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Browse
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const userInitials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  const displayName = `${user.first_name} ${user.last_name.charAt(0)}.`;

  const handleDownloadPDF = async (sequence: any) => {
    try {
      // Track download
      await axios.post('http://localhost:8000/sequences/track-download', {
        sequence_id: sequence.id,
        download_source: 'profile'
      });

      // Create PDF (simplified version for profile page)
      const response = await axios.get(`http://localhost:8000/sequences/${sequence.id}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${sequence.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <main className={styles.main}>
      <Navbar />

      <section className={styles.profileSection}>
        <div className={styles.profileContainer}>

          {/* Back Button */}
          <Link href="/browse" className={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Browse
          </Link>

          {/* Profile Header */}
          <div className={styles.profileHeader}>
            <div className={styles.profileImageContainer}>
              {user.profile_image ? (
                <img
                  src={user.profile_image.startsWith('http') ? 
                    user.profile_image : 
                    `http://localhost:8000/${user.profile_image}`}
                  alt={`${user.first_name} ${user.last_name}`}
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profileImagePlaceholder}>
                  {userInitials}
                </div>
              )}
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.profileInfoHeader}>
                <div className={styles.profileInfoLeft}>
                  <h1 className={styles.profileName}>{displayName}</h1>
                  {user.business_name && (
                    <p className={styles.businessName}>{user.business_name}</p>
                  )}
                </div>
                <div className={styles.profileInfoRight}>
                  <button className={styles.messageButton}>
                    <User size={18} />
                    Send Message
                  </button>
                </div>
              </div>

              <div className={styles.profileMeta}>
                {user.location && (
                  <div className={styles.metaItem}>
                    <MapPin size={16} />
                    <span>{user.location}</span>
                  </div>
                )}

                {user.business_category && (
                  <div className={styles.metaItem}>
                    <Building size={16} />
                    <span>{user.business_category}</span>
                  </div>
                )}

                <div className={styles.metaItem}>
                  <Calendar size={16} />
                  <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}</span>
                </div>
              </div>
              {/* Sequences Count */}
              <div className={styles.metaItem}>
                <List size={16} />
                <span>{sequences.length} Sequences</span>
              </div>
              {/* Bio */}
              {user.bio && (
                <p className={styles.bio}>{user.bio}</p>
              )}
            </div>
          </div>



          {/* Sequences Section */}
          <div className={styles.sequencesSection}>
            <h2 className={styles.sectionTitle}>Sequences</h2>

            {sequences.length === 0 ? (
              <div className={styles.emptyState}>
                <User size={48} />
                <h3>No Sequences</h3>
                <p>This user hasn't shared any sequences yet.</p>
              </div>
            ) : (
              <div className={styles.sequencesGrid}>
                {sequences.map((sequence) => (
                  <div key={sequence.id} className={styles.sequenceCard}>
                    {/* Content */}
                    <div className={styles.content}>
                      {/* Title and Subtitle */}
                      <div className={styles.sequenceHeader}>
                        <h3 className={styles.sequenceName}>
                          <Link href={`/browse/${sequence.id}`} className={styles.sequenceLink}>
                            {sequence.name}
                          </Link>
                        </h3>
                        <p className={styles.sequenceSubtitle}>{sequence.description}</p>
                      </div>

                      {/* Metadata */}
                      <div className={styles.metadata}>
                        <div className={styles.metaItem}>
                          <Clock size={16} />
                          <span>{sequence.duration || 'N/A'}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <Layers size={16} />
                          <span>{sequence.poseCount} poses</span>
                        </div>
                        <div className={styles.metaItem}>
                          <Calendar size={16} />
                          <span>{new Date(sequence.createdAt).toLocaleDateString()}</span>
                        </div>
                        {sequence.industryLabel && (
                          <div className={styles.metaItem}>
                            <Tag size={16} />
                            <span>{sequence.industryLabel}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className={styles.actions}>
                        {sequence.category && (
                          <div className={styles.categoryBadge}>
                            <Tag size={14} />
                            <span>{sequence.category}</span>
                          </div>
                        )}
                        <button
                          className={styles.actionButton}
                          data-tooltip="Download PDF"
                          onClick={() => handleDownloadPDF(sequence)}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

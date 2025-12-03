'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Download, Calendar, Clock, Share2, Tag, Search, Filter, Layers } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import styles from '@/styles/Browse.module.scss';
import { svg2pdf } from 'svg2pdf.js';
import { apiUrl, silhouetteUrl, profileImageUrl } from '@/lib/api';
import Image from 'next/image';

interface UserInfo {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  business_name?: string;
}

interface Sequence {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  duration: string;
  poseCount: number;
  thumbnail?: string;
  industryLabel?: string; // Industry/professional field (Yoga, Pilates, etc.)
  category?: string; // User-defined custom category (Morning Flow, Beginner, etc.)
  privacy?: 'private' | 'public';
  user?: UserInfo;
}

interface ApiSequence {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  duration: string;
  poseCount: number;
  poses?: Array<{ filePath: string; poseName?: string }>;
  industryLabel?: string;
  category?: string;
  privacy?: 'private' | 'public';
  user?: UserInfo;
}

// Define the available industry labels based on the homepage professional categories
const AVAILABLE_INDUSTRY_LABELS = [
  'Yoga',
  'Yoga Therapy',
  'Pilates',
  'Physical Therapy',
  'Occupational Therapy',
  'Dance',
  'Fitness Training',
  'Martial Arts',
  'Sports Training'
];

export default function BrowsePage() {
  // All hooks must be called at the top level, before any conditional returns
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustryLabel, setSelectedIndustryLabel] = useState('all');
  const [sortBy, setSortBy] = useState('dateCreated');

  // Add DOMParser for PDF generation
  const DOMParser = typeof window !== 'undefined' ? window.DOMParser : null;

  // Fetch public sequences and categories from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching public sequences...');
        setLoading(true);
        setError(null);

        // Fetch only public sequences
        const sequencesResponse = await axios.get(apiUrl('sequences/public/'));
        console.log('Public sequences API response:', sequencesResponse.data);

        const transformedSequences = sequencesResponse.data.map((seq: ApiSequence) => ({
          id: seq.id,
          name: seq.name,
          description: seq.description,
          createdAt: seq.createdAt,
          duration: seq.duration,
          poseCount: seq.poseCount,
          thumbnail: seq.poses?.[0]?.filePath ? silhouetteUrl(seq.poses[0].filePath) : '/images/yoga2.jpg',
          industryLabel: seq.industryLabel || 'Yoga', // Default to Yoga if no industry label
          category: seq.category, // Include the category field
          privacy: seq.privacy || 'public',
          user: seq.user // Include the user information
        }));

        console.log('Transformed public sequences:', transformedSequences);
        setSequences(transformedSequences);

      } catch (error: unknown) {
        console.error('Failed to fetch public sequences:', error);
        const errorMessage = (error as { message?: string; code?: string })?.message || 'Failed to fetch data';
        const errorCode = (error as { code?: string })?.code;
        
        // Provide more helpful error messages
        if (errorCode === 'ERR_NETWORK' || errorMessage.includes('Network Error')) {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          setError(`Unable to connect to backend API at ${apiBaseUrl}. Please ensure the backend server is running.`);
        } else {
          setError(errorMessage);
        }
        setSequences([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownloadPDF = async (sequence: Sequence) => {
    try {
      // Get sequence data for PDF generation
      const response = await axios.get(apiUrl(`sequences/${sequence.id}`));
      const sequenceData = response.data;

      // Generate PDF using jsPDF
      const pdf = new (await import('jspdf')).default('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = 100;
      const spacingX = 5;
      const spacingY = 10;
      let x = spacingX;
      let y = spacingY;

      // Add sequence title and subtitle
      if (sequenceData.name || sequenceData.description) {
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(176, 51, 106);

        if (sequenceData.name) {
          const titleWidth = pdf.getTextWidth(sequenceData.name);
          const titleX = (pageWidth - titleWidth) / 2;
          pdf.text(sequenceData.name, titleX, y + 20);
          y += 35;
        }

        if (sequenceData.description) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100);
          const descWidth = pdf.getTextWidth(sequenceData.description);
          const descX = (pageWidth - descWidth) / 2;
          pdf.text(sequenceData.description, descX, y + 15);
          y += 30;
        }
      }

      // Add metadata
      if (sequenceData.duration || sequenceData.poseCount) {
        pdf.setFontSize(12);
        pdf.setTextColor(100);
        const metadataText = `${sequenceData.duration || 'N/A'} • ${sequenceData.poseCount || 0} poses`;
        const metadataWidth = pdf.getTextWidth(metadataText);
        const metadataX = (pageWidth - metadataWidth) / 2;
        pdf.text(metadataText, metadataX, y + 15);
        y += 25;
      }

      // Add poses
      if (sequenceData.poses && sequenceData.poses.length > 0) {
        y += 20;

        for (let i = 0; i < sequenceData.poses.length; i++) {
          const pose = sequenceData.poses[i];

          try {
            if (pose.filePath) {
              const filePath = silhouetteUrl(pose.filePath);
              const res = await fetch(filePath);
              const svgText = await res.text();
              const parser = new DOMParser!();
              const svgDoc = parser.parseFromString(svgText, 'image/svg+xml').documentElement;
              svgDoc.setAttribute('width', `${maxWidth}px`);
              svgDoc.setAttribute('height', `${maxWidth}px`);
              await svg2pdf(svgDoc, pdf, { x, y });

              if (pose.poseName) {
                pdf.setFontSize(10);
                const textWidth = pdf.getTextWidth(pose.poseName);
                const centerX = x + maxWidth / 2 - textWidth / 2;
                pdf.setFontSize(9);
                pdf.setTextColor(100);
                pdf.text(pose.poseName, centerX, y + maxWidth - 4);
              }
            } else {
              // Fallback to text if silhouette fails to load
              pdf.setFontSize(10);
              pdf.setTextColor(100);
              pdf.text(`${i + 1}. ${pose.poseName || `Pose ${i + 1}`}`, x, y + maxWidth / 2);
            }

            x += maxWidth + spacingX;
            if (x + maxWidth > pageWidth) {
              x = spacingX;
              y += maxWidth + spacingY;
              if (y + maxWidth > pageHeight) {
                pdf.addPage();
                y = spacingY;
              }
            }
          } catch (error) {
            console.error(`Failed to process pose ${i}:`, error);
            // Fallback to text if silhouette fails to load
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(`${i + 1}. ${pose.poseName || `Pose ${i + 1}`}`, x, y + maxWidth / 2);
            x += maxWidth + spacingX;
            if (x + maxWidth > pageWidth) {
              x = spacingX;
              y += maxWidth + spacingY;
              if (y + maxWidth > pageHeight) {
                pdf.addPage();
                y = spacingY;
              }
            }
          }
        }
      }

      // Save the PDF
      const filename = sequenceData.name
        ? `${sequenceData.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`
        : 'sequence.pdf';
      pdf.save(filename);

      // Track the download
      try {
        console.log('Tracking download for sequence:', sequence.id);
        const response = await axios.post(apiUrl('sequences/track-download'), null, {
          params: {
            sequence_id: sequence.id,
            download_source: 'browse'
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        console.log('Download tracking response:', response.data);
      } catch (trackingError) {
        console.error('Failed to track download:', trackingError);
        // Don't show error to user, download still succeeded
      }

    } catch (error: unknown) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleShare = async (sequence: Sequence) => {
    try {
      // Get sequence data for sharing
      const response = await axios.get(apiUrl(`sequences/${sequence.id}`));
      const sequenceData = response.data;

      // Generate PDF for sharing
      const pdf = new (await import('jspdf')).default('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = 100;
      const spacingX = 5;
      const spacingY = 10;
      let x = spacingX;
      let y = spacingY;

      // Add sequence title and subtitle
      if (sequenceData.name || sequenceData.description) {
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(176, 51, 106);

        if (sequenceData.name) {
          const titleWidth = pdf.getTextWidth(sequenceData.name);
          const titleX = (pageWidth - titleWidth) / 2;
          pdf.text(sequenceData.name, titleX, y + 20);
          y += 35;
        }

        if (sequenceData.description) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100);
          const descWidth = pdf.getTextWidth(sequenceData.description);
          const descX = (pageWidth - descWidth) / 2;
          pdf.text(sequenceData.description, descX, y + 15);
          y += 30;
        }
      }

      // Add metadata
      if (sequenceData.duration || sequenceData.poseCount) {
        pdf.setFontSize(12);
        pdf.setTextColor(100);
        const metadataText = `${sequenceData.duration || 'N/A'} • ${sequenceData.poseCount || 0} poses`;
        const metadataWidth = pdf.getTextWidth(metadataText);
        const metadataX = (pageWidth - metadataWidth) / 2;
        pdf.text(metadataText, metadataX, y + 15);
        y += 25;
      }

      // Add poses
      if (sequenceData.poses && sequenceData.poses.length > 0) {
        y += 20;

        for (let i = 0; i < sequenceData.poses.length; i++) {
          const pose = sequenceData.poses[i];

          try {
            if (pose.filePath) {
              const filePath = silhouetteUrl(pose.filePath);
              const res = await fetch(filePath);
              const svgText = await res.text();
              const parser = new DOMParser!();
              const svgDoc = parser.parseFromString(svgText, 'image/svg+xml').documentElement;
              svgDoc.setAttribute('width', `${maxWidth}px`);
              svgDoc.setAttribute('height', `${maxWidth}px`);
              await svg2pdf(svgDoc, pdf, { x, y });

              if (pose.poseName) {
                pdf.setFontSize(10);
                const textWidth = pdf.getTextWidth(pose.poseName);
                const centerX = x + maxWidth / 2 - textWidth / 2;
                pdf.setFontSize(9);
                pdf.setTextColor(100);
                pdf.text(pose.poseName, centerX, y + maxWidth - 4);
              }
            } else {
              // Fallback to text if silhouette fails to load
              pdf.setFontSize(10);
              pdf.setTextColor(100);
              pdf.text(`${i + 1}. ${pose.poseName || `Pose ${i + 1}`}`, x, y + maxWidth / 2);
            }

            x += maxWidth + spacingX;
            if (x + maxWidth > pageWidth) {
              x = spacingX;
              y += maxWidth + spacingY;
              if (y + maxWidth > pageHeight) {
                pdf.addPage();
                y = spacingY;
              }
            }
          } catch (error) {
            console.error(`Failed to process pose ${i}:`, error);
            // Fallback to text if silhouette fails to load
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(`${i + 1}. ${pose.poseName || `Pose ${i + 1}`}`, x, y + maxWidth / 2);
            x += maxWidth + spacingX;
            if (x + maxWidth > pageWidth) {
              x = spacingX;
              y += maxWidth + spacingY;
              if (y + maxWidth > pageHeight) {
                pdf.addPage();
                y = spacingY;
              }
            }
          }
        }
      }

      // Convert PDF to blob for sharing
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], `${sequenceData.name || 'sequence'}.pdf`, { type: 'application/pdf' });

      // Try to share the PDF file
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: sequenceData.name || 'Yoga Sequence',
          text: `Check out this ${sequenceData.name || 'yoga sequence'}: ${sequenceData.description || 'A beautiful movement flow'}`,
          files: [pdfFile]
        });
      } else {
        // Fallback: download the PDF and show success message
        const filename = sequenceData.name
          ? `${sequenceData.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`
          : 'sequence.pdf';
        pdf.save(filename);

        alert('PDF downloaded! You can now share it manually.');
      }
    } catch (error: unknown) {
      console.error('Failed to share sequence:', error);
      alert('Failed to share sequence. Please try again.');
    }
  };

  // Filter sequences based on search term and industry label
  const filteredSequences = sequences.filter(sequence => {
    const matchesSearch = sequence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sequence.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustryLabel = selectedIndustryLabel === 'all' || sequence.industryLabel === selectedIndustryLabel;
    return matchesSearch && matchesIndustryLabel;
  });

  // Sort sequences
  const sortedSequences = [...filteredSequences].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'dateCreated':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'duration':
        return (parseInt(a.duration) || 0) - (parseInt(b.duration) || 0);
      case 'poseCount':
        return a.poseCount - b.poseCount;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <main className={styles.main}>
        <Navbar />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingText}>Loading public sequences...</div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <Navbar />
        <div className={styles.errorContainer}>
          <div className={styles.errorText}>Error: {error}</div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Navbar />

      <section className={styles.browseSection}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>Browse Sequences</h1>
            <p className={styles.subtitle}>Find sequences shared by the community</p>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            {/* Search */}
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} size={20} />
              <input
                type="text"
                placeholder="Search sequences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Filters */}
            <div className={styles.filters}>
              {/* Label Filter */}
              <div className={styles.filterGroup}>
                <label htmlFor="industryLabel" className={styles.filterLabel}>
                  <Tag size={16} />
                  Industry
                </label>
                <select
                  id="industryLabel"
                  value={selectedIndustryLabel}
                  onChange={(e) => setSelectedIndustryLabel(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Industries</option>
                  {AVAILABLE_INDUSTRY_LABELS.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className={styles.filterGroup}>
                <label htmlFor="sort" className={styles.filterLabel}>
                  <Filter size={16} />
                  Sort By
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="dateCreated">Date Created</option>
                  <option value="name">A to Z</option>
                  <option value="duration">Duration</option>
                  <option value="poseCount">Number of Poses</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className={styles.resultsCount}>
            {sortedSequences.length} sequence{sortedSequences.length !== 1 ? 's' : ''} found
          </div>

          {/* Sequences Grid */}
          {sortedSequences.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyText}>
                {searchTerm || selectedIndustryLabel !== 'all'
                  ? 'No sequences match your search criteria. Try adjusting your filters.'
                  : 'No public sequences available yet. Check back soon!'}
              </div>
            </div>
          ) : (
            <div className={styles.sequencesGrid}>
              {sortedSequences.map((sequence) => (
                <div key={sequence.id} className={styles.sequenceCard}>

                  {/* Content */}
                  <div className={styles.content}>
                    {/* Header with title and user info */}
                    <div className={styles.sequenceHeader}>
                      <h3 className={styles.sequenceName}>
                        <Link href={`/browse/${sequence.id}`} className={styles.sequenceLink}>
                          {sequence.name}
                        </Link>
                      </h3>
                      
                      {/* User Information - Top Right */}
                      {sequence.user && (
                        <div className={styles.userInfoCompact}>
                          <Link href={`/profile/${sequence.user.id}`} className={styles.userLink}>
                          <span className={styles.uploadedByCompact}>by</span>
                            <div className={styles.userAvatar}>
                              {sequence.user.profile_image ? (
                                <Image 
                                  src={profileImageUrl(sequence.user.profile_image)} 
                                  alt={`${sequence.user.first_name} ${sequence.user.last_name}`}
                                  className={styles.avatarImage}
                                  width={40}
                                  height={40}
                                  unoptimized
                                />
                              ) : (
                                <div className={styles.avatarPlaceholder}>
                                  {sequence.user.first_name.charAt(0)}{sequence.user.last_name.charAt(0)}
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>
                    
                    <p className={styles.sequenceDescription}>{sequence.description}</p>

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
                        <Download size={18} />
                      </button>
                      <button
                        className={styles.actionButton}
                        data-tooltip="Share Sequence"
                        onClick={() => handleShare(sequence)}
                      >
                        <Share2 size={18} />
                      </button>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Download, Edit, Trash2, Calendar, Clock, Share2, Tag, Layers, Lock, Globe, FileText } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import styles from '@/styles/Sequences.module.scss';
import { svg2pdf } from 'svg2pdf.js';

interface Sequence {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  duration: string;
  poseCount: number;
  thumbnail?: string;
  category?: string;
  privacy?: 'private' | 'public';
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function SequencesPage() {
  // Add DOMParser for PDF generation
  const DOMParser = typeof window !== 'undefined' ? window.DOMParser : null;
  
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPrivacy, setSelectedPrivacy] = useState('all');
  const [sortBy, setSortBy] = useState('dateCreated');
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch sequences and categories from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching sequences and categories...');
        setLoading(true);
        setError(null);
        
        // Fetch sequences
        const sequencesResponse = await axios.get('http://localhost:8000/sequences/');
        console.log('Sequences API response:', sequencesResponse.data);
        
                        const transformedSequences = sequencesResponse.data.map((seq: any) => {
          console.log('Processing sequence:', seq.name, 'poses:', seq.poses);
          let thumbnail = '/images/yoga2.jpg'; // Default fallback
          
          if (seq.poses && seq.poses.length > 0 && seq.poses[0].filePath) {
            const filePath = seq.poses[0].filePath;
            console.log('First pose filePath:', filePath);
            
            // Check if it's already a complete URL
            if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
              thumbnail = filePath;
            } else {
              // Extract filename and construct URL
              const filename = filePath.split('/').pop();
              thumbnail = `http://localhost:8000/silhouettes/${filename}`;
            }
            console.log('Constructed thumbnail URL:', thumbnail);
          }
          
          return {
            id: seq.id,
            name: seq.name,
            description: seq.description,
            createdAt: seq.createdAt,
            duration: seq.duration,
            poseCount: seq.poseCount,
            thumbnail: thumbnail,
            category: seq.category,
            privacy: seq.privacy || 'private'
          };
        });
        
        console.log('Transformed sequences:', transformedSequences);
        setSequences(transformedSequences);

        // Fetch categories
        const categoriesResponse = await axios.get('http://localhost:8000/sequences/categories/');
        console.log('Categories API response:', categoriesResponse.data);
        setCategories(categoriesResponse.data);
        
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        setError(error.message || 'Failed to fetch data');
        setSequences([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#b8336a',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await axios.delete(`http://localhost:8000/sequences/${id}`);
        setSequences(sequences.filter(seq => seq.id !== id));
        
        Swal.fire(
          'Deleted!',
          'Your sequence has been deleted.',
          'success'
        );
      }
    } catch (error: any) {
      console.error('Failed to delete sequence:', error);
      Swal.fire(
        'Error!',
        'Failed to delete sequence. Please try again.',
        'error'
      );
    }
  };

  const handleDownloadPDF = async (sequence: Sequence) => {
    try {
      // Get sequence data for PDF generation
      const response = await axios.get(`http://localhost:8000/sequences/${sequence.id}`);
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
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          const subtitleWidth = pdf.getTextWidth(sequenceData.description);
          const subtitleX = (pageWidth - subtitleWidth) / 2;
          pdf.text(sequenceData.description, subtitleX, y + 15);
          y += 25;
        }
        
        // Add metadata and date on same line
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        const creationDate = new Date(sequenceData.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const metadataText = `${sequenceData.duration} • ${sequenceData.poseCount} poses • ${creationDate}`;
        const metadataWidth = pdf.getTextWidth(metadataText);
        const metadataX = (pageWidth - metadataWidth) / 2;
        pdf.text(metadataText, metadataX, y + 15);
        y += 20;
        
        // Reset y position for poses with more space
        y = 120;
      }

      // Add poses with silhouettes
      for (let i = 0; i < sequenceData.poses.length; i++) {
        const pose = sequenceData.poses[i];
        const filePath = `http://localhost:8000/silhouettes/${pose.filePath}`;
        
        try {
          if (!DOMParser) {
            throw new Error('DOMParser not available');
          }
          const res = await fetch(`http://localhost:8000/${filePath}`);
          const svgText = await res.text();
          const parser = new DOMParser();
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
          console.error(`Failed to load silhouette for pose ${i + 1}:`, error);
          // Fallback to text if silhouette fails to load
          pdf.setFontSize(10);
          pdf.setTextColor(100);
          pdf.text(`${i + 1}. ${pose.poseName || `Pose ${i + 1}`}`, x, y + maxWidth/2);
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

      // Generate filename
      const filename = sequenceData.name 
        ? `${sequenceData.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`
        : 'sequence.pdf';
      
      pdf.save(filename);
      
      // Track the download
      try {
        await axios.post('http://localhost:8000/sequences/track-download', null, {
          params: {
            sequence_id: sequence.id,
            download_source: 'sequences'
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
      } catch (trackingError) {
        console.warn('Failed to track download:', trackingError);
        // Don't show error to user, download still succeeded
      }
      
      Swal.fire({
        title: 'Download Started!',
        text: 'PDF download has started successfully',
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate PDF. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    }
  };

  // Sort sequences based on selected sort option
  const sortSequences = (sequencesToSort: Sequence[]) => {
    const sorted = [...sequencesToSort];
    
    switch (sortBy) {
      case 'dateCreated':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'alphabetical':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'duration':
        return sorted.sort((a, b) => {
          const aMinutes = parseInt(a.duration) || 0;
          const bMinutes = parseInt(b.duration) || 0;
          return aMinutes - bMinutes;
        });
      case 'poseCount':
        return sorted.sort((a, b) => a.poseCount - b.poseCount);
      default:
        return sorted;
    }
  };

  // Filter and sort sequences
  const filteredAndSortedSequences = sortSequences(
    sequences.filter(sequence => {
      const matchesSearch = sequence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sequence.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || sequence.category === selectedCategory;
      const matchesPrivacy = selectedPrivacy === 'all' || sequence.privacy === selectedPrivacy;
      return matchesSearch && matchesCategory && matchesPrivacy;
    })
  );

  // Loading state
  if (loading) {
    return (
      <main className={styles.main}>
        <Navbar />
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>⏳</div>
          <h3>Loading sequences...</h3>
          <p>Please wait while we fetch your sequences</p>
        </div>
        <Footer />
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className={styles.main}>
        <Navbar />
        <div className={styles.errorState}>
          <h3>Error loading sequences</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />
      
      <section className={styles.sequencesSection}>
        <div className={styles.sequencesContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Your Sequences</h1>
            <p className={styles.subtitle}>Manage and organize your movement sequences</p>
          </div>

          <div className={styles.controls}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search sequences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.filterContainer}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterContainer}>
              <select
                value={selectedPrivacy}
                onChange={(e) => setSelectedPrivacy(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Privacy</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className={styles.sortContainer}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="dateCreated">Date Created</option>
                <option value="alphabetical">A to Z</option>
                <option value="duration">Duration</option>
                <option value="poseCount">Pose Count</option>
              </select>
            </div>

            <Link href="/upload" className={styles.createButton}>
              Create New Sequence
            </Link>
          </div>

          {filteredAndSortedSequences.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <FileText size={64} />
              </div>
              <h3>No sequences found</h3>
              <p>Create your first sequence by uploading a video</p>
              <Link href="/upload" className={styles.emptyButton}>
                Upload Video
              </Link>
            </div>
          ) : (
            <div className={styles.sequencesGrid}>
              {filteredAndSortedSequences.map((sequence) => (
                <div 
                  key={sequence.id} 
                  className={styles.sequenceCard}
                >
                  <div className={styles.sequenceInfo}>
                    <h3 className={styles.sequenceName}>
                      <Link href={`/sequences/${sequence.id}`} className={styles.sequenceLink}>
                        {sequence.name}
                      </Link>
                      <span className={styles.privacyIndicator}>
                        {sequence.privacy === 'public' ? <Globe size={16} /> : <Lock size={16} />}
                      </span>
                    </h3>
                    <p className={styles.sequenceDescription}>
                      {sequence.description.length > 100 
                        ? `${sequence.description.substring(0, 100)}...` 
                        : sequence.description
                      }
                    </p>
                    
                    <div className={styles.sequenceCategory}>
                      {sequence.category ? (
                        <>
                          <Tag size={14} />
                          <span>{sequence.category}</span>
                        </>
                      ) : (
                        <span className={styles.noCategory}>No category</span>
                      )}
                    </div>
                    
                    <div className={styles.sequenceMeta}>
                      <div className={styles.metaItem}>
                        <Clock size={16} />
                        <span>{sequence.duration}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Layers size={16} />
                        <span>{sequence.poseCount} poses</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span>Created: {new Date(sequence.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className={styles.sequenceActions}>
                                                    <button 
                                className={styles.actionButton} 
                                data-tooltip="Share Sequence PDF"
                                onClick={async () => {
                                  try {
                                    // Generate PDF first
                                    const response = await axios.get(`http://localhost:8000/sequences/${sequence.id}`);
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
                                        pdf.setFontSize(12);
                                        pdf.setFont('helvetica', 'normal');
                                        pdf.setTextColor(100, 100, 100);
                                        const subtitleWidth = pdf.getTextWidth(sequenceData.description);
                                        const subtitleX = (pageWidth - subtitleWidth) / 2;
                                        pdf.text(sequenceData.description, subtitleX, y + 15);
                                        y += 25;
                                      }
                                      
                                      // Add metadata and date on same line
                                      pdf.setFontSize(10);
                                      pdf.setTextColor(80, 80, 80);
                                      const creationDate = new Date(sequenceData.createdAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      });
                                      const metadataText = `${sequenceData.duration} • ${sequenceData.poseCount} poses • ${creationDate}`;
                                      const metadataWidth = pdf.getTextWidth(metadataText);
                                      const metadataX = (pageWidth - metadataWidth) / 2;
                                      pdf.text(metadataText, metadataX, y + 15);
                                      y += 20;
                                      
                                      // Reset y position for poses with more space
                                      y = 120;
                                    }

                                    // Add poses with silhouettes
                                    for (let i = 0; i < sequenceData.poses.length; i++) {
                                      const pose = sequenceData.poses[i];
                                      const filePath = `http://localhost:8000/silhouettes/${pose.filePath}`;
                                      
                                      try {
                                        if (!DOMParser) {
                                          throw new Error('DOMParser not available');
                                        }
                                        const res = await fetch(`http://localhost:8000/${filePath}`);
                                        const svgText = await res.text();
                                        const parser = new DOMParser();
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
                                        console.error(`Failed to load silhouette for pose ${i + 1}:`, error);
                                        // Fallback to text if silhouette fails to load
                                        pdf.setFontSize(10);
                                        pdf.setTextColor(100);
                                        pdf.text(`${i + 1}. ${pose.poseName || `Pose ${i + 1}`}`, x, y + maxWidth/2);
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

                                    // Convert PDF to blob for sharing
                                    const pdfBlob = pdf.output('blob');
                                    const pdfFile = new File([pdfBlob], `${sequenceData.name || 'sequence'}.pdf`, { type: 'application/pdf' });

                                    // Try to share the PDF file
                                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                                      await navigator.share({
                                        title: sequenceData.name || 'Yoga Sequence',
                                        text: `Hey, someone wants to share a sequence with you! Check out this ${sequenceData.name || 'yoga sequence'}: ${sequenceData.description || 'A beautiful movement flow'}`,
                                        files: [pdfFile]
                                      });
                                    } else {
                                      // Fallback: download the PDF and show success message
                                      const filename = sequenceData.name 
                                        ? `${sequenceData.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`
                                        : 'sequence.pdf';
                                      pdf.save(filename);
                                      
                                      Swal.fire({
                                        title: 'PDF Downloaded!',
                                        text: 'Hey, someone wants to share a sequence with you! The PDF has been downloaded so you can share it manually.',
                                        icon: 'success',
                                        confirmButtonColor: '#b8336a',
                                        confirmButtonText: 'OK',
                                      });
                                    }
                                  } catch (error) {
                                    console.error('Failed to share sequence:', error);
                                    Swal.fire({
                                      title: 'Error!',
                                      text: 'Failed to generate PDF for sharing. Please try again.',
                                      icon: 'error',
                                      confirmButtonColor: '#b8336a',
                                      confirmButtonText: 'OK',
                                    });
                                  }
                                }}
                              >
                                <Share2 size={18} />
                              </button>
                      <button 
                        className={styles.actionButton} 
                        data-tooltip="Download PDF"
                        onClick={() => handleDownloadPDF(sequence)}
                      >
                        <Download size={18} />
                      </button>
                      <Link 
                        href={`/sequences/${sequence.id}`}
                        className={styles.actionButton} 
                        data-tooltip="Edit Sequence"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        id="deleteSeq"
                        className={styles.actionButton} 
                        data-tooltip="Delete Sequence"
                        onClick={() => handleDelete(sequence.id)}
                      >
                        <Trash2 size={18} />
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

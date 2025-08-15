'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Download, Edit, Trash2, Calendar, Clock, Share2, Tag } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import styles from '@/styles/Sequences.module.scss';

interface Sequence {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  duration: string;
  poseCount: number;
  thumbnail?: string;
  category?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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
        
        const transformedSequences = sequencesResponse.data.map((seq: any) => ({
          id: seq.id,
          name: seq.name,
          description: seq.description,
          createdAt: seq.createdAt,
          duration: seq.duration,
          poseCount: seq.poseCount,
          thumbnail: seq.poses?.[0]?.filePath || '/images/yoga2.jpg',
          category: seq.category
        }));
        
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
      let y = 50;

      // Add sequence title and subtitle
      if (sequenceData.name || sequenceData.description) {
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(176, 51, 106);
        
        if (sequenceData.name) {
          const titleWidth = pdf.getTextWidth(sequenceData.name);
          const titleX = (pageWidth - titleWidth) / 2;
          pdf.text(sequenceData.name, titleX, y + 30);
          y += 50;
        }
        
        if (sequenceData.description) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          const subtitleWidth = pdf.getTextWidth(sequenceData.description);
          const subtitleX = (pageWidth - subtitleWidth) / 2;
          pdf.text(sequenceData.description, subtitleX, y + 20);
          y += 40;
        }
        
        // Add metadata
        pdf.setFontSize(12);
        pdf.setTextColor(80, 80, 80);
        const metadataText = `${sequenceData.duration} • ${sequenceData.poseCount} poses`;
        const metadataWidth = pdf.getTextWidth(metadataText);
        const metadataX = (pageWidth - metadataWidth) / 2;
        pdf.text(metadataText, metadataX, y + 20);
        y += 30;
        
        // Add creation date
        const creationDate = new Date(sequenceData.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const dateText = `Created on ${creationDate}`;
        const dateWidth = pdf.getTextWidth(dateText);
        const dateX = (pageWidth - dateWidth) / 2;
        pdf.setTextColor(120, 120, 120);
        pdf.text(dateText, dateX, y + 20);
        y += 40;
        
        y = 140;
      }

      // Add poses
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80);
      let poseY = y;
      
      sequenceData.poses.forEach((pose: any, index: number) => {
        const poseText = `${index + 1}. ${pose.poseName}`;
        pdf.text(poseText, 50, poseY);
        poseY += 20;
        
        if (poseY > pageHeight - 50) {
          pdf.addPage();
          poseY = 50;
        }
      });

      // Generate filename
      const filename = sequenceData.name 
        ? `${sequenceData.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`
        : 'sequence.pdf';
      
      pdf.save(filename);
      
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
      return matchesSearch && matchesCategory;
    })
  );

  // Loading state
  if (loading) {
    return (
      <main className={styles.main}>
        <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />
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
        <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />
        <div className={styles.errorState}>
          <h3>Error loading sequences</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
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
              <div className={styles.emptyIcon}>📚</div>
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
                    <h3 className={styles.sequenceName}>{sequence.name}</h3>
                    <p className={styles.sequenceDescription}>{sequence.description}</p>
                    
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
                        <Calendar size={16} />
                        <span>{sequence.poseCount} poses</span>
                      </div>
                      <div className={styles.metaItem}>
                        <span>Created: {new Date(sequence.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className={styles.sequenceActions}>
                      <button 
                        className={styles.actionButton} 
                        data-tooltip="Share Sequence"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: sequence.name,
                              text: sequence.description,
                              url: `${window.location.origin}/sequences`
                            });
                          } else {
                            // Fallback for browsers that don't support Web Share API
                            navigator.clipboard.writeText(`${window.location.origin}/sequences`);
                            Swal.fire({
                              title: 'Link Copied!',
                              text: 'Sequence link has been copied to clipboard',
                              icon: 'success',
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
                      <button 
                        className={styles.actionButton} 
                        data-tooltip="Edit Sequence"
                        onClick={() => {
                          Swal.fire({
                            title: 'Edit Feature',
                            text: 'Edit functionality will be implemented soon. For now, you can recreate the sequence from the upload page.',
                            icon: 'info',
                            confirmButtonColor: '#b8336a',
                            confirmButtonText: 'OK',
                          });
                        }}
                      >
                        <Edit size={18} />
                      </button>
                      <button 
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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Edit, Trash2, Eye, Calendar, Clock, Share2 } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import styles from '@/styles/Sequences.module.scss';

// Mock data - in real app this would come from API
const mockSequences = [
  {
    id: 1,
    name: 'Morning Flow',
    description: 'Gentle morning yoga sequence to start your day',
    createdAt: '2024-01-15',
    duration: '15 min',
    poseCount: 8,
    thumbnail: '/images/yoga2.jpg'
  },
  {
    id: 2,
    name: 'Power Vinyasa',
    description: 'Dynamic flow for strength and flexibility',
    createdAt: '2024-01-10',
    duration: '45 min',
    poseCount: 12,
    thumbnail: '/images/yoga5.jpg'
  },
  {
    id: 3,
    name: 'Restorative Evening',
    description: 'Calming poses for relaxation and recovery',
    createdAt: '2024-01-05',
    duration: '20 min',
    poseCount: 6,
    thumbnail: '/images/yoga-side.jpg'
  }
];

export default function SequencesPage() {
  const [sequences, setSequences] = useState(mockSequences);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this sequence?')) {
      setSequences(sequences.filter(seq => seq.id !== id));
    }
  };

  const filteredSequences = sequences.filter(sequence =>
    sequence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sequence.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <option value="yoga">Yoga</option>
                <option value="pilates">Pilates</option>
                <option value="dance">Dance</option>
                <option value="fitness">Fitness</option>
                <option value="add">Add New Category</option>
              </select>
            </div>

            <Link href="/upload" className={styles.createButton}>
              Create New Sequence
            </Link>
          </div>

          {filteredSequences.length === 0 ? (
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
              {filteredSequences.map((sequence) => (
                <div 
                  key={sequence.id} 
                  className={styles.sequenceCard}
                  onClick={() => window.location.href = `/sequences/${sequence.id}`}
                >
                  <div className={styles.sequenceInfo}>
                    <h3 className={styles.sequenceName}>{sequence.name}</h3>
                    <p className={styles.sequenceDescription}>{sequence.description}</p>
                    
                    <div className={styles.sequenceMeta}>
                      <div className={styles.metaItem}>
                        <Clock size={16} />
                        <span>{sequence.duration}</span>
                      </div>
                      <div className={styles.metaItem}>
                        <Calendar size={16} />
                        <span>{sequence.poseCount} poses</span>
                      </div>
                    </div>
                    
                    <div className={styles.sequenceActions}>
                      <button 
                        className={styles.actionButton} 
                        data-tooltip="Share Sequence"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle share logic
                          if (navigator.share) {
                            navigator.share({
                              title: sequence.name,
                              text: sequence.description,
                              url: `${window.location.origin}/sequences/${sequence.id}`
                            });
                          } else {
                            // Fallback for browsers that don't support Web Share API
                            navigator.clipboard.writeText(`${window.location.origin}/sequences/${sequence.id}`);
                            alert('Link copied to clipboard!');
                          }
                        }}
                      >
                        <Share2 size={18} />
                      </button>
                      <button 
                        className={styles.actionButton} 
                        data-tooltip="Download PDF"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle download logic
                        }}
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        className={styles.actionButton} 
                        data-tooltip="Edit Sequence"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle edit logic
                        }}
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className={styles.actionButton} 
                        data-tooltip="Delete Sequence"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(sequence.id);
                        }}
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

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Edit, Trash2, Clock, Calendar, Share2 } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import styles from '@/styles/SequenceDetail.module.scss';

// Mock data - in real app this would come from API
const mockSequences = [
  {
    id: 1,
    name: 'Morning Flow',
    description: 'Gentle morning yoga sequence to start your day',
    createdAt: '2024-01-15',
    duration: '15 min',
    poseCount: 8,
    poses: [
      { id: 1, name: 'Child\'s Pose', duration: '2 min', image: '/poses/pose1.svg' },
      { id: 2, name: 'Cat-Cow Stretch', duration: '3 min', image: '/poses/pose2.svg' },
      { id: 3, name: 'Downward Dog', duration: '2 min', image: '/poses/pose3.svg' },
      { id: 4, name: 'Warrior I', duration: '2 min', image: '/poses/pose4.svg' },
      { id: 5, name: 'Warrior II', duration: '2 min', image: '/poses/pose5.svg' },
      { id: 6, name: 'Tree Pose', duration: '2 min', image: '/poses/pose6.svg' },
      { id: 7, name: 'Corpse Pose', duration: '1 min', image: '/poses/pose7.svg' },
      { id: 8, name: 'Final Relaxation', duration: '1 min', image: '/poses/pose8.svg' }
    ]
  },
  {
    id: 2,
    name: 'Power Vinyasa',
    description: 'Dynamic flow for strength and flexibility',
    createdAt: '2024-01-10',
    duration: '45 min',
    poseCount: 12,
    poses: [
      { id: 1, name: 'Sun Salutation A', duration: '5 min', image: '/poses/pose1.svg' },
      { id: 2, name: 'Sun Salutation B', duration: '5 min', image: '/poses/pose2.svg' },
      { id: 3, name: 'Standing Split', duration: '3 min', image: '/poses/pose3.svg' },
      { id: 4, name: 'Crow Pose', duration: '3 min', image: '/poses/pose4.svg' },
      { id: 5, name: 'Headstand', duration: '5 min', image: '/poses/pose5.svg' },
      { id: 6, name: 'Wheel Pose', duration: '3 min', image: '/poses/pose6.svg' },
      { id: 7, name: 'Pigeon Pose', duration: '3 min', image: '/poses/pose7.svg' },
      { id: 8, name: 'Bridge Pose', duration: '3 min', image: '/poses/pose8.svg' },
      { id: 9, name: 'Fish Pose', duration: '2 min', image: '/poses/pose9.svg' },
      { id: 10, name: 'Seated Forward Bend', duration: '3 min', image: '/poses/pose10.svg' },
      { id: 11, name: 'Twisted Chair', duration: '3 min', image: '/poses/pose11.svg' },
      { id: 12, name: 'Savasana', duration: '5 min', image: '/poses/pose12.svg' }
    ]
  },
  {
    id: 3,
    name: 'Restorative Evening',
    description: 'Calming poses for relaxation and recovery',
    createdAt: '2024-01-05',
    duration: '20 min',
    poseCount: 6,
    poses: [
      { id: 1, name: 'Legs Up the Wall', duration: '5 min', image: '/poses/pose1.svg' },
      { id: 2, name: 'Reclined Bound Angle', duration: '5 min', image: '/poses/pose2.svg' },
      { id: 3, name: 'Happy Baby Pose', duration: '3 min', image: '/poses/pose3.svg' },
      { id: 4, name: 'Reclined Twist', duration: '3 min', image: '/poses/pose4.svg' },
      { id: 5, name: 'Corpse Pose', duration: '3 min', image: '/poses/pose5.svg' },
      { id: 6, name: 'Meditation', duration: '1 min', image: '/poses/pose6.svg' }
    ]
  }
];

export default function SequenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [sequence, setSequence] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const foundSequence = mockSequences.find(seq => seq.id === parseInt(params.id as string));
      setSequence(foundSequence);
      setLoading(false);
    }, 500);
  }, [params.id]);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this sequence?')) {
      // Handle delete logic here
      router.push('/sequences');
    }
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />
        <div className={styles.loading}>Loading sequence...</div>
        <Footer />
      </main>
    );
  }

  if (!sequence) {
    return (
      <main className={styles.main}>
        <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />
        <div className={styles.error}>Sequence not found</div>
        <Footer />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />
      
      <section className={styles.sequenceDetailSection}>
        <div className={styles.sequenceDetailContainer}>
          <div className={styles.header}>
            <button 
              onClick={() => router.back()} 
              className={styles.backButton}
            >
              <ArrowLeft size={20} />
              <span>Back to Sequences</span>
            </button>
            
            <div className={styles.sequenceHeader}>
              <h1 className={styles.title}>{sequence.name}</h1>
              <p className={styles.description}>{sequence.description}</p>
              
              <div className={styles.sequenceMeta}>
                <div className={styles.metaItem}>
                  <Clock size={20} />
                  <span>{sequence.duration}</span>
                </div>
                <div className={styles.metaItem}>
                  <Calendar size={20} />
                  <span>{sequence.poseCount} poses</span>
                </div>
                <div className={styles.metaItem}>
                  <span>Created: {sequence.createdAt}</span>
                </div>
              </div>
            </div>

            <div className={styles.sequenceActions}>
              <button 
                className={styles.actionButton}
                onClick={() => {
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
                <span>Share</span>
              </button>
              <button className={styles.actionButton}>
                <Download size={18} />
                <span>Download PDF</span>
              </button>
              <button className={styles.actionButton}>
                <Edit size={18} />
                <span>Edit Sequence</span>
              </button>
              <button 
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={handleDelete}
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className={styles.posesSection}>
            <h2 className={styles.sectionTitle}>Sequence Poses</h2>
            <div className={styles.posesGrid}>
              {sequence.poses.map((pose: any, index: number) => (
                <div key={pose.id} className={styles.poseCard}>
                  <div className={styles.poseNumber}>{index + 1}</div>
                  <div className={styles.poseInfo}>
                    <h3 className={styles.poseName}>{pose.name}</h3>
                    <p className={styles.poseDuration}>{pose.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

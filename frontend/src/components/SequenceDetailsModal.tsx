'use client';

import React, { useState } from 'react';
import { X, FileText, Lock, Globe } from 'lucide-react';
import styles from '@/styles/UploadModal.module.scss';

interface SequenceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (details: {
    title: string;
    description: string;
    duration: string;
    privacy: 'private' | 'public';
  }) => void;
  initialData?: {
    title: string;
    description: string;
    duration: string;
    privacy: 'private' | 'public';
  };
}

export default function SequenceDetailsModal({
  isOpen,
  onClose,
  onNext,
  initialData
}: SequenceDetailsModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [duration, setDuration] = useState(initialData?.duration || '');
  const [privacy, setPrivacy] = useState<'private' | 'public'>(initialData?.privacy || 'private');

  const handleNext = () => {
    if (!title.trim()) {
      alert('Please enter a sequence title');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a sequence description');
      return;
    }
    if (!duration.trim()) {
      alert('Please enter a sequence duration');
      return;
    }
    onNext({ title, description, duration, privacy });
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={`btn-tertiary btn-sm ${styles.closeButton}`} onClick={handleClose}>
          <X size={24} />
        </button>

        <div className={styles.content}>
          <div className={styles.step}>
            <div className={styles.icon}>
              <FileText size={48} />
            </div>
            
            <h2 className={styles.title}>Sequence Details</h2>
            <p className={styles.description}>
              Add a title, description, and duration for your yoga sequence
            </p>

            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label htmlFor="title">
                  Sequence Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter sequence title"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your sequence"
                  className={styles.textarea}
                  rows={3}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="duration">
                  Duration *
                </label>
                <input
                  id="duration"
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 15 min, 30 min"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Privacy</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="privacy"
                      value="private"
                      checked={privacy === 'private'}
                      onChange={(e) => setPrivacy(e.target.value as 'private' | 'public')}
                    />
                    <span className={styles.radioLabel}>
                      <Lock size={16} />
                      Private
                    </span>
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={privacy === 'public'}
                      onChange={(e) => setPrivacy(e.target.value as 'private' | 'public')}
                    />
                    <span className={styles.radioLabel}>
                      <Globe size={16} />
                      Public
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="btn-group">
              <button
                onClick={handleClose}
                className="btn-tertiary"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                className="btn-primary"
                disabled={!title.trim() || !description.trim() || !duration.trim()}
              >
                Next: Categories
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

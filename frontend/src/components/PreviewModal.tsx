'use client';

import React from 'react';
import { X, CheckCircle, Clock, Eye, EyeOff, Tag, FileText } from 'lucide-react';
import styles from '@/styles/UploadModal.module.scss';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sequenceData: {
    title: string;
    description: string;
    duration: string;
    privacy: 'private' | 'public';
    categoryName?: string;
    industryLabel: string;
    poseCount: number;
  };
}

export default function PreviewModal({
  isOpen,
  onClose,
  onConfirm,
  sequenceData
}: PreviewModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={handleClose}>
          <X size={24} />
        </button>

        <div className={styles.content}>
          <div className={styles.step}>
            <div className={styles.icon}>
              <CheckCircle size={48} />
            </div>
            
            <h2 className={styles.title}>Preview & Confirm</h2>
            <p className={styles.description}>
              Please review all details before proceeding to the pose editor
            </p>

            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <h4 className={styles.previewTitle}>{sequenceData.title}</h4>
                <div className={styles.previewMeta}>
                  <span className={styles.metaItem}>
                    <Clock size={16} />
                    {sequenceData.duration || 'No duration set'}
                  </span>
                  <span className={styles.metaItem}>
                    {sequenceData.privacy === 'private' ? <EyeOff size={16} /> : <Eye size={16} />}
                    {sequenceData.privacy === 'private' ? 'Private' : 'Public'}
                  </span>
                  <span className={styles.metaItem}>
                    <FileText size={16} />
                    {sequenceData.poseCount} poses
                  </span>
                </div>
              </div>

              {sequenceData.description && (
                <p className={styles.previewDescription}>{sequenceData.description}</p>
              )}

              <div className={styles.previewDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Category:</span>
                  <span className={styles.detailValue}>
                    {sequenceData.categoryName || 'No category'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Industry Label:</span>
                  <span className={styles.detailValue}>
                    <Tag size={14} />
                    {sequenceData.industryLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button
                onClick={handleClose}
                className={styles.cancelButton}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className={styles.primaryButton}
              >
                Continue to Pose Editor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

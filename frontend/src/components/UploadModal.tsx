'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileVideo, Play, Settings } from 'lucide-react';
import LongVideoProcessor from './LongVideoProcessor';
import styles from '@/styles/UploadModal.module.scss';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  onUpload: (file: File) => Promise<void>;
  onStartProcessing: () => void;
  onComplete: (result: ProcessingResult | undefined) => void;
  onError: (error: string) => void;
  selectedFile: File | null;
  uploading: boolean;
  uploadComplete: boolean;
  processing: boolean;
  filename: string;
  silhouettes: string[];
}

export default function UploadModal({
  isOpen,
  onClose,
  onFileSelect,
  onUpload,
  onStartProcessing,
  onComplete,
  onError,
  selectedFile,
  uploading,
  uploadComplete,
  processing,
  filename,
  silhouettes
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'select' | 'upload' | 'uploaded' | 'process' | 'processing' | 'complete'>('select');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      setStep('upload');
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        await onUpload(selectedFile);
        // Don't change step here - let the uploadComplete state trigger the step change
      } catch (error) {
        console.error('Upload failed:', error);
        // Stay on upload step if there's an error
      }
    }
  };

  const handleStartProcessing = () => {
    onStartProcessing();
    setStep('processing');
  };

  const handleClose = () => {
    setStep('select');
    onClose();
  };

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select');
    }
  }, [isOpen]);

  // Monitor upload completion
  useEffect(() => {
    if (uploadComplete && step === 'upload') {
      setStep('uploaded');
    }
  }, [uploadComplete, step]);

  // Monitor processing completion
  useEffect(() => {
    if (silhouettes.length > 0) {
      setStep('complete');
    }
  }, [silhouettes.length]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={`btn-tertiary btn-sm ${styles.closeButton}`} onClick={handleClose}>
          <X size={24} />
        </button>

        <div className={styles.content}>
          {step === 'select' && (
            <div className={styles.step}>
              <div className={styles.icon}>
                <FileVideo size={48} />
              </div>
              <h2 className={styles.title}>Choose Your Video</h2>
              <p className={styles.description}>Select a video file to create your movement sequence</p>
              
              <label className={styles.fileLabel}>
                Choose File
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-m4v,video/webm,video/ogg"
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                />
              </label>
              
              {selectedFile && (
              <div className={styles.fileInfo}>
                <p className={styles.fileInfoText}><strong>Selected:</strong> {selectedFile.name}</p>
                <p className={styles.fileInfoText}><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              )}
            </div>
          )}

          {step === 'upload' && selectedFile && (
            <div className={styles.step}>
              <div className={styles.icon}>
                <Upload size={48} />
              </div>
              <h2 className={styles.title}>Upload Video</h2>
              <p className={styles.description}>Ready to upload your video for processing</p>
              
              <div className={styles.fileInfo}>
                <p className={styles.fileInfoText}><strong>File:</strong> {selectedFile.name}</p>
                <p className={styles.fileInfoText}><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              
              <div className="btn-group center">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn-primary"
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
                <button
                  onClick={() => setStep('select')}
                  disabled={uploading}
                  className="btn-tertiary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 'uploaded' && uploadComplete && !processing && (
            <div className={styles.step}>
              <div className={styles.icon}>
                <Play size={48} />
              </div>
              <h2 className={styles.title}>Uploaded</h2>
              <p className={styles.description}>Your video has been uploaded successfully, ready to extract poses?</p>
              
              <div className={styles.fileInfo}>
                <p className={styles.fileInfoText}><strong>File:</strong> {selectedFile?.name}</p>
                <p className={styles.fileInfoText}><strong>Status:</strong> Upload Complete ✓</p>
              </div>
              
              <div className="btn-group center">
                <button
                  onClick={handleStartProcessing}
                  disabled={processing}
                  className="btn-primary"
                >
                  {processing ? 'Starting...' : 'Next'}
                </button>
                <button
                  onClick={() => setStep('select')}
                  className="btn-tertiary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 'process' && !processing && (
            <div className={styles.step}>
              <div className={styles.icon}>
                <Settings size={48} />
              </div>
              <h2 className={styles.title}>Process your video</h2>
              <p className={styles.description}>Extract silhouettes from your video, this may take 10-30 minutes.</p>
              
              <div className={styles.fileInfo}>
                <p className={styles.fileInfoText}><strong>File:</strong> {selectedFile?.name}</p>
                <p className={styles.fileInfoText}><strong>Status:</strong> Ready to process</p>
              </div>
              
              <div className="btn-group center">
                <button
                  onClick={() => setStep('select')}
                  className="btn-tertiary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartProcessing}
                  className="btn-primary"
                >
                  Start Processing
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && processing && (
            <div className={styles.step}>
              <div className={styles.icon}>
                <Settings size={48} />
              </div>
              <h2 className={styles.title}>Process Your Video</h2>
              <p className={styles.description}>Extract poses from your video. This may take 10-30 minutes for longer videos. The progress bar will show real-time updates. Please don&apos;t close the browser or refresh the page.</p>
              
              <div className={styles.fileInfo}>
                <p className={styles.fileInfoText}><strong>File:</strong> {selectedFile?.name}</p>
                <p className={styles.fileInfoText}><strong>Status:</strong> Ready to process</p>
              </div>
              
              <div className={styles.processorContainer}>
                <LongVideoProcessor
                  filename={filename}
                  onComplete={(result) => {
                    console.log('Video processing completed:', result);
                    if (result?.silhouette_files) {
                      onComplete(result);
                    }
                  }}
                  onError={(error) => {
                    console.error('Video processing error:', error);
                    onError(error);
                  }}
                />
              </div>
            </div>
          )}

          {step === 'complete' && silhouettes.length > 0 && (
            <div className={styles.step}>
              <div className={styles.icon}>
                <FileVideo size={48} />
              </div>
              <h2 className={styles.title}>Processing Complete!</h2>
              <p className={styles.description}>Your video has been processed successfully. {silhouettes.length} silhouettes were extracted.</p>
              
              <div className={styles.resultsInfo}>
                <p className={styles.resultsText}><strong>File:</strong> {selectedFile?.name}</p>
                <p className={styles.resultsText}><strong>Silhouettes:</strong> {silhouettes.length} extracted</p>
                <p className={styles.resultsText}><strong>Status:</strong> Ready for sequence creation ✓</p>
              </div>
              
              <div className="btn-group center">
                <button
                  onClick={handleClose}
                  className="btn-primary"
                >
                  Continue to Sequence Editor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
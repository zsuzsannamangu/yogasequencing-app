'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import LongVideoProcessor from '@/components/LongVideoProcessor';
import UploadModal from '@/components/UploadModal';
import SequenceDetailsModal from '@/components/SequenceDetailsModal';
import CategorySelectionModal from '@/components/CategorySelectionModal';
import PreviewModal from '@/components/PreviewModal';
import Swal from 'sweetalert2';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Save, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/Upload.module.scss';

interface Category {
  id: string;
  name: string;
  description?: string;
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

const DraggablePose = ({ id, poseName, image, index, onDelete, onNameChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.poseCard}>
      <div className={styles.poseHeader}>
        <div
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
      </div>
        <div className={styles.poseNumber}>{index + 1}</div>
        <div
          onClick={() => onDelete(id)}
          className={styles.deleteButtonPose}
        >
          <Trash2 size={16} />
        </div>
      </div>
      <div className={styles.poseImage}>
        <img 
          src={image} 
        alt={`Pose ${index + 1}`}
          onLoad={() => console.log(`Image ${index} loaded successfully:`, image)}
          onError={(e) => console.error(`Image ${index} failed to load:`, e, 'URL:', image)}
      />
      </div>
      <div className={styles.poseName}>
      <input
        type="text"
        value={poseName}
          onChange={(e) => onNameChange(id, e.target.value)}
          className={styles.poseNameInput}
        />
      </div>
    </div>
  );
};

export default function UploadPage() {
  const { user, token } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [silhouettes, setSilhouettes] = useState<string[]>([]);
  const [poseNames, setPoseNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [sequenceTitle, setSequenceTitle] = useState('');
  const [sequenceDescription, setSequenceDescription] = useState('');
  const [sequenceDuration, setSequenceDuration] = useState('');
  const [privacy, setPrivacy] = useState<'private' | 'public'>('private');
  const [selectedLabel, setSelectedLabel] = useState<string>('Yoga'); // Default to Yoga
  const labelHeight = 16;
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSequenceDetailsModal, setShowSequenceDetailsModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [modalFlowCompleted, setModalFlowCompleted] = useState(false);
  const [processingStarted, setProcessingStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // Fetch categories when token is available
  useEffect(() => {
    if (!token) return;

  const fetchCategories = async () => {
    try {
        const response = await axios.get('http://localhost:8000/sequences/categories/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

    fetchCategories();
  }, [token]);

  // Get video duration helper function
  const getVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);  // Start loading indicator
    
    // Show upload progress
    const startTime = Date.now();
    console.log(`Starting upload of ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      const res = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minute timeout for very large files
      });
      
      const uploadTime = (Date.now() - startTime) / 1000;
      console.log(`Upload completed in ${uploadTime.toFixed(2)} seconds`);
      
      setFilename(res.data.filename); // Use actual .mp4 filename from server
      setUploadComplete(true); // Mark upload as complete
      const fileSizeMB = res.data.file_size ? (res.data.file_size / 1024 / 1024).toFixed(1) : 'Unknown';
      Swal.fire({
        title: 'Success!',
        text: `Upload successful! (${uploadTime.toFixed(1)}s, ${fileSizeMB} MB)`,
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    } catch (err) {
      console.error('Upload failed', err);
      const errorMessage = err.response?.data?.detail || 'Upload failed';
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
    } finally {
      setUploading(false);  // Stop loading indicator
      setSilhouettes([]);
      setPoseNames([]);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFilename(file.name);
  };

  const handleUploadFromModal = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    
    const startTime = Date.now();
    console.log(`Starting upload of ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      const res = await axios.post('http://localhost:8000/fast/fast-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes
      });
      
      const uploadTime = (Date.now() - startTime) / 1000;
      console.log(`Upload completed in ${uploadTime.toFixed(2)} seconds`);
      
      setFilename(res.data.filename);
      setUploadComplete(true);
      // Remove SweetAlert popup for faster workflow
      console.log(`Upload successful! (${uploadTime.toFixed(1)}s)`);
    } catch (err) {
      console.error('Upload failed', err);
      const errorMessage = err.response?.data?.detail || 'Upload failed';
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
    } finally {
      setUploading(false);
      setSilhouettes([]);
      setPoseNames([]);
    }
  };

  const handleStartProcessing = () => {
    setProcessingStarted(true);
  };

  const handleGenerate = async () => {
    if (!filename) {
      return Swal.fire({
        title: 'No File',
        text: 'Please upload a file first!',
        icon: 'warning',
        confirmButtonColor: '#b8336a',
      });
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/detect', {
        filename: filename,
      });

      if (response.data.silhouette_files && response.data.silhouette_files.length > 0) {
        console.log('Old upload method - received silhouette_files:', response.data.silhouette_files);
        // Convert silhouette paths to full URLs
        const silhouetteUrls = response.data.silhouette_files.map((filepath: string) => {
          // Extract just the filename from the path
          const filename = filepath.split('/').pop();
          const url = `http://localhost:8000/silhouettes/${filename}`;
          console.log('Old upload - converting filepath:', filepath, 'to URL:', url);
          return url;
        });
        console.log('Old upload - final silhouette URLs:', silhouetteUrls);
        setSilhouettes(silhouetteUrls);
        setPoseNames(response.data.silhouette_files.map((_, index) => `Pose ${index + 1}`));
      } else {
        Swal.fire({
          title: 'No Poses Detected',
          text: 'No poses were detected in your video. Please try a different video.',
          icon: 'warning',
          confirmButtonColor: '#b8336a',
        });
      }
    } catch (error) {
      console.error('Error generating silhouettes:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to generate silhouettes. Please try again.',
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSilhouettes((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });

      setPoseNames((items) => {
        const oldIndex = items.indexOf(poseNames[items.indexOf(active.id)]);
        const newIndex = items.indexOf(poseNames[items.indexOf(over.id)]);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDeletePose = (poseId: string) => {
    setSilhouettes(prev => prev.filter(id => id !== poseId));
    setPoseNames(prev => {
      const index = silhouettes.indexOf(poseId);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePoseNameChange = (poseId: string, newName: string) => {
    setPoseNames(prev => {
      const index = silhouettes.indexOf(poseId);
      const newNames = [...prev];
      newNames[index] = newName;
      return newNames;
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Please enter a category name',
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
      return;
    }

    if (!user || !token) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please log in to create categories',
        icon: 'warning',
        confirmButtonColor: '#b8336a',
      });
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/sequences/categories/', {
        name: newCategoryName,
        description: newCategoryDescription,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setCategories(prev => [...prev, response.data]);
      setSelectedCategory(response.data.id);
      setNewCategoryName('');
      setNewCategoryDescription('');

      Swal.fire({
        title: 'Success!',
        text: 'Category created successfully',
        icon: 'success',
        confirmButtonColor: '#b8336a',
      });
    } catch (error) {
      console.error('Failed to create category:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to create category. Please try again.',
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
    }
  };

  const handleSaveToLibrary = async () => {
    if (!sequenceTitle.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Please enter a sequence title',
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
      return;
    }

    if (!user || !token) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please log in to save sequences to your library',
        icon: 'warning',
        confirmButtonColor: '#b8336a',
      });
      return;
    }

    try {
      // Transform data to match backend expectations
      const poses = silhouettes.map((silhouette, index) => ({
        filePath: silhouette,
        poseName: poseNames[index] || `Pose ${index + 1}`
      }));

      const sequenceData = {
        name: sequenceTitle,
        description: sequenceDescription,
        duration: sequenceDuration,
        poseCount: silhouettes.length,
        poses: poses,
        category: selectedCategory || null,
        privacy: privacy,
        industryLabel: selectedLabel,
      };

      console.log('Saving sequence with data:', sequenceData);
      console.log('User token:', token ? 'Present' : 'Missing');

      const response = await axios.post('http://localhost:8000/sequences/', sequenceData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Save sequence response:', response.data);

      // Get the sequence ID from the response
      const sequenceId = response.data?.id;
      
    Swal.fire({
        title: 'Success!',
        text: 'Sequence saved to library successfully',
      icon: 'success',
      confirmButtonColor: '#b8336a',
        showCancelButton: true,
        confirmButtonText: sequenceId ? 'View & Edit Sequence' : 'Go to Library',
        cancelButtonText: 'Stay Here'
      }).then((result) => {
        if (result.isConfirmed) {
          if (sequenceId) {
            // Redirect to the specific sequence page
            window.location.href = `/sequences/${sequenceId}`;
          } else {
            // Redirect to the sequences library page
            window.location.href = '/sequences';
          }
        }
      });

      // Reset form
      setSequenceTitle('');
      setSequenceDescription('');
      setSequenceDuration('');
      setSelectedCategory('');
      setPrivacy('private');
      setSelectedLabel('Yoga');
      setSilhouettes([]);
      setPoseNames([]);
      setFilename('');
      setSelectedFile(null);
      setUploadComplete(false);
      setProcessingStarted(false);
    } catch (error) {
      console.error('Failed to save sequence:', error);
      
      let errorMessage = 'Failed to save sequence. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
        
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.response.status === 422) {
          errorMessage = 'Invalid data. Please check your sequence details.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data && error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'Unable to connect to server. Please check your connection.';
        } else {
        // Something else happened
        console.error('Error setting up request:', error.message);
        errorMessage = 'An unexpected error occurred.';
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
    }
  };

  const handleDownloadSequence = async () => {
      if (!sequenceTitle.trim()) {
        Swal.fire({
        title: 'Error',
        text: 'Please enter a sequence title',
        icon: 'error',
        confirmButtonColor: '#f87171',
        });
        return;
      }

    try {
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
      if (sequenceTitle || sequenceDescription) {
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(176, 51, 106);
        
        if (sequenceTitle) {
          const titleWidth = pdf.getTextWidth(sequenceTitle);
          const titleX = (pageWidth - titleWidth) / 2;
          pdf.text(sequenceTitle, titleX, y + 20);
          y += 35;
        }
        
        if (sequenceDescription) {
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          const subtitleWidth = pdf.getTextWidth(sequenceDescription);
          const subtitleX = (pageWidth - subtitleWidth) / 2;
          pdf.text(sequenceDescription, subtitleX, y + 15);
          y += 25;
        }
        
        // Add metadata
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        const metadataText = `${sequenceDuration} • ${silhouettes.length} poses`;
        const metadataWidth = pdf.getTextWidth(metadataText);
        const metadataX = (pageWidth - metadataWidth) / 2;
        pdf.text(metadataText, metadataX, y + 15);
        y += 30;
      }

      // Add poses
      if (silhouettes.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(176, 51, 106);
        pdf.text('Sequence Poses', spacingX, y + 20);
        y += 40;

        for (let i = 0; i < silhouettes.length; i++) {
          if (y > pageHeight - 50) {
            pdf.addPage();
            y = spacingY;
          }

          // Add pose number and name
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(176, 51, 106);
          pdf.text(`Pose ${i + 1}: ${poseNames[i] || `Pose ${i + 1}`}`, x, y + 20);
          y += 20;

          // Add placeholder for image
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(100, 100, 100);
          pdf.text('[Silhouette image would appear here]', x, y + 15);
          y += 30;
        }
      }

      // Save the PDF
      const fileName = `${sequenceTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_sequence.pdf`;
      pdf.save(fileName);

        Swal.fire({
        title: 'Success!',
        text: 'Sequence downloaded successfully',
          icon: 'success',
          confirmButtonColor: '#b8336a',
        });

    } catch (error) {
      console.error('Failed to download sequence:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to download sequence. Please try again.',
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
    }
  };

  const handleClearSequence = () => {
    setSilhouettes([]);
    setPoseNames([]);
    setSequenceTitle('');
    setSequenceDescription('');
    setSequenceDuration('');
    setSelectedCategory('');
    setPrivacy('private');
    setSelectedLabel('Yoga');
    setFilename('');
    setSelectedFile(null);
    setUploadComplete(false);
    setProcessingStarted(false);
    setShowSequenceDetailsModal(false);
    setShowCategoryModal(false);
    setShowPreviewModal(false);
    setModalFlowCompleted(false);
  };


  // Modal handlers
  const handleSequenceDetailsNext = (details: {
    title: string;
    description: string;
    duration: string;
    privacy: 'private' | 'public';
  }) => {
    setSequenceTitle(details.title);
    setSequenceDescription(details.description);
    setSequenceDuration(details.duration);
    setPrivacy(details.privacy);
    setShowSequenceDetailsModal(false);
    setShowCategoryModal(true);
  };

  const handleCategoryNext = (selection: {
    categoryId: string | null;
    industryLabel: string;
  }) => {
    setSelectedCategory(selection.categoryId || '');
    setSelectedLabel(selection.industryLabel);
    setShowCategoryModal(false);
    setShowPreviewModal(true);
  };

  const handlePreviewConfirm = () => {
    setShowPreviewModal(false);
    setModalFlowCompleted(true);
    // Now show the pose editor (the existing form)
  };

  // Modal close handlers - reset flow when closed without completing
  const handleSequenceDetailsClose = () => {
    setShowSequenceDetailsModal(false);
    // Don't reset modalFlowCompleted here - user might just be going back
  };

  const handleCategoryClose = () => {
    setShowCategoryModal(false);
    setShowSequenceDetailsModal(true); // Go back to previous step
  };

  const handlePreviewClose = () => {
    setShowPreviewModal(false);
    setShowCategoryModal(true); // Go back to previous step
  };

  return (
    <main className={styles.main}>
      <Navbar showUserMenu={true} firstName="User" lastName="" profileImage={null} />
      <section className={styles.section}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create New Sequence</h1>
          <p className={styles.subtitle}>
            Upload a video to automatically extract poses and create a movement sequence
          </p>
        </div>

        {/* Workflow Steps - Always visible at the top */}
        <div className={styles.workflowSteps}>
          <div className={`${styles.step} ${uploadComplete ? styles.completed : (uploading ? styles.current : styles.pending)}`}>
            <span className={styles.stepNumber}>1</span>
            <span className={styles.stepText}>Upload Video</span>
                </div>
          <div className={styles.stepArrow}>→</div>
          <div className={`${styles.step} ${uploadComplete && !silhouettes.length ? styles.current : (silhouettes.length > 0 ? styles.completed : styles.pending)}`}>
            <span className={styles.stepNumber}>2</span>
            <span className={styles.stepText}>Process Video</span>
                </div>
          <div className={styles.stepArrow}>→</div>
          <div className={`${styles.step} ${silhouettes.length > 0 ? styles.completed : styles.pending}`}>
            <span className={styles.stepNumber}>3</span>
            <span className={styles.stepText}>Create Sequence</span>
                </div>
              </div>

        {/* Video Guidelines */}
        <div className={styles.guidelinesSection}>
          <button
            className={styles.guidelinesToggle}
            onClick={() => setShowGuidelines(!showGuidelines)}
          >
            <span className={styles.guidelinesTitle}>Video Guidelines</span>
            <span className={styles.guidelinesArrow}>{showGuidelines ? '▼' : '▶'}</span>
          </button>
          {showGuidelines && (
            <div className={styles.guidelinesContent}>
              <ul className={styles.guidelinesList}>
                <li>Optimized for <strong>yoga classes 20-90 minutes</strong> - perfect for full sessions</li>
                <li>Ensure <strong>good lighting</strong> and clear visibility of your movements</li>
                <li>Avoid <strong>direct sunlight</strong> or strong shadow contrast. Consistent lighting helps generate clean silhouettes.</li>
                <li>Ensure your <strong>full body remains in the frame</strong> throughout the sequence.</li>
                <li>Wear clothes that contrast well with the background.</li>
                <li>For faster upload and processing, we recommend uploading <strong>MP4 files</strong> (smaller and instantly compatible).</li>
                <li><strong>File size limit: 1000MB (1GB)</strong> - Handles high-quality videos up to 90+ minutes. For best performance, aim for files under 700MB.</li>
                <li>Processing time: <strong>2-5 minutes</strong> for typical classes (20-60 minutes), <strong>5-10 minutes</strong> for longer sessions (60+ minutes).</li>
              </ul>
            </div>
          )}
        </div>

        {/* Upload Section - Only show if no silhouettes */}
        {silhouettes.length === 0 && (
          <div className={styles.buttonContainer}>
                    <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              Choose File
                    </button>
            {(selectedFile || uploadComplete || processingStarted) && (
                    <button
                onClick={handleClearSequence}
                className="btn-tertiary"
                    >
                Reset
                    </button>
            )}
              </div>
            )}



        {/* Upload Modal */}
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onFileSelect={handleFileSelect}
          onUpload={handleUploadFromModal}
          onStartProcessing={handleStartProcessing}
          onComplete={(result) => {
            console.log('UploadModal onComplete - result:', result);
            if (result?.silhouette_files) {
              console.log('UploadModal - received silhouette_files:', result.silhouette_files);
              // Convert silhouette paths to full URLs
              const silhouetteUrls = result.silhouette_files.map((filepath: string) => {
                // Extract just the filename from the path
                const filename = filepath.split('/').pop();
                const url = `http://localhost:8000/silhouettes/${filename}`;
                console.log('UploadModal - converting filepath:', filepath, 'to URL:', url);
                return url;
              });
              console.log('UploadModal - final silhouette URLs:', silhouetteUrls);
              setSilhouettes(silhouetteUrls);
              setPoseNames(result.silhouette_files.map((_, index) => `Pose ${index + 1}`));
              // Close upload modal and show sequence details modal
              setShowUploadModal(false);
              setShowSequenceDetailsModal(true);
            }
          }}
          onError={(error) => {
            console.error('Video processing error:', error);
            Swal.fire({
              title: 'Processing Error',
              text: error,
              icon: 'error',
              confirmButtonColor: '#003221',
            });
          }}
          selectedFile={selectedFile}
          uploading={uploading}
          uploadComplete={uploadComplete}
          processing={processingStarted}
          filename={filename}
          silhouettes={silhouettes}
        />

        {/* Sequence Details Modal */}
        <SequenceDetailsModal
          isOpen={showSequenceDetailsModal}
          onClose={handleSequenceDetailsClose}
          onNext={handleSequenceDetailsNext}
          initialData={{
            title: sequenceTitle,
            description: sequenceDescription,
            duration: sequenceDuration,
            privacy: privacy
          }}
        />

        {/* Category Selection Modal */}
        <CategorySelectionModal
          isOpen={showCategoryModal}
          onClose={handleCategoryClose}
          onNext={handleCategoryNext}
          initialData={{
            categoryId: selectedCategory,
            industryLabel: selectedLabel
          }}
        />

        {/* Preview Modal */}
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={handlePreviewClose}
          onConfirm={handlePreviewConfirm}
          sequenceData={{
            title: sequenceTitle,
            description: sequenceDescription,
        duration: sequenceDuration,
        privacy: privacy,
            categoryName: categories.find(cat => cat.id === selectedCategory)?.name,
            industryLabel: selectedLabel,
            poseCount: silhouettes.length
          }}
        />

        {/* Silhouette Display and Management - Show when silhouettes are available and modal flow is completed */}
        {silhouettes.length > 0 && modalFlowCompleted && (
          <div className={styles.silhouetteSection}>
            <h3 className={styles.silhouetteTitle}>{silhouettes.length} poses</h3>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={silhouettes} strategy={verticalListSortingStrategy}>
                <div className={styles.posesGrid}>
                  {silhouettes.map((silhouette, index) => {
                    console.log(`Rendering pose ${index}:`, silhouette);
                    return (
                    <DraggablePose
                        key={silhouette}
                        id={silhouette}
                        poseName={poseNames[index]}
                        image={silhouette}
                        index={index}
                      onDelete={handleDeletePose}
                      onNameChange={handlePoseNameChange}
                    />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            <div className={`btn-group center ${styles.actionButtonsSpacing}`}>
              <button
                onClick={handleSaveToLibrary}
                className="btn-primary"
              >
                
                Save to Library
              </button>
              <button
                onClick={handleDownloadSequence}
                className="btn-secondary"
              >
                
                Download Sequence
              </button>
              <button
                onClick={handleClearSequence}
                className="btn-tertiary"
              >
                
                Clear Sequence
                </button>
            </div>
              </div>
            )}

        {loading && (
          <p className={styles.loadingText}>Generating sequence...</p>
        )}

      </section>

      <Footer />
    </main>
  );
};
'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import LongVideoProcessor from '@/components/LongVideoProcessor';
import UploadModal from '@/components/UploadModal';
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
import { GripVertical, Plus, Trash2 } from 'lucide-react';
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
          src={`http://localhost:8001/silhouettes/${image}`} 
          alt={`Pose ${index + 1}`}
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
  const [sequencePrivacy, setSequencePrivacy] = useState<'private' | 'public'>('private');
  const [selectedLabel, setSelectedLabel] = useState<string>('Yoga'); // Default to Yoga
  const labelHeight = 16;
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [processingStarted, setProcessingStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // Fetch categories when token is available
  useEffect(() => {
    if (!token) return;
    
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:8001/sequences/categories/', {
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
      const res = await axios.post('http://localhost:8001/upload', formData, {
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
      const res = await axios.post('http://localhost:8001/fast/fast-upload', formData, {
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
      const response = await axios.post('http://localhost:8001/detect', {
        filename: filename,
      });

      if (response.data.silhouette_files && response.data.silhouette_files.length > 0) {
        setSilhouettes(response.data.silhouette_files);
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
      const response = await axios.post('http://localhost:8001/sequences/categories/', {
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

      const response = await axios.post('http://localhost:8001/sequences/', {
        name: sequenceTitle,
        description: sequenceDescription,
        duration: sequenceDuration,
        poseCount: silhouettes.length,
        poses: poses,
        category: selectedCategory || null,
        privacy: sequencePrivacy,
        industryLabel: selectedLabel,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      Swal.fire({
        title: 'Success!',
        text: 'Sequence saved to library successfully',
        icon: 'success',
        confirmButtonColor: '#b8336a',
      });

      // Reset form
      setSequenceTitle('');
      setSequenceDescription('');
      setSequenceDuration('');
      setSelectedCategory('');
      setSequencePrivacy('private');
      setSelectedLabel('Yoga');
      setSilhouettes([]);
      setPoseNames([]);
      setFilename('');
      setSelectedFile(null);
      setUploadComplete(false);
      setProcessingStarted(false);
    } catch (error) {
      console.error('Failed to save sequence:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to save sequence. Please try again.',
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
          if (y > pageHeight - 200) {
            pdf.addPage();
            y = spacingY;
          }

          // Add pose number and name
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(176, 51, 106);
          pdf.text(`Pose ${i + 1}: ${poseNames[i] || `Pose ${i + 1}`}`, x, y + 20);
          y += 30;

          // Add silhouette image
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const imgWidth = maxWidth;
              const imgHeight = (img.height * imgWidth) / img.width;
              
              if (y + imgHeight > pageHeight - 50) {
                pdf.addPage();
                y = spacingY;
              }
              
              pdf.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
              y += imgHeight + spacingY;
            };
            img.src = silhouettes[i];
          } catch (error) {
            console.error('Error loading image:', error);
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Image not available', x, y + 20);
            y += 30;
          }
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
    setSequencePrivacy('private');
    setSelectedLabel('Yoga');
    setFilename('');
    setSelectedFile(null);
    setUploadComplete(false);
    setProcessingStarted(false);
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

        {/* Sequence Information Section - Show when silhouettes are available */}
        {silhouettes.length > 0 && (
          <div className={styles.sequenceInfoSection}>
            <h3 className={styles.sequenceInfoTitle}>Create Your Sequence</h3>
            <p className={styles.sequenceInfoSubtitle}>Fill in the details below to save your sequence to your library</p>
            
            <form className={styles.sequenceForm}>
              {/* Basic Information Group */}
              <div className={styles.formGroup}>
                <h4 className={styles.groupTitle}>Basic Information</h4>
                
                <div className={styles.formField}>
                  <label htmlFor="sequenceTitle" className={styles.fieldLabel}>
                    Sequence Title
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="sequenceTitle"
                    value={sequenceTitle}
                    onChange={(e) => setSequenceTitle(e.target.value)}
                    placeholder="e.g., Morning Yoga Flow"
                    className={styles.fieldInput}
                    maxLength={100}
                    required
                  />
                  <div className={styles.fieldHelp}>
                    Give your sequence a descriptive name (max 100 characters)
                  </div>
                </div>

                <div className={styles.formField}>
                  <label htmlFor="sequenceDescription" className={styles.fieldLabel}>
                    Description
                  </label>
                  <textarea
                    id="sequenceDescription"
                    value={sequenceDescription}
                    onChange={(e) => setSequenceDescription(e.target.value)}
                    placeholder="Describe what this sequence focuses on, who it's for, and any special instructions..."
                    className={styles.fieldTextarea}
                    rows={4}
                    maxLength={500}
                  />
                  <div className={styles.fieldHelp}>
                    Help others understand your sequence (max 500 characters)
                  </div>
                </div>
              </div>

              {/* Classification Group */}
              <div className={styles.formGroup}>
                <h4 className={styles.groupTitle}>Classification</h4>
                
                <div className={styles.formField}>
                  <label htmlFor="industryLabel" className={styles.fieldLabel}>
                    Industry Label
                    <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="industryLabel"
                    value={selectedLabel}
                    onChange={(e) => setSelectedLabel(e.target.value)}
                    className={styles.fieldSelect}
                    required
                  >
                    {AVAILABLE_INDUSTRY_LABELS.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className={styles.fieldHelp}>
                    Choose the industry this sequence belongs to
                  </div>
                </div>

                <div className={styles.formField}>
                  <label htmlFor="sequenceCategory" className={styles.fieldLabel}>
                    Category
                  </label>
                  <select
                    id="sequenceCategory"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={styles.fieldSelect}
                  >
                    <option value="">Choose a category (optional)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                    <option value="new">Create New Category</option>
                  </select>
                  {selectedCategory === 'new' && (
                    <div className={styles.newCategoryForm}>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g., Beginner Yoga"
                        className={styles.fieldInput}
                        maxLength={50}
                      />
                      <input
                        type="text"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="e.g., Sequences for yoga beginners"
                        className={styles.fieldInput}
                        maxLength={100}
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className={styles.createCategoryButton}
                      >
                        Create Category
                      </button>
                    </div>
                  )}
                  <div className={styles.fieldHelp}>
                    Organize your sequences with categories
                  </div>
                </div>
              </div>

              {/* Details Group */}
              <div className={styles.formGroup}>
                <h4 className={styles.groupTitle}>Sequence Details</h4>
                
                <div className={styles.formField}>
                  <label htmlFor="sequenceDuration" className={styles.fieldLabel}>
                    Duration
                  </label>
                  <input
                    type="text"
                    id="sequenceDuration"
                    value={sequenceDuration}
                    onChange={(e) => setSequenceDuration(e.target.value)}
                    placeholder="e.g., 45 minutes, 1 hour, 30-45 min"
                    className={styles.fieldInput}
                    maxLength={20}
                  />
                  <div className={styles.fieldHelp}>
                    How long does this sequence take to complete?
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Privacy Setting
                    <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="privacy"
                        value="private"
                        checked={sequencePrivacy === 'private'}
                        onChange={(e) => setSequencePrivacy(e.target.value as 'private' | 'public')}
                        className={styles.radioInput}
                      />
                      <span className={styles.radioLabel}>
                        <strong>Private</strong>
                        <span className={styles.radioDescription}>Only visible to you</span>
                      </span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="privacy"
                        value="public"
                        checked={sequencePrivacy === 'public'}
                        onChange={(e) => setSequencePrivacy(e.target.value as 'private' | 'public')}
                        className={styles.radioInput}
                      />
                      <span className={styles.radioLabel}>
                        <strong>Public</strong>
                        <span className={styles.radioDescription}>Visible to everyone</span>
                      </span>
                    </label>
                  </div>
                  <div className={styles.fieldHelp}>
                    Choose who can see this sequence
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Upload Section - Only show if no silhouettes */}
        {silhouettes.length === 0 && (
          <div className={styles.buttonContainer}>
            <button
              onClick={() => setShowUploadModal(true)}
              className={styles.chooseFileButton}
            >
              Choose File
            </button>
            {(selectedFile || uploadComplete || processingStarted) && (
              <button
                onClick={handleClearSequence}
                className={styles.resetButton}
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
            console.log('Video processing completed:', result);
            if (result?.silhouette_files) {
              setSilhouettes(result.silhouette_files);
              setPoseNames(result.silhouette_files.map((_, index) => `Pose ${index + 1}`));
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

        {/* Silhouette Display and Management - Show when silhouettes are available */}
        {silhouettes.length > 0 && (
          <div className={styles.silhouetteSection}>
            <h3 className={styles.silhouetteTitle}>Your Sequence ({silhouettes.length} poses)</h3>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={silhouettes} strategy={verticalListSortingStrategy}>
                <div className={styles.posesGrid}>
                  {silhouettes.map((silhouette, index) => (
                    <DraggablePose
                      key={silhouette}
                      id={silhouette}
                      poseName={poseNames[index]}
                      image={silhouette}
                      index={index}
                      onDelete={handleDeletePose}
                      onNameChange={handlePoseNameChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {silhouettes.length > 0 && (
              <div className={`${styles.actionButtons} ${styles.actionButtonsSpacing}`}>
                <button
                  onClick={handleSaveToLibrary}
                  className={styles.saveButton}
                >
                  Save to Library
                </button>
                <button
                  onClick={handleDownloadSequence}
                  className={styles.downloadButton}
                >
                  Download Sequence
                </button>
                <button
                  onClick={handleClearSequence}
                  className={styles.clearButton}
                >
                  Clear Sequence
                </button>
              </div>
            )}
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
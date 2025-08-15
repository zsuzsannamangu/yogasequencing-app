'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import UserMenu from '@/components/UserMenu';
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
import { GripVertical, Plus, X } from 'lucide-react';
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
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.draggablePose} ${isDragging ? styles.dragging : ''}`}
    >
      <div className={styles.gripHandle} {...attributes} {...listeners}>
        <GripVertical size={18} />
      </div>
      <img
        src={`http://localhost:8000/${image}`}
        alt={`Pose ${index + 1}`}
        className={styles.poseImage}
      />
      <input
        type="text"
        value={poseName}
        onChange={(e) => onNameChange(index, e.target.value)}
        placeholder={`Pose ${index + 1}`}
        className={styles.poseInput}
      />
      <button
        onClick={() => onDelete(index)}
        className={styles.deleteButton}
        title="Delete Pose"
      >
        ✕
      </button>
    </div>
  );
};

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [silhouettes, setSilhouettes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [poseNames, setPoseNames] = useState<string[]>([]);
  const [sequenceTitle, setSequenceTitle] = useState<string>('');
  const [sequenceSubtitle, setSequenceSubtitle] = useState<string>('');
  const [sequenceDuration, setSequenceDuration] = useState<string>('');
  const [sequencePoseCount, setSequencePoseCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [sequencePrivacy, setSequencePrivacy] = useState<'private' | 'public'>('private');
  const [selectedLabel, setSelectedLabel] = useState<string>('Yoga'); // Default to Yoga
  const labelHeight = 16;
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8000/sequences/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Category name is required',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/sequences/categories/', {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined
      });

      setCategories([...categories, response.data]);
      setSelectedCategory(response.data.name);
      setShowNewCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryDescription('');

      Swal.fire({
        title: 'Success!',
        text: 'Category created successfully',
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    } catch (error: any) {
      console.error('Failed to create category:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.detail || 'Failed to create category',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);  // Start loading indicator
    try {
      const res = await axios.post('http://localhost:8000/upload', formData);
      setFilename(res.data.filename); // Use actual .mp4 filename from server
      Swal.fire({
        title: 'Success!',
        text: 'Upload successful!',
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    } catch (err) {
      console.error('Upload failed', err);
      Swal.fire({
        title: 'Error',
        text: 'Upload failed',
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
    } finally {
      setUploading(false);  // Stop loading indicator
      setSilhouettes([]);
      setPoseNames([]);
    }
  };

  const handleGenerate = async () => {
    if (!filename) {
      return Swal.fire({
        title: 'No File',
        text: 'Please upload a file first!',
        icon: 'warning',
        confirmButtonColor: '#003221',
      });
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/extract-silhouettes', null, {
        params: { filename },
      });
      setSilhouettes(res.data.files);
    } catch (err) {
      console.error('Failed to generate silhouettes', err);
      Swal.fire({
        title: 'Error',
        text: 'Error generating silhouettes',
        icon: 'error',
        confirmButtonColor: '#f87171',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = 100;
    const spacingX = 5;
    const spacingY = 10;
    let x = spacingX;
    let y = spacingY;

    // Add sequence title and subtitle at the top
    if (sequenceTitle || sequenceSubtitle) {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(176, 51, 106); // accent-color

      if (sequenceTitle) {
        const titleWidth = pdf.getTextWidth(sequenceTitle);
        const titleX = (pageWidth - titleWidth) / 2;
        pdf.text(sequenceTitle, titleX, y + 20);
        y += 35;
      }

      if (sequenceSubtitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100); // muted color
        const subtitleWidth = pdf.getTextWidth(sequenceSubtitle);
        const subtitleX = (pageWidth - subtitleWidth) / 2;
        pdf.text(sequenceSubtitle, subtitleX, y + 15);
        y += 25;
      }

      // Add sequence metadata and date on same line
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      const creationDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const metadataText = `${sequenceDuration} • ${sequencePoseCount} poses • ${creationDate}`;
      const metadataWidth = pdf.getTextWidth(metadataText);
      const metadataX = (pageWidth - metadataWidth) / 2;
      pdf.text(metadataText, metadataX, y + 15);
      y += 20;

      // Reset y position for poses with more space
      y = 120;
    }

    for (let i = 0; i < silhouettes.length; i++) {
      const filePath = silhouettes[i];
      const res = await fetch(`http://localhost:8000/${filePath}`);
      const svgText = await res.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml').documentElement;
      svgDoc.setAttribute('width', `${maxWidth}px`);
      svgDoc.setAttribute('height', `${maxWidth}px`);
      await svg2pdf(svgDoc, pdf, { x, y });

      if (poseNames[i]) {
        pdf.setFontSize(10);
        const textWidth = pdf.getTextWidth(poseNames[i]);
        const centerX = x + maxWidth / 2 - textWidth / 2;
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(poseNames[i], centerX, y + maxWidth - 4);
      }

      x += maxWidth + spacingX;
      if (x + maxWidth > pageWidth) {
        x = spacingX;
        y += maxWidth + spacingY;
        if (y + maxWidth > pageHeight) {
          pdf.addPage();
          y += maxWidth + labelHeight + spacingY;
        }
      }
    }

    // Generate filename based on sequence title or use default
    const filename = sequenceTitle
      ? `${sequenceTitle.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`
      : 'yoga_sequence_vector.pdf';

    pdf.save(filename);

    // Show success message for download
    Swal.fire({
      title: 'Download Started!',
      text: 'PDF download has started successfully',
      icon: 'success',
      confirmButtonColor: '#b8336a',
      confirmButtonText: 'OK',
    });
  };

  const handlePoseNameChange = (index: number, value: string) => {
    const updatedNames = [...poseNames];
    updatedNames[index] = value;
    setPoseNames(updatedNames);
  };

  const handleDeletePose = (index: number) => {
    const updatedSilhouettes = [...silhouettes];
    const updatedPoseNames = [...poseNames];
    updatedSilhouettes.splice(index, 1);
    updatedPoseNames.splice(index, 1);
    setSilhouettes(updatedSilhouettes);
    setPoseNames(updatedPoseNames);
    // Update pose count when poses are deleted
    setSequencePoseCount(updatedSilhouettes.length);
  };

  // Calculate pose count whenever silhouettes change
  React.useEffect(() => {
    setSequencePoseCount(silhouettes.length);
  }, [silhouettes]);

  // Get actual video duration when file is selected
  const getVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);

        if (minutes > 0) {
          resolve(`${minutes}m ${seconds}s`);
        } else {
          resolve(`${seconds}s`);
        }
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleSaveToLibrary = async () => {
    try {
      // Validate required fields
      if (!sequenceTitle.trim()) {
        Swal.fire({
          title: 'Required Field Missing',
          text: 'Please enter a sequence title.',
          icon: 'warning',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
        return;
      }

      if (!sequenceSubtitle.trim()) {
        Swal.fire({
          title: 'Required Field Missing',
          text: 'Please enter a sequence description.',
          icon: 'warning',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
        return;
      }

      if (!sequencePrivacy) {
        Swal.fire({
          title: 'Required Field Missing',
          text: 'Please select a privacy setting.',
          icon: 'warning',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
        return;
      }

      // Check if sequence with same title already exists
      const existingSequences = await axios.get('http://localhost:8000/sequences/');
      const titleToCheck = sequenceTitle.trim();

      const isDuplicate = existingSequences.data.some((seq: any) =>
        seq.name.toLowerCase() === titleToCheck.toLowerCase()
      );

      if (isDuplicate) {
        Swal.fire({
          title: 'Sequence Already Exists',
          text: `A sequence with the title "${sequenceTitle}" already exists in your library.`,
          icon: 'warning',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
        return;
      }

      // Create sequence object for API
      const sequenceData = {
        name: titleToCheck,
        description: sequenceSubtitle || 'No description provided',
        duration: sequenceDuration,
        poseCount: sequencePoseCount,
        poses: silhouettes.map((filePath, index) => ({
          filePath: filePath,
          poseName: poseNames[index] || `Pose ${index + 1}`
        })),
        category: selectedCategory || undefined,
        industryLabel: selectedLabel,
        privacy: sequencePrivacy
      };

      // Save to backend API
      const response = await axios.post('http://localhost:8000/sequences/', sequenceData);

      if (response.status === 200) {
        // Show success message
        Swal.fire({
          title: 'Saved!',
          text: 'Sequence has been saved to your library',
          icon: 'success',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
      }
    } catch (error) {
      console.error('Failed to save sequence:', error);

      // Show error message
      Swal.fire({
        title: 'Error',
        text: 'Failed to save sequence to library. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    }
  };

  return (
    <main className={styles.main}>
      <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />

      <section className={styles.section}>
        <div className={styles.header}>
          <h1 className={styles.title}>Upload and Visualize Your Practice</h1>
          <p className={styles.subtitle}>
            Upload your recorded flow to generate a printable visual sequence.
          </p>
        </div>

        <div className={styles.buttonContainer}>
          <label className={styles.fileLabel}>
            Choose File
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/x-m4v,video/webm,video/ogg"
              onChange={async (e) => {
                const file = e.target.files?.[0] || null;
                if (file) {
                  setSelectedFile(file);
                  setFilename(file.name);

                  // Get actual video duration
                  try {
                    const duration = await getVideoDuration(file);
                    setSequenceDuration(duration);
                  } catch (error) {
                    console.error('Failed to get video duration:', error);
                    setSequenceDuration('Unknown');
                  }
                }

                setSilhouettes([]);
                setPoseNames([]);
              }}
              className={styles.fileInput}
            />
          </label>
          {selectedFile && (
            <span className={styles.fileName}>{selectedFile.name}</span>
          )}
          <button
            onClick={handleUpload}
            className={styles.uploadButton}
          >
            Upload
          </button>
          {uploading && (
            <p className={styles.uploadingText}>
              Uploading & converting video… please wait
            </p>
          )}
          <button
            onClick={handleGenerate}
            disabled={!filename}
            className={styles.generateButton}
          >
            Create Sequence
          </button>
        </div>

        {loading ? (
          <p className={styles.loadingText}>Generating sequence...</p>
        ) : silhouettes.length === 0 ? (
          <p className={styles.emptyText}>Create your sequence!</p>
        ) : (
          <>
            <div className={styles.sequenceInfoSection}>
              <h3 className={styles.sequenceInfoTitle}>Sequence Information</h3>
              {/* First row: Title, Industry Label, Privacy */}
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="sequenceTitle" className={styles.label}>Sequence Title *</label>
                  <input
                    type="text"
                    id="sequenceTitle"
                    value={sequenceTitle}
                    onChange={(e) => setSequenceTitle(e.target.value)}
                    placeholder="Enter sequence title..."
                    className={styles.textInput}
                    required
                  />
                  <small className={styles.helpText}>Required: Give your sequence a descriptive title</small>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="sequenceLabel" className={styles.label}>Industry Label *</label>
                  <select
                    id="sequenceLabel"
                    value={selectedLabel}
                    onChange={(e) => setSelectedLabel(e.target.value)}
                    className={styles.categorySelect}
                    required
                  >
                    {AVAILABLE_INDUSTRY_LABELS.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <small className={styles.helpText}>Required: Choose the industry this sequence belongs to.</small>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="sequencePrivacy" className={styles.label}>Privacy Setting *</label>
                  <div className={styles.privacyContainer}>
                    <label className={styles.privacyOption} data-tooltip="Only visible to you">
                      <input
                        type="radio"
                        name="privacy"
                        value="private"
                        checked={sequencePrivacy === 'private'}
                        onChange={(e) => setSequencePrivacy(e.target.value as 'private' | 'public')}
                        className={styles.privacyRadio}
                      />
                      <span className={styles.privacyLabel}>
                        <span className={styles.privacyIcon}>🔒</span>
                        Private
                      </span>
                    </label>
                    <label className={styles.privacyOption} data-tooltip="Visible to the community">
                      <input
                        type="radio"
                        name="privacy"
                        value="public"
                        checked={sequencePrivacy === 'public'}
                        onChange={(e) => setSequencePrivacy(e.target.value as 'private' | 'public')}
                        className={styles.privacyRadio}
                      />
                      <span className={styles.privacyLabel}>
                        <span className={styles.privacyIcon}>🌍</span>
                        Public
                      </span>
                    </label>
                  </div>
                  <small className={styles.helpText}>Required: Choose who can see this sequence</small>
                </div>
              </div>

              {/* Second row: Description only */}
              <div className={`${styles.inputGroup} ${styles.descriptionSection}`}>
                <label htmlFor="sequenceSubtitle" className={styles.label}>Description *</label>
                <textarea
                  id="sequenceSubtitle"
                  value={sequenceSubtitle}
                  onChange={(e) => setSequenceSubtitle(e.target.value)}
                  placeholder="Describe your sequence such as difficulty level, age group, type of movement, etc."
                  className={styles.textarea}
                  rows={4}
                  required
                />
                <small className={styles.helpText}>Required: Describe your sequence in detail</small>
              </div>

              {/* Third row: Duration, Pose Count, Category */}
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="sequenceDuration" className={styles.label}>Duration</label>
                  <input
                    type="text"
                    id="sequenceDuration"
                    value={sequenceDuration}
                    placeholder="Automatically calculated"
                    className={styles.textInput}
                    readOnly
                  />
                  <small className={styles.helpText}>Automatically extracted from your video file</small>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="sequencePoseCount" className={styles.label}>Pose Count</label>
                  <input
                    type="number"
                    id="sequencePoseCount"
                    value={sequencePoseCount}
                    onChange={(e) => setSequencePoseCount(parseInt(e.target.value) || 0)}
                    className={styles.textInput}
                    readOnly
                  />
                  <small className={styles.helpText}>Automatically calculated from your sequence</small>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="sequenceCategory" className={styles.label}>Category</label>
                  <div className={styles.categoryContainer}>
                    <select
                      id="sequenceCategory"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className={styles.categorySelect}
                    >
                      <option value="">No Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryForm(true)}
                      className={styles.addCategoryButton}
                      title="Create New Category"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showNewCategoryForm && (
              <div className={styles.newCategoryForm}>
                <h4 className={styles.newCategoryTitle}>Create New Category</h4>
                <div className={styles.newCategoryInputs}>
                  <input
                    type="text"
                    placeholder="Category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={styles.newCategoryInput}
                  />
                  <div className={styles.newCategoryActions}>
                    <button
                      onClick={handleCreateCategory}
                      className={styles.saveCategoryButton}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCategoryForm(false);
                        setNewCategoryName('');
                        setNewCategoryDescription('');
                      }}
                      className={styles.cancelCategoryButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.helpMessage}>
              <p>💡 <strong>Tip:</strong> You can drag poses to reorder them, click the red ✕ to delete poses, and edit pose names by typing in the input fields.</p>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (over && active.id !== over.id) {
                  const oldIndex = silhouettes.findIndex((id) => id === active.id);
                  const newIndex = silhouettes.findIndex((id) => id === over.id);
                  setSilhouettes(arrayMove(silhouettes, oldIndex, newIndex));
                  setPoseNames(arrayMove(poseNames, oldIndex, newIndex));
                }
              }}
            >
              <SortableContext items={silhouettes} strategy={verticalListSortingStrategy}>
                <div className={styles.grid}>
                  {silhouettes.map((filePath, idx) => (
                    <DraggablePose
                      key={filePath}
                      id={filePath}
                      poseName={poseNames[idx] || ''}
                      image={filePath}
                      index={idx}
                      onDelete={handleDeletePose}
                      onNameChange={handlePoseNameChange}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {silhouettes.length > 0 && (
              <div className={styles.actionButtons}>
                <button
                  onClick={handleSaveToLibrary}
                  className={styles.saveButton}
                >
                  Save to Library
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className={styles.downloadButton}
                >
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    setSilhouettes([]);
                    setPoseNames([]);
                    setSequenceTitle('');
                    setSequenceSubtitle('');
                    setSequenceDuration('');
                    setSequencePoseCount(0);
                    setSelectedCategory('');
                    setSelectedLabel('Yoga');
                    setSequencePrivacy('private');
                    setFilename('');
                    setSelectedFile(null);
                  }}
                  className={styles.clearButton}
                >
                  Clear Sequence
                </button>
              </div>
            )}
          </>
        )}

        <div className={styles.guidelines}>
          <h2 className={styles.guidelinesTitle}>🎥 Video Guidelines</h2>
          <ul className={styles.guidelinesList}>
            <li>Record in front of a <strong>neutral, uncluttered background</strong>, plain walls work best.</li>
            <li>Avoid <strong>direct sunlight</strong> or strong shadow contrast. Consistent lighting helps generate clean silhouettes.</li>
            <li>Ensure your <strong>full body remains in the frame</strong> throughout the sequence.</li>
            <li>Wear clothes that contrast well with the background.</li>
            <li>For faster upload and processing, we recommend uploading <strong>MP4 files</strong> (smaller and instantly compatible).</li>
            <li>Maximum file size: <strong>100MB</strong>. For best results, keep videos under 2 minutes.</li>
          </ul>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default UploadPage;

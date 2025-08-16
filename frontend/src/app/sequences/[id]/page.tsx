'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, Download, Share2, Calendar, Clock, Tag, Layers, Edit, Trash2, Plus, X, GripVertical } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import styles from '@/styles/SequenceDetail.module.scss';
import { svg2pdf } from 'svg2pdf.js';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

interface PoseData {
  filePath: string;
  poseName: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Sequence {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  duration: string;
  poseCount: number;
  poses: PoseData[];
  category?: string;
  privacy?: 'private' | 'public';
  industryLabel?: string;
}

export default function SequenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sequenceId = params.id as string;
  
  // Available industry labels
  const AVAILABLE_INDUSTRY_LABELS = [
    'Yoga', 'Pilates', 'Physical Therapy', 'Chiropractic', 
    'Dance', 'Martial Arts', 'Personal Training', 'Occupational Therapy'
  ];
  
  // Debug logging
  console.log('Params object:', params);
  console.log('Sequence ID:', sequenceId);
  
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false); // TODO: Implement when auth is implemented
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIndustryLabel, setEditIndustryLabel] = useState('');
  const [editPrivacy, setEditPrivacy] = useState<'private' | 'public'>('private');
  const [editPoseNames, setEditPoseNames] = useState<string[]>([]);
  const [editPoses, setEditPoses] = useState<{filePath: string, poseName: string}[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // DraggablePose component for editing
  const DraggablePose = ({ id, poseName, image, index, onDelete, onNameChange }: {
    id: string;
    poseName: string;
    image: string;
    index: number;
    onDelete: (index: number) => void;
    onNameChange: (index: number, value: string) => void;
  }) => {
    const handleDragStart = (e: React.DragEvent) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', index.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const draggedIndex = parseInt(e.dataTransfer.getData('text/html'));
      if (draggedIndex !== index) {
        handleDragEnd(draggedIndex, index);
      }
    };

    return (
      <div 
        className={`${styles.draggablePose} ${draggedIndex === index ? styles.dragging : ''}`}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className={styles.gripHandle}>
          <GripVertical size={16} />
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

  // Drag and drop functions
  const handleDragEnd = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newPoses = [...editPoses];
    const newPoseNames = [...editPoseNames];
    
    // Remove the dragged item
    const [draggedPose] = newPoses.splice(fromIndex, 1);
    const [draggedPoseName] = newPoseNames.splice(fromIndex, 1);
    
    // Insert at new position
    newPoses.splice(toIndex, 0, draggedPose);
    newPoseNames.splice(toIndex, 0, draggedPoseName);
    
    setEditPoses(newPoses);
    setEditPoseNames(newPoseNames);
    setDraggedIndex(null);
  };

  // Add DOMParser for PDF generation
  const DOMParser = typeof window !== 'undefined' ? window.DOMParser : null;

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8000/sequences/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    const fetchSequence = async () => {
      try {
        console.log('Fetching sequence with ID:', sequenceId); // Debug log
        
        if (!sequenceId) {
          setError('No sequence ID provided');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`http://localhost:8000/sequences/${sequenceId}`);
        console.log('Sequence response:', response.data); // Debug log
        const sequenceData = response.data;
        setSequence(sequenceData);
        
        // Populate edit fields
        setEditTitle(sequenceData.name);
        setEditDescription(sequenceData.description || '');
        setEditCategory(sequenceData.category || '');
        setEditIndustryLabel(sequenceData.industryLabel || 'Yoga');
        setEditPrivacy(sequenceData.privacy || 'private');
        setEditPoseNames(sequenceData.poses?.map((pose: any) => pose.poseName) || []);
        setEditPoses(sequenceData.poses || []);
        
        // Fetch categories for dropdown
        fetchCategories();
        
        // TODO: Check if current user is the owner when auth is implemented
        // setIsOwner(response.data.userId === currentUserId);
        
      } catch (error: any) {
        console.error('Failed to fetch sequence:', error);
        if (error.response?.status === 404) {
          setError('Sequence not found');
        } else {
          setError(error.message || 'Failed to fetch sequence');
        }
      } finally {
        setLoading(false);
      }
    };

    if (sequenceId) {
      fetchSequence();
    } else {
      console.log('No sequenceId available yet'); // Debug log
      setError('No sequence ID provided');
      setLoading(false);
    }
  }, [sequenceId]);

  const handleDownloadPDF = async () => {
    if (!sequence) return;

    try {
      const pdf = new (await import('jspdf')).default('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const maxWidth = 120;
      const spacingX = 20;
      const spacingY = 20;
      let x = spacingX;
      let y = spacingY;

      // Add sequence title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(176, 51, 106);
      const titleWidth = pdf.getTextWidth(sequence.name);
      const titleX = (pageWidth - titleWidth) / 2;
      pdf.text(sequence.name, titleX, y + 30);
      y += 50;



      // Add metadata
      pdf.setFontSize(12);
      pdf.setTextColor(100);
      const creationDate = new Date(sequence.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const metadataText = `${sequence.duration} • ${sequence.poseCount} poses • ${creationDate}`;
      const metadataWidth = pdf.getTextWidth(metadataText);
      const metadataX = (pageWidth - metadataWidth) / 2;
      pdf.text(metadataText, metadataX, y + 15);
      y += 30;

      // Add poses
      if (sequence.poses && sequence.poses.length > 0) {
        y += 20;
        
        for (let i = 0; i < sequence.poses.length; i++) {
          const pose = sequence.poses[i];
          
          try {
            if (pose.filePath) {
              console.log(`Fetching SVG from: http://localhost:8000/${pose.filePath}`); // Debug log
              const res = await fetch(`http://localhost:8000/${pose.filePath}`);
              const svgText = await res.text();
              const parser = new DOMParser!();
              const svgDoc = parser.parseFromString(svgText, 'image/svg+xml').documentElement;
              svgDoc.setAttribute('width', `${maxWidth}px`);
              svgDoc.setAttribute('height', `${maxWidth}px`);
              await svg2pdf(svgDoc, pdf, { x, y });

              // Add pose name below the image
              if (pose.poseName) {
                pdf.setFontSize(10);
                const textWidth = pdf.getTextWidth(pose.poseName);
                const centerX = x + maxWidth / 2 - textWidth / 2;
                pdf.setFontSize(9);
                pdf.setTextColor(100);
                pdf.text(pose.poseName, centerX, y + maxWidth + 15);
              }

              // Move to next position
              x += maxWidth + spacingX;
              if (x + maxWidth > pageWidth - spacingX) {
                x = spacingX;
                y += maxWidth + spacingY + 30; // Extra space for pose names
                if (y + maxWidth > pageHeight - spacingY) {
                  pdf.addPage();
                  y = spacingY;
                }
              }
            }
          } catch (error) {
            console.error(`Failed to add pose ${i}:`, error);
            console.error(`Pose filePath: ${pose.filePath}`);
            console.error(`Full URL: http://localhost:8000/${pose.filePath}`);
            // Continue with next pose
            x += maxWidth + spacingX;
            if (x + maxWidth > pageWidth - spacingX) {
              x = spacingX;
              y += maxWidth + spacingY + 30;
            }
          }
        }
      }

      // Save the PDF
      const filename = `${sequence.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`;
      pdf.save(filename);
      
    } catch (error: any) {
      console.error('Failed to generate PDF:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to generate PDF. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleShare = async () => {
    if (!sequence) return;

    try {
      // Generate PDF using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(50);
      pdf.text(sequence.name, pageWidth / 2, 30, { align: 'center' });
      
      // Add sequence info
      pdf.setFontSize(10);
      pdf.setTextColor(80);
      let yPosition = 70;
      
      pdf.text(`Duration: ${sequence.duration}`, 20, yPosition);
      pdf.text(`Poses: ${sequence.poseCount}`, 20, yPosition + 8);
      pdf.text(`Category: ${sequence.category || 'None'}`, 20, yPosition + 16);
      pdf.text(`Industry: ${sequence.industryLabel || 'Yoga'}`, 20, yPosition + 24);
      pdf.text(`Privacy: ${sequence.privacy}`, 20, yPosition + 32);
      
      // Add poses grid
      yPosition += 50;
      const maxWidth = 40;
      const spacingX = 10;
      const spacingY = 15;
      let x = 20;
      let y = yPosition;
      
      for (let i = 0; i < sequence.poses.length; i++) {
        const pose = sequence.poses[i];
        
        try {
          // Fetch SVG content
          const response = await fetch(`http://localhost:8000/${pose.filePath}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const svgText = await response.text();
          const parser = new window.DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgElement = svgDoc.documentElement;
          
          if (svgElement) {
            svgElement.setAttribute('width', `${maxWidth}px`);
            svgElement.setAttribute('height', `${maxWidth}px`);
            await svg2pdf(svgElement, pdf, { x, y });
            
            // Add pose name below the image
            if (pose.poseName) {
              pdf.setFontSize(10);
              const textWidth = pdf.getTextWidth(pose.poseName);
              const centerX = x + maxWidth / 2 - textWidth / 2;
              pdf.setFontSize(9);
              pdf.setTextColor(100);
              pdf.text(pose.poseName, centerX, y + maxWidth + 15);
            }
            
            // Move to next position
            x += maxWidth + spacingX;
            if (x + maxWidth > pageWidth - spacingX) {
              x = 20;
              y += maxWidth + spacingY + 30;
              if (y + maxWidth > pageHeight - spacingY) {
                pdf.addPage();
                y = 20;
              }
            }
          }
        } catch (error) {
          console.error(`Failed to add pose ${i}:`, error);
          // Continue with next pose
          x += maxWidth + spacingX;
          if (x + maxWidth > pageWidth - spacingX) {
            x = 20;
            y += maxWidth + spacingY + 30;
          }
        }
      }
      
      // Convert PDF to blob for sharing
      const pdfBlob = pdf.output('blob') as Blob;
      const pdfFile = new File([pdfBlob], `${sequence.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`, { type: 'application/pdf' });
      
      // Try to use Web Share API first (for mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `${sequence.name} - Yoga Sequence`,
          text: `Check out this movement sequence: ${sequence.name}`,
          files: [pdfFile]
        });
      } else {
        // Fallback: download the PDF for manual sharing
        const filename = `${sequence.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`;
        pdf.save(filename);
        
        Swal.fire({
          title: 'PDF Downloaded!',
          text: 'The PDF has been downloaded. You can now share it manually.',
          icon: 'success',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
      }
      
    } catch (error) {
      console.error('Failed to share PDF:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to generate PDF for sharing. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset edit fields to original values
    if (sequence) {
      setEditTitle(sequence.name);
      setEditDescription(sequence.description || '');
      setEditCategory(sequence.category || '');
      setEditIndustryLabel(sequence.industryLabel || 'Yoga');
      setEditPrivacy(sequence.privacy || 'private');
      setEditPoseNames(sequence.poses?.map((pose: any) => pose.poseName) || []);
      setEditPoses(sequence.poses || []);
    }
  };

  const handleSaveEdit = async () => {
    if (!sequence) return;

    try {
      // Validate required fields
      if (!editTitle.trim()) {
        Swal.fire({
          title: 'Required Field Missing',
          text: 'Please enter a sequence title.',
          icon: 'warning',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
        return;
      }

      // Update sequence data
      const updatedSequence = {
        ...sequence,
        name: editTitle.trim(),
        description: editDescription,
        category: editCategory || undefined,
        industryLabel: editIndustryLabel,
        privacy: editPrivacy,
        poseCount: editPoses.length, // Update pose count
        poses: editPoses.map((pose: any, index: number) => ({
          ...pose,
          poseName: editPoseNames[index] || pose.poseName
        }))
      };

      // Send update to backend
      const response = await axios.put(`http://localhost:8000/sequences/${sequenceId}`, updatedSequence);
      
      // Update local state
      setSequence(response.data);
      setIsEditing(false);
      
      Swal.fire({
        title: 'Updated!',
        text: 'Sequence has been updated successfully.',
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
      
    } catch (error: any) {
      console.error('Failed to update sequence:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update sequence. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    }
  };

  // Drag and drop functions
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newPoses = [...editPoses];
    const newPoseNames = [...editPoseNames];
    
    // Remove dragged item from original position
    const draggedPose = newPoses[draggedIndex];
    const draggedName = newPoseNames[draggedIndex];
    newPoses.splice(draggedIndex, 1);
    newPoseNames.splice(draggedIndex, 1);
    
    // Insert at new position
    newPoses.splice(index, 0, draggedPose);
    newPoseNames.splice(index, 0, draggedName);
    
    setEditPoses(newPoses);
    setEditPoseNames(newPoseNames);
    setDraggedIndex(index);
  };


  const handleDeletePose = (index: number) => {
    const newPoses = editPoses.filter((_, i) => i !== index);
    const newPoseNames = editPoseNames.filter((_, i) => i !== index);
    setEditPoses(newPoses);
    setEditPoseNames(newPoseNames);
    
    // Update the sequence's pose count
    if (sequence) {
      setSequence({
        ...sequence,
        poseCount: newPoses.length
      });
    }
  };

  const handlePoseNameChange = (index: number, newName: string) => {
    const newPoseNames = [...editPoseNames];
    newPoseNames[index] = newName;
    setEditPoseNames(newPoseNames);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await axios.post('http://localhost:8000/sequences/categories/', {
        name: newCategoryName.trim(),
        description: newCategoryDescription
      });
      
      setEditCategory(response.data.name);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowNewCategoryForm(false);
      
      Swal.fire({
        title: 'Category Created!',
        text: 'New category has been added.',
        icon: 'success',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
      
    } catch (error: any) {
      console.error('Failed to create category:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to create category. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    }
  };

  const handleDelete = async () => {
    if (!sequence) return;

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
        await axios.delete(`http://localhost:8000/sequences/${sequenceId}`);
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Sequence has been deleted.',
          icon: 'success',
          confirmButtonColor: '#b8336a',
          confirmButtonText: 'OK',
        });
        
        router.push('/sequences');
      }
    } catch (error: any) {
      console.error('Failed to delete sequence:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete sequence. Please try again.',
        icon: 'error',
        confirmButtonColor: '#b8336a',
        confirmButtonText: 'OK',
      });
    }
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />
        <section className={styles.loadingSection}>
          <div className={styles.loadingSpinner}>⏳</div>
          <p>Loading sequence...</p>
        </section>
        <Footer />
      </main>
    );
  }

  if (error || !sequence) {
    return (
      <main className={styles.main}>
        <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />
        <section className={styles.errorSection}>
          <h1>Sequence Not Found</h1>
          <p>{error || 'The sequence you are looking for does not exist.'}</p>
          <Link href="/sequences" className={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Sequences
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />
      
      <section className={styles.sequenceSection}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <Link href="/sequences" className={styles.backLink}>
              <ArrowLeft size={20} />
              Back to Sequences
            </Link>
            
            <div className={styles.titleSection}>
              <h1 className={styles.title}>{sequence.name}</h1>
            </div>
          </div>

          {/* Sequence Metadata */}
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <Clock size={20} />
              <span>{sequence.duration}</span>
            </div>
            <div className={styles.metaItem}>
              <Layers size={20} />
              <span>{sequence.poseCount} poses</span>
            </div>
            <div className={styles.metaItem}>
              <Calendar size={20} />
              <span>Created: {new Date(sequence.createdAt).toLocaleDateString()}</span>
            </div>
            {sequence.industryLabel && (
              <div className={styles.metaItem}>
                <Tag size={20} />
                <span>{sequence.industryLabel}</span>
              </div>
            )}
            {sequence.category && (
              <div className={styles.metaItem}>
                <Tag size={20} />
                <span>{sequence.category}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {sequence.description && (
            <div className={styles.descriptionSection}>
              <p className={styles.description}>
                {sequence.description.length > 100 
                  ? `${sequence.description.substring(0, 100)}...` 
                  : sequence.description
                }
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button
              onClick={handleDownloadPDF}
              className={styles.actionButton}
              title="Download PDF"
            >
              <Download size={18} />
              Download PDF
            </button>
            
            <button
              onClick={handleShare}
              className={styles.actionButton}
              title="Share PDF"
            >
              <Share2 size={18} />
              Share PDF
            </button>

            <button
              onClick={handleEdit}
              className={styles.actionButton}
              title="Edit Sequence"
            >
              <Edit size={18} />
              Edit
            </button>
            
            {isOwner && (
              <button
                onClick={handleDelete}
                className={styles.actionButton}
                title="Delete Sequence"
              >
                <Trash2 size={18} />
                Delete
              </button>
            )}
          </div>

          {isEditing ? (
            /* Edit Form */
            <div className={styles.editForm}>
              <h2 className={styles.editTitle}>Edit Sequence</h2>
              
              {/* Basic Information */}
              <div className={styles.formSection}>
                <h3>Basic Information</h3>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="editTitle" className={styles.label}>Sequence Title *</label>
                    <input
                      type="text"
                      id="editTitle"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                  
                  <div className={styles.inputGroup}>
                    <label htmlFor="editDescription" className={styles.label}>Description</label>
                    <textarea
                      id="editDescription"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className={styles.textarea}
                      rows={3}
                    />
                  </div>
                </div>
                

              </div>

              {/* Classification and Privacy */}
              <div className={styles.formSection}>
                <h3>Classification & Privacy</h3>
                <div className={styles.inputRowThree}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="editCategory" className={styles.label}>Category</label>
                    <div className={styles.categoryInput}>
                      <select
                        id="editCategory"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className={styles.select}
                      >
                        <option value="">Select a category</option>
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

                  <div className={styles.inputGroup}>
                    <label htmlFor="editIndustryLabel" className={styles.label}>Industry Label *</label>
                    <select
                      id="editIndustryLabel"
                      value={editIndustryLabel}
                      onChange={(e) => setEditIndustryLabel(e.target.value)}
                      className={styles.select}
                      required
                    >
                      {AVAILABLE_INDUSTRY_LABELS.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="editPrivacy" className={styles.label}>Privacy Setting *</label>
                    <div className={styles.privacyContainer}>
                      <label className={styles.privacyOption}>
                        <input
                          type="radio"
                          name="editPrivacy"
                          value="private"
                          checked={editPrivacy === 'private'}
                          onChange={(e) => setEditPrivacy(e.target.value as 'private' | 'public')}
                          className={styles.radio}
                        />
                        <span className={styles.privacyLabel}>
                          <span className={styles.privacyIcon}>🔒</span>
                          Private
                        </span>
                      </label>
                      <label className={styles.privacyOption}>
                        <input
                          type="radio"
                          name="editPrivacy"
                          value="public"
                          checked={editPrivacy === 'public'}
                          onChange={(e) => setEditPrivacy(e.target.value as 'private' | 'public')}
                          className={styles.radio}
                        />
                        <span className={styles.privacyLabel}>
                          <span className={styles.privacyIcon}>🌍</span>
                          Public
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Category Form */}
              {showNewCategoryForm && (
                <div className={styles.newCategoryForm}>
                  <h4>Create New Category</h4>
                  <div className={styles.newCategoryInputs}>
                    <input
                      type="text"
                      placeholder="Category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className={styles.input}
                    />
                    <div className={styles.newCategoryActions}>
                      <button onClick={handleCreateCategory} className={styles.createButton}>
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowNewCategoryForm(false);
                          setNewCategoryName('');
                          setNewCategoryDescription('');
                        }}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Poses */}
              <div className={styles.formSection}>
                <p className={styles.helpText}>
                  Drag poses to reorder them, click the red ✕ to delete poses, and edit pose names by typing in the input fields.
                </p>
                
                <div className={styles.grid}>
                  {editPoses.map((pose, index) => (
                    <DraggablePose
                      key={index}
                      id={`pose-${index}`}
                      poseName={editPoseNames[index] || ''}
                      image={pose.filePath}
                      index={index}
                      onDelete={handleDeletePose}
                      onNameChange={handlePoseNameChange}
                    />
                  ))}
                </div>
              </div>

              {/* Edit Actions */}
              <div className={styles.editActions}>
                <button onClick={handleSaveEdit} className={styles.saveButton}>
                  Save Changes
                </button>
                <button onClick={handleCancelEdit} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View Mode - Poses Grid */
            <div className={styles.posesSection}>
              <div className={styles.posesGrid}>
                {sequence.poses.map((pose, index) => (
                  <div key={index} className={styles.poseCard}>
                    <div className={styles.poseImage}>
                      <img 
                        src={`http://localhost:8000/${pose.filePath}`}
                        alt={pose.poseName}
                        className={styles.poseSvg}
                      />
                    </div>
                    <div className={styles.poseInfo}>
                      <h3 className={styles.poseName}>{pose.poseName}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

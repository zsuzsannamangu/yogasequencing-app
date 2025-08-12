'use client';

import React, { useState } from 'react';
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
import { GripVertical } from 'lucide-react';
import styles from '@/styles/Upload.module.scss';

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
  const labelHeight = 16;
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

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
        confirmButtonColor: '#f87171',
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
      return       Swal.fire({
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

    pdf.save('yoga_sequence_vector.pdf');
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
  };

  return (
            <main className={styles.main}>
          <Navbar showUserMenu={true} firstName="User" lastName="Name" profileImage={null} />

          <section className={styles.section}>
        <h1 className={styles.title}>Upload and Visualize Your Practice</h1>
        <p className={styles.description}>
          Upload your recorded flow to generate a printable visual sequence. As a guest, you can create and download your sequences. If you want to save your flows and return to them later, register for an account and build your own library.
        </p>

        <div className={styles.buttonContainer}>
          <label className={styles.fileLabel}>
            Choose File
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/x-m4v,video/webm,video/ogg"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
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
          {silhouettes.length > 0 && (
            <button
              onClick={handleDownloadPDF}
              className={styles.downloadButton}
            >
              Download as PDF
            </button>
          )}
        </div>

        {loading ? (
          <p className={styles.loadingText}>Generating sequence...</p>
        ) : silhouettes.length === 0 ? (
          <p className={styles.emptyText}>Create your sequence!</p>
        ) : (
          <>
            <div className={styles.helpMessage}>
              <p>💡 <strong>Tip:</strong> You can drag poses to reorder them, click the red ✕ to delete poses, and edit pose names by typing in the input fields.</p>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (active.id !== over.id) {
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
          </>
        )}

        <div className={styles.guidelines}>
          <h2 className={styles.guidelinesTitle}>🎥 Video Guidelines</h2>
          <ul className={styles.guidelinesList}>
            <li>Record in front of a <strong>neutral, uncluttered background</strong> — plain walls work best.</li>
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

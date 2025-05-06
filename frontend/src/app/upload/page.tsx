'use client';

import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [silhouettes, setSilhouettes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [poseNames, setPoseNames] = useState<string[]>([]);
  const labelHeight = 16;

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      await axios.post('http://localhost:8000/upload', formData);
      setFilename(selectedFile.name);
      alert('Upload successful!');
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed');
    }
    setSilhouettes([]);
    setPoseNames([]);
  };

  const handleGenerate = async () => {
    if (!filename) return alert('Please upload a file first!');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/extract-silhouettes', null, {
        params: { filename },
      });
      setSilhouettes(res.data.files);
    } catch (err) {
      console.error('Failed to generate silhouettes', err);
      alert('Error generating silhouettes');
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
    <main className="bg-[#fde68a] text-[#111827] font-sans min-h-screen flex flex-col">
      <Navbar />

      <section className="flex-grow px-2 py-16 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl font-black mb-6">Upload and Visualize Your Practice</h1>
        <p className="text-lg mb-10 max-w-3xl mx-auto text-center">
          Upload your recorded flow to generate a printable visual sequence. As a guest, you can create and download your sequences. If you want to save your flows and return to them later, register for an account and build your own library.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <label className="px-6 py-2 bg-[#f87171] text-white rounded-full cursor-pointer hover:bg-[#ef4444] transition">
            Choose File
            <input
              type="file"
              accept="video/mp4"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                setSilhouettes([]);
                setPoseNames([]);
                setFilename('');
              }}

              className="hidden"
            />
          </label>
          {selectedFile && (
            <span className="text-sm text-[#111827] mt-2 block sm:inline">{selectedFile.name}</span>
          )}
          <button
            onClick={handleUpload}
            className="px-6 py-2 rounded-full bg-[#f87171] text-white hover:bg-[#ef4444] transition"
          >
            Upload
          </button>
          <button
            onClick={handleGenerate}
            disabled={!filename}
            className="px-6 py-2 rounded-full bg-[#60a5fa] text-white hover:bg-[#3b82f6] transition disabled:opacity-40"
          >
            Create Sequence
          </button>
          {silhouettes.length > 0 && (
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2 rounded-full bg-[#facc15] text-[#111827] hover:bg-[#eab308] transition"
            >
              Download as PDF
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-center text-lg">Generating sequence...</p>
        ) : silhouettes.length === 0 ? (
          <p className="text-center text-[#4b5563]">Please upload and generate.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-10">
            {silhouettes.map((filePath, idx) => (
              <div
                key={idx}
                className="relative flex flex-col items-center border border-[#111827] rounded shadow bg-white p-2"
              >
                <img
                  src={`http://localhost:8000/${filePath}`}
                  alt={`Pose ${idx + 1}`}
                  className="w-full max-w-[400px] h-auto"
                />
                <input
                  type="text"
                  value={poseNames[idx] || ''}
                  onChange={(e) => handlePoseNameChange(idx, e.target.value)}
                  placeholder={`Pose ${idx + 1}`}
                  className="mt-2 text-sm border border-[#111827] rounded px-2 py-1 w-full text-[#111827]"
                />
                <button
                  onClick={() => handleDeletePose(idx)}
                  className="absolute top-1 right-2 text-red-500 hover:text-red-700 text-lg font-bold"
                  title="Delete Pose"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

        )}
        <div className="bg-[#fef3c7] border border-[#111827] rounded-lg p-6 mb-12 text-left mx-auto my-12">
          <h2 className="text-2xl font-bold mb-4">🎥 Video Guidelines</h2>
          <ul className="list-disc list-inside space-y-2 text-[#1f2937] text-base leading-relaxed">
            <li>Record in front of a <strong>neutral, uncluttered background</strong> — plain walls work best.</li>
            <li>Avoid <strong>direct sunlight</strong> or strong shadow contrast. Consistent lighting helps generate clean silhouettes.</li>
            <li>Ensure your <strong>full body remains in the frame</strong> throughout the sequence.</li>
            <li>Wear clothes that contrast well with the background.</li>
            <li>Currently, only <strong>MP4 files</strong> are supported.</li>
            <li>Maximum file size: <strong>100MB</strong>. For best results, keep videos under 2 minutes.</li>
          </ul>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default UploadPage;

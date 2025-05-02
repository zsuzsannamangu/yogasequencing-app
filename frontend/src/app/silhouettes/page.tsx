'use client';

import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';

const SilhouettesPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState<string>(''); // for dynamic uploads
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

    const maxWidth = 100; // pose size
    const spacingX = 5;  // horizontal spacing
    const spacingY = 10;  // vertical spacing

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
        pdf.setFontSize(9); // font size
        pdf.setTextColor(100); // Subtle gray (0–255)
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
    <main className="bg-white text-green-700 font-sans min-h-screen px-6 py-16 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-10 text-green-800 text-center">Generate Your Pose Sequence</h1>

      {/* Upload + Generate Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
        <label className="px-6 py-2 bg-green-600 text-white rounded-full cursor-pointer hover:bg-green-700 transition">
          Choose File
          <input
            type="file"
            accept="video/mp4"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
        {selectedFile && (
          <span className="text-sm text-gray-700 mt-2 block text-center">{selectedFile.name}</span>
        )}

        <button
          onClick={handleUpload}
          className="px-6 py-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition"
        >
          Upload
        </button>
        <button
          onClick={handleGenerate}
          disabled={!filename}
          className="px-6 py-2 rounded-full bg-green-800 text-white hover:bg-green-900 transition disabled:opacity-40"
        >
          Create Sequence
        </button>
        {silhouettes.length > 0 && (
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
          >
            Download as PDF
          </button>
        )}
      </div>

      {/* Render Silhouettes */}
      {loading ? (
        <p className="text-center text-lg">Generating sequence...</p>
      ) : silhouettes.length === 0 ? (
        <p className="text-center text-gray-500">No silhouettes found. Please upload and generate.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {silhouettes.map((filePath, idx) => (
            <div
              key={idx}
              className="relative flex flex-col items-center border rounded shadow bg-white p-4"
            >
              <img
                src={`http://localhost:8000/${filePath}`}
                alt={`Pose ${idx + 1}`}
                className="w-full max-w-[250px] h-auto"
              />
              <input
                type="text"
                value={poseNames[idx] || ''}
                onChange={(e) => handlePoseNameChange(idx, e.target.value)}
                placeholder={`Pose ${idx + 1}`}
                className="mt-2 text-sm border rounded px-2 py-1 w-full text-green-800"
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
    </main>

  );
};

export default SilhouettesPage;

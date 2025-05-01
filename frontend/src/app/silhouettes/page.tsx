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
    const spacing = 20;
    const maxWidth = 150;
    let x = spacing;
    let y = spacing;

    for (const filePath of silhouettes) {
      const res = await fetch(`http://localhost:8000/${filePath}`);
      const svgText = await res.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml').documentElement;

      svgDoc.setAttribute('width', `${maxWidth}px`);
      svgDoc.setAttribute('height', `${maxWidth}px`);

      await svg2pdf(svgDoc, pdf, { x, y });

      x += maxWidth + spacing;
      if (x + maxWidth > pageWidth) {
        x = spacing;
        y += maxWidth + spacing;
      }
    }

    pdf.save('yoga_sequence_vector.pdf');
  };

  return (
    <main className="flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6">Generated Pose Silhouettes</h1>

      {/* Upload + Generate Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <input
          type="file"
          accept="video/mp4"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Upload
        </button>
        <button
          onClick={handleGenerate}
          disabled={!filename}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Sequence
        </button>
        {silhouettes.length > 0 && (
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Download as PDF
          </button>
        )}
      </div>

      {/* Render Silhouettes/Vector images */}
      {loading ? (
        <p>Generating sequence...</p>
      ) : silhouettes.length === 0 ? (
        <p>No silhouettes found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {silhouettes.map((filePath, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center bg-white aspect-square overflow-hidden"
            >
              <img
                src={`http://localhost:8000/${filePath}`}
                alt={`Pose ${idx + 1}`}
                className="w-full max-w-[300px] h-auto"
              />
              <p className="text-sm mt-2">{idx + 1}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default SilhouettesPage;

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, Download, Share2, Calendar, Clock, Tag, Layers, User } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import styles from '@/styles/BrowseDetail.module.scss';
import { svg2pdf } from 'svg2pdf.js';
import jsPDF from 'jspdf';
import Swal from 'sweetalert2';

interface PoseData {
    filePath: string;
    poseName: string;
}

interface UserInfo {
    id: string;
    first_name: string;
    last_name: string;
    profile_image?: string;
    business_name?: string;
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
    user?: UserInfo;
}

export default function BrowseSequenceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const sequenceId = params.id as string;

    // Debug logging
    console.log('Params object:', params);
    console.log('Sequence ID:', sequenceId);

    const [sequence, setSequence] = useState<Sequence | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add DOMParser for PDF generation
    const DOMParser = typeof window !== 'undefined' ? window.DOMParser : null;

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

            } catch (error: any) {
                console.error('Failed to fetch sequence:', error);
                if (error.response?.status === 404) {
                    setError('Sequence not found');
                } else {
                    setError('Failed to load sequence. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSequence();
    }, [sequenceId]);

    const handleDownloadPDF = async () => {
        if (!sequence) return;

        try {
            // Generate PDF using jsPDF
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
            const currentDate = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const metadataText = `${sequence.duration} • ${sequence.poseCount} poses • Downloaded ${currentDate}`;
            pdf.text(metadataText, pageWidth / 2, y + 15, { align: 'center' });
            y += 30;

            // Add poses
            if (sequence.poses && sequence.poses.length > 0) {
                y += 20;
                
                for (let i = 0; i < sequence.poses.length; i++) {
                const pose = sequence.poses[i];

                try {
                    // Fetch SVG content
                    const response = await fetch(`http://localhost:8000/${pose.filePath}`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    const svgText = await response.text();
                    const parser = new DOMParser!();
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
                    console.error(`Pose filePath: ${pose.filePath}`);
                    console.error(`Full URL: http://localhost:8000/${pose.filePath}`);
                    // Continue with next pose
                    x += maxWidth + spacingX;
                    if (x + maxWidth > pageWidth - spacingX) {
                        x = 20;
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
            // First generate the PDF
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
            const currentDate = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const metadataText = `${sequence.duration} • ${sequence.poseCount} poses • Downloaded ${currentDate}`;
            pdf.text(metadataText, pageWidth / 2, y + 15, { align: 'center' });
            y += 30;

            // Add poses
            if (sequence.poses && sequence.poses.length > 0) {
                y += 20;

            for (let i = 0; i < sequence.poses.length; i++) {
                const pose = sequence.poses[i];

                try {
                    // Fetch SVG content
                    const response = await fetch(`http://localhost:8000/${pose.filePath}`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    const svgText = await response.text();
                    const parser = new DOMParser!();
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
            }

            // Convert PDF to blob for sharing
            const pdfBlob = pdf.output('blob') as Blob;
            const pdfFile = new File([pdfBlob], `${sequence.name.replace(/[^a-zA-Z0-9]/g, '_')}_sequence.pdf`, { type: 'application/pdf' });

            // Try to use Web Share API first (for mobile devices)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                await navigator.share({
                    title: `${sequence.name} - Movement Sequence`,
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
                    <Link href="/browse" className={styles.backButton}>
                        <ArrowLeft size={16} />
                        Back to Browse
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
                        <Link href="/browse" className={styles.backLink}>
                            <ArrowLeft size={20} />
                            Back to Browse
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
                        {sequence.user && (
                            <div className={styles.metaItem}>
                                <User size={20} />
                                <Link href={`/profile/${sequence.user.id}`} className={styles.userLink}>
                                    <span>Uploaded by {sequence.user.first_name} {sequence.user.last_name.charAt(0)}.</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {sequence.description && (
                        <div className={styles.descriptionSection}>
                            <p className={styles.description}>{sequence.description}</p>
                        </div>
                    )}

                    {/* Poses Grid */}
                    <div className={styles.posesSection}>
                        <div className={styles.posesGrid}>
                            {sequence.poses.map((pose, index) => (
                                <div key={index} className={styles.poseCard}>
                                    <div className={styles.poseSilhouette}>
                                        <img
                                            src={`http://localhost:8000/${pose.filePath}`}
                                            alt={pose.poseName || `Pose ${index + 1}`}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const fallback = target.nextElementSibling as HTMLElement;
                                                if (fallback) {
                                                    fallback.style.display = 'block';
                                                }
                                            }}
                                        />
                                        <div className={styles.poseFallback} style={{ display: 'none' }}>
                                            <span>Pose {index + 1}</span>
                                        </div>
                                    </div>
                                    <p className={styles.poseName}>{pose.poseName || `Pose ${index + 1}`}</p>
                                </div>
                            ))}
                        </div>
                    </div>
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
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}

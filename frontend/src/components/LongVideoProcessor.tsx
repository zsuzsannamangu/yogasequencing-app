'use client';

import React, { useState } from 'react';
import axios from 'axios';
import styles from '@/styles/LongVideoProcessor.module.scss';

interface ProcessingJob {
    job_id: string;
    status: 'starting' | 'analyzing' | 'extracting_silhouettes' | 'completed' | 'error' | 'cancelled';
    progress: number;
    filename: string;
    error?: string;
    result?: {
        silhouette_files: string[];
        total_silhouettes: number;
        still_ranges: [number, number][];
        video_info: {
            fps: number;
            frame_count: number;
            duration: number;
            width: number;
            height: number;
        };
    };
}

interface LongVideoProcessorProps {
    filename: string;
    onComplete: (result: ProcessingJob['result']) => void;
    onError: (error: string) => void;
}

export default function LongVideoProcessor({ filename, onComplete, onError }: LongVideoProcessorProps) {
    const [job, setJob] = useState<ProcessingJob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [lastProgressUpdate, setLastProgressUpdate] = useState<number>(Date.now());
    const [isProgressStuck, setIsProgressStuck] = useState(false);

    const startProcessing = async () => {
        try {
            setIsProcessing(true);
            setProgressMessage('Starting video processing...');

            const response = await axios.post('http://localhost:8000/long-video/process-video', null, {
                params: { filename }
            });

            const jobId = response.data.job_id;
            setJob({ ...response.data, status: 'starting', progress: 0 });

            // Start polling for progress
            pollProgress(jobId);

        } catch (error: unknown) {
            console.error('Failed to start processing:', error);
            const errorMessage = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start video processing';
            onError(errorMessage);
            setIsProcessing(false);
        }
    };

    const pollProgress = async (jobId: string) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await axios.get(`http://localhost:8000/long-video/progress/${jobId}`);
                const jobData = response.data;

                // Check if progress has changed
                const currentTime = Date.now();
                const progressChanged = job?.progress !== jobData.progress;
                
                if (progressChanged) {
                    setLastProgressUpdate(currentTime);
                    setIsProgressStuck(false);
                } else {
                    // Check if progress has been stuck for more than 30 seconds
                    if (currentTime - lastProgressUpdate > 30000) {
                        setIsProgressStuck(true);
                    }
                }

                setJob(jobData);

                // Update progress message based on status with more detailed messages
                switch (jobData.status) {
                    case 'starting':
                        setProgressMessage('Initializing video processing...');
                        break;
                    case 'analyzing':
                        setProgressMessage('Analyzing video for motion patterns...');
                        break;
                    case 'extracting_silhouettes':
                        if (isProgressStuck) {
                            setProgressMessage('Extracting silhouettes... This may take several minutes for long videos. Please be patient.');
                        } else {
                            setProgressMessage('Extracting silhouettes from detected poses...');
                        }
                        break;
                    case 'completed':
                        setProgressMessage('Processing completed successfully!');
                        clearInterval(pollInterval);
                        setIsProcessing(false);
                        setIsProgressStuck(false);
                        onComplete(jobData.result);
                        break;
                    case 'error':
                        setProgressMessage(`Error: ${jobData.error}`);
                        clearInterval(pollInterval);
                        setIsProcessing(false);
                        setIsProgressStuck(false);
                        onError(jobData.error || 'Unknown error occurred');
                        break;
                    case 'cancelled':
                        setProgressMessage('Processing cancelled');
                        clearInterval(pollInterval);
                        setIsProcessing(false);
                        setIsProgressStuck(false);
                        break;
                }

            } catch (error) {
                console.error('Error polling progress:', error);
                clearInterval(pollInterval);
                setIsProcessing(false);
                setIsProgressStuck(false);
                onError('Failed to check processing status');
            }
        }, 2000); // Poll every 2 seconds
    };

    const cancelProcessing = async () => {
        if (!job?.job_id) return;

        try {
            await axios.delete(`http://localhost:8000/long-video/job/${job.job_id}`);
            setProgressMessage('Processing cancelled');
            setIsProcessing(false);
        } catch (error) {
            console.error('Failed to cancel processing:', error);
        }
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10b981';
            case 'error': return '#ef4444';
            case 'cancelled': return '#f59e0b';
            default: return '#3b82f6';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.actions}>
                    {!isProcessing && !job && (
                        <button
                            className={styles.startButton}
                            onClick={startProcessing}
                        >
                            Start Processing
                        </button>
                    )}
                </div>
                {job && <p>Processing: {filename}</p>}
            </div>

            {job && (
                <div className={styles.jobInfo}>
                    <div className={styles.statusRow}>
                        <span className={styles.statusLabel}>Status:</span>
                        <span
                            className={styles.status}
                            style={{ color: getStatusColor(job.status) }}
                        >
                            {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>

                    {job.result?.video_info && (
                        <div className={styles.videoInfo}>
                            <h4>Video Information</h4>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Duration:</span>
                                    <span>{formatDuration(job.result.video_info.duration)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Resolution:</span>
                                    <span>{job.result.video_info.width} × {job.result.video_info.height}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>FPS:</span>
                                    <span>{job.result.video_info.fps.toFixed(1)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Total Frames:</span>
                                    <span>{job.result.video_info.frame_count.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {job.result && (
                        <div className={styles.resultInfo}>
                            <h4>Processing Results</h4>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Silhouettes Found:</span>
                                    <span>{job.result.total_silhouettes}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Still Ranges:</span>
                                    <span>{job.result.still_ranges.length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {job && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div
                            className={`${styles.progressFill} ${isProgressStuck ? styles.progressPulse : ''}`}
                            style={{ width: `${job?.progress || 0}%` }}
                        />
                    </div>
                    <div className={styles.progressText}>
                        {progressMessage} ({job?.progress || 0}%)
                    </div>
                    {isProgressStuck && isProcessing && (
                        <div className={styles.stuckProgressActions}>
                            <p className={styles.stuckProgressMessage}>
                                Processing is taking longer than expected. You can wait or cancel if needed.
                            </p>
                            <button
                                className={styles.cancelButton}
                                onClick={cancelProcessing}
                            >
                                Cancel Processing
                            </button>
                        </div>
                    )}
                </div>
            )}


        </div>
    );
}

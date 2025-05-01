import React from 'react';
import PoseSVG from '@/components/PoseSVG';
import poseData from '@/assets/yoga_test_video.mp4_poses.json';

const LibraryPage = () => {
    // Map the first frame's keypoints, keypoints are already normalized (0 to 1).
    const firstFrameKeypoints = poseData[20].keypoints.map(([x, y, score]) => ({
        x,
        y,
        score,
    }));

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-4">Yoga Pose Preview</h1>
        <PoseSVG keypoints={firstFrameKeypoints} />
        </main>
    );
};

export default LibraryPage;

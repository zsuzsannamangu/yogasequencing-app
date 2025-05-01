import React from 'react';

interface Keypoint {
    x: number;
    y: number;
    score: number;
}

interface PoseSVGProps {
    keypoints: Keypoint[];
}

const getMidpoint = (a: Keypoint, b: Keypoint) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
});

const getAngle = (a: Keypoint, b: Keypoint) => {
    return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
};

const getDistance = (a: Keypoint, b: Keypoint) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};

const drawLimb = (
    a: Keypoint,
    b: Keypoint,
    i: number,
    thickness = 0.02,
    color = 'black'
) => {
    if (a.score < 0.1 || b.score < 0.1) return null;

    const length = getDistance(a, b);
    const angle = getAngle(a, b);
    const mid = getMidpoint(a, b);

    return (
        <rect
            key={`limb-${i}`}
            x={mid.x - length / 2}
            y={mid.y - thickness / 2}
            width={length}
            height={thickness}
            fill={color}
            transform={`rotate(${angle}, ${mid.x}, ${mid.y})`}
        />
    );
};

const PoseSVG: React.FC<PoseSVGProps> = ({ keypoints }) => {
    const leftShoulder = keypoints[5];
    const rightShoulder = keypoints[6];
    const leftHip = keypoints[11];
    const rightHip = keypoints[12];
    const head = keypoints[0];

    let uprightAngle = 0;

    // Calculate shoulder angle if both shoulders are reliable
    if (leftShoulder?.score > 0.2 && rightShoulder?.score > 0.2) {
        uprightAngle = -getAngle(leftShoulder, rightShoulder);

        // Flip if head is below average hip height
        if (
            head?.score > 0.2 &&
            leftHip?.score > 0.2 &&
            rightHip?.score > 0.2
        ) {
            const avgHipY = (leftHip.y + rightHip.y) / 2;
            if (head.y > avgHipY) {
                uprightAngle += 180;
            }
        }
    }

    console.log('Upright angle:', uprightAngle);

    return (
        <svg
            width="300"
            height="400"
            viewBox="0 0 1 1.3"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Optional debug box */}
            <rect x="0" y="0" width="1" height="1.3" fill="pink" opacity="0.05" />
            {keypoints.map((pt, i) =>
                pt.score > 0.05 ? (
                    <circle
                        key={`pt-${i}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={0.01}
                        fill="red"
                    />
                ) : null
            )}

            <g
                transform={`
      translate(0.5, 0.65)
      rotate(${uprightAngle})
      scale(1, -1)
      translate(-0.5, -0.65)
    `}
            >
                {/* Head */}
                {keypoints[0]?.score > 0.2 && (
                    <circle
                        cx={keypoints[0].x}
                        cy={keypoints[0].y}
                        r={0.03}
                        fill="#444"
                    />
                )}

                {/* Limbs */}
                {[
                    [5, 7], [7, 9], // Left arm
                    [6, 8], [8, 10], // Right arm
                    [11, 13], [13, 15], // Left leg
                    [12, 14], [14, 16], // Right leg
                    [5, 6], // shoulders
                    [11, 12], // hips
                ].map(([a, b], i) => drawLimb(keypoints[a], keypoints[b], i))}

                {/* Torso */}
                {keypoints[5]?.score > 0.2 &&
                    keypoints[6]?.score > 0.2 &&
                    keypoints[11]?.score > 0.2 &&
                    keypoints[12]?.score > 0.2 && (
                        <polygon
                            points={`${keypoints[5].x},${keypoints[5].y} ${keypoints[6].x},${keypoints[6].y} ${keypoints[12].x},${keypoints[12].y} ${keypoints[11].x},${keypoints[11].y}`}
                            fill="#888"
                        />
                    )}
            </g>
        </svg>

    );
};

export default PoseSVG;

import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { GestureType } from '../types';

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<HandLandmarker | null>(null);
  const requestRef = useRef<number>();
  const { setGesture, cameraActive, setCameraActive, setHandPosition, setHandOpenness, setHandRotation } = useStore();

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    const initLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      setLandmarker(handLandmarker);
    };
    initLandmarker();
  }, []);

  const detect = () => {
    if (videoRef.current && videoRef.current.readyState >= 2 && landmarker) {
      const video = videoRef.current;
      const results = landmarker.detectForVideo(video, performance.now());
      
      let detectedGesture: GestureType = 'None';
      
      // Update canvas dimensions if needed
      if (canvasRef.current && (canvasRef.current.width !== video.videoWidth)) {
         canvasRef.current.width = video.videoWidth;
         canvasRef.current.height = video.videoHeight;
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      if (results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // Debug drawing
        if (ctx) drawHand(landmarks, ctx);

        // --- 1. Track Hand Position (Centroid) ---
        const p0 = landmarks[0]; // Wrist
        const p5 = landmarks[5]; // Index MCP
        const p9 = landmarks[9]; // Middle MCP (Needed for Pitch)
        const p17 = landmarks[17]; // Pinky MCP
        
        const centerX = (p0.x + p5.x + p17.x) / 3;
        const centerY = (p0.y + p5.y + p17.y) / 3;

        // Depth approximation
        const p12 = landmarks[12]; // Middle finger tip
        const dx = p12.x - p0.x;
        const dy = p12.y - p0.y;
        const handSize = Math.sqrt(dx * dx + dy * dy);
        const normalizedZ = Math.min(Math.max((handSize - 0.1) / 0.4, 0), 1);
        
        setHandPosition({ x: centerX, y: centerY, z: normalizedZ });

        // --- 2. Calculate Continuous "Openness" ---
        const wrist = landmarks[0];
        const middleKnuckle = landmarks[9];
        const handScale = Math.hypot(middleKnuckle.x - wrist.x, middleKnuckle.y - wrist.y);
        
        const tipIndices = [4, 8, 12, 16, 20];
        let totalTipDist = 0;
        
        tipIndices.forEach(idx => {
            const dist = Math.hypot(landmarks[idx].x - wrist.x, landmarks[idx].y - wrist.y);
            totalTipDist += dist;
        });
        
        const avgRatio = (totalTipDist / 5) / handScale;
        const openness = Math.min(Math.max((avgRatio - 1.0) / 1.2, 0), 1);
        setHandOpenness(openness);

        // --- 3. Calculate Rotation (Roll, Pitch, Yaw) ---
        // Roll (Z): Angle between Index Base (5) and Pinky Base (17) in XY plane
        const roll = Math.atan2(p17.y - p5.y, p17.x - p5.x);
        
        // Yaw (Y): Rotation left/right. Estimated by Z difference between Pinky(17) and Index(5)
        const yaw = (p17.z - p5.z) * 3;

        // Pitch (X): Tilt forward/back. Estimated by Z difference between Middle(9) and Wrist(0)
        const pitch = (p9.z - p0.z) * 3;

        setHandRotation({ x: pitch, y: yaw, z: -roll });

        // --- 4. Discrete Gesture Logic ---
        if (openness > 0.8) {
          detectedGesture = 'Open_Palm';
        } else if (openness < 0.2) { 
          detectedGesture = 'Closed_Fist';
        }
        
      } else {
         // No hand detected
      }
      
      setGesture(detectedGesture);
    }
    requestRef.current = requestAnimationFrame(detect);
  };

  const drawHand = (landmarks: any[], ctx: CanvasRenderingContext2D) => {
    // Connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], 
      [0, 5], [5, 6], [6, 7], [7, 8], 
      [0, 9], [9, 10], [10, 11], [11, 12], 
      [0, 13], [13, 14], [14, 15], [15, 16], 
      [0, 17], [17, 18], [18, 19], [19, 20] 
    ];
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    for (const [start, end] of connections) {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      ctx.beginPath();
      ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
      ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
      ctx.stroke();
    }
  };

  const toggleCamera = async () => {
    if (!cameraActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240, frameRate: 30 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
             requestRef.current = requestAnimationFrame(detect);
          });
        }
        setCameraActive(true);
      } catch (err) {
        console.error("Error accessing webcam:", err);
        alert("Cannot access webcam. Please check permissions.");
      }
    } else {
       if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
         videoRef.current.srcObject = null;
       }
       if (requestRef.current) cancelAnimationFrame(requestRef.current);
       setCameraActive(false);
       setGesture('None');
       setHandOpenness(0);
       setHandRotation({ x: 0, y: 0, z: 0 });
    }
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className={`glass-panel p-1 rounded-lg transition-all duration-500 relative ${cameraActive ? 'w-48 h-36 opacity-100' : 'w-0 h-0 opacity-0 overflow-hidden'}`}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded transform -scale-x-100" />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform -scale-x-100 pointer-events-none" />
      </div>
      <button 
        onClick={toggleCamera}
        className="glass-panel px-4 py-2 rounded-full text-white text-xs font-bold hover:bg-white/20 transition-colors uppercase tracking-widest border border-white/40 hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
      >
        {cameraActive ? 'Close Vision' : 'Enable Vision'}
      </button>
    </div>
  );
};

export default HandTracker;
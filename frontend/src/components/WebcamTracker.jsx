import React, { useRef, useEffect, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

let handLandmarker = null;

const WebcamTracker = ({ systemActive, activeTab }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [builtinGesture, setBuiltinGesture] = useState(null);
    const [logs, setLogs] = useState([]);
    const wsRef = useRef(null);

    // WebSocket connection
    useEffect(() => {
        wsRef.current = new WebSocket('ws://localhost:8000/ws/predict');
        wsRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'trigger') {
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${data.action} ← ${data.gesture}`, ...prev].slice(0, 5));
            }
            if (data.type === 'prediction') {
                if (data.confidence > 0.5) {
                    setPrediction(`${data.gesture} (${(data.confidence * 100).toFixed(0)}%)`);
                } else {
                    setPrediction(null);
                }
            }
        };
        return () => wsRef.current?.close();
    }, []);

    useEffect(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ command: systemActive ? 'resume' : 'pause' }));
        }
    }, [systemActive]);

    // Start camera directly via getUserMedia
    useEffect(() => {
        let stream;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            } catch (err) {
                setCameraError('Camera access denied or unavailable. ' + (err?.message || ''));
            }
        };
        startCamera();
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, []);

    // Load MediaPipe
    useEffect(() => {
        const initModel = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );
            handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
            setLoaded(true);
        };
        initModel();
    }, []);

    // Render loop
    useEffect(() => {
        if (!loaded) return;

        let animationId;
        let lastVideoTime = -1;

        const renderLoop = () => {
            const video = videoRef.current;
            if (video && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime;
                const results = handLandmarker.detectForVideo(video, performance.now());

                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    canvas.width = video.videoWidth || 640;
                    canvas.height = video.videoHeight || 480;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    if (results.landmarks && results.landmarks.length > 0) {
                        const lms = results.landmarks[0];

                        const distance = (a, b) => Math.hypot((a.x - b.x), (a.y - b.y));
                        const isExtended = (tip, pip) => tip.y < pip.y && distance(tip, pip) > 0.08;

                        const indexTip = lms[8];
                        const middleTip = lms[12];
                        const ringTip = lms[16];
                        const pinkyTip = lms[20];

                        const indexExtended = isExtended(indexTip, lms[6]);
                        const middleExtended = isExtended(middleTip, lms[10]);
                        const ringExtended = isExtended(ringTip, lms[14]);
                        const pinkyExtended = isExtended(pinkyTip, lms[18]);
                        const thumbExtended = distance(lms[4], lms[2]) > 0.05;

                        const indexThumbPinch = distance(lms[4], indexTip) < 0.08;
                        const pinkyThumbPinch = distance(lms[4], pinkyTip) < 0.08;
                        const fullPalm = indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended;

                        const builtin = indexThumbPinch
                            ? 'index_thumb_pinch'
                            : pinkyThumbPinch
                            ? 'pinky_thumb_pinch'
                            : fullPalm
                            ? 'full_palm'
                            : null;

                        if (builtin === 'index_thumb_pinch') {
                            console.log('Detected left click pinch');
                            setBuiltinGesture('Left click (index + thumb pinch)');
                            if (systemActive && wsRef.current?.readyState === WebSocket.OPEN) {
                                console.log('Sending left_click');
                                wsRef.current.send(JSON.stringify({ builtin: 'left_click' }));
                            }
                        } else if (builtin === 'pinky_thumb_pinch') {
                            console.log('Detected right click pinch');
                            setBuiltinGesture('Right click (pinky + thumb pinch)');
                            if (systemActive && wsRef.current?.readyState === WebSocket.OPEN) {
                                console.log('Sending right_click');
                                wsRef.current.send(JSON.stringify({ builtin: 'right_click' }));
                            }
                        } else if (builtin === 'full_palm') {
                            const x = Math.round(indexTip.x * canvas.width);
                            const y = Math.round(indexTip.y * canvas.height);
                            console.log('Detected full palm pointer', x, y);
                            setBuiltinGesture('Pointer control (full palm)');
                            if (systemActive && wsRef.current?.readyState === WebSocket.OPEN) {
                                console.log('Sending pointer', x, y, canvas.width, canvas.height);
                                wsRef.current.send(JSON.stringify({ builtin: 'pointer', x, y, videoWidth: canvas.width, videoHeight: canvas.height }));
                            }
                            // Draw pointer target
                            ctx.fillStyle = '#00FFFF';
                            ctx.beginPath();
                            ctx.arc(x, y, 12, 0, 2 * Math.PI);
                            ctx.fill();
                        } else {
                            setBuiltinGesture(null);
                        }

                        const edges = [
                            [0,1],[1,2],[2,3],[3,4],
                            [0,5],[5,6],[6,7],[7,8],
                            [0,9],[9,10],[10,11],[11,12],
                            [0,13],[13,14],[14,15],[15,16],
                            [0,17],[17,18],[18,19],[19,20]
                        ];

                        ctx.strokeStyle = '#00FFAA';
                        ctx.lineWidth = 3;
                        for (let [a, b] of edges) {
                            ctx.beginPath();
                            ctx.moveTo(lms[a].x * canvas.width, lms[a].y * canvas.height);
                            ctx.lineTo(lms[b].x * canvas.width, lms[b].y * canvas.height);
                            ctx.stroke();
                        }

                        ctx.fillStyle = '#00FFAA';
                        ctx.shadowColor = '#00FFAA';
                        ctx.shadowBlur = 8;
                        for (let lm of lms) {
                            ctx.beginPath();
                            ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 5, 0, 2 * Math.PI);
                            ctx.fill();
                        }

                        const flat = lms.flatMap(l => [l.x, l.y, l.z]);
                        window.dispatchEvent(new CustomEvent('landmarks_detected', { detail: flat }));

                        if (systemActive && wsRef.current?.readyState === WebSocket.OPEN && !builtin) {
                            wsRef.current.send(JSON.stringify({ landmarks: flat }));
                        }
                    } else {
                        setPrediction(null);
                        setBuiltinGesture(null);
                        window.dispatchEvent(new CustomEvent('landmarks_detected', { detail: null }));
                    }
                }
            }
            animationId = requestAnimationFrame(renderLoop);
        };

        animationId = requestAnimationFrame(renderLoop);
        return () => cancelAnimationFrame(animationId);
    }, [loaded, systemActive]);

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full">
                {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-error bg-base-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.866v6.268a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                        <p className="text-sm font-semibold">{cameraError}</p>
                        <p className="text-xs opacity-60 text-center max-w-[200px]">Allow camera access in your browser's address bar</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                            muted
                            playsInline
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full object-cover z-10"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    </>
                )}

                {!loaded && !cameraError && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 gap-3">
                        <span className="loading loading-ring loading-lg text-secondary"></span>
                        <span className="text-xs text-base-content/50">Loading AI model...</span>
                    </div>
                )}

                {prediction && (
                    <div className="absolute top-3 right-3 z-20 badge badge-secondary badge-lg shadow-lg">
                        {prediction}
                    </div>
                )}

                {builtinGesture && (
                    <div className="absolute top-3 left-3 z-20 badge badge-info badge-lg shadow-lg">
                        {builtinGesture}
                    </div>
                )}
            </div>

            {activeTab === 'dashboard' && (
                <div className="bg-base-200 rounded-xl p-4 font-mono text-sm border border-base-300">
                    <h3 className="text-primary mb-2 border-b border-primary/20 pb-1 flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span>Activity Log</span>
                        <span className="text-base-content/40">ws://{window.location.host}</span>
                    </h3>
                    <div className="space-y-1 h-20 overflow-y-auto">
                        {logs.length === 0 ? (
                            <div className="text-base-content/40 italic text-xs">Awaiting neural input...</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className={`text-xs ${i === 0 ? 'text-accent font-bold' : 'text-base-content/50'}`}>
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebcamTracker;

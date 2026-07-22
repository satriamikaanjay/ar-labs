import React, { useState, useEffect, useRef } from 'react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const COLORS = ['#00ffff', '#00ff00', '#ffff00', '#ff00ff', '#ff0000', '#ffffff'];

export default function NeonCanvas({ onExit }) {
  const [camStatus, setCamStatus] = useState('WAITING');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  
  // Refs untuk optimasi performa 60fps (tanpa memicu re-render React berulang)
  const activeColorRef = useRef(COLORS[0]); 
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const statusTextRef = useRef(null);

  const handleColorSelect = (color) => {
    setActiveColor(color);
    activeColorRef.current = color; // Simpan ke ref agar terbaca di renderLoop
    if (statusTextRef.current) {
      statusTextRef.current.style.color = color;
      statusTextRef.current.style.borderColor = color;
      statusTextRef.current.style.textShadow = `0 0 5px ${color}`;
    }
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    let streamReference = null;

    const initCameraAndAI = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2
        });
        
        handLandmarkerRef.current = handLandmarker;

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        
        streamReference = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setCamStatus('GRANTED');
            startDrawingEngine();
          };
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setCamStatus('DENIED');
      }
    };

    initCameraAndAI();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamReference) streamReference.getTracks().forEach(track => track.stop());
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
    };
  }, []);

  const startDrawingEngine = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    let isCanvasAligned = false;
    let lastDrawX = null;
    let lastDrawY = null;
    let lastVideoTime = -1;

    // --- LOGIKA GESTUR TANGAN ---
    const isFingerUp = (landmarks, tipIdx, pipIdx) => landmarks[tipIdx].y < landmarks[pipIdx].y;
    const isFist = (landmarks) => {
      return !isFingerUp(landmarks, 8, 6) && !isFingerUp(landmarks, 12, 10) && 
             !isFingerUp(landmarks, 16, 14) && !isFingerUp(landmarks, 20, 18);
    };

    const renderLoop = () => {
      if (!videoRef.current) return;

      if (video.videoWidth > 0 && !isCanvasAligned) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        isCanvasAligned = true;
      }

      if (video.currentTime !== lastVideoTime && handLandmarkerRef.current && isCanvasAligned) {
        lastVideoTime = video.currentTime;
        const results = handLandmarkerRef.current.detectForVideo(video, performance.now());

        let currentStatus = "STANDBY";
        let statusColor = activeColorRef.current;
        let isDrawingThisFrame = false;

        if (results.landmarks && results.landmarks.length > 0) {
          // Fokus pada satu tangan saja untuk menggambar agar tidak bentrok
          const landmarks = results.landmarks[0]; 
          
          const indexUp = isFingerUp(landmarks, 8, 6);
          const middleUp = isFingerUp(landmarks, 12, 10);
          const fist = isFist(landmarks);

          if (fist) {
            currentStatus = "BERHENTI";
            statusColor = "#ffaa00";
            lastDrawX = null;
            lastDrawY = null;
          } 
          else if (indexUp) {
            const currentX = landmarks[8].x * canvas.width;
            const currentY = landmarks[8].y * canvas.height;
            isDrawingThisFrame = true;

            if (middleUp) {
              // MODE PENGHAPUS
              currentStatus = "MENGHAPUS";
              statusColor = "#ff4444";
              ctx.globalCompositeOperation = "destination-out";
              ctx.lineWidth = 40; 
              
              if (lastDrawX !== null && lastDrawY !== null) {
                ctx.beginPath();
                ctx.moveTo(lastDrawX, lastDrawY);
                ctx.lineTo(currentX, currentY);
                ctx.stroke();
              }
            } else {
              // MODE MENGGAMBAR
              currentStatus = "MENGGAMBAR";
              ctx.globalCompositeOperation = "source-over";
              ctx.lineWidth = 8;
              ctx.strokeStyle = activeColorRef.current;
              ctx.shadowBlur = 10;
              ctx.shadowColor = activeColorRef.current;
              
              if (lastDrawX !== null && lastDrawY !== null) {
                ctx.beginPath();
                ctx.moveTo(lastDrawX, lastDrawY);
                ctx.lineTo(currentX, currentY);
                ctx.stroke();
              }
            }
            lastDrawX = currentX;
            lastDrawY = currentY;
          }
        }

        if (!isDrawingThisFrame) {
          lastDrawX = null;
          lastDrawY = null;
        }

        // Update teks status tanpa memicu re-render React
        if (statusTextRef.current) {
          statusTextRef.current.innerText = currentStatus;
          statusTextRef.current.style.color = statusColor;
          statusTextRef.current.style.borderColor = statusColor;
          statusTextRef.current.style.textShadow = `0 0 5px ${statusColor}`;
        }
      }
      
      requestRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] flex flex-col font-sans overflow-hidden">
      
      {/* AREA ATAS: Video & Canvas Container */}
      <div className="relative flex-1 w-full bg-black shadow-[0_0_30px_rgba(0,255,255,0.15)] overflow-hidden">
        
        {camStatus === 'WAITING' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
            <div className="w-12 h-12 border-4 border-[#00e5ff]/20 border-t-[#00e5ff] rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-mono uppercase tracking-widest text-[#00e5ff]">Initializing Canvas...</h2>
            <p className="text-gray-400 mt-2 text-sm text-center">Memuat mesin pelacakan gestur.<br/>Mohon izinkan akses kamera.</p>
          </div>
        )}

        {/* Video & Canvas Dibalik (Mirrored) */}
        <video 
          ref={videoRef} autoPlay playsInline muted 
          className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] z-10 filter brightness-50 contrast-125" 
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] z-30 pointer-events-none" 
        />

        {/* JUDUL MEWAH (NEON CANVAS) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3 py-1 bg-[#050505]/60 backdrop-blur-md border border-white/5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            NEON CANVAS
          </span>
          <div className="w-[1px] h-3 bg-white/20"></div>
          <span className="text-[8px] md:text-xs font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] via-[#fff] to-[#00ffff] drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]">
            AR-LABS
          </span>
        </div>

        {/* HUD: Palet Warna & Status (Ditengah Atas, di bawah judul) */}
        {camStatus === 'GRANTED' && (
          <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 bg-black/60 p-2 md:p-2.5 px-4 rounded-full border border-[#00e5ff]/40 backdrop-blur-md shadow-[0_0_15px_rgba(0,255,255,0.2)]">
              {COLORS.map((color) => (
                <button 
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  style={{ 
                    backgroundColor: color, 
                    boxShadow: activeColor === color ? `0 0 12px ${color}` : 'none',
                    borderColor: activeColor === color ? '#ffffff' : 'transparent'
                  }}
                  className={`w-6 h-6 md:w-8 md:h-8 rounded-full border-2 transition-all cursor-pointer ${
                    activeColor === color ? 'scale-125' : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
            
            <div 
              ref={statusTextRef}
              className="text-[#00ffff] text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase bg-black/60 px-4 py-1 rounded-full border border-[#00ffff] drop-shadow-[0_0_5px_#00ffff] transition-colors"
            >
              STANDBY
            </div>
          </div>
        )}

        {/* Tombol Bersihkan Papan (Melayang di area gambar) */}
        {camStatus === 'GRANTED' && (
          <button 
            onClick={clearBoard}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 bg-rose-600/90 hover:bg-rose-500 text-white font-bold py-2 md:py-3 px-6 rounded-full shadow-[0_4px_15px_rgba(225,29,72,0.5)] border border-rose-400 uppercase tracking-widest text-[10px] md:text-xs transition-all cursor-pointer backdrop-blur-sm"
          >
            Bersihkan Papan
          </button>
        )}

      </div>

      {/* AREA BAWAH: Control Panel / Dashboard */}
      <div className="h-24 md:h-28 bg-[#050505] border-t border-white/10 flex items-center justify-center gap-3 md:gap-6 px-4 shrink-0 z-40 relative">
        <button 
          onClick={() => setIsGuideOpen(true)} 
          className="flex-1 max-w-[200px] h-12 md:h-14 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors flex items-center justify-center cursor-pointer"
        >
          Panduan
        </button>
        <button 
          onClick={onExit} 
          className="flex-1 max-w-[200px] h-12 md:h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors flex items-center justify-center cursor-pointer"
        >
          Exit Module
        </button>
      </div>

      {/* Modal Panduan Teks Ringkas (Tanpa Video) */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#050505] border border-[#00e5ff]/50 rounded-lg p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            <h3 className="text-[#00e5ff] font-mono text-sm uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Tutorial Neon Canvas</h3>
            
            <div className="space-y-4 mb-8">
              <div className="bg-white/5 p-4 border border-white/10 rounded">
                <p className="text-gray-300 text-sm font-light">
                  <span className='text-[#00e5ff] font-bold block mb-1'>MENGGAMBAR:</span> 
                  Acungkan jari <span className="font-bold text-white">Telunjuk</span> saja untuk mulai mencoret layar dengan spidol neon.
                </p>
              </div>
              
              <div className="bg-white/5 p-4 border border-white/10 rounded">
                <p className="text-gray-300 text-sm font-light">
                  <span className='text-[#ff4444] font-bold block mb-1'>MENGHAPUS:</span> 
                  Rapatkan jari <span className="font-bold text-white">Telunjuk & Tengah</span> untuk mengaktifkan mode penghapus.
                </p>
              </div>

              <div className="bg-white/5 p-4 border border-white/10 rounded">
                <p className="text-gray-300 text-sm font-light">
                  <span className='text-[#ffaa00] font-bold block mb-1'>BERHENTI & WARNA:</span> 
                  <span className="font-bold text-white">Genggam tanganmu</span> jika ingin berhenti menggores. Klik palet di atas layar untuk mengganti warna.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsGuideOpen(false)}
              className="w-full py-3 bg-[#00e5ff] hover:bg-[#00b3cc] text-black text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors"
            >
              Mulai Menggambar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
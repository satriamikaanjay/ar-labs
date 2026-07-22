import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export default function HoloShifter({ onExit }) {
  const [camStatus, setCamStatus] = useState('WAITING');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  const [inputText, setInputText] = useState('');
  const [uiState, setUiState] = useState({ text: 'MENCARI TANGAN...', color: '#aaaaaa' });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  
  // OPTIMASI 1: Kurangi jumlah partikel sedikit agar HP bernapas lega (8.000 sudah sangat cukup)
  const PARTICLE_COUNT = 8000;
  const textShapeRef = useRef(new Float32Array(PARTICLE_COUNT * 3));
  const textUpdateTrigger = useRef(true); // Trigger agar array hanya dicopy saat teks berubah

  // --- ENGINE PENGUBAH TEKS MENJADI PARTIKEL ---
  useEffect(() => {
    const updateTextParticles = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800; 
      canvas.height = 400;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      ctx.fillStyle = '#000'; 
      ctx.fillRect(0, 0, 800, 400);
      ctx.fillStyle = '#fff'; 
      
      ctx.font = 'bold 110px monospace';
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle';
      ctx.fillText(inputText || "TULIS TEKSMU", 400, 200);

      const imgData = ctx.getImageData(0, 0, 800, 400).data;
      const validPixels = [];
      
      for (let y = 0; y < 400; y += 3) {
        for (let x = 0; x < 800; x += 3) {
          if (imgData[(y * 800 + x) * 4] > 128) {
            validPixels.push({ x: x - 400, y: -(y - 200) });
          }
        }
      }

      const arr = textShapeRef.current;
      if (validPixels.length === 0) return;
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = validPixels[i % validPixels.length];
        arr[i * 3] = p.x * 0.05 + (Math.random() - 0.5) * 0.2;
        arr[i * 3 + 1] = p.y * 0.05 + 2 + (Math.random() - 0.5) * 0.2;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      }
      
      // Beritahu renderLoop bahwa bentuk teks telah diperbarui
      textUpdateTrigger.current = true;
    };
    
    updateTextParticles();
  }, [inputText]);

  // --- INISIALISASI KAMERA & MEDIAPIPE ---
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
          numHands: 1
        });
        
        handLandmarkerRef.current = handLandmarker;

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        
        streamReference = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setCamStatus('GRANTED');
            startParticleEngine();
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

  const startParticleEngine = () => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false }); 
    const isMobile = window.innerWidth < 768;
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

    let visibleWidth = 30, visibleHeight = 20;

    // FUNGSI RESIZE 
    const handleResize = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);

      const vFov = THREE.MathUtils.degToRad(camera.fov);
      visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
      visibleWidth = visibleHeight * camera.aspect;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // --- MEMBUAT SISTEM PARTIKEL ---
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
    
    const shapeButterfly = new Float32Array(PARTICLE_COUNT * 3);
    const shapeSphere = new Float32Array(PARTICLE_COUNT * 3);
    const shapeHeart = new Float32Array(PARTICLE_COUNT * 3);
    const shapeGalaxy = new Float32Array(PARTICLE_COUNT * 3);
    const shapeScatter = new Float32Array(PARTICLE_COUNT * 3);

    // Generate Shapes
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = Math.random() * Math.PI * 24;
      const r = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5);
      shapeButterfly[i * 3] = Math.sin(t) * r * 2.5;
      shapeButterfly[i * 3 + 1] = Math.cos(t) * r * 2.5 + 2; 
      shapeButterfly[i * 3 + 2] = (Math.random() - 0.5) * 2; 
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 7 + (Math.random() * 1.5);
      shapeSphere[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      shapeSphere[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 2;
      shapeSphere[i * 3 + 2] = r * Math.cos(phi);
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = Math.random() * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      shapeHeart[i * 3] = x * 0.45;
      shapeHeart[i * 3 + 1] = y * 0.45 + 3;
      shapeHeart[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 12;
      const spiral = angle + radius * 0.5;
      shapeGalaxy[i * 3] = Math.cos(spiral) * radius;
      shapeGalaxy[i * 3 + 1] = (Math.random() - 0.5) * 3 + 2; 
      shapeGalaxy[i * 3 + 2] = Math.sin(spiral) * radius;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      shapeScatter[i * 3] = (Math.random() - 0.5) * 100;
      shapeScatter[i * 3 + 1] = (Math.random() - 0.5) * 100;
      shapeScatter[i * 3 + 2] = (Math.random() - 0.5) * 100 + 20; 
      positions[i] = shapeScatter[i * 3];
      targetPositions[i] = shapeScatter[i * 3];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff, 
      size: 0.12, 
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    let lastVideoTime = -1;
    let currentShape = 'SCATTER';
    const targetColor = new THREE.Color(0xffffff);

    const getDistance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const isFingerUp = (landmarks, tip, dip, wrist) => getDistance(landmarks[tip], landmarks[wrist]) > getDistance(landmarks[dip], landmarks[wrist]);

    const renderLoop = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && handLandmarkerRef.current) {
        if (videoRef.current.currentTime !== lastVideoTime) {
          lastVideoTime = videoRef.current.currentTime;
          
          const results = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());

          let detectedShape = 'SCATTER';
          let uiText = "TANGAN TIDAK TERDETEKSI";
          let uiColor = "#666666";

          if (results.landmarks && results.landmarks.length > 0) {
            const hand = results.landmarks[0];
            const wrist = 0;
            
            const indexUp = isFingerUp(hand, 8, 6, wrist);
            const middleUp = isFingerUp(hand, 12, 10, wrist);
            const ringUp = isFingerUp(hand, 16, 14, wrist);
            const pinkyUp = isFingerUp(hand, 20, 18, wrist);

            const isFist     = !indexUp && !middleUp && !ringUp && !pinkyUp;
            const isPointing = indexUp && !middleUp && !ringUp && !pinkyUp;
            const isPeace    = indexUp && middleUp && !ringUp && !pinkyUp;
            const isThree    = indexUp && middleUp && ringUp && !pinkyUp;
            const isMetal    = indexUp && !middleUp && !ringUp && pinkyUp;
            const isHighFive = indexUp && middleUp && ringUp && pinkyUp;

            uiText = "MENGANALISA GESTUR...";

            if (isPointing) {
              detectedShape = 'TEXT';
              uiText = "BENTUK: TEKS CUSTOM (POINT)";
              uiColor = "#00e5ff"; 
              targetColor.setHex(0x00e5ff);
            } else if (isPeace) {
              detectedShape = 'BUTTERFLY';
              uiText = "BENTUK: KUPU-KUPU (PEACE)";
              uiColor = "#ff66cc"; 
              targetColor.setHex(0xff66cc);
            } else if (isFist) {
              detectedShape = 'SPHERE';
              uiText = "BENTUK: PLANET (FIST)";
              uiColor = "#ffaa00"; 
              targetColor.setHex(0xffaa00);
            } else if (isThree) {
              detectedShape = 'GALAXY';
              uiText = "BENTUK: GALAKSI (3 JARI)";
              uiColor = "#9d4edd"; 
              targetColor.setHex(0x9d4edd);
            } else if (isMetal) {
              detectedShape = 'HEART';
              uiText = "BENTUK: HATI (METAL)";
              uiColor = "#ff1144"; 
              targetColor.setHex(0xff1144);
            } else if (isHighFive) {
              detectedShape = 'SCATTER';
              uiText = "MEMUDAR (HIGH FIVE)";
              uiColor = "#ffffff";
              targetColor.setHex(0xffffff);
            }

            // Parallax Kamera / Rotasi
            const targetRotX = (hand[9].y - 0.5) * 1.5;
            const targetRotY = (hand[9].x - 0.5) * 1.5;
            particleSystem.rotation.x += (targetRotX - particleSystem.rotation.x) * 0.1;
            particleSystem.rotation.y += (targetRotY - particleSystem.rotation.y) * 0.1;
          } else {
            targetColor.setHex(0xffffff);
          }

          setUiState({ text: uiText, color: uiColor });

          // OPTIMASI 2: Array HANYA dicopy jika bentuknya berubah atau teks diupdate.
          // Ini menghilangkan lag CPU yang menyebabkan HP patah-patah!
          if (detectedShape !== currentShape || (detectedShape === 'TEXT' && textUpdateTrigger.current)) {
            currentShape = detectedShape;
            textUpdateTrigger.current = false;

            let targetArr = shapeScatter;
            if (currentShape === 'TEXT') targetArr = textShapeRef.current;
            else if (currentShape === 'BUTTERFLY') targetArr = shapeButterfly;
            else if (currentShape === 'SPHERE') targetArr = shapeSphere;
            else if (currentShape === 'GALAXY') targetArr = shapeGalaxy;
            else if (currentShape === 'HEART') targetArr = shapeHeart;

            for(let i=0; i < targetPositions.length; i++) {
              targetPositions[i] = targetArr[i];
            }
          }
        }
      }

      // Animasi Lerp Posisi Partikel
      const posAttribute = geometry.attributes.position;
      const currentPos = posAttribute.array;
      const lerpSpeed = currentShape === 'SCATTER' ? 0.05 : 0.08; 

      for (let i = 0; i < currentPos.length; i++) {
        currentPos[i] += (targetPositions[i] - currentPos[i]) * lerpSpeed;
      }
      posAttribute.needsUpdate = true;
      material.color.lerp(targetColor, 0.05);

      // Rotasi Estetik Pasif (Termasuk animasi bergerak saat idle/SCATTER)
      if(currentShape === 'BUTTERFLY') {
          particleSystem.rotation.z = Math.sin(Date.now() * 0.001) * 0.1; 
      } else if (currentShape === 'SPHERE') {
          particleSystem.rotation.y += 0.01;
          particleSystem.rotation.x += 0.005;
      } else if (currentShape === 'GALAXY') {
          particleSystem.rotation.y -= 0.015;
      } else if (currentShape === 'HEART') {
          const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.05;
          particleSystem.scale.set(pulse, pulse, pulse);
      } else if (currentShape === 'SCATTER') {
          // Partikel bergerak memutar saat tangan tidak ada
          particleSystem.rotation.y += 0.002;
          particleSystem.rotation.z += 0.001;
          particleSystem.scale.set(1, 1, 1);
      } else {
          particleSystem.scale.set(1, 1, 1);
      }

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => window.removeEventListener('resize', handleResize);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col font-sans overflow-hidden">
      
      {/* TATA LETAK UTAMA RESPONSIVE */}
      <div className="flex-1 w-full flex flex-col md:block relative overflow-hidden">
        
        {/* 1. KANVAS 3D AREA & JUDUL */}
        {/* Di mobile: bentuk landscape (height 45vh). Di desktop: fullscreen absolut */}
        <div ref={containerRef} className="w-full h-[45vh] md:h-full md:absolute md:inset-0 bg-black relative shrink-0 z-10 overflow-hidden">
          
          {camStatus === 'WAITING' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
              <div className="w-12 h-12 border-4 border-[#ff66cc]/20 border-t-[#ff66cc] rounded-full animate-spin mb-6"></div>
              <h2 className="text-lg md:text-xl font-mono uppercase tracking-widest text-[#ff66cc]">Memuat Partikel...</h2>
            </div>
          )}

          {/* JUDUL & INPUT TEKS - Pindah ke BAWAH di mobile (bottom-4), kembali ke ATAS di desktop (md:bottom-auto md:top-6) */}
          <div className="absolute bottom-4 md:bottom-auto md:top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 md:gap-3 w-[90%] md:w-auto z-50">
            <div className="px-3 py-1 bg-[#050505]/60 backdrop-blur-md border border-white/5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
              <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                HOLO SHIFTER
              </span>
              <div className="w-[1px] h-3 bg-white/20"></div>
              <span className="text-[8px] md:text-xs font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#fff5b5] to-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                AR-LABS
              </span>
            </div>
            
            {camStatus === 'GRANTED' && (
              <input 
                type="text" 
                maxLength={12}
                value={inputText}
                onChange={(e) => setInputText(e.target.value.toUpperCase())}
                placeholder="TULIS TEKSMU"
                /* 
                  PERUBAHAN DI MOBILE: 
                  Teks: text-[10px]
                  Padding: px-4 py-1.5
                  Lebar: w-48
                  
                  DI DESKTOP (md:):
                  Teks: md:text-sm
                  Padding: md:px-6 md:py-2.5
                  Lebar: md:w-64
                */
                className="bg-[#000]/60 backdrop-blur-sm border border-[#00e5ff]/50 text-[#00e5ff] text-center font-black tracking-widest text-[10px] md:text-sm px-4 py-1.5 md:px-6 md:py-2.5 rounded-full outline-none focus:border-[#00e5ff] focus:shadow-[0_0_15px_rgba(0,229,255,0.6)] transition-all w-48 md:w-64 placeholder-[#00e5ff]/40"
              />
            )}
          </div>

          <canvas ref={canvasRef} className="w-full h-full block outline-none" />
        </div>

        {/* 2. AREA KONTROL & VIDEO (UI LAYER) */}
        {/* Di mobile: Mengisi ruang di bawah kanvas. Di desktop: Float transparan */}
        <div className="flex-1 w-full bg-[#0a0a0a] md:bg-transparent md:absolute md:inset-0 z-40 flex flex-col items-center justify-center md:block gap-5 py-4 md:py-0 overflow-y-auto md:pointer-events-none">
          
          {/* PIP Kamera & Status */}
          {/* Tambahkan md:pointer-events-auto di sini agar video tetap normal */}
          <div className={`flex flex-col items-center md:items-end gap-2.5 w-[90%] md:w-auto md:absolute md:bottom-32 md:right-6 shrink-0 md:pointer-events-auto ${camStatus === 'GRANTED' ? 'flex' : 'hidden'}`}>
            
            <div 
              className="bg-[#111111]/80 backdrop-blur-md border px-4 py-2 rounded-lg w-full max-w-[250px] md:max-w-[200px] transition-colors duration-300"
              style={{ borderColor: uiState.color, boxShadow: `0 0 15px ${uiState.color}40` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: uiState.color }}></span>
                <span className="text-white text-[10px] font-bold tracking-wider">Status AI</span>
              </div>
              <p className="text-[9px] md:text-[10px] font-mono leading-tight" style={{ color: uiState.color }}>{uiState.text}</p>
            </div>

            <div 
              className="w-full max-w-[250px] md:w-48 aspect-video rounded-xl overflow-hidden border-2 bg-black transition-colors duration-300"
              style={{ borderColor: uiState.color, boxShadow: `0 0 20px ${uiState.color}50` }}
            >
              <video 
                ref={videoRef} 
                autoPlay playsInline muted 
                className="w-full h-full object-cover scale-x-[-1]" 
              />
            </div>
          </div>

        </div>
      </div>

      {/* AREA BAWAH: Tombol Navigasi */}
      <div className="h-20 md:h-24 bg-[#020202] border-t border-white/10 flex items-center justify-center gap-3 md:gap-6 px-4 shrink-0 z-50">
        <button onClick={() => setIsGuideOpen(true)} className="flex-1 max-w-[200px] h-11 md:h-12 bg-white/5 hover:bg-white/10 text-white border border-white/20 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors rounded-lg cursor-pointer">
          Buku Panduan
        </button>
        <button onClick={onExit} className="flex-1 max-w-[200px] h-11 md:h-12 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors rounded-lg cursor-pointer">
          Tutup Modul
        </button>
      </div>

      {/* MODAL PANDUAN */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#0a0a0a] border border-[#ff66cc]/50 rounded-xl p-5 md:p-6 w-full max-w-md shadow-[0_0_40px_rgba(255,102,204,0.2)]">
            <h3 className="text-[#ff66cc] font-mono text-sm uppercase tracking-widest mb-4 border-b border-white/10 pb-3">Katalog Gestur Tangan</h3>
            
            <div className="space-y-2 md:space-y-3 mb-6 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-white/5 p-3 md:p-4 border border-white/5 rounded-lg flex items-center gap-3">
                <span className="text-2xl">☝️</span>
                <p className="text-gray-300 text-xs md:text-sm"><span className='text-[#00e5ff] font-bold block mb-0.5'>TEKS CUSTOM (POINT)</span> Acungkan <b>Telunjuk</b> untuk membentuk teks yang kamu ketik di atas layar.</p>
              </div>
              <div className="bg-white/5 p-3 md:p-4 border border-white/5 rounded-lg flex items-center gap-3">
                <span className="text-2xl">✌️</span>
                <p className="text-gray-300 text-xs md:text-sm"><span className='text-[#ff66cc] font-bold block mb-0.5'>KUPU-KUPU (PEACE)</span> Acungkan <b>Telunjuk & Tengah</b> untuk memunculkan kupu-kupu.</p>
              </div>
              <div className="bg-white/5 p-3 md:p-4 border border-white/5 rounded-lg flex items-center gap-3">
                <span className="text-2xl">🤘</span>
                <p className="text-gray-300 text-xs md:text-sm"><span className='text-[#ff1144] font-bold block mb-0.5'>HATI (METAL)</span> Acungkan <b>Telunjuk & Kelingking</b> untuk membentuk lambang Hati.</p>
              </div>
              <div className="bg-white/5 p-3 md:p-4 border border-white/5 rounded-lg flex items-center gap-3">
                <span className="text-2xl">🤟</span>
                <p className="text-gray-300 text-xs md:text-sm"><span className='text-[#9d4edd] font-bold block mb-0.5'>GALAKSI (3 JARI)</span> Acungkan <b>Telunjuk, Tengah & Manis</b> untuk membentuk pusaran Galaksi.</p>
              </div>
              <div className="bg-white/5 p-3 md:p-4 border border-white/5 rounded-lg flex items-center gap-3">
                <span className="text-2xl">✊</span>
                <p className="text-gray-300 text-xs md:text-sm"><span className='text-[#ffaa00] font-bold block mb-0.5'>PLANET (FIST)</span> <b>Genggam tanganmu</b> untuk mengumpulkan partikel menjadi bola raksasa.</p>
              </div>
              <div className="bg-white/5 p-3 md:p-4 border border-white/5 rounded-lg flex items-center gap-3">
                <span className="text-2xl">🖐️</span>
                <p className="text-gray-300 text-xs md:text-sm"><span className='text-gray-400 font-bold block mb-0.5'>HANCUR (HIGH FIVE)</span> Buka seluruh jarimu <b>(High Five)</b> untuk memudarkan partikel.</p>
              </div>
            </div>

            <button onClick={() => setIsGuideOpen(false)} className="w-full py-3 bg-[#ff66cc] hover:bg-[#ff4db8] text-black text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors rounded-lg">
              Mulai Simulasi
            </button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 102, 204, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
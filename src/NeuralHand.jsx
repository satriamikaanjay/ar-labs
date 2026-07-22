import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export default function NeuralHand({ onExit }) {
  const [camStatus, setCamStatus] = useState('WAITING');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const handLandmarkerRef = useRef(null);

  useEffect(() => {
    let streamReference = null;

    const initCameraAndAI = async () => {
      try {
        // 1. Inisialisasi MediaPipe Tasks Vision
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

        // 2. Akses Kamera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        
        streamReference = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
            setCamStatus('GRANTED');
            startThreeJSEngine();
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

  const startThreeJSEngine = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    let isCanvasAligned = false;

    const scene = new THREE.Scene();
    
    // Kamera Orthographic 1x1 (Penting agar mapping koordinat MediaPipe akurat)
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 100);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);

    // --- SHADER PORTAL B&W ---
    const videoTexture = new THREE.VideoTexture(video);
    const bwPortalMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tVideo: { value: videoTexture },
        resolution: { value: new THREE.Vector2(1, 1) },
        time: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform sampler2D tVideo;
        uniform vec2 resolution;
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec2 screenUv = gl_FragCoord.xy / resolution.xy;
          screenUv.x = 1.0 - screenUv.x;
          vec4 color = vec4(0.0);
          float blurSize = 0.008; 
          for(float x = -1.0; x <= 1.0; x++) {
            for(float y = -1.0; y <= 1.0; y++) { color += texture2D(tVideo, screenUv + vec2(x, y) * blurSize); }
          }
          color /= 9.0; 
          float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          float edge = max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0;
          float alpha = smoothstep(1.0, 0.6, edge);
          float scanline = sin(screenUv.y * resolution.y * 0.5 + time * 10.0) * 0.03;
          gl_FragColor = vec4(vec3(gray - scanline), alpha);
        }
      `,
      transparent: true, side: THREE.DoubleSide
    });

    // --- SHADER NEON CYBERPUNK ---
    const neonMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0.0 }, color: { value: new THREE.Color(0xff00ff) } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform float time; uniform vec3 color; varying vec2 vUv;
        void main() {
          float edgeX = max(abs(vUv.x - 0.5), 0.0) * 2.0;
          float edgeY = max(abs(vUv.y - 0.5), 0.0) * 2.0;
          float edge = max(edgeX, edgeY);
          float glow = pow(edge, 3.0) * 2.5; 
          float scan = sin(vUv.y * 80.0 - time * 15.0) * 0.1;
          float pulse = sin(time * 3.0) * 0.2 + 0.8;
          gl_FragColor = vec4(color, (glow * pulse) + scan + 0.15);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
    });

    // --- Helper Pembentuk Poligon ---
    const createPolygonMesh = (customMaterial, outlineColor) => {
      const geometry = new THREE.BufferGeometry();
      const vertices = new Float32Array(4 * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.setIndex([0, 1, 2, 0, 2, 3]);
      const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      const mesh = new THREE.Mesh(geometry, customMaterial);
      
      const edgeMaterial = new THREE.LineBasicMaterial({ 
        color: outlineColor, linewidth: 2, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
      });
      const outline = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
      mesh.add(outline);
      
      mesh.visible = false;
      scene.add(mesh);
      return mesh;
    };

    const poly1 = createPolygonMesh(bwPortalMaterial, 0xffffff); 
    const poly2 = createPolygonMesh(neonMaterial, 0xff00ff);     

    // --- Logika Pendeteksi Jari Lurus ---
    const isFingerStraight = (hand, tipIdx, jointIdx) => {
      const wrist = hand[0]; const tip = hand[tipIdx]; const joint = hand[jointIdx];
      return Math.hypot(tip.x - wrist.x, tip.y - wrist.y, tip.z - wrist.z) > 
             Math.hypot(joint.x - wrist.x, joint.y - wrist.y, joint.z - wrist.z);
    };

    const updateMeshVertices = (mesh, pts) => {
      if (!pts || pts.length !== 4) return;
      const positions = mesh.geometry.attributes.position.array;
      for (let i = 0; i < 4; i++) {
        if(!pts[i]) continue;
        positions[i * 3] = (1 - pts[i].x) - 0.5; 
        positions[i * 3 + 1] = -(pts[i].y - 0.5);
        positions[i * 3 + 2] = pts[i].z * -2; 
      }
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.visible = true;
    };

    // --- Render Loop Utama ---
    let lastVideoTime = -1;
    const clock = new THREE.Clock(); 

    const renderLoop = () => {
      if (!videoRef.current) return;
      
      // Alignment Canvas agar presisi dengan object-fit: cover
      if (video.videoWidth > 0 && !isCanvasAligned) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        renderer.setSize(vw, vh, false); 
        bwPortalMaterial.uniforms.resolution.value.set(vw, vh);
        isCanvasAligned = true;
      }

      const elapsedTime = clock.getElapsedTime();
      bwPortalMaterial.uniforms.time.value = elapsedTime;
      neonMaterial.uniforms.time.value = elapsedTime;

      if (video.currentTime !== lastVideoTime && handLandmarkerRef.current) {
        lastVideoTime = video.currentTime;
        
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          const results = handLandmarkerRef.current.detectForVideo(video, performance.now());
          poly1.visible = false; poly2.visible = false;

          if (results.landmarks && results.landmarks.length === 2) {
            let hand1 = results.landmarks[0]; let hand2 = results.landmarks[1];
            let leftHand = hand1[0].x > hand2[0].x ? hand1 : hand2;
            let rightHand = hand1[0].x > hand2[0].x ? hand2 : hand1;

            const lThumb = isFingerStraight(leftHand, 4, 3); const lIndex = isFingerStraight(leftHand, 8, 6); const lMid = isFingerStraight(leftHand, 12, 10);
            const rThumb = isFingerStraight(rightHand, 4, 3); const rIndex = isFingerStraight(rightHand, 8, 6); const rMid = isFingerStraight(rightHand, 12, 10);

            if (lThumb && lIndex && rThumb && rIndex) updateMeshVertices(poly1, [leftHand[8], rightHand[8], rightHand[4], leftHand[4]]);
            if (lIndex && lMid && rIndex && rMid) updateMeshVertices(poly2, [leftHand[12], rightHand[12], rightHand[8], leftHand[8]]);
          }
        }
      }
      
      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] flex flex-col font-sans overflow-hidden">
      
      {/* AREA ATAS: Video & Canvas Container */}
      <div className="relative flex-1 w-full bg-black shadow-[0_0_30px_rgba(138,43,226,0.15)] overflow-hidden">
        
        {camStatus === 'WAITING' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
            <div className="w-12 h-12 border-4 border-[#8a2be2]/20 border-t-[#8a2be2] rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-mono uppercase tracking-widest text-[#d896ff]">Initializing AI Lens...</h2>
            <p className="text-gray-400 mt-2 text-sm text-center">Loading Machine Learning models.<br/>Please allow camera access.</p>
          </div>
        )}

        <video 
          ref={videoRef} autoPlay playsInline muted 
          className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] z-10 filter brightness-75 contrast-125" 
        />
        <canvas 
          ref={canvasRef} 
          className="absolute top-0 left-0 w-full h-full object-cover z-30 pointer-events-none" 
        />

        {/* JUDUL MEWAH (EXPERIMENTAL / NEURAL HAND) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3 py-1 bg-[#050505]/60 backdrop-blur-md border border-[#8a2be2]/30 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            NEURAL HAND
          </span>
          <div className="w-[1px] h-3 bg-[#8a2be2]/50"></div>
          <span className="text-[8px] md:text-xs font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#d896ff] via-[#fff] to-[#8a2be2] drop-shadow-[0_0_8px_rgba(138,43,226,0.6)]">
            AR-LABS
          </span>
        </div>
      </div>

      {/* AREA BAWAH: Control Panel / Dashboard */}
      <div className="h-24 md:h-28 bg-[#050505] border-t border-white/10 flex items-center justify-center gap-3 md:gap-6 px-4 shrink-0 z-40 relative">
        <button 
          onClick={() => setIsGuideOpen(true)} 
          className="flex-1 max-w-[200px] h-12 md:h-14 bg-[#8a2be2]/10 hover:bg-[#8a2be2]/20 text-[#d896ff] border border-[#8a2be2]/30 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors flex items-center justify-center cursor-pointer"
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

      {/* Modal Panduan Ringkas */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#050505] border border-[#8a2be2]/50 rounded-lg p-6 w-full max-w-md shadow-[0_0_30px_rgba(138,43,226,0.2)]">
            <h3 className="text-[#d896ff] font-mono text-sm uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Tutorial Lensa AR</h3>
            
            <div className="space-y-4 mb-8">
              <div className="bg-white/5 p-4 border border-white/10 rounded">
                <p className="text-gray-300 text-sm font-light">
                  <span className='text-white font-bold block mb-1'>B&W PORTAL:</span> 
                  Angkat dan rentangkan <span className="text-[#00e5ff]">Jempol & Telunjuk</span> pada kedua tanganmu.
                </p>
              </div>
              
              <div className="bg-white/5 p-4 border border-white/10 rounded">
                <p className="text-gray-300 text-sm font-light">
                  <span className='text-[#f0f] font-bold block mb-1'>NEON PORTAL:</span> 
                  Angkat dan rentangkan <span className="text-[#00e5ff]">Telunjuk & Jari Tengah</span> pada kedua tanganmu.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsGuideOpen(false)}
              className="w-full py-3 bg-[#8a2be2] hover:bg-[#9d4edd] text-white text-xs font-mono uppercase tracking-widest cursor-pointer transition-colors"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
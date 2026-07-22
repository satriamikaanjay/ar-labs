import React, { useState, useEffect, useRef } from 'react';
import { 
  WebGLRenderer, Scene, PerspectiveCamera, AmbientLight, PointLight, Group, 
  BoxGeometry, EdgesGeometry, MeshStandardMaterial, LineBasicMaterial, Mesh, 
  LineSegments, Vector3, MathUtils 
} from 'three'; 

// 1. IMPORT KEEMPAT VIDEO PANDUAN DARI FOLDER ASSETS
import guideVid1 from './assets/panduan-voxel-1.webm';
import guideVid2 from './assets/panduan-voxel-2.webm';
import guideVid3 from './assets/panduan-voxel-3.webm';
import guideVid4 from './assets/panduan-voxel-4.webm';

export default function VoxelBuilder({ onExit }) {
  const [camStatus, setCamStatus] = useState('WAITING'); 
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hudRef = useRef(null);
  const statusTextRef = useRef(null);
  const loadingFillRef = useRef(null);

  // 2. GANTI STRING PATH DENGAN VARIABEL IMPORT
  const guideData = [
    { video: guideVid1, text: "<span class='text-[#00e5ff] font-bold'>TANGAN KANAN:</span> Cubit 1 detik untuk Membangun Blok." },
    { video: guideVid2, text: "<span class='text-[#00e5ff] font-bold'>TANGAN KANAN:</span> High Five 1 detik untuk Menggeser (Move)." },
    { video: guideVid3, text: "<span class='text-[#00e5ff] font-bold'>TANGAN KIRI:</span> Rapatkan telunjuk & tengah 1s untuk Rotate." },
    { video: guideVid4, text: "<span class='text-[#00e5ff] font-bold'>TANGAN KIRI:</span> Jauhkan jempol & telunjuk untuk Zoom In/Out." }
  ];

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        setCamStatus('GRANTED');
        stream.getTracks().forEach(track => track.stop());
      })
      .catch((err) => {
        console.error("Camera access denied:", err);
        setCamStatus('DENIED');
      });
  }, []);

  useEffect(() => {
    if (camStatus !== 'GRANTED' || !videoRef.current || !canvasRef.current) return;

    let isCanvasAligned = false;
    let visibleWidth = 30, visibleHeight = 20;

    const renderer = new WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const scene = new Scene();
    const camera = new PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 15;

    const ambientLight = new AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const pointLight = new PointLight(0x00ffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const worldGroup = new Group();
    scene.add(worldGroup);

    const voxelGeo = new BoxGeometry(1, 1, 1);
    const edgesGeo = new EdgesGeometry(voxelGeo);
    const voxelMat = new MeshStandardMaterial({ color: 0x00aaff, emissive: 0x0044aa, transparent: true, opacity: 0.9 });
    const ghostMat = new MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0066ff, transparent: true, opacity: 0.3 });

    const ghostBlock = new Mesh(voxelGeo, ghostMat);
    const ghostEdges = new LineSegments(edgesGeo, new LineBasicMaterial({ color: 0x00ffff }));
    ghostBlock.add(ghostEdges);
    worldGroup.add(ghostBlock);
    ghostBlock.visible = false;

    let targetRotY = 0, targetRotX = 0, targetPosX = 0, targetPosY = 0, targetScale = 1.0;
    const placedBlocks = new Map();
    let lastFrameTime = performance.now();
    const REQUIRED_HOLD_TIME = 1.0;

    let actionTimer = 0, lastActionPosID = "", lastRightGesture = "NONE";
    let leftActionTimer = 0, lastLeftGesture = "NONE";

    const updateHUD = (actionName, timerValue) => {
      if (!hudRef.current || !statusTextRef.current || !loadingFillRef.current) return;
      if (actionName === "NONE") {
        hudRef.current.style.display = "none";
      } else {
        hudRef.current.style.display = "block";
        statusTextRef.current.innerText = actionName;
        let percentage = (timerValue / REQUIRED_HOLD_TIME) * 100;
        loadingFillRef.current.style.width = Math.min(percentage, 100) + "%";
        loadingFillRef.current.style.background = percentage >= 100 ? "#00ff00" : "#00ffff";
        loadingFillRef.current.style.boxShadow = percentage >= 100 ? "0 0 10px #00ff00" : "0 0 10px #00ffff";
      }
    };

    const onResults = (results) => {
      const now = performance.now();
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      if (videoRef.current.videoWidth > 0 && !isCanvasAligned) {
        const vw = videoRef.current.videoWidth;
        const vh = videoRef.current.videoHeight;
        renderer.setSize(vw, vh, false);
        camera.aspect = vw / vh;
        camera.updateProjectionMatrix();
        const vFov = MathUtils.degToRad(camera.fov);
        visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
        visibleWidth = visibleHeight * camera.aspect;
        isCanvasAligned = true;
      }

      let isRightHandVisible = false;
      let activeUIAction = "NONE";
      let activeUITimer = 0;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
          const landmarks = results.multiHandLandmarks[i];
          const actualHand = results.multiHandedness[i].label === 'Left' ? 'Right' : 'Left';

          if (actualHand === 'Right') {
            isRightHandVisible = true;
            ghostBlock.visible = true;
            const thumbTip = landmarks[4], indexTip = landmarks[8], middleTip = landmarks[12], ringTip = landmarks[16], pinkyTip = landmarks[20];
            const isIndexUp = indexTip.y < landmarks[6].y, isMiddleUp = middleTip.y < landmarks[10].y, isRingUp = ringTip.y < landmarks[14].y, isPinkyUp = pinkyTip.y < landmarks[18].y;
            const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
            const isHighFive = isIndexUp && isMiddleUp && isRingUp && isPinkyUp && pinchDist > 0.1;

            const rawPosX = ((1 - indexTip.x) - 0.5) * visibleWidth;
            const rawPosY = -(indexTip.y - 0.5) * visibleHeight;
            const rawPosVector = new Vector3(rawPosX, rawPosY, 0);
            worldGroup.worldToLocal(rawPosVector);
            const gridX = Math.round(rawPosVector.x), gridY = Math.round(rawPosVector.y), gridZ = Math.round(rawPosVector.z);
            const posID = `${gridX},${gridY},${gridZ}`;

            ghostBlock.position.set(gridX, gridY, gridZ);

            let currentRightGesture = "NONE";
            if (isHighFive) currentRightGesture = "MOVE";
            else if (pinchDist < 0.05) currentRightGesture = "BUILD";

            if (currentRightGesture !== "NONE" && currentRightGesture === lastRightGesture) {
              if (currentRightGesture === "BUILD" && posID !== lastActionPosID) { actionTimer = 0; lastActionPosID = posID; } 
              else { actionTimer += dt; }
            } else {
              actionTimer = 0; lastRightGesture = currentRightGesture; lastActionPosID = posID;
            }

            if (currentRightGesture === "BUILD") {
              activeUIAction = "MEMBANGUN..."; activeUITimer = actionTimer;
              ghostBlock.material.color.setHex(0xffffff);
              ghostEdges.material.color.setHex(0xffffff);
              ghostBlock.material.opacity = Math.min(0.3 + (0.6 * (actionTimer / REQUIRED_HOLD_TIME)), 0.9);

              if (actionTimer >= REQUIRED_HOLD_TIME && !placedBlocks.has(posID)) {
                const newVoxel = new Mesh(voxelGeo, voxelMat);
                const edges = new LineSegments(edgesGeo, new LineBasicMaterial({ color: 0x00ffff, linewidth: 2 }));
                newVoxel.add(edges);
                newVoxel.position.set(gridX, gridY, gridZ);
                worldGroup.add(newVoxel);
                placedBlocks.set(posID, newVoxel);
              }
            } else if (currentRightGesture === "MOVE") {
              activeUIAction = "MEMINDAHKAN..."; activeUITimer = actionTimer;
              ghostBlock.material.opacity = 0; ghostEdges.material.color.setHex(0x000000);
              if (actionTimer >= REQUIRED_HOLD_TIME) {
                targetPosX = ((1 - landmarks[9].x) - 0.5) * visibleWidth;
                targetPosY = -(landmarks[9].y - 0.5) * visibleHeight;
              }
            } else {
              ghostBlock.material.opacity = 0.3; ghostBlock.material.color.setHex(0x00ffff); ghostEdges.material.color.setHex(0x00ffff);
            }
          }

          if (actualHand === 'Left') {
            const indexTip = landmarks[8];
            const pinchDistLeft = Math.hypot(indexTip.x - landmarks[4].x, indexTip.y - landmarks[4].y);
            const indexMiddleDist = Math.hypot(indexTip.x - landmarks[12].x, indexTip.y - landmarks[12].y);
            const indexUp = indexTip.y < landmarks[6].y, middleUp = landmarks[12].y < landmarks[10].y, ringDown = landmarks[16].y > landmarks[14].y, pinkyDown = landmarks[20].y > landmarks[18].y, middleDown = landmarks[12].y > landmarks[10].y;

            let currentLeftGesture = "NONE";
            if (indexUp && middleUp && ringDown && pinkyDown && indexMiddleDist < 0.05) currentLeftGesture = "ROTATE";
            else if (indexUp && middleDown && ringDown && pinkyDown && pinchDistLeft > 0.05) currentLeftGesture = "ZOOM";

            if (currentLeftGesture !== "NONE" && currentLeftGesture === lastLeftGesture) leftActionTimer += dt;
            else { leftActionTimer = 0; lastLeftGesture = currentLeftGesture; }

            if (currentLeftGesture === "ROTATE") {
              if (activeUIAction === "NONE") { activeUIAction = "MEROTASI..."; activeUITimer = leftActionTimer; }
              if (leftActionTimer >= REQUIRED_HOLD_TIME) {
                targetRotY = ((1 - indexTip.x) - 0.5) * Math.PI * 2.5; targetRotX = (indexTip.y - 0.5) * Math.PI * 1.5;
              }
            } else if (currentLeftGesture === "ZOOM") {
              if (activeUIAction === "NONE") { activeUIAction = "ZOOM IN / OUT"; activeUITimer = REQUIRED_HOLD_TIME; }
              targetScale = Math.max(0.3, Math.min(3.0, pinchDistLeft * 10.0));
            }
          }
        }
      }

      updateHUD(activeUIAction, activeUITimer);
      if (!isRightHandVisible) { ghostBlock.visible = false; actionTimer = 0; }

      worldGroup.rotation.y += (targetRotY - worldGroup.rotation.y) * 0.1;
      worldGroup.rotation.x += (targetRotX - worldGroup.rotation.x) * 0.1;
      worldGroup.position.x += (targetPosX - worldGroup.position.x) * 0.1;
      worldGroup.position.y += (targetPosY - worldGroup.position.y) * 0.1;
      worldGroup.scale.x += (targetScale - worldGroup.scale.x) * 0.1;
      worldGroup.scale.y += (targetScale - worldGroup.scale.y) * 0.1;
      worldGroup.scale.z += (targetScale - worldGroup.scale.z) * 0.1;

      renderer.render(scene, camera);
    };

    const hands = new window.Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({ maxNumHands: 2, modelComplexity: 0, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
    hands.onResults(onResults);

    const cameraFeed = new window.Camera(videoRef.current, {
      onFrame: async () => { await hands.send({ image: videoRef.current }); },
      width: { ideal: 640 }, height: { ideal: 480 }
    });
    cameraFeed.start();

    window.resetVoxelBlocks = () => {
      placedBlocks.forEach((block) => worldGroup.remove(block));
      placedBlocks.clear();
    };

    return () => {
      cameraFeed.stop();
      hands.close();
      renderer.dispose();
      delete window.resetVoxelBlocks;
    };
  }, [camStatus]);

  if (camStatus === 'WAITING' || camStatus === 'DENIED') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white">
        {camStatus === 'WAITING' ? (
          <>
            <div className="w-12 h-12 border-4 border-[#00e5ff]/20 border-t-[#00e5ff] rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-mono uppercase tracking-widest text-[#00e5ff]">Initializing Camera...</h2>
            <p className="text-gray-400 mt-2 text-sm">Please allow camera access in your browser.</p>
          </>
        ) : (
          <>
            <div className="text-rose-500 mb-6">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-mono uppercase tracking-widest text-rose-500 mb-2">Camera Access Denied</h2>
            <p className="text-gray-400 text-sm max-w-md text-center">AR Spatial Engine requires camera permissions to map your environment. Please enable it in your browser settings and refresh.</p>
            <button onClick={onExit} className="mt-8 px-6 py-2 border border-white/20 hover:border-white text-xs uppercase tracking-widest transition-colors cursor-pointer">Return to Hub</button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#020202] flex flex-col font-sans overflow-hidden">
      
      {/* 1. AREA ATAS: Video & Canvas Container */}
      <div className="relative flex-1 w-full bg-black shadow-[0_0_30px_rgba(0,255,255,0.15)] overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover scale-x-[-1] z-10" />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-cover z-30 pointer-events-none" />

        {/* --- JUDUL MEWAH (SANGAT COMPACT) --- */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3 py-1 bg-[#050505]/60 backdrop-blur-md border border-white/5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
          <span className="text-[8px] md:text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            VOXEL BUILDER
          </span>
          <div className="w-[1px] h-3 bg-white/20"></div>
          <span className="text-[8px] md:text-xs font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#fff5b5] to-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
            AR-LABS
          </span>
        </div>

        {/* Action HUD */}
        <div ref={hudRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[250px] text-center z-40 hidden">
          <div ref={statusTextRef} className="text-[#00e5ff] text-sm font-bold tracking-[0.2em] mb-2 uppercase drop-shadow-[0_0_5px_#00ffff]">ACTION</div>
          <div className="w-full h-2.5 bg-white/20 border border-[#00e5ff] overflow-hidden">
            <div ref={loadingFillRef} className="h-full w-0 bg-[#00e5ff] shadow-[0_0_10px_#00ffff] transition-all duration-100 ease-linear"></div>
          </div>
        </div>
      </div>

      {/* 2. AREA BAWAH: Control Panel / Dashboard */}
      <div className="h-24 md:h-28 bg-[#050505] border-t border-white/10 flex items-center justify-center gap-3 md:gap-6 px-4 shrink-0 z-40 relative">
        <button 
          onClick={() => setIsGuideOpen(true)} 
          className="flex-1 max-w-[200px] h-12 md:h-14 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors flex items-center justify-center cursor-pointer"
        >
          Panduan
        </button>
        <button 
          onClick={() => window.resetVoxelBlocks?.()} 
          className="flex-1 max-w-[200px] h-12 md:h-14 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/30 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors flex items-center justify-center cursor-pointer"
        >
          Reset
        </button>
        <button 
          onClick={onExit} 
          className="flex-1 max-w-[200px] h-12 md:h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-colors flex items-center justify-center cursor-pointer"
        >
          Exit Module
        </button>
      </div>

      {/* Modal Panduan (z-index dinaikkan agar benar-benar menutupi kamera) */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#050505] border border-[#00e5ff]/30 p-6 w-full max-w-md shadow-[0_0_30px_rgba(0,255,255,0.1)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#00e5ff] font-mono text-sm uppercase tracking-widest">Tutorial Sistem</h3>
              <span className="text-gray-500 text-xs font-mono">{currentSlide + 1} / 4</span>
            </div>
            
            <div className="w-full aspect-video bg-black overflow-hidden mb-4 border border-white/10">
              <video src={guideData[currentSlide].video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            </div>
            
            <p className="text-gray-300 text-sm text-center min-h-[48px] mb-6" dangerouslySetInnerHTML={{ __html: guideData[currentSlide].text }}></p>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))} 
                disabled={currentSlide === 0}
                className="text-gray-400 hover:text-white disabled:opacity-0 text-xs font-mono uppercase tracking-widest cursor-pointer"
              >
                &larr; Prev
              </button>
              <button 
                onClick={() => currentSlide < 3 ? setCurrentSlide(prev => prev + 1) : setIsGuideOpen(false)}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-widest text-black cursor-pointer ${currentSlide === 3 ? 'bg-white' : 'bg-[#00e5ff]'}`}
              >
                {currentSlide === 3 ? 'Close' : 'Next \u2192'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
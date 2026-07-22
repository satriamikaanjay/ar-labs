import React, { useState, useEffect } from 'react';

// IMPORT ASSETS
import voxelVid1 from './assets/panduan-voxel-1.webm';
import voxelVid2 from './assets/panduan-voxel-2.webm';
import voxelVid3 from './assets/panduan-voxel-3.webm';
import neuralVid from './assets/dynamic-polygon.webm';
import neonVid1 from './assets/panduan-draw2.webm';
import neonVid2 from './assets/panduan-draw3.webm';
import holoVid1 from './assets/holo.webm';

const VideoCarousel = ({ videos, isSidebar = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!videos || videos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [videos]);

  return (
    <div className="relative w-full h-full bg-[#050505]">
      {videos.map((vid, idx) => (
        <video
          key={idx} src={vid} autoPlay loop muted playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          } ${!isSidebar && 'group-hover:scale-105 transition-transform duration-700'}`}
        />
      ))}
      
      {videos.length > 1 && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {videos.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 md:h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-4 md:w-6 bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]' : 'w-1.5 md:w-2 bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- DATA PROJECTS (TRANSLATED TO ENGLISH) ---
const projectsData = [
  {
    id: 1,
    title: "Voxel Builder",
    category: "Spatial Tracking",
    shortDesc: "Hand-tracking system to build 3D voxel structures in real-time.",
    fullDesc: "AR Voxel Builder is an advanced spatial computing experiment. Users can use their bare hands to pick up, place, and assemble voxel blocks in a 3D environment without a mouse or keyboard. Processed purely client-side.",
    videos: [voxelVid1, voxelVid2, voxelVid3],
    linkRun: "voxel_builder.html",
    linkSource: "https://github.com/satriamikaanjay/ar-labs",
    techStack: ["Three.js", "MediaPipe", "React", "WebGL"],
    badge: "FLAGSHIP" 
  },
  {
    id: 2,
    title: "Neural Hand",
    category: "WebGL Shaders",
    shortDesc: "Machine Learning-based hand skeleton visualization.",
    fullDesc: "Detects hand joints in real-time and generates holographic plasma energy projections. This project demonstrates how raw data from MediaPipe can be converted into WebGL coordinates for dynamic sci-fi visual effects.",
    videos: [neuralVid],
    linkRun: "dynamic-polygon.html",
    linkSource: "https://github.com/satriamikaanjay/ar-labs",
    techStack: ["Three.js", "GLSL Shaders", "MediaPipe"],
    badge: "EXPERIMENTAL"
  },
  {
    id: 3,
    title: "Neon Canvas",
    category: "Gesture Engine",
    shortDesc: "Holographic whiteboard powered by air finger gestures.",
    fullDesc: "Neon Whiteboard allows you to draw in virtual space. Use a fist gesture to erase, and your index finger to paint with glowing neon ink. No mouse needed, purely camera tracked.",
    videos: [neonVid1, neonVid2],
    linkRun: "ar-draw.html",
    linkSource: "https://github.com/satriamikaanjay/ar-labs",
    techStack: ["Canvas API", "Gesture Logic", "MediaPipe"],
    badge: "BASIC" 
  },
  {
    id: 4,
    title: "Holo Shifter",
    category: "Spatial Interaction",
    shortDesc: "3D object manipulation using hand movements in real space.",
    fullDesc: "Holo Shifter is a spatial interaction experiment that allows users to move, rotate, and scale 3D objects in real space using hand gestures. This project emphasizes an immersive user experience without traditional input devices.",
    videos: [holoVid1],
    linkRun: "holo-shifter.html",
    linkSource: "https://github.com/satriamikaanjay/ar-labs",
    techStack: ["Three.js", "MediaPipe", "React"],
    badge: "FLAGSHIP"
  }
];

export default function Projects({ onLaunchVoxel, onLaunchNeural, onLaunchNeon, onLaunchHolo }) {
  const [activeProject, setActiveProject] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = (project) => {
    setActiveProject(project);
    setIsSidebarOpen(true);
    document.body.style.overflow = 'hidden'; 
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setTimeout(() => setActiveProject(null), 500); 
    document.body.style.overflow = 'auto'; 
  };

  const renderBadge = (badgeType) => {
    switch(badgeType) {
      case 'FLAGSHIP':
        return (
          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-gradient-to-r from-[#d4af37] via-[#fff5b5] to-[#d4af37] text-black font-black text-[9px] uppercase tracking-widest rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.5)] flex items-center gap-1">
            <span className="animate-pulse">✦</span> FLAGSHIP
          </div>
        );
      case 'EXPERIMENTAL':
        return (
          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-[#8a2be2]/20 border border-[#8a2be2]/50 text-[#d896ff] font-bold text-[9px] uppercase tracking-widest rounded-sm shadow-[0_0_15px_rgba(138,43,226,0.3)] backdrop-blur-md flex items-center gap-1">
            <span className="animate-spin-slow">⌬</span> EXPERIMENTAL
          </div>
        );
      case 'BASIC':
        return (
          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-white/5 border border-white/20 text-gray-400 font-medium text-[9px] uppercase tracking-widest rounded-sm backdrop-blur-md flex items-center gap-1">
            <span>○</span> BASIC
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <section id="modules" className="py-16 md:py-24 px-6 md:px-12 bg-[#050505] relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex items-center gap-4 mb-10 md:mb-16">
            <div className="h-[1px] w-8 md:w-12 bg-white/30"></div>
            <h2 className="text-[10px] md:text-xs font-mono text-gray-400 uppercase tracking-[0.2em]">02 // Active Modules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-6">
            {projectsData.map((project) => (
              <div key={project.id} className="group relative w-full h-[400px] md:h-[450px] bg-black border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-end shadow-lg transition-all duration-300 hover:border-white/30">
                
                <div className="absolute inset-0 z-0">
                  <VideoCarousel videos={project.videos} />
                </div>

                {renderBadge(project.badge)}

                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/80 to-transparent z-10 pointer-events-none"></div>
                
                <div className="relative z-20 p-6 md:p-8">
                  <span className="text-[9px] md:text-[10px] font-mono text-[#00e5ff] uppercase tracking-widest">{project.category}</span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mt-1 md:mt-2 mb-2 md:mb-3">{project.title}</h3>
                  
                  <p className="text-xs md:text-sm text-gray-300 font-light mb-4 md:mb-6 line-clamp-2 md:line-clamp-none">
                    {project.shortDesc}
                  </p>
                  
                  <button 
                    onClick={() => openSidebar(project)}
                    className="px-5 py-2 md:px-6 md:py-2.5 bg-white text-black font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#00e5ff] transition-colors rounded-sm cursor-pointer w-fit"
                  >
                    Show More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OVERLAY */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[998] transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={closeSidebar}
      ></div>

      {/* PANEL SIDEBAR */}
      <div 
        className={`fixed z-[999] bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        bottom-0 left-0 w-full max-h-[90vh] rounded-t-3xl border-t border-white/10
        ${isSidebarOpen ? 'translate-y-0' : 'translate-y-full'}
        
        md:top-0 md:bottom-auto md:right-0 md:left-auto md:h-full md:max-h-full md:w-[450px] lg:w-[500px] md:rounded-none md:border-t-0 md:border-l
        ${isSidebarOpen ? 'md:translate-x-0 md:translate-y-0' : 'md:translate-x-full md:translate-y-0'}
      `}>
        
        {activeProject && (
          <>
            <div className="w-full flex justify-center pt-3 md:hidden absolute top-0 left-0 z-40 pointer-events-none">
              <div className="w-12 h-1 bg-white/20 rounded-full"></div>
            </div>

            <div className="px-5 py-4 md:p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md z-50 pt-8 md:pt-6">
              <span className="text-[10px] md:text-xs font-mono text-gray-400 uppercase tracking-widest">Module Details</span>
              
              <button 
                onClick={closeSidebar} 
                className="p-2 bg-rose-500/10 hover:bg-rose-500 rounded-full text-rose-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 md:p-6 flex-grow overflow-y-auto flex flex-col custom-scrollbar">
              
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 mb-4 md:mb-8 shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                <VideoCarousel videos={activeProject.videos} isSidebar={true} />
              </div>

              <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap">
                  
                  <div className="inline-block px-2 py-1 md:px-3 md:py-1 bg-[#00e5ff]/10 text-[#00e5ff] text-[9px] md:text-[10px] font-mono uppercase tracking-widest rounded">
                    {activeProject.category}
                  </div>
                  
                  {activeProject.badge === 'FLAGSHIP' && (
                     <div className="inline-block px-2 py-1 md:px-3 md:py-1 bg-gradient-to-r from-[#d4af37] via-[#fff5b5] to-[#d4af37] text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded shadow-sm">
                       ✦ FLAGSHIP
                     </div>
                  )}

                  {activeProject.badge === 'EXPERIMENTAL' && (
                     <div className="inline-block px-2 py-1 md:px-3 md:py-1 bg-[#8a2be2]/20 border border-[#8a2be2]/50 text-[#d896ff] font-bold text-[9px] md:text-[10px] uppercase tracking-widest rounded-sm shadow-[0_0_15px_rgba(138,43,226,0.3)]">
                       <span className="animate-spin-slow inline-block mr-1">⌬</span> EXPERIMENTAL
                     </div>
                  )}

                  {activeProject.badge === 'BASIC' && (
                     <div className="inline-block px-2 py-1 md:px-3 md:py-1 bg-white/5 border border-white/20 text-gray-400 font-medium text-[9px] md:text-[10px] uppercase tracking-widest rounded-sm">
                       <span className="mr-1">○</span> BASIC
                     </div>
                  )}

                </div>
                
                <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2 md:mb-4">{activeProject.title}</h2>
                <p className="text-gray-400 text-xs md:text-base font-light leading-relaxed">
                  {activeProject.fullDesc}
                </p>
              </div>

              <div className="mb-6 md:mb-10 p-3 md:p-4 border border-white/10 bg-white/5 rounded-lg">
                <h4 className="text-[9px] md:text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 md:mb-3">Core Technology</h4>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {activeProject.techStack.map(tech => (
                    <span key={tech} className="px-2 py-1 md:px-3 md:py-1.5 border border-[#00e5ff]/30 bg-[#00e5ff]/5 text-[#00e5ff] text-[9px] md:text-[10px] font-mono uppercase rounded-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex flex-col gap-2 md:gap-3 pb-6 md:pb-0">
                <button 
                  onClick={() => {
                    if (activeProject.id === 1 && onLaunchVoxel) {
                      onLaunchVoxel();
                      closeSidebar();
                    } else if (activeProject.id === 2 && onLaunchNeural) {
                      onLaunchNeural();
                      closeSidebar();
                    } else if (activeProject.id === 3 && onLaunchNeon) {
                      onLaunchNeon();
                      closeSidebar();
                    } else if (activeProject.id === 4 && onLaunchHolo) {
                      onLaunchHolo();
                      closeSidebar();
                    } else {
                      window.open(activeProject.linkRun, '_blank');
                      closeSidebar();
                    }
                  }}
                  className="w-full text-center py-3 md:py-4 bg-white hover:bg-[#00e5ff] text-black font-bold text-[10px] md:text-xs uppercase tracking-widest transition-colors rounded-sm flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Try Now 
                  <svg className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
                
                <div className="flex gap-2 md:gap-3">
                  <a 
                    href={activeProject.linkSource} 
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 md:py-3 border border-white/20 hover:border-white text-white font-bold text-[9px] md:text-[10px] lg:text-xs uppercase tracking-widest transition-colors rounded-sm"
                  >
                    Source Code
                  </a>
                  <a 
                    href="https://www.instagram.com/satriamika_/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 md:py-3 border border-pink-500/50 hover:bg-pink-500 text-pink-500 hover:text-white font-bold text-[9px] md:text-[10px] lg:text-xs uppercase tracking-widest transition-colors rounded-sm flex justify-center items-center gap-1 md:gap-2"
                  >
                    <svg className="w-3 h-3 md:w-4 md:h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Follow Me on IG
                  </a>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
      
      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 229, 255, 0.5);
        }
      `}</style>
    </>
  );
}
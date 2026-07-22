import React, { useState, useEffect } from 'react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 border-b ${
        isScrolled 
          ? 'bg-[#020202]/80 backdrop-blur-xl border-[#00e5ff]/20 py-4 shadow-[0_4px_30px_rgba(0,229,255,0.03)]' 
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        
        {/* KIRI: Logo & Version */}
        <div className="flex items-center gap-4 z-50">
          <a href="#home" className="text-xl md:text-2xl font-black text-white tracking-tighter flex items-center gap-2 group">
            <div className="w-2 h-5 md:h-6 bg-[#00e5ff] rounded-[1px] skew-x-[20deg] group-hover:skew-x-[-20deg] transition-transform duration-300 shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
            AR-LABS
          </a>
        </div>

        {/* KANAN: GitHub & VIP Support Button */}
        <div className="flex items-center gap-5 md:gap-8 z-50">
          
          <a 
            href="https://github.com/satriamikaanjay" 
            target="_blank" 
            rel="noreferrer" 
            className="text-gray-400 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
            aria-label="GitHub Repository"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>

          {/* Support Me Button - Ultra Premium / Exclusive Style */}
          <a 
            href="#support" 
            className="group relative inline-flex p-[1px] rounded-sm overflow-hidden"
          >
            {/* Animasi Garis Tepi Gradasi Emas-Cyan */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00e5ff] via-[#8a2be2] to-[#d4af37] bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] opacity-80 group-hover:opacity-100"></div>
            
            {/* Bagian Dalam Gelap & Teks */}
            <div className="relative flex items-center justify-center px-5 py-2 md:px-7 md:py-2.5 bg-[#050505] transition-colors duration-500 rounded-sm w-full h-full">
              <a 
  href="https://saweria.co/satriamikaanjay" 
  target="_blank" 
  rel="noopener noreferrer"
  className="relative z-10 flex items-center gap-2 text-[10px] md:text-xs font-mono font-bold tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-white group-hover:from-white group-hover:to-white transition-colors duration-300 cursor-pointer"
>
  Support Me
  {/* Icon Petir/Energi (Mewah) */}
  <svg className="w-3 h-3 md:w-4 md:h-4 text-[#00e5ff] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
</a>
            </div>
          </a>

        </div>
      </div>
      
      {/* Keyframes Shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </header>
  );
}
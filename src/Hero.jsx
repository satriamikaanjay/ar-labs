import React, { useState, useEffect } from 'react';

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-16 md:pt-20 px-6 overflow-hidden bg-[#050505]">
      
      {/* Dynamic Grid & Radial Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:40px_40px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] md:w-[40vw] md:h-[40vw] bg-[#00e5ff]/20 rounded-full blur-[100px] md:blur-[150px] pointer-events-none"></div>

      <div className="relative z-20 flex flex-col items-center text-center w-full max-w-5xl">
        
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 md:gap-3 px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-[#00e5ff]/30 bg-[#00e5ff]/5 mb-6 md:mb-8 transition-all duration-1000 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#00e5ff] rounded-full animate-pulse"></span>
          <span className="text-[10px] md:text-xs font-mono text-[#00e5ff] uppercase tracking-[0.15em] md:tracking-[0.2em]">Spatial Computing Engine</span>
        </div>

        {/* Main Typography */}
        <h1 className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white uppercase leading-[0.95] md:leading-[0.9] mb-4 md:mb-6 transition-all duration-1000 delay-200 ease-out transform ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          ARCHITECTING <br />
          <span className="text-transparent [-webkit-text-stroke:1px_#00e5ff] animate-pulse drop-shadow-[0_0_10px_rgba(0,229,255,0.4)] md:drop-shadow-[0_0_15px_rgba(0,229,255,0.6)]">
            THE DIGITAL
          </span> DIMENSION
        </h1>
        
        {/* Subtitle & Description */}
        <p className={`text-xs md:text-lg text-gray-400 font-light tracking-wide max-w-2xl md:max-w-3xl leading-relaxed mb-8 md:mb-10 px-2 md:px-0 transition-all duration-1000 delay-400 ease-out transform ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          Bridging pure physical reality with digital objects without hardware limitations. AR-LABS harnesses advanced AI processing power and WebGL directly within modern browsers to track gestures, spatial points, and real-time interfaces.
        </p>

        {/* Action Button */}
        <div className={`flex justify-center transition-all duration-1000 delay-600 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <a 
            href="#modules" 
            className="group relative inline-flex items-center justify-center px-8 py-3 md:px-10 md:py-4 bg-white/5 border border-white/20 text-white font-bold text-[10px] md:text-xs uppercase tracking-widest hover:border-[#00e5ff] transition-all duration-300 backdrop-blur-md overflow-hidden rounded-sm"
          >
            <div className="absolute inset-0 bg-[#00e5ff]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10 flex items-center gap-2 group-hover:text-[#00e5ff] transition-colors">
              View Modules
              <svg className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </a>
        </div>

      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-40 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-30"></div>

    </section>
  );
}
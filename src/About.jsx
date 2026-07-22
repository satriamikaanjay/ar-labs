import React from 'react';

export default function About() {
  return (
    <section id="about" className="py-16 md:py-24 px-6 md:px-12 bg-[#020202] relative z-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        
        <div>
          <div className="flex items-center gap-4 mb-4 md:mb-6">
            <div className="h-[1px] w-8 md:w-12 bg-[#00e5ff]"></div>
            <h2 className="text-[10px] md:text-xs font-mono text-[#00e5ff] uppercase tracking-[0.2em]">01 // Infrastructure</h2>
          </div>
          
          <h3 className="text-2xl md:text-5xl font-bold text-white tracking-tight mb-6 md:mb-8 leading-snug">
            No VR headset required. Just use your browser.
          </h3>
          
          <div className="space-y-4 md:space-y-6 text-gray-400 text-xs md:text-base font-light leading-relaxed">
            <p>
              Our core mission is to democratize spatial computing. AR technology and hand tracking shouldn't be locked behind expensive hardware. 
            </p>
            <p>
              Utilizing Machine Learning models running entirely client-side, your standard camera is transformed into a high-accuracy spatial sensor. All data is processed locally, ensuring privacy while eliminating latency.
            </p>
          </div>
        </div>

        <div className="relative aspect-square md:aspect-video bg-white/5 border border-white/10 rounded-xl md:rounded-2xl overflow-hidden flex items-center justify-center group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className="w-24 h-24 md:w-32 md:h-32 border border-[#00e5ff]/50 rounded-full animate-[spin_8s_linear_infinite] flex items-center justify-center relative">
            <div className="w-16 h-16 md:w-24 md:h-24 border border-dashed border-[#00e5ff]/50 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
            <div className="absolute w-1.5 h-1.5 md:w-2 md:h-2 bg-[#00e5ff] rounded-full shadow-[0_0_15px_#00e5ff]"></div>
          </div>
        </div>

      </div>
    </section>
  );
}
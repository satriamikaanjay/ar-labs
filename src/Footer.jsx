import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#050505] pt-12 pb-8 md:pt-20 md:pb-10 px-6 border-t border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-10">
        
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tighter mb-2">AR-LABS</h2>
          <p className="text-white/40 text-xs md:text-sm font-light max-w-sm leading-relaxed">
            Architecting the future of spatial computing and real-time web processing environments.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 text-[9px] md:text-[11px] font-mono uppercase tracking-widest text-white/50 w-full md:w-auto mt-4 md:mt-0">
          <p className="w-full md:w-auto border-b border-white/10 md:border-none pb-2 md:pb-0 mb-2 md:mb-0">
            Created by <span className="text-white">Satria Mika Narendra</span>
          </p>
          <div className="flex items-center gap-2 md:gap-3">
            <span>Powered by</span>
            <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/20">
              Teman Coding
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
import React, { useState } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import About from './About';
import Projects from './Projects';
import Footer from './Footer';

// Pastikan kedua komponen AR sudah di-import
import VoxelBuilder from './VoxelBuilder'; 
import NeuralHand from './NeuralHand';
import NeonCanvas from './NeonCanvas';
import HoloShifter from './HoloShifter';

export default function App() {
  const [activeModule, setActiveModule] = useState(null); 

  return (
    <div className="antialiased bg-[#050505] text-white selection:bg-[#00e5ff] selection:text-black min-h-screen font-sans">
      
      <Navbar />
      <Hero />
      <About />
      
      {/* Oper kedua fungsi peluncur ke komponen Projects */}
      <Projects 
     onLaunchVoxel={() => setActiveModule('voxel')} 
     onLaunchNeural={() => setActiveModule('neural')} 
     onLaunchNeon={() => setActiveModule('neon')} 
     onLaunchHolo={() => setActiveModule('holo')}
   />
      
      <Footer />

      {/* Render komponen yang sesuai dengan state activeModule */}
      {activeModule === 'voxel' && (
        <VoxelBuilder onExit={() => setActiveModule(null)} />
      )}
      
      {activeModule === 'neural' && (
        <NeuralHand onExit={() => setActiveModule(null)} />
      )}

      {activeModule === 'neon' && (
     <NeonCanvas onExit={() => setActiveModule(null)} />
   )}

      {activeModule === 'holo' && (
        <HoloShifter onExit={() => setActiveModule(null)} />
      )}

    </div>
  );
}
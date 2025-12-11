import React from 'react';
import { useStore } from '../store';

const UI: React.FC = () => {
  const { phase, gesture } = useStore();

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">
      {/* Title */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mix-blend-screen">
        <h1 className="font-cursive text-6xl md:text-9xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] animate-pulse">
          Merry Christmas
        </h1>
      </div>

      {/* Info Panel */}
      <div className="absolute top-4 left-4 glass-panel p-4 rounded-xl text-white max-w-xs">
        <div className="flex items-center gap-2 mb-2">
           <div className={`w-3 h-3 rounded-full ${gesture !== 'None' ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-red-400'}`}></div>
           <span className="font-mono text-xs uppercase tracking-widest opacity-80">Gesture: {gesture.replace('_', ' ')}</span>
        </div>
        <p className="text-sm opacity-90 font-light">
          {phase === 'tree' && "Hover/Touch the tree to interact. Show 'Open Palm' 🖐️ to bloom."}
          {phase === 'nebula' && "Show 'Closed Fist' ✊ to reset. Point finger to scroll."}
          {(phase === 'blooming' || phase === 'collapsing') && "Transitioning..."}
        </p>
      </div>

      {/* Music Player */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 glass-panel px-6 py-3 rounded-full flex items-center gap-4 text-white pointer-events-auto">
        <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center animate-spin-slow">
           <span className="text-xl">❄️</span>
        </div>
        <div className="overflow-hidden w-48 whitespace-nowrap">
           <div className="animate-marquee inline-block">
             Merry Christmas Mr. Lawrence - Ryuichi Sakamoto &nbsp;&nbsp;&nbsp; Merry Christmas Mr. Lawrence...
           </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
        {/* Actual Audio Element (Hidden visuals, but playing) */}
        {/* Assuming file is in /mc/bgm.mp3 in public folder */}
        <audio autoPlay loop src="/mc/bgm.mp3" />
      </div>
    </div>
  );
};

export default UI;
'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, MutableRefObject } from 'react';

export function ParallaxTree() {
  const containerRef = useRef<HTMLDivElement>(null) as MutableRefObject<HTMLDivElement>;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  return (
    <div ref={containerRef} className="h-screen w-full relative overflow-hidden">
      {/* Background stars */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: y1 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-green-950 to-green-900" />
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Back layer - Mountains */}
      <motion.div 
        className="absolute inset-x-0 bottom-0"
        style={{ y: y2 }}
      >
        <div className="absolute bottom-0 w-full">
          <svg viewBox="0 0 1440 320" className="w-full">
            <path
              fill="#1a4731"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </motion.div>

      {/* Middle layer - Trees */}
      <motion.div 
        className="absolute inset-x-0 bottom-0"
        style={{ y: y3 }}
      >
        <div className="absolute bottom-0 w-full flex justify-center items-end">
          {/* Main Christmas Tree */}
          <div className="relative w-64 h-96 mb-20">
            {/* Tree layers */}
            {[1, 0.8, 0.6].map((scale, index) => (
              <div
                key={index}
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                style={{
                  width: `${scale * 100}%`,
                  height: `${scale * 100}%`,
                }}
              >
                <div className="w-full h-full bg-gradient-to-b from-green-600 to-green-700 clip-triangle" />
              </div>
            ))}
            {/* Tree trunk */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-brown-600 to-brown-700" />
            {/* Decorations */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-twinkle"
                style={{
                  backgroundColor: Math.random() > 0.5 ? '#ff0000' : '#ffd700',
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
            {/* Star */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400 clip-star animate-pulse" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

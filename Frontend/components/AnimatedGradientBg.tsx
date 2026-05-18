'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedGradientBg({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full opacity-30 blur-[100px] bg-primary"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-[20%] right-[10%] w-[40%] h-[60%] rounded-full opacity-20 blur-[120px] bg-primary"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full opacity-30 blur-[100px] bg-primary"
        />
      </div>

      {/* Content wrapper with backdrop blur implicitly applied via cards, but we ensure content is above the background */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}


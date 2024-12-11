'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';

export function ParallaxBanner2() {
  const { scrollYProgress } = useScroll();
  const bannerY = useTransform(scrollYProgress, [0.5, 1], [0, 150]);

  return (
    <section className="relative h-[600px] w-full overflow-hidden">
      <motion.div 
        className="absolute inset-0"
        style={{ y: bannerY }}
      >
        <Image
          src="/banner2.jpg"
          alt="Fresh Cut Trees Banner"
          fill
          style={{ 
            objectFit: 'cover',
            objectPosition: 'center 30%',
            scale: 1.2 // Slightly larger to prevent white edges during parallax
          }}
          priority
        />
      </motion.div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="banner-title text-6xl md:text-8xl lg:text-9xl text-white mb-4"
        >
          Premium FRESH Cut Trees
        </motion.h1>
      </div>
    </section>
  );
}

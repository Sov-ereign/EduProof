"use client";

import { motion } from "framer-motion";

type AnimatedHeadingProps = {
  text: string;
};

const AnimatedHeading = ({ text }: AnimatedHeadingProps) => {
  const words = text.split(" ");

  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
      className="
        text-6xl md:text-8xl 
        font-bold tracking-tighter 
        mb-8 
        text-white
        drop-shadow-[0_0_30px_rgba(124,58,237,0.35)]
      "
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-4"
          variants={{
            hidden: { opacity: 0, y: 40, filter: "blur(6px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: {
                duration: 0.8,
                ease: "easeOut",
              },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
};

export default AnimatedHeading;

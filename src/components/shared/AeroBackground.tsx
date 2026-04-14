import { motion } from "framer-motion";

export const AeroBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-white">
      {/* Lucid Ambient Orbs (Ultra-light) */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-15%] left-[-10%] w-[800px] h-[800px] bg-slate-100/30 blur-[150px] rounded-full"
      />
      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 60, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[900px] h-[900px] bg-indigo-50/20 blur-[180px] rounded-full"
      />
      
      {/* Lucid Fine Mesh */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />
      
      {/* Secondary accent blur */}
      <div className="absolute top-[40%] left-[20%] w-[500px] h-[500px] bg-blue-50/10 blur-[120px] rounded-full" />
    </div>
  );
};

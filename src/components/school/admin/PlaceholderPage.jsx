import React from 'react';
import { motion } from 'framer-motion';

export default function PlaceholderPage({ title, description, icon: Icon }) {
  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
        <p className="text-sm font-bold text-slate-500 mt-1">{description || 'This module is currently under development.'}</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-premium rounded-[2.5rem] p-16 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center"
      >
        <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-slate-900 flex items-center justify-center mb-6">
          {Icon && <Icon className="w-10 h-10 text-blue-600" />}
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Coming Soon</h2>
        <p className="text-slate-500 font-medium max-w-md">
          We are actively working on the {title} module to bring you powerful new features. Stay tuned!
        </p>
      </motion.div>
    </div>
  );
}

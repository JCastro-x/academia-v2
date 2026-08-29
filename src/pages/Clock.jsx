import { useState } from 'react';
import { motion } from 'framer-motion';
import PomodoroTimer from '../components/PomodoroTimer.jsx';
import ChronometerTimer from '../components/ChronometerTimer.jsx';

export default function Clock() {
  const [activeTab, setActiveTab] = useState('pomodoro');

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-[var(--dm-text)]">Reloj</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pomodoro')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pomodoro'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]'
          }`}
        >
          Pomodoro
        </button>
        <button
          onClick={() => setActiveTab('chronometer')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'chronometer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-[var(--dm-bg)] dark:text-[var(--dm-text)] dark:hover:bg-[var(--dm-border)]'
          }`}
        >
          Cronómetro
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'pomodoro' ? <PomodoroTimer /> : <ChronometerTimer />}
        </motion.div>
      </div>
    </div>
  );
}

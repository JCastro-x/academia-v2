import { useState } from 'react'

export default function HabitsTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-[var(--dm-border)]">
      <button
        onClick={() => onTabChange('semana')}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'semana'
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-transparent text-gray-600 dark:text-[var(--dm-text-muted)] hover:text-gray-900 dark:hover:text-[var(--dm-text)]'
        }`}
      >
        Semana
      </button>
      <button
        onClick={() => onTabChange('progreso')}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'progreso'
            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
            : 'border-transparent text-gray-600 dark:text-[var(--dm-text-muted)] hover:text-gray-900 dark:hover:text-[var(--dm-text)]'
        }`}
      >
        Progreso
      </button>
    </div>
  )
}

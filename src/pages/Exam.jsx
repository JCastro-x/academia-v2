import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUIStore } from '../stores/ui.store.js';
import { playSound } from '../lib/sound.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import UndoToast from '../components/UndoToast.jsx';
import { openDB } from 'idb';

// IndexedDB setup for exam files
const DB_NAME = 'AcademiaExamDB';
const DB_VERSION = 1;
const STORE_NAME = 'examFiles';

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

async function saveFileToDB(file) {
  const db = await initDB();
  const id = Date.now().toString();
  const fileData = {
    id,
    name: file.name,
    type: file.type,
    data: file,
    createdAt: new Date().toISOString(),
  };
  await db.put(STORE_NAME, fileData);
  return fileData;
}

async function getFilesFromDB() {
  const db = await initDB();
  return await db.getAll(STORE_NAME);
}

async function deleteFileFromDB(id) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}

async function clearExamFiles() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}

export default function Exam() {
  const navigate = useNavigate();
  const { semesterId } = useParams();
  const { openConfirmDialog } = useUIStore();

  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const [examFiles, setExamFiles] = useState([]);
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const intervalRef = useRef(null);
  const lastCountdownSecondRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load files from IndexedDB on mount
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await getFilesFromDB();
        setExamFiles(files || []);
      } catch (error) {
        console.error('Error loading exam files:', error);
      }
    };
    loadFiles();
  }, []);

  // Paste event handler for images
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            try {
              const savedFile = await saveFileToDB(file);
              setExamFiles(prev => [...prev, savedFile]);
              playSound('save');
            } catch (error) {
              console.error('Error saving pasted image:', error);
            }
          }
          break; // Only handle the first image
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // Keyboard navigation for file viewer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFile) return;

      const currentIndex = examFiles.findIndex(f => f.id === selectedFile.id);
      
      if (e.key === 'ArrowLeft' && examFiles.length > 1) {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : examFiles.length - 1;
        setSelectedFile(examFiles[prevIndex]);
      } else if (e.key === 'ArrowRight' && examFiles.length > 1) {
        e.preventDefault();
        const nextIndex = currentIndex < examFiles.length - 1 ? currentIndex + 1 : 0;
        setSelectedFile(examFiles[nextIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedFile(null);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, examFiles]);

  // Touch/swipe navigation for mobile
  useEffect(() => {
    if (!selectedFile || examFiles.length <= 1) return;

    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      const currentIndex = examFiles.findIndex(f => f.id === selectedFile.id);

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          // Swipe right - go to previous
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : examFiles.length - 1;
          setSelectedFile(examFiles[prevIndex]);
        } else {
          // Swipe left - go to next
          const nextIndex = currentIndex < examFiles.length - 1 ? currentIndex + 1 : 0;
          setSelectedFile(examFiles[nextIndex]);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [selectedFile, examFiles]);

  // Pinch-to-zoom for mobile
  useEffect(() => {
    if (!selectedFile) return;

    let initialDistance = 0;
    let initialZoom = 1;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoom = zoomLevel;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = currentDistance / initialDistance;
        const newZoom = Math.max(0.5, Math.min(3, initialZoom * scale));
        setZoomLevel(newZoom);
      }
    };

    const viewerElement = document.getElementById('exam-file-viewer');
    if (viewerElement) {
      viewerElement.addEventListener('touchstart', handleTouchStart);
      viewerElement.addEventListener('touchmove', handleTouchMove);
      return () => {
        viewerElement.removeEventListener('touchstart', handleTouchStart);
        viewerElement.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [selectedFile, zoomLevel]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const viewerElement = document.getElementById('exam-file-viewer');
    if (!viewerElement) return;

    if (!isFullscreen) {
      if (viewerElement.requestFullscreen) {
        viewerElement.requestFullscreen();
      } else if (viewerElement.webkitRequestFullscreen) {
        viewerElement.webkitRequestFullscreen();
      } else if (viewerElement.msRequestFullscreen) {
        viewerElement.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  // Keyboard zoom controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedFile) return;

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleZoomReset();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile]);

  // Reset zoom when changing files
  useEffect(() => {
    setZoomLevel(1);
  }, [selectedFile?.id]);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        try {
          const savedFile = await saveFileToDB(file);
          setExamFiles(prev => [...prev, savedFile]);
        } catch (error) {
          console.error('Error saving file:', error);
        }
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = async (id) => {
    try {
      await deleteFileFromDB(id);
      setExamFiles(prev => prev.filter(f => f.id !== id));
      if (selectedFile?.id === id) {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleClearExam = () => {
    openConfirmDialog({
      title: 'Limpiar examen',
      message: 'Esto reiniciará el temporizador y borrará todas las imágenes/PDFs guardados. ¿Continuar?',
      confirmText: 'Limpiar',
      onConfirm: async () => {
        try {
          await clearExamFiles();
          setExamFiles([]);
          setSelectedFile(null);
          handleReset();
          playSound('delete');
        } catch (error) {
          console.error('Error clearing exam files:', error);
        }
      },
    });
  };

  const triggerCountdownSound = (remaining) => {
    if (remaining > 10 || remaining <= 0) {
      if (remaining > 10) lastCountdownSecondRef.current = null;
      return;
    }

    if (remaining !== lastCountdownSecondRef.current) {
      lastCountdownSecondRef.current = remaining;
      playSound('countdown');
    }
  };

  const finishExam = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
    setRemainingSeconds(0);
    lastCountdownSecondRef.current = null;
    playSound('pomodoro-complete');
  };

  // Timer logic usando timestamp-based approach (igual que Pomodoro)
  useEffect(() => {
    if (isRunning && startedAt) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = (durationMinutes * 60) - elapsed;

        if (remaining <= 0) {
          finishExam();
        } else {
          triggerCountdownSound(remaining);
          setRemainingSeconds(remaining);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startedAt, durationMinutes]);

  // Recalcular tiempo restante cuando la pestaña vuelve a estar visible (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning && startedAt) {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = (durationMinutes * 60) - elapsed;
        if (remaining <= 0) finishExam();
        else {
          triggerCountdownSound(remaining);
          setRemainingSeconds(remaining);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, startedAt, durationMinutes]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    lastCountdownSecondRef.current = null;
    setStartedAt(Date.now());
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    // Recalcular startedAt para continuar desde donde quedó
    const elapsed = (durationMinutes * 60) - remainingSeconds;
    lastCountdownSecondRef.current = null;
    setStartedAt(Date.now() - (elapsed * 1000));
    setIsRunning(true);
    setIsPaused(false);
  };

  const handleReset = () => {
    lastCountdownSecondRef.current = null;
    setIsRunning(false);
    setIsPaused(false);
    setStartedAt(null);
    setRemainingSeconds(durationMinutes * 60);
  };

  const handleExit = () => {
    if (isRunning) {
      openConfirmDialog({
        title: 'Salir del modo examen',
        message: 'El temporizador está corriendo. ¿Seguro que quieres salir? Perderás el progreso actual.',
        confirmText: 'Salir',
        onConfirm: () => navigate(`/s/${semesterId}`),
      });
    } else {
      navigate(`/s/${semesterId}`);
    }
  };

  const handleDurationChange = (value) => {
    const newDuration = parseInt(value) || 60;
    setDurationMinutes(newDuration);
    if (!isRunning && !isPaused) {
      setRemainingSeconds(newDuration * 60);
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-[var(--dm-bg)] flex flex-col items-center justify-center p-8">
      {/* Header con botones */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setShowFilesPanel(!showFilesPanel)}
          className="px-4 py-2 bg-gray-200 dark:bg-[var(--dm-surface)] text-gray-700 dark:text-[var(--dm-text)] rounded-lg hover:bg-gray-300 dark:hover:bg-[var(--dm-border)] transition-colors"
        >
          {showFilesPanel ? 'Ocultar archivos' : `Archivos (${examFiles.length})`}
        </button>
        <button
          onClick={handleClearExam}
          className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
        >
          Limpiar examen
        </button>
        <button
          onClick={handleExit}
          className="px-4 py-2 bg-gray-200 dark:bg-[var(--dm-surface)] text-gray-700 dark:text-[var(--dm-text)] rounded-lg hover:bg-gray-300 dark:hover:bg-[var(--dm-border)] transition-colors"
        >
          Salir
        </button>
      </div>

      <div className="flex items-start gap-8 max-w-6xl w-full">
        {/* Timer Section */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-8 flex-1"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[var(--dm-text)]">Modo Examen</h1>

          {/* Timer display */}
          <div className="rounded-2xl py-12 px-16 inline-block text-[var(--color-primary-fg)]" style={{ backgroundColor: 'var(--color-primary)' }}>
            <div className="text-8xl font-bold">
              {formatTime(remainingSeconds)}
            </div>
          </div>

          {/* Configuración de duración (solo cuando no está corriendo) */}
          {!isRunning && !isPaused && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--dm-text-muted)]">
                Duración (minutos)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="w-32 px-4 py-2 text-center text-lg border border-gray-300 dark:border-[var(--dm-border)] rounded-lg dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)]"
                min="1"
                max="300"
                autoComplete="off"
              />
            </div>
          )}

          {/* Controles */}
          <div className="flex gap-4 justify-center">
            {!isRunning && !isPaused && (
              <button
                onClick={handleStart}
                className="text-[var(--color-primary-fg)] px-8 py-3 rounded-lg font-medium text-lg transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Iniciar
              </button>
            )}
            {isRunning && (
              <button
                onClick={handlePause}
                className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 font-medium text-lg"
              >
                Pausar
              </button>
            )}
            {isPaused && (
              <button
                onClick={handleResume}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-medium text-lg"
              >
                Reanudar
              </button>
            )}
            <button
              onClick={handleReset}
              className="bg-gray-200 text-gray-700 dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)] px-8 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-[var(--dm-border)] font-medium text-lg"
            >
              Reset
            </button>
          </div>

          {/* Estado */}
          <div className="text-sm text-gray-500 dark:text-[var(--dm-text-muted)]">
            {isRunning && 'Temporizador corriendo...'}
            {isPaused && 'Temporizador pausado'}
            {!isRunning && !isPaused && 'Listo para iniciar'}
          </div>
        </motion.div>

        {/* Files Panel */}
        {showFilesPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-96 bg-gray-50 dark:bg-[var(--dm-surface)] rounded-xl p-4 border border-gray-200 dark:border-[var(--dm-border)] max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-[var(--dm-text)]">Archivos del examen</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
              >
                Subir
              </button>
            </div>

            <div className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)] mb-3">
              Ctrl+V para pegar imágenes
            </div>

            {examFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-[var(--dm-text-muted)]">
                <p>No hay archivos</p>
                <p className="text-xs mt-1">Sube PDF o imágenes, o pega con Ctrl+V</p>
              </div>
            ) : (
              <div className="space-y-2">
                {examFiles.map(file => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-2 bg-white dark:bg-[var(--dm-bg)] rounded-lg border border-gray-200 dark:border-[var(--dm-border)] hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer transition-colors"
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-[var(--dm-border)] rounded flex-shrink-0">
                      {file.type.startsWith('image/') ? (
                        <svg className="w-5 h-5 text-gray-600 dark:text-[var(--dm-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600 dark:text-[var(--dm-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-[var(--dm-text)] truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
                        {file.type.startsWith('image/') ? 'Imagen' : 'PDF'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* File Viewer Modal - Large Carousel */}
      {selectedFile && (
        <div 
          id="exam-file-viewer"
          className="fixed inset-0 bg-black/90 z-50 flex flex-col" 
          onClick={() => setSelectedFile(null)}
        >
          {/* Header with navigation and controls */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[var(--dm-surface)] border-b border-gray-200 dark:border-[var(--dm-border)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const currentIndex = examFiles.findIndex(f => f.id === selectedFile.id);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : examFiles.length - 1;
                  setSelectedFile(examFiles[prevIndex]);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg transition-colors"
                disabled={examFiles.length <= 1}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-[var(--dm-text)] truncate max-w-md">{selectedFile.name}</h3>
                <p className="text-xs text-gray-500 dark:text-[var(--dm-text-muted)]">
                  {examFiles.findIndex(f => f.id === selectedFile.id) + 1} / {examFiles.length}
                </p>
              </div>
              <button
                onClick={() => {
                  const currentIndex = examFiles.findIndex(f => f.id === selectedFile.id);
                  const nextIndex = currentIndex < examFiles.length - 1 ? currentIndex + 1 : 0;
                  setSelectedFile(examFiles[nextIndex]);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg transition-colors"
                disabled={examFiles.length <= 1}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Zoom and fullscreen controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg transition-colors"
                title="Alejar (-)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-[var(--dm-text)] min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg transition-colors"
                title="Acercar (+)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={handleZoomReset}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg transition-colors"
                title="Reset zoom (0)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m0 0l-5 5M4 16v4m0 0h4m0 0l5-5m11 5l-5-5m-5 5v-4m0 0h-4" />
                </svg>
              </button>
              <div className="w-px h-6 bg-gray-300 dark:bg-[var(--dm-border)] mx-1" />
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg transition-colors"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m0 0l-5 5M4 16v4m0 0h4m0 0l5 5m11 5l-5-5m-5 5v-4m0 0h-4" />
                  </svg>
                )}
              </button>
            </div>

            <button
              onClick={() => setSelectedFile(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[var(--dm-border)] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* File content area */}
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-[var(--dm-bg)]" onClick={(e) => e.stopPropagation()}>
            <div className="max-w-6xl mx-auto p-8">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(selectedFile.data)}
                  alt={selectedFile.name}
                  className="max-w-full h-auto mx-auto shadow-lg transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              ) : selectedFile.type === 'application/pdf' ? (
                <div className="h-full">
                  <iframe
                    src={URL.createObjectURL(selectedFile.data)}
                    className="w-full h-[calc(100vh-120px)] border border-gray-200 dark:border-[var(--dm-border)] rounded-lg bg-white dark:bg-[var(--dm-surface)] transition-transform duration-200"
                    title={selectedFile.name}
                    style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-[var(--dm-text-muted)]">Tipo de archivo no soportado</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation footer for mobile swipe hint */}
          <div className="p-2 bg-white dark:bg-[var(--dm-surface)] border-t border-gray-200 dark:border-[var(--dm-border)] text-center text-xs text-gray-500 dark:text-[var(--dm-text-muted)]" onClick={(e) => e.stopPropagation()}>
            {examFiles.length > 1 && 'Usa las flechas o swipe para navegar entre archivos • +/- para zoom • F para pantalla completa'}
          </div>
        </div>
      )}

      {/* Componentes globales */}
      <ConfirmDialog />
      <UndoToast />
    </div>
  );
}

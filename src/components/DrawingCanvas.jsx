import { useRef, useState, useEffect } from 'react'
import { usePainter } from 'react-painter'

export default function DrawingCanvas({ onSave, onCancel, width = 600, height = 400 }) {
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [isEraser, setIsEraser] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)
  
  const { getCanvasProps, triggerSave, setColor, setLineWidth } = usePainter({
    width,
    height,
    initialColor: strokeColor,
    initialLineWidth: strokeWidth,
    onSave: (blob) => {
      if (onSave) onSave(blob)
    },
  })

  // Update color when strokeColor or isEraser changes
  useEffect(() => {
    setColor(isEraser ? '#ffffff' : strokeColor)
  }, [strokeColor, isEraser, setColor])

  // Update line width when strokeWidth changes
  useEffect(() => {
    setLineWidth(strokeWidth)
  }, [strokeWidth, setLineWidth])

  const handleSave = () => {
    triggerSave()
  }

  const handleClear = () => {
    setCanvasKey(prev => prev + 1)
  }

  const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Color picker */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Color:</span>
          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setStrokeColor(color)
                  setIsEraser(false)
                }}
                className={`w-6 h-6 rounded border-2 ${
                  strokeColor === color && !isEraser ? 'border-blue-500' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Stroke width */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Grosor:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm w-6">{strokeWidth}</span>
        </div>

        {/* Eraser */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`px-3 py-1 rounded text-sm ${
            isEraser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isEraser ? '✏️' : '🧹'}
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          Limpiar
        </button>
      </div>

      {/* Canvas */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          key={canvasKey}
          {...getCanvasProps({
            style: {
              cursor: isEraser ? 'cell' : 'crosshair',
            },
          })}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Guardar dibujo
        </button>
      </div>
    </div>
  )
}

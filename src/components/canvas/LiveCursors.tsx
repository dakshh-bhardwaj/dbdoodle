import { useEffect, useState } from 'react'
import { getAwareness, useMultiplayerStore } from '@/hooks/useMultiplayer'
import { useReactFlow, useViewport } from '@xyflow/react'

const CURSOR_COLORS = [
  '#ff5722', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', 
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800'
]

export function LiveCursors() {
  const [peers, setPeers] = useState(new Map())
  const { screenToFlowPosition } = useReactFlow()
  const { x, y, zoom } = useViewport()
  const connected = useMultiplayerStore(s => s.connected)

  useEffect(() => {
    // We re-run this effect when `connected` changes because the provider 
    // might be initialized after this component mounts.
    const awareness = getAwareness()
    if (!awareness) return

    const handleAwarenessUpdate = () => {
      const states = awareness.getStates()
      const newPeers = new Map()
      states.forEach((state, clientId) => {
        if (clientId !== awareness.clientID && state.cursor) {
          newPeers.set(clientId, state)
        }
      })
      setPeers(newPeers)
    }

    awareness.on('change', handleAwarenessUpdate)
    handleAwarenessUpdate() // Initial fetch

    const handlePointerMove = (e: PointerEvent) => {
      // Ignore moves over UI elements that stop propagation, but window event catches all unless stopped
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      awareness.setLocalStateField('cursor', position)
    }
    
    const handlePointerLeave = () => {
      awareness.setLocalStateField('cursor', null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      awareness.off('change', handleAwarenessUpdate)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [screenToFlowPosition, connected])

  if (peers.size === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {Array.from(peers.entries()).map(([id, state]) => {
        const { cursor } = state
        if (!cursor) return null
        
        const color = CURSOR_COLORS[id % CURSOR_COLORS.length]
        
        // Convert flow position back to screen position based on current viewport
        const screenX = cursor.x * zoom + x
        const screenY = cursor.y * zoom + y
        
        return (
          <div
            key={id}
            className="absolute top-0 left-0 transition-all duration-75 ease-linear"
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
            }}
          >
            <svg 
              width="24" 
              height="36" 
              viewBox="0 0 24 36" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-md"
              style={{ transform: 'translate(-4px, -4px)' }}
            >
              <path 
                d="M5.65376 21.1597L1 36L11.5847 16.9497L23 20.3061L5.65376 21.1597Z" 
                fill={color} 
                stroke="white" 
                strokeWidth="2"
              />
            </svg>
            <div 
              className="absolute left-4 top-4 px-1.5 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-sm"
              style={{ backgroundColor: color }}
            >
              User {id.toString().slice(-4)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

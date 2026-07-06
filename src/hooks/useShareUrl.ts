import { useEffect, useState } from 'react'
import * as SharingService from '@/services/sharing'
import { useSchemaStore } from '@/hooks/useSchemaStore'

export function useShareUrl() {
  const setSchema = useSchemaStore((s) => s.setSchema)
  const [roomId, setRoomId] = useState<string | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    let room = url.searchParams.get('room')
    
    // Legacy support for hash-based schema loading
    const legacySchema = SharingService.getSchemaFromUrl()
    if (legacySchema) {
      setSchema(legacySchema)
      window.history.replaceState(null, '', window.location.pathname)
    }

    // Assign room ID if missing
    if (!room) {
      room = crypto.randomUUID()
      url.searchParams.set('room', room)
      window.history.replaceState(null, '', url.toString())
    }
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRoomId(room)
  }, [setSchema])

  return {
    roomId,
    generateShareUrl: () => {
      const url = new URL(window.location.href)
      url.searchParams.set('room', roomId || '')
      return url.toString()
    },
    copyShareUrl: async () => {
      const url = new URL(window.location.href)
      url.searchParams.set('room', roomId || '')
      const urlString = url.toString()
      await navigator.clipboard.writeText(urlString)
      return urlString
    },
  }
}

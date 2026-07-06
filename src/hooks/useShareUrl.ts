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
      const schema = useSchemaStore.getState().schema
      const url = new URL(window.location.href)
      url.searchParams.set('room', roomId || '')
      url.hash = `schema=${SharingService.encodeSchema(schema)}`
      return url.toString()
    },
    copyShareUrl: async () => {
      const schema = useSchemaStore.getState().schema
      const url = new URL(window.location.href)
      url.searchParams.set('room', roomId || '')
      url.hash = `schema=${SharingService.encodeSchema(schema)}`
      const urlString = url.toString()
      await navigator.clipboard.writeText(urlString)
      return urlString
    },
  }
}

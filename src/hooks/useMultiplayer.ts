import { useEffect, useRef } from 'react'
import * as Y from 'yjs'
import YPartyKitProvider from 'y-partykit/provider'
import { useSchemaStore } from './useSchemaStore'
import { create } from 'zustand'

export const useMultiplayerStore = create<{
  connected: boolean
  peers: number
  canUndo: boolean
  canRedo: boolean
  setConnected: (c: boolean) => void
  setPeers: (p: number) => void
  setUndoState: (canUndo: boolean, canRedo: boolean) => void
}>((set) => ({
  connected: false,
  peers: 0,
  canUndo: false,
  canRedo: false,
  setConnected: (connected) => set({ connected }),
  setPeers: (peers) => set({ peers }),
  setUndoState: (canUndo, canRedo) => set({ canUndo, canRedo }),
}))

// Create a single global Yjs document
export const yDoc = new Y.Doc()

// We store the schema in maps to allow granular merging
export const yTables = yDoc.getMap('tables')
export const yRelationships = yDoc.getMap('relationships')

export const undoManager = new Y.UndoManager([yTables, yRelationships], {
  trackedOrigins: new Set(['local']),
})

let provider: YPartyKitProvider | null = null

export function useMultiplayer(roomId: string | null) {
  const setConnected = useMultiplayerStore(s => s.setConnected)
  const setPeers = useMultiplayerStore(s => s.setPeers)

  // Track if a local change was applied to prevent echo loops
  const isApplyingRemote = useRef(false)

  // 1. Setup Network Provider & UndoManager
  useEffect(() => {
    const handleUndoUpdate = () => {
      useMultiplayerStore.getState().setUndoState(
        undoManager.undoStack.length > 0,
        undoManager.redoStack.length > 0
      )
    }
    
    undoManager.on('stack-item-added', handleUndoUpdate)
    undoManager.on('stack-item-popped', handleUndoUpdate)

    if (!roomId) {
      if (provider) {
        provider.destroy()
        provider = null
      }
      return
    }

    // Initialize PartyKit provider
    const host = window.location.hostname === 'localhost' 
      ? 'localhost:1999' 
      : 'dbdoodle.dakshh-bhardwaj.partykit.dev'

    provider = new YPartyKitProvider(host, roomId, yDoc)

    const handleSynced = () => setConnected(true)
    const handlePeers = () => {
      if (!provider) return
      setPeers(provider.awareness.getStates().size - 1)
    }

    provider.on('synced', handleSynced)
    provider.awareness.on('change', handlePeers)

    return () => {
      undoManager.off('stack-item-added', handleUndoUpdate)
      undoManager.off('stack-item-popped', handleUndoUpdate)
      if (provider) {
        provider.off('synced', handleSynced)
        provider.awareness.off('change', handlePeers)
        provider.destroy()
        provider = null
      }
      setConnected(false)
    }
  }, [roomId, setConnected, setPeers])

  // 2. Sync Zustand to Yjs (Local -> Remote)
  useEffect(() => {
    if (!roomId) return

    return useSchemaStore.subscribe((state) => {
      if (isApplyingRemote.current) return // skip if we are applying a remote update

      const newSchema = state.schema

      yDoc.transact(() => {
        // Sync tables
        const newTableIds = new Set(newSchema.tables.map((t) => t.id))
        for (const id of yTables.keys()) {
          if (!newTableIds.has(id)) yTables.delete(id)
        }
        for (const t of newSchema.tables) {
          const existing = yTables.get(t.id) as import('@/types/schema').Table | undefined
          if (!existing || JSON.stringify(existing) !== JSON.stringify(t)) {
            yTables.set(t.id, t)
          }
        }

        // Sync relationships
        const newRelIds = new Set(newSchema.relationships.map((r) => r.id))
        for (const id of yRelationships.keys()) {
          if (!newRelIds.has(id)) yRelationships.delete(id)
        }
        for (const r of newSchema.relationships) {
          const existing = yRelationships.get(r.id) as import('@/types/schema').Relationship | undefined
          if (!existing || JSON.stringify(existing) !== JSON.stringify(r)) {
            yRelationships.set(r.id, r)
          }
        }
      }, 'local')
    })
  }, [roomId])

  // 3. Sync Yjs to Zustand (Remote -> Local)
  useEffect(() => {
    if (!roomId) return

    const observer = (_event: Y.YMapEvent<unknown>, transaction: Y.Transaction) => {
      if (transaction.origin === 'local') return // skip our own updates

      isApplyingRemote.current = true
      
      const tables = Array.from(yTables.values()) as import('@/types/schema').Table[]
      const relationships = Array.from(yRelationships.values()) as import('@/types/schema').Relationship[]

      // Make sure we have a fresh copy of the whole schema from Yjs
      useSchemaStore.getState().setSchema({
        version: 1,
        tables,
        relationships,
      })

      // Allow React/Zustand to flush before we reset the flag
      setTimeout(() => {
        isApplyingRemote.current = false
      }, 0)
    }

    yTables.observe(observer)
    yRelationships.observe(observer)

    return () => {
      yTables.unobserve(observer)
      yRelationships.unobserve(observer)
    }
  }, [roomId])
}

export function getAwareness() {
  return provider?.awareness
}

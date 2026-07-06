import { create } from 'zustand'

type ChatStore = {
  isOpen: boolean
  unreadCount: number
  setOpen: (isOpen: boolean) => void
  incrementUnread: () => void
  clearUnread: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  unreadCount: 0,
  setOpen: (isOpen) => set((state) => ({ isOpen, unreadCount: isOpen ? 0 : state.unreadCount })),
  incrementUnread: () => set((state) => ({ unreadCount: state.isOpen ? 0 : state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),
}))

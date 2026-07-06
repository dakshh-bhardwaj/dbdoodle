import { useEffect, useState, useRef } from 'react'
import { XIcon, SendIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChatStore } from '@/hooks/useChatStore'
import { yChatMessages, localUser, yDoc } from '@/hooks/useMultiplayer'
import type { ChatMessage } from '@/hooks/useMultiplayer'
import { cn } from '@/lib/utils'

function useChatMessagesSync() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  
  useEffect(() => {
    const sync = () => setMessages(yChatMessages.toArray())
    sync()
    
    yChatMessages.observe(sync)
    return () => yChatMessages.unobserve(sync)
  }, [])
  
  return messages
}

export function ChatPanel() {
  const isOpen = useChatStore(s => s.isOpen)
  const setOpen = useChatStore(s => s.setOpen)
  const clearUnread = useChatStore(s => s.clearUnread)
  
  const messages = useChatMessagesSync()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      clearUnread()
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isOpen, messages.length, clearUnread])

  if (!isOpen) return null

  const handleSend = () => {
    if (!inputValue.trim()) return
    
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      userId: localUser.id,
      userName: localUser.name,
      userColor: localUser.color,
      timestamp: Date.now()
    }
    
    yDoc.transact(() => {
      yChatMessages.push([newMessage])
    }, 'local')
    
    setInputValue('')
  }

  return (
    <div className={cn(
        'bg-card absolute top-0 left-0 z-20 flex h-full w-[320px] flex-col border-r shadow-lg md:w-[340px] lg:w-[370px]',
        'motion-safe:animate-in motion-safe:slide-in-from-left motion-safe:duration-200'
      )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <span className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
          Chat
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close chat"
          className="text-muted-foreground hover:text-foreground size-6"
          onClick={() => setOpen(false)}
        >
          <XIcon className="size-3.5" />
        </Button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex flex-col", msg.userId === localUser.id ? "items-end" : "items-start")}>
            <span className="text-[10px] font-medium mb-0.5" style={{ color: msg.userColor }}>
              {msg.userName}
            </span>
            <div className={cn(
              "px-3 py-2 rounded-lg text-sm max-w-[85%] break-words",
              msg.userId === localUser.id ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
            )}>
              {msg.text}
            </div>
            <span className="text-[9px] text-muted-foreground mt-0.5 opacity-70">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-xs italic mt-10">
            No messages yet. Say hello!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="p-3 border-t bg-card">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
          <Input 
            autoComplete="off"
            placeholder="Type a message..." 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="flex-1 h-9"
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!inputValue.trim()}>
            <SendIcon className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

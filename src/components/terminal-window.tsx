"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef } from "react"
import { X, Minimize, Maximize, ChevronDown, ChevronUp, Send, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, type PanInfo } from "framer-motion"
import type { TerminalTheme } from "@/lib/terminal-themes"

// Define Message type locally within this component
// Allow all senders that might be passed via props
interface Message {
    id: string
    content: string
    sender: "user" | "system" | "npc" | "void"
    timestamp: Date
}

// Define Props using the local Message type
interface TerminalWindowProps {
    id: string
    theme: TerminalTheme
    onClose: () => void
    onFullscreenChange: (isFullscreen: boolean) => void
    onSaveState: (state: { messages: Message[], scrollPosition: number }) => void; // Uses local Message
    isActive: boolean
    initialPosition: { x: number; y: number }
    savedMessages: Message[] // Expects local Message format
    savedScrollPosition: number
    zIndex: number
    onFocus: () => void
    initialMessage?: string
}

const TerminalWindow = forwardRef<HTMLDivElement, TerminalWindowProps>(
    (
        {
            id,
            theme,
            onClose,
            onFullscreenChange,
            onSaveState,
            isActive,
            initialPosition,
            savedMessages,
            savedScrollPosition,
            zIndex,
            onFocus,
            initialMessage = "Welcome to the terminal. How can I assist you today?",
        },
        ref,
    ) => {
        // --- Core State ---
        const [isFullscreen, setIsFullscreen] = useState(false)
        const [isMinimized, setIsMinimized] = useState(false)
        const [inputValue, setInputValue] = useState("")
        // Initialize state with the received messages (now matching local Message type)
        const [messages, setMessages] = useState<Message[]>(savedMessages)
        // Reinstate missing state variables
        const [savedScrollPos, setSavedScrollPos] = useState(savedScrollPosition || 0)
        const [isUnminimizing, setIsUnminimizing] = useState(false)
        const [isTransitioning, setIsTransitioning] = useState(false)

        // State for previous position/size
        const [prevState, setPrevState] = useState({
            x: initialPosition.x,
            y: initialPosition.y,
            width: 380,
            height: 500
        })

        // --- Motion Values ---
        const x = useMotionValue(initialPosition.x)
        const y = useMotionValue(initialPosition.y)
        const width = useMotionValue(prevState.width)
        const height = useMotionValue(prevState.height)

        // --- Refs ---
        const constraintsRef = useRef(null)
        const messagesEndRef = useRef<HTMLDivElement>(null)
        const messagesContainerRef = useRef<HTMLDivElement>(null)

        // --- Effects (Keep relevant ones) ---
        useEffect(() => { /* unmount save */ return () => { if (messagesContainerRef.current) { onSaveState({ messages, scrollPosition: messagesContainerRef.current.scrollTop }) } else { onSaveState({ messages, scrollPosition: savedScrollPos }) } } }, [messages, onSaveState, savedScrollPos])
        useEffect(() => { /* fullscreen save */ if (isFullscreen) { setPrevState({ x: x.get(), y: y.get(), width: width.get(), height: height.get() }) } }, [isFullscreen, x, y, width, height])
        useEffect(() => { /* fullscreen restore */ if (!isFullscreen) { x.set(prevState.x); y.set(prevState.y); width.set(prevState.width); height.set(prevState.height) } }, [isFullscreen, prevState, x, y, width, height])
        useEffect(() => { /* scroll restore */ if (messagesContainerRef.current && savedScrollPosition > 0 && !isMinimized) { messagesContainerRef.current.scrollTop = savedScrollPosition } }, [savedScrollPosition, isMinimized])
        useEffect(() => { /* scroll to bottom */ if (!isMinimized && !isTransitioning && messagesEndRef.current) { const container = messagesContainerRef.current; const isScrolledToBottom = container && (container.scrollHeight - container.scrollTop <= container.clientHeight + 50); const lastMessage = messages[messages.length - 1]; if (lastMessage?.sender === 'system' || isScrolledToBottom) { messagesEndRef.current.scrollIntoView({ behavior: "smooth" }); } } }, [messages, isMinimized, isTransitioning]);
        useEffect(() => { /* unminimize restore scroll */ if (isUnminimizing && !isMinimized && messagesContainerRef.current) { messagesContainerRef.current.scrollTop = savedScrollPos; const timer = setTimeout(() => { setIsUnminimizing(false) }, 50); return () => clearTimeout(timer) } }, [isMinimized, isUnminimizing, savedScrollPos])

        // --- Handlers --- 
        const handleClose = () => { if (messagesContainerRef.current) { onSaveState({ messages, scrollPosition: messagesContainerRef.current.scrollTop }) } else { onSaveState({ messages, scrollPosition: savedScrollPos }) }; onClose() }
        const handleResize = (_: any, info: PanInfo) => { if (isFullscreen) return; width.set(Math.max(300, width.get() + info.delta.x)); height.set(Math.max(200, height.get() + info.delta.y)); };
        const toggleFullscreen = () => { /* ... logic ... */ }; // Assume correct
        const toggleMinimize = () => { /* ... logic ... */ }; // Assume correct

        const handleSendMessage = () => {
            if (!inputValue.trim()) return
            // Create new message using the local Message type
            const newMessage: Message = {
                id: Date.now().toString(),
                content: inputValue,
                sender: "user",
                timestamp: new Date(),
            }
            setMessages([...messages, newMessage])
            const currentInput = inputValue;
            setInputValue("")
            setTimeout(() => {
                let responseContent = `Echo: ${currentInput}`;
                // Determine sender based on theme - use local type
                // The key is that the 'sender' value matches the defined local Message type
                const responseMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: responseContent,
                    sender: "system", // Example: response is always 'system'
                    timestamp: new Date()
                };
                setMessages((prev) => [...prev, responseMessage]);
            }, 1000);
        }
        const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }
        const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        const exportChat = () => { /* ... */ }
        const getAsciiArt = () => { /* ... */ };

        // --- Return JSX ---
        return (
            <motion.div ref={ref} /* ... props ... */ >
                {/* ... Header ... */}
                {/* ... Content Area - uses local messages state */}
                <div ref={messagesContainerRef} /* ... */ >
                    {messages.map((message) => (
                        <div key={message.id} /* ... */ >
                            {/* Render based on message.sender from local state */}
                            <span className="text-xs font-semibold">
                                {message.sender === "system" ? theme.senderName
                                    : message.sender === "npc" ? "NPC"
                                        : message.sender === "void" ? "VOID"
                                            : theme.userSenderName}
                            </span>
                            {/* ... */}
                        </div>
                    ))}
                </div>
                {/* ... Input ... */}
                {/* ... Resize Handles ... */}
            </motion.div>
        )
    },
)

TerminalWindow.displayName = "TerminalWindow"
export default TerminalWindow


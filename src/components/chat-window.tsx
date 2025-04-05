"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef } from "react"
import { X, Minimize, Maximize, ChevronDown, ChevronUp, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, type PanInfo } from "framer-motion"

interface Message {
    id: string
    content: string
    sender: "user" | "system"
    timestamp: Date
}

interface ChatWindowProps {
    onClose: () => void
    onFullscreenChange: (isFullscreen: boolean) => void
    onSaveState: (messages: Message[], scrollPosition: number) => void
    isActive: boolean
    initialPosition: { x: number; y: number }
    savedMessages: Message[]
    savedScrollPosition: number
    zIndex: number
    onFocus: () => void
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
    (
        {
            onClose,
            onFullscreenChange,
            onSaveState,
            isActive,
            initialPosition,
            savedMessages,
            savedScrollPosition,
            zIndex,
            onFocus,
        },
        ref,
    ) => {
        // Core state
        const [isFullscreen, setIsFullscreen] = useState(false)
        const [isMinimized, setIsMinimized] = useState(false)
        const [inputValue, setInputValue] = useState("")
        const [messages, setMessages] = useState<Message[]>(savedMessages)

        // Transition states
        const [isUnminimizing, setIsUnminimizing] = useState(false)

        // Scroll position tracking
        const [savedScrollPos, setSavedScrollPos] = useState(savedScrollPosition)

        // Position and size tracking
        const [prevState, setPrevState] = useState({
            x: initialPosition.x,
            y: initialPosition.y,
            width: 380,
            height: 500,
        })

        // Motion values
        const x = useMotionValue(initialPosition.x)
        const y = useMotionValue(initialPosition.y)
        const width = useMotionValue(prevState.width)
        const height = useMotionValue(prevState.height)

        // Refs
        const constraintsRef = useRef(null)
        const chatWindowRef = useRef<HTMLDivElement>(null)
        const messagesEndRef = useRef<HTMLDivElement>(null)
        const messagesContainerRef = useRef<HTMLDivElement>(null)

        // Track if we're in the middle of a state transition
        const [isTransitioning, setIsTransitioning] = useState(false)

        // Save state before unmounting
        useEffect(() => {
            return () => {
                if (messagesContainerRef.current) {
                    onSaveState(messages, messagesContainerRef.current.scrollTop)
                } else {
                    onSaveState(messages, savedScrollPos)
                }
            }
        }, []) // Empty dependency array - this only runs on unmount

        // Save position and size before going fullscreen
        useEffect(() => {
            if (isFullscreen) {
                setPrevState({
                    x: x.get(),
                    y: y.get(),
                    width: width.get(),
                    height: height.get(),
                })
            }
        }, [isFullscreen, x, y, width, height])

        // Restore position and size when exiting fullscreen
        useEffect(() => {
            if (!isFullscreen) {
                x.set(prevState.x)
                y.set(prevState.y)
                width.set(prevState.width)
                height.set(prevState.height)
            }
        }, [isFullscreen, prevState, x, y, width, height])

        // Restore saved scroll position on initial load
        useEffect(() => {
            if (messagesContainerRef.current && savedScrollPosition > 0 && !isMinimized) {
                messagesContainerRef.current.scrollTop = savedScrollPosition
            }
        }, [savedScrollPosition, isMinimized])

        // Scroll to bottom when messages change
        useEffect(() => {
            if (!isMinimized && !isTransitioning && messagesEndRef.current) {
                // Only scroll to bottom for new messages, not on initial load
                if (savedMessages.length === 0 || messages.length > savedMessages.length) {
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
                }
            }
        }, [messages, isMinimized, isTransitioning, savedMessages.length])

        // Handle un-minimizing transition
        useEffect(() => {
            if (isUnminimizing && !isMinimized && messagesContainerRef.current) {
                // Apply the scroll position immediately
                messagesContainerRef.current.scrollTop = savedScrollPos

                // Small delay to ensure the scroll is applied before clearing the transition state
                const timer = setTimeout(() => {
                    setIsUnminimizing(false)
                }, 50)

                return () => clearTimeout(timer)
            }
        }, [isMinimized, isUnminimizing, savedScrollPos])

        // Handle closing - save state first
        const handleClose = () => {
            if (messagesContainerRef.current) {
                onSaveState(messages, messagesContainerRef.current.scrollTop)
            } else {
                onSaveState(messages, savedScrollPos)
            }
            onClose()
        }

        // Handle resizing
        const handleResize = (_: MouseEvent, info: PanInfo) => {
            if (isFullscreen) return

            width.set(Math.max(300, width.get() + info.delta.x))
            height.set(Math.max(200, height.get() + info.delta.y))
        }

        // Toggle fullscreen with completely revised approach for minimized state
        const toggleFullscreen = () => {
            // Prevent any action if we're already in a transition
            if (isTransitioning) return

            // If minimized and trying to go fullscreen
            if (isMinimized && !isFullscreen) {
                // Set transitioning flag to prevent other actions
                setIsTransitioning(true)

                // First un-minimize
                setIsMinimized(false)

                // Then after a delay, go fullscreen
                setTimeout(() => {
                    setIsFullscreen(true)
                    onFullscreenChange(true)

                    // Reset scroll position
                    if (messagesContainerRef.current) {
                        messagesContainerRef.current.scrollTop = 0
                    }

                    // Clear transition state
                    setTimeout(() => {
                        setIsTransitioning(false)
                    }, 100)
                }, 300) // Longer delay to ensure un-minimize is complete
            }
            // Normal toggle when not minimized
            else {
                setIsTransitioning(true)

                if (!isFullscreen && messagesContainerRef.current) {
                    setSavedScrollPos(messagesContainerRef.current.scrollTop)
                }

                const newFullscreenState = !isFullscreen
                setIsFullscreen(newFullscreenState)
                onFullscreenChange(newFullscreenState)

                // Clear transition state after a delay
                setTimeout(() => {
                    setIsTransitioning(false)
                }, 100)
            }
        }

        // Toggle minimize with scroll position preservation
        const toggleMinimize = () => {
            // Prevent any action if we're already in a transition
            if (isTransitioning) return

            if (!isMinimized && messagesContainerRef.current) {
                // Save scroll position when minimizing
                setSavedScrollPos(messagesContainerRef.current.scrollTop)
                setIsMinimized(true)
            } else {
                // When un-minimizing, set the transition state first
                setIsUnminimizing(true)
                setIsMinimized(false)
            }
        }

        // Handle sending messages
        const handleSendMessage = () => {
            if (!inputValue.trim()) return

            const newMessage: Message = {
                id: Date.now().toString(),
                content: inputValue,
                sender: "user",
                timestamp: new Date(),
            }

            setMessages([...messages, newMessage])
            setInputValue("")

            // Simulate response after a short delay
            setTimeout(() => {
                const responseMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: `Echo: ${inputValue}`,
                    sender: "system",
                    timestamp: new Date(),
                }
                setMessages((prev) => [...prev, responseMessage])
            }, 1000)
        }

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
            }
        }

        // Format timestamp
        const formatTime = (date: Date) => {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }

        // Save state when messages change
        useEffect(() => {
            // Only save state when messages actually change and after a small delay
            const saveTimeout = setTimeout(() => {
                if (messagesContainerRef.current) {
                    onSaveState(messages, messagesContainerRef.current.scrollTop)
                }
            }, 500)

            return () => clearTimeout(saveTimeout)
        }, [messages, onSaveState])

        return (
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    ref={(el) => {
                        // Assign to both refs
                        chatWindowRef.current = el
                        if (typeof ref === "function") {
                            ref(el)
                        } else if (ref) {
                            ref.current = el
                        }
                    }}
                    className={cn(
                        "fixed font-mono text-sm shadow-lg overflow-hidden pointer-events-auto",
                        "bg-[#f0ede6] border border-[#c8c3b8] backdrop-blur-sm",
                        isFullscreen ? "inset-0 rounded-none" : "rounded-md",
                        isTransitioning && "opacity-0", // Hide completely during transitions
                        isFullscreen && !isActive && "hidden", // Hide when not active in fullscreen
                    )}
                    style={{
                        x: isFullscreen ? 0 : x,
                        y: isFullscreen ? 0 : y,
                        width: isFullscreen ? "100vw" : width,
                        height: isFullscreen ? "100vh" : isMinimized ? 48 : height,
                        transition: isTransitioning ? "opacity 0.1s ease-out" : "opacity 0.2s ease-in",
                        zIndex: isFullscreen ? 1000 : zIndex, // Higher z-index for fullscreen
                    }}
                    drag={!isFullscreen}
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={constraintsRef}
                    dragTransition={{ power: 0, timeConstant: 0 }}
                    onMouseDown={onFocus} // Bring to front when clicked
                    onDragStart={onFocus} // Bring to front when dragged
                >
                    {/* Chat header with controls */}
                    <div className="chat-header flex items-center justify-between px-3 py-2 bg-[#e5e1d8] border-b border-[#c8c3b8]">
                        <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 rounded-full bg-[#d9b38c]"></div>
                            <span className="text-[#5a5751] font-semibold tracking-wide">TERMINAL_v2.3</span>
                        </div>
                        <div className="chat-controls flex items-center space-x-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-[#5a5751] hover:text-[#3d3b36] hover:bg-[#d9d4c9]"
                                onClick={toggleMinimize}
                                disabled={isFullscreen || isTransitioning}
                            >
                                {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-[#5a5751] hover:text-[#3d3b36] hover:bg-[#d9d4c9]"
                                onClick={toggleFullscreen}
                                disabled={isTransitioning}
                            >
                                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-[#5a5751] hover:text-[#3d3b36] hover:bg-[#d9d4c9]"
                                onClick={handleClose}
                            >
                                <X size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* Chat content */}
                    {(!isMinimized || isFullscreen) && (
                        <div className="flex flex-col" style={{ height: "calc(100% - 48px)" }}>
                            {/* Messages area with native scrolling */}
                            <div
                                ref={messagesContainerRef}
                                className={cn(
                                    "flex-1 overflow-y-auto p-3",
                                    isUnminimizing && !isFullscreen && "invisible", // Only hide during un-minimize, not during fullscreen
                                )}
                                style={{
                                    height: "calc(100% - 64px)",
                                    scrollbarWidth: "thin",
                                    scrollbarColor: "#c8c3b8 transparent",
                                }}
                            >
                                <div className="ascii-art text-center text-[#8a857d] mb-4 leading-tight">
                                    <pre className="text-xs">
                                        {`
┌─────────────────────────┐
│ ╔═╗╦═╗╔═╗╦ ╦╦╦  ╦╔═╗    │
│ ╠═╣╠╦╝║  ╠═╣║╚╗╔╝║╣     │
│ ╩ ╩╩╚═╚═╝╩ ╩╩ ╚╝ ╚═╝    │
└─────────────────────────┘
`}
                                    </pre>
                                </div>

                                <div className="grid gap-3">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                "px-3 py-2 rounded",
                                                message.sender === "system"
                                                    ? "bg-[#e5e1d8] text-[#5a5751] border-l-2 border-[#d9b38c]"
                                                    : "bg-[#d9d4c9] text-[#3d3b36] ml-8",
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-semibold">{message.sender === "system" ? "SYSTEM" : "USER"}</span>
                                                <span className="text-xs text-[#8a857d]">{formatTime(message.timestamp)}</span>
                                            </div>
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Chat input */}
                            <div className="chat-input p-3 bg-[#e5e1d8] border-t border-[#c8c3b8]">
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Type a message..."
                                            className="bg-[#f0ede6] border-[#c8c3b8] focus-visible:ring-[#d9b38c] placeholder:text-[#a39e94]"
                                        />
                                        <div className="absolute left-2 top-0 text-[#8a857d] text-xs font-mono opacity-70 pointer-events-none">
                                            {inputValue ? "" : "> "}
                                        </div>
                                    </div>
                                    <Button onClick={handleSendMessage} className="bg-[#d9b38c] hover:bg-[#c9a37c] text-[#3d3b36]">
                                        <Send size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resize handles */}
                    {!isFullscreen && !isMinimized && (
                        <>
                            {/* Bottom-right resize handle */}
                            <motion.div
                                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize"
                                drag
                                dragMomentum={false}
                                dragElastic={0}
                                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                                onDrag={handleResize}
                            >
                                <div className="w-2 h-2 border-r-2 border-b-2 border-[#8a857d] absolute bottom-1 right-1"></div>
                            </motion.div>

                            {/* Bottom-left resize handle */}
                            <motion.div
                                className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize"
                                drag
                                dragMomentum={false}
                                dragElastic={0}
                                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                                onDrag={(_, info) => {
                                    // For bottom-left, we need to adjust both width and x position
                                    const deltaWidth = -info.delta.x
                                    const newWidth = Math.max(300, width.get() + deltaWidth)
                                    const deltaX = width.get() - newWidth

                                    width.set(newWidth)
                                    x.set(x.get() + deltaX)
                                    height.set(Math.max(200, height.get() + info.delta.y))
                                }}
                            >
                                <div className="w-2 h-2 border-l-2 border-b-2 border-[#8a857d] absolute bottom-1 left-1"></div>
                            </motion.div>
                        </>
                    )}

                    {/* Grid overlay for terminal effect */}
                    <div
                        className="absolute inset-0 pointer-events-none z-10 opacity-5"
                        style={{
                            backgroundImage:
                                "linear-gradient(rgba(90, 87, 81, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(90, 87, 81, 0.1) 1px, transparent 1px)",
                            backgroundSize: "4px 4px",
                        }}
                    ></div>
                </motion.div>
            </div>
        )
    },
)

ChatWindow.displayName = "ChatWindow"

export default ChatWindow


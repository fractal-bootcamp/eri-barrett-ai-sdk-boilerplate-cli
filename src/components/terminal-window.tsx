"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef } from "react"
import { X, Minimize, Maximize, ChevronDown, ChevronUp, Send, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, type PanInfo, useDragControls } from "framer-motion"
import type { TerminalTheme } from "@/lib/terminal-themes"

interface Message {
    id: string
    content: string
    sender: "user" | "system"
    timestamp: Date
}

interface TerminalWindowProps {
    id: string
    theme: TerminalTheme
    onClose: () => void
    onFullscreenChange: (isFullscreen: boolean) => void
    onSaveState: (messages: Message[], scrollPosition: number) => void
    isActive: boolean
    initialPosition: { x: number; y: number }
    savedMessages: Message[]
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
        // Core state
        const [isFullscreen, setIsFullscreen] = useState(false)
        const [isMinimized, setIsMinimized] = useState(false)
        const [inputValue, setInputValue] = useState("")
        const [messages, setMessages] = useState<Message[]>(
            savedMessages.length > 0
                ? savedMessages
                : initialMessage
                    ? [{ id: "1", content: initialMessage, sender: "system", timestamp: new Date() }]
                    : []
        )

        // Transition states
        const [isUnminimizing, setIsUnminimizing] = useState(false)

        // Scroll position tracking
        const [savedScrollPos, setSavedScrollPos] = useState(savedScrollPosition || 0)

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

        // Create drag controls instance
        const dragControls = useDragControls()

        // Save state before unmounting
        useEffect(() => {
            return () => {
                if (messagesContainerRef.current) {
                    onSaveState(messages, messagesContainerRef.current.scrollTop)
                } else {
                    onSaveState(messages, savedScrollPos)
                }
            }
        }, [messages, onSaveState, savedScrollPos])

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
                const container = messagesContainerRef.current;
                const isScrolledToBottom = container && (container.scrollHeight - container.scrollTop <= container.clientHeight + 50);
                const lastMessage = messages[messages.length - 1];

                if (lastMessage?.sender === 'system' || isScrolledToBottom) {
                    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
                }
            }
        }, [messages, isMinimized, isTransitioning]);

        // Handle un-minimizing transition
        useEffect(() => {
            if (isUnminimizing && !isMinimized && messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = savedScrollPos
                const timer = setTimeout(() => {
                    setIsUnminimizing(false)
                }, 50)
                return () => clearTimeout(timer)
            }
        }, [isMinimized, isUnminimizing, savedScrollPos])

        // Save state when messages change
        useEffect(() => {
            const saveTimeout = setTimeout(() => {
                if (messagesContainerRef.current) {
                    onSaveState(messages, messagesContainerRef.current.scrollTop)
                }
            }, 500)

            return () => clearTimeout(saveTimeout)
        }, [messages, onSaveState])

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
        const handleResize = (_: any, info: PanInfo) => {
            if (isFullscreen) return
            width.set(Math.max(300, width.get() + info.offset.x))
            height.set(Math.max(200, height.get() + info.offset.y))
        }

        // Toggle fullscreen with completely revised approach for minimized state
        const toggleFullscreen = () => {
            if (isTransitioning) return
            if (isMinimized && !isFullscreen) {
                setIsTransitioning(true)
                setIsMinimized(false)
                setTimeout(() => {
                    setIsFullscreen(true)
                    onFullscreenChange(true)
                    if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = 0
                    setTimeout(() => {
                        setIsTransitioning(false)
                    }, 100)
                }, 300)
            } else {
                setIsTransitioning(true)
                if (!isFullscreen && messagesContainerRef.current) {
                    setSavedScrollPos(messagesContainerRef.current.scrollTop)
                }
                const newFullscreenState = !isFullscreen
                setIsFullscreen(newFullscreenState)
                onFullscreenChange(newFullscreenState)
                setTimeout(() => {
                    setIsTransitioning(false)
                }, 100)
            }
        }

        // Toggle minimize with scroll position preservation
        const toggleMinimize = () => {
            if (isTransitioning) return
            if (!isMinimized && messagesContainerRef.current) {
                setSavedScrollPos(messagesContainerRef.current.scrollTop)
                setIsMinimized(true)
            } else {
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
            const currentInput = inputValue
            setInputValue("")

            // Generate response based on terminal type
            setTimeout(() => {
                let responseContent = `Echo: ${currentInput}`

                if (theme.id === "npc") {
                    const npcResponses = [
                        "I've been in this village for many years. I can tell you about our local history.",
                        "You'll need better equipment if you want to venture into the forest.",
                        "Have you spoken with the blacksmith yet? He might have a quest for you.",
                        "Rumors say there's a hidden treasure in the mountains to the north.",
                        "I don't have any more quests for you at this time. Check back later.",
                    ]
                    responseContent = npcResponses[Math.floor(Math.random() * npcResponses.length)]
                } else if (theme.id === "void") {
                    const voidResponses = [
                        "The void whispers secrets that mortal minds cannot comprehend.",
                        "Stars die and are born in the endless expanse. Your question is but a fleeting moment.",
                        "The patterns you seek are illusions. Embrace the chaos of the cosmos.",
                        "Time is a construct. In the void, all moments exist simultaneously.",
                        "Your consciousness is a mere ripple in the infinite darkness.",
                    ]
                    responseContent = voidResponses[Math.floor(Math.random() * voidResponses.length)]
                }

                const responseMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    content: responseContent,
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

        // Get ASCII art based on terminal type
        const getAsciiArt = () => {
            if (theme.id === "npc") {
                return `
┌─────────────────────────┐
│ ╔═╗╔╗╔╔═╗  ╔╦╗╔═╗╔╦╗╔═╗ │
│ ║ ║║║║╠═╝  ║║║║ ║ ║║║╣  │
│ ╚═╝╝╚╝╩    ╩ ╩╚═╝═╩╝╚═╝ │
└─────────────────────────┘
`
            } else if (theme.id === "void") {
                return `
┌─────────────────────────┐
│ ╦  ╦╔═╗╦╔╦╗  ╔═╗╔═╗╔╦╗╔═╗│
│ ╚╗╔╝║ ║║ ║   ║  ║ ║ ║║║╣ │
│  ╚╝ ╚═╝╩ ╩   ╚═╝╚═╝═╩╝╚═╝│
└─────────────────────────┘
`
            } else {
                return `
┌─────────────────────────┐
│ ╔═╗╦═╗╔═╗╦ ╦╦╦  ╦╔═╗    │
│ ╠═╣╠╦╝║  ╠═╣║╚╗╔╝║╣     │
│ ╩ ╩╩╚═╚═╝╩ ╩╩ ╚╝ ╚═╝    │
└─────────────────────────┘
`
            }
        }

        // Export chat as JSON
        const exportChat = () => {
            // Create a JSON object with chat data
            const chatData = {
                id,
                theme: theme.id,
                timestamp: new Date().toISOString(),
                messages: messages.map((msg) => ({
                    ...msg,
                    timestamp: msg.timestamp.toISOString(),
                })),
            }

            // Convert to JSON string
            const jsonString = JSON.stringify(chatData, null, 2)

            // Create a blob
            const blob = new Blob([jsonString], { type: "application/json" })

            // Create a URL for the blob
            const url = URL.createObjectURL(blob)

            // Create a temporary anchor element
            const a = document.createElement("a")
            a.href = url
            a.download = `${theme.name.toLowerCase().replace(/\s+/g, "-")}-chat-${new Date().toISOString().slice(0, 10)}.json`

            // Trigger download
            document.body.appendChild(a)
            a.click()

            // Clean up
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        }

        // Save current position on drag start
        const onDragStartHandler = () => {
            onFocus(); // Bring window to front
        }

        // Properly update position after drag
        const onDragEndHandler = () => {
            // Store the current position in the prevState
            // This ensures it's remembered when toggling fullscreen
            setPrevState(prev => ({
                ...prev,
                x: x.get(),
                y: y.get()
            }));
        }

        // Function to start drag using controls (for the header)
        const startDrag = (event: React.PointerEvent) => {
            dragControls.start(event)
        }

        return (
            <div ref={constraintsRef} className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    ref={ref}
                    className={cn(
                        "fixed font-mono text-sm shadow-lg overflow-hidden pointer-events-auto",
                        theme.background,
                        `border-2 ${theme.border}`,
                        "backdrop-blur-sm",
                        isFullscreen ? "inset-0 rounded-none" : "rounded-md",
                        isTransitioning && "opacity-0", // Hide completely during transitions
                        isFullscreen && !isActive && "hidden", // Hide when not active in fullscreen
                        !isFullscreen && !isMinimized && "cursor-move", // Add cursor style when draggable
                    )}
                    style={{
                        x: isFullscreen ? 0 : x,
                        y: isFullscreen ? 0 : y,
                        width: isFullscreen ? "100vw" : width,
                        height: isFullscreen ? "100vh" : isMinimized ? 48 : height,
                        transition: isTransitioning ? "opacity 0.1s ease-out" : "opacity 0.2s ease-in",
                        zIndex: isFullscreen ? 1000 : zIndex, // Higher z-index for fullscreen
                    }}
                    drag={!isFullscreen && !isMinimized}
                    dragListener={false} // Disable automatic drag listening
                    dragControls={dragControls} // Pass controls
                    dragMomentum={false}
                    dragElastic={0}
                    dragConstraints={constraintsRef}
                    onDragStart={onDragStartHandler} // Keep state update handlers
                    onDragEnd={onDragEndHandler}
                    onMouseDown={onFocus}
                >
                    {/* Chat header with controls */}
                    <div
                        onPointerDown={startDrag} // Start drag on pointer down on the header
                        className={cn(
                            `chat-header flex items-center justify-between px-3 py-2 ${theme.headerBackground} border-b ${theme.headerBorder}`,
                            !isFullscreen && !isMinimized && "cursor-move", // Keep cursor style ONLY on header
                        )}
                    >
                        <div className="flex items-center space-x-2">
                            <div className={`h-3 w-3 rounded-full ${theme.dotColor}`}></div>
                            <span className={`${theme.headerText} font-semibold tracking-wide`}>{theme.name}</span>
                        </div>
                        <div className="chat-controls flex items-center space-x-1">
                            {/* Export button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 ${theme.headerText} hover:${theme.text} hover:${theme.buttonHover}`}
                                onClick={exportChat}
                                title="Export chat as JSON"
                            >
                                <Download size={14} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 ${theme.headerText} hover:${theme.text} hover:${theme.buttonHover}`}
                                onClick={toggleMinimize}
                                disabled={isFullscreen || isTransitioning}
                            >
                                {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 ${theme.headerText} hover:${theme.text} hover:${theme.buttonHover}`}
                                onClick={toggleFullscreen}
                                disabled={isTransitioning}
                            >
                                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 ${theme.headerText} hover:${theme.text} hover:${theme.buttonHover}`}
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
                                    scrollbarColor: `${theme.border} transparent`,
                                }}
                            >
                                <div className={`ascii-art text-center ${theme.timestampText} mb-4 leading-tight`}>
                                    <pre className="text-xs">{getAsciiArt()}</pre>
                                </div>

                                <div className="grid gap-3">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={cn(
                                                "px-3 py-2 rounded",
                                                message.sender === "system"
                                                    ? `${theme.messageBackground} ${theme.messageText} border-l-2 ${theme.messageBorder}`
                                                    : `${theme.userMessageBackground} ${theme.userMessageText} ml-8`,
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-semibold">
                                                    {message.sender === "system" ? theme.senderName : theme.userSenderName}
                                                </span>
                                                <span className={`text-xs ${theme.timestampText}`}>{formatTime(message.timestamp)}</span>
                                            </div>
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Chat input */}
                            <div className={`chat-input p-3 ${theme.headerBackground} border-t ${theme.headerBorder}`}>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Type a message..."
                                            className={`${theme.inputBackground} ${theme.inputBorder} focus-visible:ring-[${theme.dotColor}] ${theme.inputText} ${theme.inputPlaceholder}`}
                                        />
                                        <div
                                            className={`absolute left-2 top-0 ${theme.timestampText} text-xs font-mono opacity-70 pointer-events-none`}
                                        >
                                            {inputValue ? "" : "> "}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSendMessage}
                                        className={`${theme.buttonBackground} ${theme.buttonHover} ${theme.buttonText}`}
                                    >
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
                                style={{ touchAction: 'none' }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragMomentum={false}
                                dragElastic={0}
                                onDrag={handleResize}
                            >
                                <div
                                    className={`w-2 h-2 border-r-2 border-b-2 ${theme.resizeHandleBorder} absolute bottom-1 right-1`}
                                ></div>
                            </motion.div>

                            {/* Bottom-left resize handle */}
                            <motion.div
                                className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize"
                                style={{ touchAction: 'none' }}
                                drag
                                dragMomentum={false}
                                dragElastic={0}
                                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                                onDrag={(_, info) => {
                                    if (isFullscreen) return;
                                    const newWidth = Math.max(300, width.get() - info.offset.x);
                                    const widthChange = width.get() - newWidth;
                                    width.set(newWidth);
                                    x.set(x.get() + widthChange);
                                    height.set(Math.max(200, height.get() + info.offset.y));
                                }}
                            >
                                <div
                                    className={`w-2 h-2 border-l-2 border-b-2 ${theme.resizeHandleBorder} absolute bottom-1 left-1`}
                                ></div>
                            </motion.div>
                        </>
                    )}

                    {/* Grid overlay for terminal effect */}
                    <div
                        className="absolute inset-0 pointer-events-none z-10 opacity-5"
                        style={{
                            backgroundImage: `linear-gradient(${theme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)`,
                            backgroundSize: "4px 4px",
                        }}
                    ></div>
                </motion.div>
            </div>
        )
    },
)

TerminalWindow.displayName = "TerminalWindow"

export default TerminalWindow


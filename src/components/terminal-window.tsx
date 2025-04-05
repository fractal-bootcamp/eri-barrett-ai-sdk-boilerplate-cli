"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef } from "react"
import { X, Minimize, Maximize, ChevronDown, ChevronUp, Send, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { motion, useMotionValue } from "framer-motion"
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
        const [isUnminimizing, setIsUnminimizing] = useState(false)
        const [savedScrollPos, setSavedScrollPos] = useState(savedScrollPosition || 0)

        // Position tracking only (fixed size)
        const [prevState, setPrevState] = useState({
            x: initialPosition.x,
            y: initialPosition.y,
            // Fixed size values
            width: 380,
            height: 500,
        })

        // Motion values only for position
        const x = useMotionValue(initialPosition.x)
        const y = useMotionValue(initialPosition.y)
        // Remove width and height motion values
        // const width = useMotionValue(prevState.width)
        // const height = useMotionValue(prevState.height)

        // Refs
        const messagesEndRef = useRef<HTMLDivElement>(null)
        const messagesContainerRef = useRef<HTMLDivElement>(null)
        const [isTransitioning, setIsTransitioning] = useState(false)

        // --- Start: Effects --- 

        // Remove onSaveState dependency
        // useEffect(() => {
        //     return () => { ... }
        // }, [messages, onSaveState, savedScrollPos]);

        // Effect to save position before fullscreen (no size needed)
        useEffect(() => {
            if (isFullscreen) {
                setPrevState(prev => ({ ...prev, x: x.get(), y: y.get() }))
            }
        }, [isFullscreen, x, y]) // Only depend on x, y

        // Effect to restore position when exiting fullscreen (no size needed)
        useEffect(() => {
            if (!isFullscreen) {
                x.set(prevState.x)
                y.set(prevState.y)
            }
        }, [isFullscreen, prevState, x, y]) // Only restore x, y

        // Keep scroll restoration effect
        useEffect(() => {
            if (messagesContainerRef.current && savedScrollPosition > 0 && !isMinimized) {
                messagesContainerRef.current.scrollTop = savedScrollPosition
            }
        }, [savedScrollPosition, isMinimized])

        // Keep scroll-to-bottom effect
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

        // Keep un-minimizing transition effect
        useEffect(() => {
            if (isUnminimizing && !isMinimized && messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = savedScrollPos
                const timer = setTimeout(() => { setIsUnminimizing(false) }, 50)
                return () => clearTimeout(timer)
            }
        }, [isMinimized, isUnminimizing, savedScrollPos])

        // Remove state saving effect
        // useEffect(() => { ... }, [messages, onSaveState]);

        // --- Start: Handlers --- 

        // Simplify handleClose (no state saving)
        const handleClose = () => {
            onClose()
        }

        // Remove handleResize function
        // const handleResize = (...) => { ... }

        // Update toggleFullscreen (no size saving/restoring)
        const toggleFullscreen = () => {
            if (isTransitioning) return
            if (isMinimized && !isFullscreen) {
                setIsTransitioning(true)
                setIsMinimized(false)
                setTimeout(() => {
                    setIsFullscreen(true)
                    onFullscreenChange(true)
                    if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = 0
                    setTimeout(() => { setIsTransitioning(false) }, 100)
                }, 300)
            } else {
                setIsTransitioning(true)
                if (!isFullscreen && messagesContainerRef.current) {
                    setSavedScrollPos(messagesContainerRef.current.scrollTop)
                }
                // Still save position before going fullscreen
                setPrevState(prev => ({ ...prev, x: x.get(), y: y.get() }))
                const newFullscreenState = !isFullscreen
                setIsFullscreen(newFullscreenState)
                onFullscreenChange(newFullscreenState)
                setTimeout(() => { setIsTransitioning(false) }, 100)
            }
        }

        // Update toggleMinimize (no size saving/restoring)
        const toggleMinimize = () => {
            if (isTransitioning) return
            if (!isMinimized && messagesContainerRef.current) {
                // Still save position before minimizing
                setPrevState(prev => ({ ...prev, x: x.get(), y: y.get() }))
                setSavedScrollPos(messagesContainerRef.current.scrollTop)
                setIsMinimized(true)
            } else {
                setIsUnminimizing(true)
                setIsMinimized(false)
            }
        }

        // Keep handleSendMessage, handleKeyDown, formatTime, getAsciiArt, exportChat
        const handleSendMessage = () => { if (!inputValue.trim()) return; const newMessage: Message = { id: Date.now().toString(), content: inputValue, sender: "user", timestamp: new Date() }; setMessages([...messages, newMessage]); const currentInput = inputValue; setInputValue(""); setTimeout(() => { let responseContent = `Echo: ${currentInput}`; if (theme.id === "npc") { const npcResponses = ["I've been in this village for many years. I can tell you about our local history.", "You'll need better equipment if you want to venture into the forest.", "Have you spoken with the blacksmith yet? He might have a quest for you.", "Rumors say there's a hidden treasure in the mountains to the north.", "I don't have any more quests for you at this time. Check back later."]; responseContent = npcResponses[Math.floor(Math.random() * npcResponses.length)] } else if (theme.id === "void") { const voidResponses = ["The void whispers secrets that mortal minds cannot comprehend.", "Stars die and are born in the endless expanse. Your question is but a fleeting moment.", "The patterns you seek are illusions. Embrace the chaos of the cosmos.", "Time is a construct. In the void, all moments exist simultaneously.", "Your consciousness is a mere ripple in the infinite darkness."]; responseContent = voidResponses[Math.floor(Math.random() * voidResponses.length)] } const responseMessage: Message = { id: (Date.now() + 1).toString(), content: responseContent, sender: "system", timestamp: new Date() }; setMessages((prev) => [...prev, responseMessage]); }, 1000); }
        const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }
        const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        const exportChat = () => { const chatData = { id, theme: theme.id, timestamp: new Date().toISOString(), messages: messages.map(msg => ({ ...msg, timestamp: msg.timestamp.toISOString() })) }; const jsonString = JSON.stringify(chatData, null, 2); const blob = new Blob([jsonString], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${theme.name.toLowerCase().replace(/\s+/g, "-")}-chat-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
        const getAsciiArt = () => { if (theme.id === "npc") return `\n┌─────────────────────────┐\n│ ╔═╗╔╗╔╔═╗  ╔╦╗╔═╗╔╦╗╔═╗ │\n│ ║ ║║║║╠═╝  ║║║║ ║ ║║║╣  │\n│ ╚═╝╝╚╝╩    ╩ ╩╚═╝═╩╝╚═╝ │\n└─────────────────────────┘\n`; if (theme.id === "void") return `\n┌─────────────────────────┐\n│ ╦  ╦╔═╗╦╔╦╗  ╔═╗╔═╗╔╦╗╔═╗│\n│ ╚╗╔╝║ ║║ ║   ║  ║ ║ ║║║╣ │\n│  ╚╝ ╚═╝╩ ╩   ╚═╝╚═╝═╩╝╚═╝│\n└─────────────────────────┘\n`; return `\n┌─────────────────────────┐\n│ ╔═╗╦═╗╔═╗╦ ╦╦╦  ╦╔═╗    │\n│ ╠═╣╠╦╝║  ╠═╣║╚╗╔╝║╣     │\n│ ╩ ╩╩╚═╚═╝╩ ╩╩ ╚╝ ╚═╝    │\n└─────────────────────────┘\n`; };

        return (
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    ref={ref}
                    className={cn(
                        "fixed font-mono text-sm shadow-lg overflow-hidden pointer-events-auto",
                        theme.background,
                        `border-2 ${theme.border}`,
                        "backdrop-blur-sm",
                        isFullscreen ? "inset-0 rounded-none" : "rounded-md",
                        isTransitioning && "opacity-0",
                        isFullscreen && !isActive && "hidden",
                    )}
                    style={{
                        x: isFullscreen ? 0 : x,
                        y: isFullscreen ? 0 : y,
                        // Use fixed size from prevState when not fullscreen
                        width: isFullscreen ? "100vw" : `${prevState.width}px`,
                        height: isFullscreen ? "100vh" : isMinimized ? "48px" : `${prevState.height}px`,
                        transition: isTransitioning ? "opacity 0.1s ease-out" : "opacity 0.2s ease-in",
                        zIndex: isFullscreen ? 1000 : zIndex,
                    }}
                    onMouseDown={onFocus}
                >
                    <div
                        className={cn(
                            `chat-header flex items-center justify-between px-3 py-2 ${theme.headerBackground} border-b ${theme.headerBorder}`,
                        )}
                    >
                        <div className="flex items-center space-x-2">
                            <div className={`h-3 w-3 rounded-full ${theme.dotColor}`}></div>
                            <span className={`${theme.headerText} font-semibold tracking-wide`}>{theme.name}</span>
                        </div>
                        <div className="chat-controls flex items-center space-x-1">
                            <Button variant="ghost" size="icon" className={`h-6 w-6 ${theme.headerText} hover:${theme.text} hover:${theme.buttonHover}`} onClick={exportChat} title="Export chat as JSON"> <Download size={14} /> </Button>
                            <Button variant="ghost" size="icon" className={`h-6 w-6 ${theme.headerText} hover:${theme.text} hover:${theme.buttonHover}`} onClick={toggleMinimize} disabled={isFullscreen || isTransitioning}> {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />} </Button>
                            <Button variant="ghost" size="icon" className={`h-6 w-6 ${theme.headerText} hover:${theme.text} hover:${theme.buttonHover}`} onClick={toggleFullscreen} disabled={isTransitioning}> {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} </Button>
                            <Button variant="ghost" size="icon" className={`h-6 w-6 ${theme.headerText} hover:${theme.text} hover:${theme.buttonHover}`} onClick={handleClose}> <X size={14} /> </Button>
                        </div>
                    </div>

                    {/* Keep chat content, input */}
                    {(!isMinimized || isFullscreen) && (
                        <div className="flex flex-col" style={{ height: "calc(100% - 48px)" }}>
                            <div ref={messagesContainerRef} className={cn("flex-1 overflow-y-auto p-3", isUnminimizing && !isFullscreen && "invisible")} style={{ height: "calc(100% - 64px)", scrollbarWidth: "thin", scrollbarColor: `${theme.border} transparent` }} >
                                <div className={`ascii-art text-center ${theme.timestampText} mb-4 leading-tight`}> <pre className="text-xs">{getAsciiArt()}</pre> </div>
                                <div className="grid gap-3">
                                    {messages.map((message) => (
                                        <div key={message.id} className={cn("px-3 py-2 rounded", message.sender === "system" ? `${theme.messageBackground} ${theme.messageText} border-l-2 ${theme.messageBorder}` : `${theme.userMessageBackground} ${theme.userMessageText} ml-8`)}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-semibold">{message.sender === "system" ? theme.senderName : theme.userSenderName}</span>
                                                <span className={`text-xs ${theme.timestampText}`}>{formatTime(message.timestamp)}</span>
                                            </div>
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                            <div className={`chat-input p-3 ${theme.headerBackground} border-t ${theme.headerBorder}`}>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 relative">
                                        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type a message..." className={`${theme.inputBackground} ${theme.inputBorder} focus-visible:ring-[${theme.dotColor}] ${theme.inputText} ${theme.inputPlaceholder}`} />
                                        <div className={`absolute left-2 top-0 ${theme.timestampText} text-xs font-mono opacity-70 pointer-events-none`}> {inputValue ? "" : "> "} </div>
                                    </div>
                                    <Button onClick={handleSendMessage} className={`${theme.buttonBackground} ${theme.buttonHover} ${theme.buttonText}`}> <Send size={16} /> </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Remove Resize Handles */}
                    {/* {!isFullscreen && !isMinimized && ( <> ... </> )} */}

                    {/* Keep Grid overlay */}
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


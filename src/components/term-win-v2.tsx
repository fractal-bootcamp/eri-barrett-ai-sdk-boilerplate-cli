"use client";

import React, { useState, useRef, useEffect, forwardRef } from "react";
import { motion, useMotionValue, type PanInfo, useDragControls } from "framer-motion";
import { X, Minimize, Maximize, ChevronDown, ChevronUp, Send, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TermWinV2Props, TerminalMessage } from "./terminal-types";

const TermWinV2 = forwardRef<HTMLDivElement, TermWinV2Props>(
    (
        {
            id,
            theme,
            initialPosition,
            savedScrollPosition,
            zIndex,
            initialMessage,
            savedMessages,
            onClose,
            onFullscreenChange,
            onFocus,
            onSaveState,
            isActive,
        },
        ref,
    ) => {
        // --- State Initialization ---
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [isMinimized, setIsMinimized] = useState(false);
        const [messages, setMessages] = useState<TerminalMessage[]>(
            savedMessages && savedMessages.length > 0
                ? savedMessages
                : initialMessage
                    ? [{ id: `${id}-initial`, content: initialMessage, sender: "system", timestamp: new Date() }]
                    : []
        );
        const [inputValue, setInputValue] = useState("");
        const [savedScrollPos, setSavedScrollPos] = useState(savedScrollPosition || 0);
        const [prevState, setPrevState] = useState({
            x: initialPosition.x,
            y: initialPosition.y,
            width: 380,
            height: 500,
        });
        const [isTransitioning, setIsTransitioning] = useState(false);
        const [isUnminimizing, setIsUnminimizing] = useState(false);

        // --- Motion Values ---
        const x = useMotionValue(initialPosition.x);
        const y = useMotionValue(initialPosition.y);
        const width = useMotionValue(prevState.width);
        const height = useMotionValue(prevState.height);

        // --- Refs ---
        const messagesContainerRef = useRef<HTMLDivElement>(null);
        const messagesEndRef = useRef<HTMLDivElement>(null);
        const constraintsRef = useRef(null);

        // --- Drag Controls ---
        const dragControls = useDragControls();

        // --- Effects ---
        useEffect(() => {
            const saveCurrentState = () => {
                if (messagesContainerRef.current && onSaveState) {
                    onSaveState({ messages, scrollPosition: messagesContainerRef.current.scrollTop });
                }
            };
            return saveCurrentState;
        }, [messages, onSaveState]);

        useEffect(() => {
            if (isFullscreen) {
                setPrevState({ x: x.get(), y: y.get(), width: width.get(), height: height.get() })
            }
        }, [isFullscreen, x, y, width, height])

        useEffect(() => {
            if (!isFullscreen) {
                x.set(prevState.x)
                y.set(prevState.y)
                width.set(prevState.width)
                height.set(prevState.height)
            }
        }, [isFullscreen, prevState, x, y, width, height])

        useEffect(() => {
            if (messagesContainerRef.current && savedScrollPosition > 0 && !isMinimized) {
                messagesContainerRef.current.scrollTop = savedScrollPosition
            }
        }, [savedScrollPosition, isMinimized])

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

        useEffect(() => {
            if (isUnminimizing && !isMinimized && messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = savedScrollPos
                const timer = setTimeout(() => { setIsUnminimizing(false) }, 50)
                return () => clearTimeout(timer)
            }
        }, [isMinimized, isUnminimizing, savedScrollPos])

        // --- Handlers ---
        const handleClose = () => {
            if (messagesContainerRef.current && onSaveState) {
                onSaveState({ messages, scrollPosition: messagesContainerRef.current.scrollTop });
            }
            onClose()
        }

        const handleResize = (_: any, info: PanInfo) => {
            if (isFullscreen) return;
            width.set(Math.max(300, width.get() + info.offset.x));
            height.set(Math.max(200, height.get() + info.offset.y));
        };

        const toggleFullscreen = () => {
            if (isTransitioning) return
            if (isMinimized && !isFullscreen) {
                setIsTransitioning(true);
                setIsMinimized(false);
                setTimeout(() => {
                    setPrevState({ x: x.get(), y: y.get(), width: width.get(), height: height.get() });
                    setIsFullscreen(true);
                    onFullscreenChange(true);
                    if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = 0;
                    setTimeout(() => setIsTransitioning(false), 100);
                }, 300);
            } else {
                setIsTransitioning(true);
                if (!isFullscreen) {
                    if (messagesContainerRef.current) setSavedScrollPos(messagesContainerRef.current.scrollTop);
                    setPrevState({ x: x.get(), y: y.get(), width: width.get(), height: height.get() });
                } else {
                }
                const newFullscreenState = !isFullscreen;
                setIsFullscreen(newFullscreenState);
                onFullscreenChange(newFullscreenState);
                setTimeout(() => setIsTransitioning(false), 100);
            }
        };

        const toggleMinimize = () => {
            if (isTransitioning) return
            if (!isMinimized) {
                setPrevState({ x: x.get(), y: y.get(), width: width.get(), height: height.get() });
                if (messagesContainerRef.current) setSavedScrollPos(messagesContainerRef.current.scrollTop);
                setIsMinimized(true);
            } else {
                setIsUnminimizing(true);
                setIsMinimized(false);
            }
        };

        const handleSendMessage = () => {
            if (!inputValue.trim()) return;
            const newMessage: TerminalMessage = { id: Date.now().toString(), content: inputValue, sender: "user", timestamp: new Date() };
            setMessages([...messages, newMessage]);
            const currentInput = inputValue;
            setInputValue("");
            setTimeout(() => {
                let responseContent = `Echo: ${currentInput}`;
                if (theme.id === "npc") {
                    const npcResponses = ["I've been in this village for many years...", "... quest for you."];
                    responseContent = npcResponses[Math.floor(Math.random() * npcResponses.length)]
                } else if (theme.id === "void") {
                    const voidResponses = ["The void whispers secrets...", "...infinite darkness."];
                    responseContent = voidResponses[Math.floor(Math.random() * voidResponses.length)]
                }
                const responseMessage: TerminalMessage = { id: (Date.now() + 1).toString(), content: responseContent, sender: "system", timestamp: new Date() };
                setMessages((prev) => [...prev, responseMessage]);
            }, 1000);
        }
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage()
            }
        }
        const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        const exportChat = () => {
            const chatData = { id, theme: theme.id, timestamp: new Date().toISOString(), messages: messages.map(msg => ({ ...msg, timestamp: msg.timestamp.toISOString() })) };
            const jsonString = JSON.stringify(chatData, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${theme.name.toLowerCase().replace(/\s+/g, "-")}-chat-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        const getAsciiArt = () => {
            if (theme.id === "npc") return `...NPC ASCII...`;
            if (theme.id === "void") return `...VOID ASCII...`;
            return `...DEFAULT ASCII...`;
        };

        // --- Drag Handlers ---
        const onDragStartHandler = () => { onFocus(); };
        const onDragEndHandler = () => { setPrevState(prev => ({ ...prev, x: x.get(), y: y.get() })); };
        const startDrag = (event: React.PointerEvent) => { dragControls.start(event); };

        return (
            <div className="fixed inset-0 overflow-hidden">
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
                        width: isFullscreen ? "100vw" : width,
                        height: isFullscreen ? "100vh" : isMinimized ? "48px" : height,
                        transition: isTransitioning ? "opacity 0.1s ease-out" : "opacity 0.2s ease-in",
                        zIndex: isFullscreen ? 1000 : zIndex,
                    }}
                    drag={!isFullscreen && !isMinimized}
                    dragListener={false}
                    dragControls={dragControls}
                    dragMomentum={false}
                    dragElastic={0}
                    onDragStart={onDragStartHandler}
                    onDragEnd={onDragEndHandler}
                    onMouseDown={onFocus}
                >
                    <div
                        onPointerDown={startDrag}
                        className={cn(
                            `chat-header flex items-center justify-between px-3 py-2 ${theme.headerBackground} border-b ${theme.headerBorder}`,
                            !isFullscreen && !isMinimized && "cursor-move"
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

                    {!isFullscreen && !isMinimized && (
                        <>
                            <motion.div
                                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize"
                                style={{ touchAction: 'none' }}
                                drag
                                dragConstraints={{ top: 0, left: 0 }}
                                dragMomentum={false}
                                dragElastic={0}
                                onDrag={handleResize}
                            >
                                <div className={`w-2 h-2 border-r-2 border-b-2 ${theme.resizeHandleBorder} absolute bottom-1 right-1`}></div>
                            </motion.div>

                            <motion.div
                                className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize"
                                style={{ touchAction: 'none' }}
                                drag
                                dragMomentum={false}
                                dragElastic={0}
                                dragConstraints={{ top: 0, right: 0 }}
                                onDrag={(_, info) => {
                                    if (isFullscreen) return;
                                    const newWidth = Math.max(300, width.get() - info.offset.x);
                                    const widthChange = width.get() - newWidth;
                                    width.set(newWidth);
                                    x.set(x.get() + widthChange);
                                    height.set(Math.max(200, height.get() + info.offset.y));
                                }}
                            >
                                <div className={`w-2 h-2 border-l-2 border-b-2 ${theme.resizeHandleBorder} absolute bottom-1 left-1`}></div>
                            </motion.div>
                        </>
                    )}

                    <div
                        className="absolute inset-0 pointer-events-none z-10 opacity-5"
                        style={{ backgroundImage: `linear-gradient(${theme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${theme.gridColor} 1px, transparent 1px)`, backgroundSize: "4px 4px" }}
                    ></div>
                </motion.div>
            </div>
        )
    },
)

TermWinV2.displayName = "TermWinV2"

export default TermWinV2 
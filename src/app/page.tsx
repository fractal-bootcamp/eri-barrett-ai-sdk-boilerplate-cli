"use client"

import { useState, useEffect, useRef } from "react"
import TerminalWindow from "@/components/terminal-window"
import GroupChatWindow from "@/components/group-chat-window"
import ConfirmationDialog from "@/components/confirmation-dialog"
import TermWinV2 from "@/components/term-win-v2"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { defaultTheme, npcTheme, voidTheme } from "@/lib/terminal-themes"
import type { ExtendedTerminalType, TerminalMessage as V2TerminalMessage } from "@/types/terminal-types"

// --- Local Types for Original Terminals ---
// Export this interface
export interface Message {
  id: string
  content: string
  sender: "user" | Llm
  timestamp: Date
}

// Define TerminalState using the local Message type (as an array)
type TerminalState = {
  isOpen: boolean
  isToolbarMinimized: boolean
  messages: Message[] // Reverted: Use Message[] again
  scrollPosition: number
  createdAt: number
  zIndex: number
}

type TerminalType = "default" | "group"

export default function Home() {
  // Window dimensions state
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  })

  // Update window dimensions on resize
  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Track terminal states with creation order
  const [terminals, setTerminals] = useState<{
    default: TerminalState
    npc: TerminalState
    void: TerminalState
    group: TerminalState
  }>({
    default: {
      isOpen: false,
      isToolbarMinimized: false,
      messages: [
        {
          id: "1",
          content: "Welcome to the terminal. How can I assist you today?",
          sender: "system",
          timestamp: new Date(),
        },
      ],
      scrollPosition: 0,
      createdAt: 0,
      zIndex: 10,
    },
    npc: {
      isOpen: false,
      isToolbarMinimized: false,
      messages: [
        {
          id: "1",
          content: "Greetings, traveler. How may I assist you on your quest today?",
          sender: "system",
          timestamp: new Date(),
        },
      ],
      scrollPosition: 0,
      createdAt: 0,
      zIndex: 10,
    },
    void: {
      isOpen: false,
      isToolbarMinimized: false,
      messages: [
        {
          id: "1",
          content: "You have connected to the void. What secrets do you seek in the darkness?",
          sender: "system",
          timestamp: new Date(),
        },
      ],
      scrollPosition: 0,
      createdAt: 0,
      zIndex: 10,
    },
    group: {
      isOpen: false,
      isToolbarMinimized: false,
      messages: [],
      scrollPosition: 0,
      createdAt: 0,
      zIndex: 10,
    },
  })

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean
    terminalType: TerminalType | null
    title: string
    message: string
  }>({
    isOpen: false,
    terminalType: null,
    title: "",
    message: "",
  })

  // Terminal refs for connection lines
  const terminalRefs = {
    default: useRef<HTMLDivElement>(null),
    npc: useRef<HTMLDivElement>(null),
    void: useRef<HTMLDivElement>(null),
    group: useRef<HTMLDivElement>(null),
  }

  const [activeFullscreen, setActiveFullscreen] = useState<ExtendedTerminalType | null>(null)
  const [nextZIndex, setNextZIndex] = useState(20) // Start z-index counter

  // State for TermWinV2
  const [isTermWinV2Open, setIsTermWinV2Open] = useState(false)
  const termWinV2Ref = useRef<HTMLDivElement>(null)
  const [termWinV2ZIndex, setTermWinV2ZIndex] = useState(15)

  // Function to bring a terminal to the front
  const bringToFront = (terminal: TerminalType) => {
    setTerminals((prev) => {
      const newZIndex = nextZIndex
      setNextZIndex((prev) => prev + 1)

      return {
        ...prev,
        [terminal]: {
          ...prev[terminal],
          zIndex: newZIndex,
        },
      }
    })
  }

  // Open terminals in complementary positions
  const openDefaultChat = () => {
    if (terminals.default.isToolbarMinimized) {
      // Restore from toolbar
      setTerminals((prev) => ({
        ...prev,
        default: {
          ...prev.default,
          isToolbarMinimized: false,
          isOpen: true,
        },
      }))
    } else {
      // Open new with timestamp
      const now = Date.now()
      setTerminals((prev) => ({
        ...prev,
        default: {
          ...prev.default,
          isOpen: true,
          createdAt: now,
        },
      }))
    }
    // Bring to front
    bringToFront("default")
  }

  const openNPCChat = () => {
    if (terminals.npc.isToolbarMinimized) {
      // Restore from toolbar
      setTerminals((prev) => ({
        ...prev,
        npc: {
          ...prev.npc,
          isToolbarMinimized: false,
          isOpen: true,
        },
      }))
    } else {
      // Open new with timestamp
      const now = Date.now()
      setTerminals((prev) => ({
        ...prev,
        npc: {
          ...prev.npc,
          isOpen: true,
          createdAt: now,
        },
      }))
    }
    // Bring to front
    bringToFront("npc")
  }

  const openVoidChat = () => {
    if (terminals.void.isToolbarMinimized) {
      // Restore from toolbar
      setTerminals((prev) => ({
        ...prev,
        void: {
          ...prev.void,
          isToolbarMinimized: false,
          isOpen: true,
        },
      }))
    } else {
      // Open new with timestamp
      const now = Date.now()
      setTerminals((prev) => ({
        ...prev,
        void: {
          ...prev.void,
          isOpen: true,
          createdAt: now,
        },
      }))
    }
    // Bring to front
    bringToFront("void")
  }

  // Minimize to toolbar instead of closing
  const minimizeDefaultToToolbar = () => {
    setTerminals((prev) => ({
      ...prev,
      default: {
        ...prev.default,
        isToolbarMinimized: true,
        isOpen: false,
      },
    }))
    if (activeFullscreen === "default") setActiveFullscreen(null)
  }

  const minimizeNPCToToolbar = () => {
    setTerminals((prev) => ({
      ...prev,
      npc: {
        ...prev.npc,
        isToolbarMinimized: true,
        isOpen: false,
      },
    }))
    if (activeFullscreen === "npc") setActiveFullscreen(null)
  }

  const minimizeVoidToToolbar = () => {
    setTerminals((prev) => ({
      ...prev,
      void: {
        ...prev.void,
        isToolbarMinimized: true,
        isOpen: false,
      },
    }))
    if (activeFullscreen === "void") setActiveFullscreen(null)
  }

  const minimizeGroupToToolbar = () => {
    setTerminals((prev) => ({
      ...prev,
      group: {
        ...prev.group,
        isToolbarMinimized: true,
        isOpen: false,
      },
    }))
    if (activeFullscreen === "group") setActiveFullscreen(null)
  }

  // Permanently close a terminal
  const closeTerminal = (terminalType: TerminalType) => {
    setConfirmationDialog({
      isOpen: true,
      terminalType,
      title: "Close Terminal",
      message: "This will permanently close the terminal and destroy all context. Are you sure you want to continue?",
    })
  }

  // Handle confirmation dialog confirm
  const handleConfirmClose = () => {
    if (!confirmationDialog.terminalType) return

    setTerminals((prev) => ({
      ...prev,
      [confirmationDialog.terminalType!]: {
        ...prev[confirmationDialog.terminalType!],
        isOpen: false,
        isToolbarMinimized: false,
        messages: [
          {
            id: "1",
            content: getInitialMessage(confirmationDialog.terminalType as TerminalType),
            sender: "system",
            timestamp: new Date(),
          },
        ],
        scrollPosition: 0,
      },
    }))

    setConfirmationDialog({
      isOpen: false,
      terminalType: null,
      title: "",
      message: "",
    })
  }

  // Handle confirmation dialog cancel
  const handleCancelClose = () => {
    setConfirmationDialog({
      isOpen: false,
      terminalType: null,
      title: "",
      message: "",
    })
  }

  // Get initial message based on terminal type
  const getInitialMessage = (type: TerminalType): string => {
    switch (type) {
      case "default":
        return "Welcome to the terminal. How can I assist you today?"
      case "npc":
        return "Greetings, traveler. How may I assist you on your quest today?"
      case "void":
        return "You have connected to the void. What secrets do you seek in the darkness?"
      case "group":
        return "Welcome to the group chat."
      default:
        return "Hello, how can I help you?"
    }
  }

  // Fullscreen state management
  const setDefaultFullscreen = (isFullscreen: boolean) => {
    if (isFullscreen) {
      setActiveFullscreen("default")
      // When going fullscreen, bring to front
      bringToFront("default")
    } else if (activeFullscreen === "default") {
      setActiveFullscreen(null)
    }
  }

  const setNPCFullscreen = (isFullscreen: boolean) => {
    if (isFullscreen) {
      setActiveFullscreen("npc")
      // When going fullscreen, bring to front
      bringToFront("npc")
    } else if (activeFullscreen === "npc") {
      setActiveFullscreen(null)
    }
  }

  const setVoidFullscreen = (isFullscreen: boolean) => {
    if (isFullscreen) {
      setActiveFullscreen("void")
      // When going fullscreen, bring to front
      bringToFront("void")
    } else if (activeFullscreen === "void") {
      setActiveFullscreen(null)
    }
  }

  const setGroupFullscreen = (isFullscreen: boolean) => {
    if (isFullscreen) {
      setActiveFullscreen("group")
      // When going fullscreen, bring to front
      bringToFront("group")
    } else if (activeFullscreen === "group") {
      setActiveFullscreen(null)
    }
  }

  // Cycle between fullscreen terminals
  const cycleFullscreen = (direction: "next" | "prev") => {
    const openTerminalKeys = (Object.keys(terminals) as TerminalType[]).filter(key => terminals[key].isOpen)
    const availableFullscreenKeys: ExtendedTerminalType[] = [...openTerminalKeys]
    if (isTermWinV2Open) {
      availableFullscreenKeys.push('v2')
    }
    if (!activeFullscreen || availableFullscreenKeys.length < 2) return
    const currentIndex = availableFullscreenKeys.indexOf(activeFullscreen)
    if (currentIndex === -1) return
    let nextIndex = direction === "next"
      ? (currentIndex + 1) % availableFullscreenKeys.length
      : (currentIndex - 1 + availableFullscreenKeys.length) % availableFullscreenKeys.length
    const nextKey = availableFullscreenKeys[nextIndex]
    setActiveFullscreen(nextKey)
    // Explicit check for 'v2' before calling bringToFront
    if (nextKey === 'v2') {
      bringV2ToFront()
    } else {
      // nextKey here is guaranteed to be TerminalType
      bringToFront(nextKey)
    }
  }

  // Save terminal state - only called when terminal is closed or minimized to toolbar
  const saveDefaultState = (messages: any[], scrollPosition: number) => {
    // Only update if something actually changed
    setTerminals((prev) => {
      // Skip update if nothing changed
      if (prev.default.messages === messages && prev.default.scrollPosition === scrollPosition) {
        return prev
      }

      return {
        ...prev,
        default: {
          ...prev.default,
          messages,
          scrollPosition,
        },
      }
    })
  }

  const saveNPCState = (messages: any[], scrollPosition: number) => {
    // Only update if something actually changed
    setTerminals((prev) => {
      // Skip update if nothing changed
      if (prev.npc.messages === messages && prev.npc.scrollPosition === scrollPosition) {
        return prev
      }

      return {
        ...prev,
        npc: {
          ...prev.npc,
          messages,
          scrollPosition,
        },
      }
    })
  }

  const saveVoidState = (messages: any[], scrollPosition: number) => {
    // Only update if something actually changed
    setTerminals((prev) => {
      // Skip update if nothing changed
      if (prev.void.messages === messages && prev.void.scrollPosition === scrollPosition) {
        return prev
      }

      return {
        ...prev,
        void: {
          ...prev.void,
          messages,
          scrollPosition,
        },
      }
    })
  }

  const saveGroupState = (messages: any[], scrollPosition: number) => {
    // Only update if something actually changed
    setTerminals((prev) => {
      // Skip update if nothing changed
      if (prev.group.messages === messages && prev.group.scrollPosition === scrollPosition) {
        return prev
      }

      return {
        ...prev,
        group: {
          ...prev.group,
          messages,
          scrollPosition,
        },
      }
    })
  }

  // Update the initial positions to be complementary
  const defaultInitialPosition = {
    x: windowDimensions.width / 2 - 190, // Position in center
    y: 50, // Position from top
  }

  const npcInitialPosition = {
    x: windowDimensions.width - 430, // Position in top-right
    y: 50, // Position from top
  }

  const voidInitialPosition = {
    x: 50, // Position in bottom-left
    y: windowDimensions.height - 550, // Position from bottom
  }

  const groupInitialPosition = {
    x: windowDimensions.width / 2 - 240, // Position in center
    y: windowDimensions.height / 2 - 300, // Position in center
  }

  // Calculate position for the new window
  const v2InitialPosition = { x: windowDimensions.width / 2 - 190, y: windowDimensions.height - 550 }

  // Determine if taskbar should be visible (hide when fullscreen is active)
  const isTaskbarVisible =
    activeFullscreen === null &&
    (terminals.default.isToolbarMinimized ||
      terminals.npc.isToolbarMinimized ||
      terminals.void.isToolbarMinimized ||
      terminals.group.isToolbarMinimized)

  // Get connected window names for group chat
  const getConnectedWindowNames = () => {
    return ["DEFAULT", "NPC", "VOID"].filter((name) => Math.random() > 0.5)
  }

  // TermWinV2 handlers
  const handleV2Close = () => {
    setIsTermWinV2Open(false)
    if (activeFullscreen === 'v2') {
      setActiveFullscreen(null)
    }
  }

  const handleV2FullscreenChange = (isFullscreen: boolean) => {
    if (isFullscreen) {
      setActiveFullscreen('v2')
      bringV2ToFront()
    } else if (activeFullscreen === 'v2') {
      setActiveFullscreen(null)
    }
    console.log("TermWinV2 fullscreen changed:", isFullscreen, "Active FS:", isFullscreen ? 'v2' : null)
  }

  const bringV2ToFront = () => {
    const newZ = nextZIndex
    setTermWinV2ZIndex(newZ)
    setNextZIndex((prev) => prev + 1)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-[#f7f5f0]">
      <h1 className="text-3xl font-mono mb-12 text-[#5a5751]">Terminal Selection</h1>

      <div className="flex gap-8 items-center justify-center mb-8">
        <div className="flex flex-col items-center">
          <Button
            onClick={openDefaultChat}
            className="w-24 h-24 bg-[#e5e1d8] hover:bg-[#d9d4c9] text-[#5a5751] border border-[#c8c3b8] shadow-sm"
          >
            <span className="font-mono">DEFAULT</span>
          </Button>
          <p className="mt-2 text-center text-[#5a5751] max-w-xs text-sm">Standard terminal interface</p>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={openNPCChat}
            className="w-24 h-24 bg-[#e5e1d8] hover:bg-[#d9d4c9] text-[#2c3e2e] border border-[#c8c3b8] shadow-sm"
          >
            <span className="font-mono">NPC</span>
          </Button>
          <p className="mt-2 text-center text-[#5a5751] max-w-xs text-sm">Game dialogue interface</p>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={openVoidChat}
            className="w-24 h-24 bg-[#e5e1d8] hover:bg-[#d9d4c9] text-[#2d1b3e] border border-[#c8c3b8] shadow-sm"
          >
            <span className="font-mono">VOID</span>
          </Button>
          <p className="mt-2 text-center text-[#5a5751] max-w-xs text-sm">Cosmic void interface</p>
        </div>

        <div className="flex flex-col items-center">
          <Button
            onClick={() => {
              setIsTermWinV2Open(true)
              bringV2ToFront()
            }}
            className="w-24 h-24 bg-[#e0e0e0] hover:bg-[#cccccc] text-[#333333] border border-[#bbbbbb] shadow-sm"
            disabled={isTermWinV2Open}
          >
            <span className="font-mono">V2</span>
          </Button>
          <p className="mt-2 text-center text-[#5a5751] max-w-xs text-sm">New Terminal V2</p>
        </div>
      </div>

      {terminals.default.isOpen && (
        <TerminalWindow
          id="default"
          theme={defaultTheme}
          onClose={minimizeDefaultToToolbar}
          onFullscreenChange={setDefaultFullscreen}
          onSaveState={saveDefaultState}
          isActive={activeFullscreen === "default" || activeFullscreen === null}
          initialPosition={defaultInitialPosition}
          savedMessages={terminals.default.messages}
          savedScrollPosition={terminals.default.scrollPosition}
          zIndex={terminals.default.zIndex}
          onFocus={() => bringToFront("default")}
          initialMessage="Welcome to the terminal. How can I assist you today?"
          ref={terminalRefs.default}
        />
      )}

      {terminals.npc.isOpen && (
        <TerminalWindow
          id="npc"
          theme={npcTheme}
          onClose={minimizeNPCToToolbar}
          onFullscreenChange={setNPCFullscreen}
          onSaveState={saveNPCState}
          isActive={activeFullscreen === "npc" || activeFullscreen === null}
          initialPosition={npcInitialPosition}
          savedMessages={terminals.npc.messages}
          savedScrollPosition={terminals.npc.scrollPosition}
          zIndex={terminals.npc.zIndex}
          onFocus={() => bringToFront("npc")}
          initialMessage="Greetings, traveler. How may I assist you on your quest today?"
          ref={terminalRefs.npc}
        />
      )}

      {terminals.void.isOpen && (
        <TerminalWindow
          id="void"
          theme={voidTheme}
          onClose={minimizeVoidToToolbar}
          onFullscreenChange={setVoidFullscreen}
          onSaveState={saveVoidState}
          isActive={activeFullscreen === "void" || activeFullscreen === null}
          initialPosition={voidInitialPosition}
          savedMessages={terminals.void.messages}
          savedScrollPosition={terminals.void.scrollPosition}
          zIndex={terminals.void.zIndex}
          onFocus={() => bringToFront("void")}
          initialMessage="You have connected to the void. What secrets do you seek in the darkness?"
          ref={terminalRefs.void}
        />
      )}

      {terminals.group.isOpen && (
        <GroupChatWindow
          onClose={minimizeGroupToToolbar}
          onFullscreenChange={setGroupFullscreen}
          onSaveState={saveGroupState}
          isActive={activeFullscreen === "group" || activeFullscreen === null}
          initialPosition={groupInitialPosition}
          savedMessages={terminals.group.messages as Message[]}
          savedScrollPosition={terminals.group.scrollPosition}
          zIndex={terminals.group.zIndex}
          onFocus={() => bringToFront("group")}
          connectedWindows={getConnectedWindowNames()}
        />
      )}

      {isTermWinV2Open && (
        <TermWinV2
          ref={termWinV2Ref}
          id="v2-terminal"
          theme={defaultTheme}
          initialPosition={v2InitialPosition}
          savedScrollPosition={0}
          zIndex={termWinV2ZIndex}
          initialMessage="Welcome to Terminal V2!"
          savedMessages={[]}
          isActive={activeFullscreen === 'v2' || activeFullscreen === null}
          onClose={handleV2Close}
          onFullscreenChange={handleV2FullscreenChange}
          onFocus={bringV2ToFront}
        />
      )}

      {confirmationDialog.isOpen && (
        <ConfirmationDialog
          title={confirmationDialog.title}
          message={confirmationDialog.message}
          confirmLabel="Close Terminal"
          cancelLabel="Cancel"
          onConfirm={handleConfirmClose}
          onCancel={handleCancelClose}
        />
      )}

      {activeFullscreen && (
        <>
          <Button
            onClick={() => cycleFullscreen("prev")}
            className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full h-10 w-10 p-0"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            onClick={() => cycleFullscreen("next")}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full h-10 w-10 p-0"
          >
            <ChevronRight size={20} />
          </Button>
        </>
      )}

      {isTaskbarVisible && (
        <div className="fixed bottom-0 left-0 right-0 h-12 bg-[#e5e1d8] border-t border-[#c8c3b8] flex items-center justify-end px-4 z-50">
          <div className="flex items-center gap-2">
            <div className={terminals.default.isToolbarMinimized ? "block" : "hidden"}>
              <div className="flex items-center">
                <Button
                  onClick={openDefaultChat}
                  variant="ghost"
                  className="h-8 px-3 bg-[#e5e1d8] text-[#5a5751] hover:bg-[#d9d4c9] hover:text-[#3d3b36] flex items-center gap-2 rounded-md rounded-r-none"
                >
                  <div className="h-2 w-2 rounded-full bg-[#d9b38c]"></div>
                  <span className="font-mono text-xs">TERMINAL_v2.3</span>
                </Button>
                <Button
                  onClick={() => closeTerminal("default")}
                  variant="ghost"
                  className="h-8 px-2 bg-[#e5e1d8] text-[#5a5751] hover:bg-[#d9d4c9] hover:text-[#3d3b36] rounded-md rounded-l-none border-l border-[#c8c3b8]"
                >
                  <X size={12} />
                </Button>
              </div>
            </div>

            <div className={terminals.npc.isToolbarMinimized ? "block" : "hidden"}>
              <div className="flex items-center">
                <Button
                  onClick={openNPCChat}
                  variant="ghost"
                  className="h-8 px-3 bg-[#0f3a1a] text-[#a3ffb0] hover:bg-[#1a4a25] hover:text-[#d0ffd8] flex items-center gap-2 rounded-md rounded-r-none"
                >
                  <div className="h-2 w-2 rounded-full bg-[#5aff70]"></div>
                  <span className="font-mono text-xs">NPC_TERMINAL</span>
                </Button>
                <Button
                  onClick={() => closeTerminal("npc")}
                  variant="ghost"
                  className="h-8 px-2 bg-[#0f3a1a] text-[#a3ffb0] hover:bg-[#1a4a25] hover:text-[#d0ffd8] rounded-md rounded-l-none border-l border-[#2a5a30]"
                >
                  <X size={12} />
                </Button>
              </div>
            </div>

            <div className={terminals.void.isToolbarMinimized ? "block" : "hidden"}>
              <div className="flex items-center">
                <Button
                  onClick={openVoidChat}
                  variant="ghost"
                  className="h-8 px-3 bg-[#1d0e35] text-[#c9b8e0] hover:bg-[#2d1b4a] hover:text-[#e2d8f0] flex items-center gap-2 rounded-md rounded-r-none"
                >
                  <div className="h-2 w-2 rounded-full bg-[#b56cff]"></div>
                  <span className="font-mono text-xs">VOID_TERMINAL</span>
                </Button>
                <Button
                  onClick={() => closeTerminal("void")}
                  variant="ghost"
                  className="h-8 px-2 bg-[#1d0e35] text-[#c9b8e0] hover:bg-[#2d1b4a] hover:text-[#e2d8f0] rounded-md rounded-l-none border-l border-[#4a2a7a]"
                >
                  <X size={12} />
                </Button>
              </div>
            </div>

            <div className={terminals.group.isToolbarMinimized ? "block" : "hidden"}>
              <div className="flex items-center">
                <Button
                  onClick={() => {
                    setTerminals((prev) => ({
                      ...prev,
                      group: {
                        ...prev.group,
                        isToolbarMinimized: false,
                        isOpen: true,
                      },
                    }))
                    bringToFront("group")
                  }}
                  variant="ghost"
                  className="h-8 px-3 bg-gradient-to-r from-[#0f3a1a] via-[#e5e1d8] to-[#1d0e35] text-[#5a5751] hover:opacity-90 flex items-center gap-2 rounded-md rounded-r-none"
                >
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 rounded-full bg-[#5aff70]"></div>
                    <div className="h-2 w-2 rounded-full bg-[#d9b38c]"></div>
                    <div className="h-2 w-2 rounded-full bg-[#b56cff]"></div>
                  </div>
                  <span className="font-mono text-xs">GROUP_CHAT</span>
                </Button>
                <Button
                  onClick={() => closeTerminal("group")}
                  variant="ghost"
                  className="h-8 px-2 bg-gradient-to-r from-[#0f3a1a] via-[#e5e1d8] to-[#1d0e35] text-[#5a5751] hover:opacity-90 rounded-md rounded-l-none border-l border-[#c8c3b8]"
                >
                  <X size={12} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}


// Theme configurations for different terminal types

export type TerminalTheme = {
    id: string
    name: string
    background: string
    border: string
    headerBackground: string
    headerBorder: string
    text: string
    headerText: string
    dotColor: string
    inputBackground: string
    inputBorder: string
    inputText: string
    inputPlaceholder: string
    buttonBackground: string
    buttonHover: string
    buttonText: string
    messageBackground: string
    messageText: string
    userMessageBackground: string
    userMessageText: string
    messageBorder: string
    timestampText: string
    resizeHandleBorder: string
    gridColor: string
    senderName: string
    userSenderName: string
}

export const defaultTheme: TerminalTheme = {
    id: "default",
    name: "TERMINAL_v2.3",
    background: "bg-[#f0ede6]",
    border: "border-[#c8c3b8]",
    headerBackground: "bg-[#e5e1d8]",
    headerBorder: "border-[#c8c3b8]",
    text: "text-[#5a5751]",
    headerText: "text-[#5a5751]",
    dotColor: "bg-[#d9b38c]",
    inputBackground: "bg-[#f0ede6]",
    inputBorder: "border-[#c8c3b8]",
    inputText: "text-[#5a5751]",
    inputPlaceholder: "placeholder:text-[#a39e94]",
    buttonBackground: "bg-[#d9b38c]",
    buttonHover: "hover:bg-[#c9a37c]",
    buttonText: "text-[#3d3b36]",
    messageBackground: "bg-[#e5e1d8]",
    messageText: "text-[#5a5751]",
    userMessageBackground: "bg-[#d9d4c9]",
    userMessageText: "text-[#3d3b36]",
    messageBorder: "border-[#d9b38c]",
    timestampText: "text-[#8a857d]",
    resizeHandleBorder: "border-[#8a857d]",
    gridColor: "rgba(90, 87, 81, 0.1)",
    senderName: "SYSTEM",
    userSenderName: "USER",
}

export const npcTheme: TerminalTheme = {
    id: "npc",
    name: "NPC_TERMINAL",
    background: "bg-[#0a2010]",
    border: "border-[#2a5a30]",
    headerBackground: "bg-[#0f3a1a]",
    headerBorder: "border-[#2a5a30]",
    text: "text-[#a3ffb0]",
    headerText: "text-[#a3ffb0]",
    dotColor: "bg-[#5aff70]",
    inputBackground: "bg-[#0a2010]",
    inputBorder: "border-[#2a5a30]",
    inputText: "text-[#a3ffb0]",
    inputPlaceholder: "placeholder:text-[#5aff70] placeholder:opacity-50",
    buttonBackground: "bg-[#1a4a25]",
    buttonHover: "hover:bg-[#2a5a30]",
    buttonText: "text-[#a3ffb0]",
    messageBackground: "bg-[#0f3a1a]",
    messageText: "text-[#a3ffb0]",
    userMessageBackground: "bg-[#1a4a25]",
    userMessageText: "text-[#d0ffd8]",
    messageBorder: "border-[#5aff70]",
    timestampText: "text-[#5aff70] opacity-70",
    resizeHandleBorder: "border-[#5aff70]",
    gridColor: "rgba(90, 255, 112, 0.1)",
    senderName: "NPC",
    userSenderName: "PLAYER",
}

export const voidTheme: TerminalTheme = {
    id: "void",
    name: "VOID_TERMINAL",
    background: "bg-[#120821]",
    border: "border-[#4a2a7a]",
    headerBackground: "bg-[#1d0e35]",
    headerBorder: "border-[#4a2a7a]",
    text: "text-[#c9b8e0]",
    headerText: "text-[#c9b8e0]",
    dotColor: "bg-[#b56cff]",
    inputBackground: "bg-[#120821]",
    inputBorder: "border-[#4a2a7a]",
    inputText: "text-[#c9b8e0]",
    inputPlaceholder: "placeholder:text-[#b56cff] placeholder:opacity-50",
    buttonBackground: "bg-[#2d1b4a]",
    buttonHover: "hover:bg-[#3d2b5a]",
    buttonText: "text-[#c9b8e0]",
    messageBackground: "bg-[#1d0e35]",
    messageText: "text-[#c9b8e0]",
    userMessageBackground: "bg-[#2d1b4a]",
    userMessageText: "text-[#e2d8f0]",
    messageBorder: "border-[#b56cff]",
    timestampText: "text-[#b56cff] opacity-70",
    resizeHandleBorder: "border-[#b56cff]",
    gridColor: "rgba(181, 108, 255, 0.1)",
    senderName: "VOID",
    userSenderName: "SEEKER",
}

export const getThemeById = (id: string): TerminalTheme => {
    switch (id) {
        case "npc":
            return npcTheme
        case "void":
            return voidTheme
        default:
            return defaultTheme
    }
}


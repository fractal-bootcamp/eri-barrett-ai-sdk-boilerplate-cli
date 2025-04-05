import type { TerminalStyle } from "@/lib/terminal-themes";


export type TerminalTheme = {
    id: string
    name: string
    styles: TerminalStyle
    senderName: string
    userSenderName: string
    asciiArt: string
    llm: TerminalLLM
    systemPrompt: string
}

export interface TerminalLLM {
    id: string;
    provider: "openai" | "anthropic";
    model: string;
    temperature: number;
    maxTokens: number;
}

export interface TerminalMessage {
    id: string;
    content: string;
    sender: "user" | "system";
    timestamp: Date;
}

export interface TermWinProps {
    id: string;
    theme: TerminalTheme;
    initialPosition: { x: number; y: number };
    savedScrollPosition: number;
    zIndex: number;
    initialMessage?: string;
    savedMessages: TerminalMessage[];
    isActive: boolean;
    onClose: () => void;
    onFullscreenChange: (isFullscreen: boolean) => void;
    onFocus: () => void;
    onSaveState?: (state: { messages: TerminalMessage[]; scrollPosition: number }) => void;
}

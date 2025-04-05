import type { TerminalTheme } from "@/lib/terminal-themes";

export interface TerminalMessage {
    id: string;
    content: string;
    sender: "user" | "system" | "npc" | "void";
    timestamp: Date;
}

export interface TermWinV2Props {
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
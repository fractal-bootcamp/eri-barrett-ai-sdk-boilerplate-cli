"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ConfirmationDialogProps {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmationDialog({
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
}: ConfirmationDialogProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Animate in after mounting
        const timer = setTimeout(() => setIsVisible(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const handleConfirm = () => {
        setIsVisible(false)
        setTimeout(onConfirm, 300) // Wait for animation to complete
    }

    const handleCancel = () => {
        setIsVisible(false)
        setTimeout(onCancel, 300) // Wait for animation to complete
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-black/30 backdrop-blur-sm">
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-[#f0ede6] border border-[#c8c3b8] rounded-lg shadow-lg p-6 max-w-md w-full"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-mono font-semibold text-[#5a5751]">{title}</h3>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-[#5a5751] hover:text-[#3d3b36] hover:bg-[#d9d4c9]"
                                onClick={handleCancel}
                            >
                                <X size={16} />
                            </Button>
                        </div>

                        <p className="text-[#5a5751] mb-6">{message}</p>

                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                className="border-[#c8c3b8] text-[#5a5751] hover:bg-[#d9d4c9]"
                                onClick={handleCancel}
                            >
                                {cancelLabel}
                            </Button>
                            <Button className="bg-[#d9b38c] hover:bg-[#c9a37c] text-[#3d3b36]" onClick={handleConfirm}>
                                {confirmLabel}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}


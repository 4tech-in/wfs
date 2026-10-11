"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { attendanceService } from "@/services/attendance-service"
import { toast } from "sonner"

interface AttendanceContextType {
  selectedFile: File | null
  isUploading: boolean
  isDragging: boolean
  isGlobalDragging: boolean
  progress: number
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleUploadClick: () => void
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleDragOver: (event: React.DragEvent) => void
  handleDragLeave: (event: React.DragEvent) => void
  handleDrop: (event: React.DragEvent) => void
  handleGlobalDragEnter: (event: React.DragEvent) => void
  handleGlobalDragOver: (event: React.DragEvent) => void
  handleGlobalDragLeave: (event: React.DragEvent) => void
  uploadFile: () => Promise<boolean>
  clearFile: () => void
  setIsGlobalDragging: (isDragging: boolean) => void
}

export const AttendanceContext = React.createContext<AttendanceContextType | undefined>(undefined)

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isGlobalDragging, setIsGlobalDragging] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const dragCounter = React.useRef(0)

  // Safety listener for window-level drag leave
  React.useEffect(() => {
    const handleWindowDragLeave = (event: DragEvent) => {
      // If relatedTarget is null, it means we left the window entirely
      if (!event.relatedTarget) {
        setIsGlobalDragging(false)
        dragCounter.current = 0
      }
    }

    const handleWindowDrop = () => {
      // Just in case a drop happens but isn't caught by React handlers
      setIsGlobalDragging(false)
      dragCounter.current = 0
    }

    window.addEventListener("dragleave", handleWindowDragLeave)
    window.addEventListener("drop", handleWindowDrop)

    return () => {
      window.removeEventListener("dragleave", handleWindowDragLeave)
      window.removeEventListener("drop", handleWindowDrop)
    }
  }, [])

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'text/csv',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    const isExtensionAllowed = 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls') || 
      file.name.endsWith('.txt');

    if (!allowedTypes.includes(file.type) && !isExtensionAllowed) {
      toast.error('Please upload a valid CSV, Excel, or Text file');
      return false;
    }
    return true;
  }

  const uploadFile = async () => {
    if (!selectedFile) return false

    try {
      setIsUploading(true)
      setProgress(10)
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 100);

      await attendanceService.uploadAttendance(selectedFile)

      // Clear React Query cache so newly uploaded data refetches immediately
      queryClient.clear()
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setSelectedFile(null)
        setProgress(0)
      }, 500)
      
      return true
    } catch (error) {
      setProgress(0)
      console.error("Upload failed", error)
      return false
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    setIsGlobalDragging(false)
    dragCounter.current = 0

    const file = event.dataTransfer.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleGlobalDragEnter = (event: React.DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer.types.includes("Files")) {
      dragCounter.current++
      if (dragCounter.current === 1) {
        setIsGlobalDragging(true)
      }
    }
  }

  const handleGlobalDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleGlobalDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsGlobalDragging(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const clearFile = () => {
    setSelectedFile(null)
    setProgress(0)
  }

  const value = {
    selectedFile,
    isUploading,
    isDragging,
    isGlobalDragging,
    progress,
    fileInputRef,
    handleUploadClick,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleGlobalDragEnter,
    handleGlobalDragOver,
    handleGlobalDragLeave,
    uploadFile,
    clearFile,
    setIsGlobalDragging
  }

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  )
}

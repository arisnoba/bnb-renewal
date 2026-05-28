'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CircleAlert, FileText, ImageIcon, Pause, Play, Trash, Upload, X } from 'lucide-react'
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

export enum FileStatus {
  Uploading,
  Paused,
  Completed,
  Error,
  Cancelled,
  Pending,
}

export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  file: File
  progress: number
  status: FileStatus
  error?: string
}

interface FileUploadContextType {
  accept?: string
  disabled?: boolean
  error: string | null
  files: FileInfo[]
  maxCount?: number
  maxSize?: number
  multiple?: boolean
  onFileSelect?: (files: File[]) => void
  onFileSelectChange?: (files: FileInfo[]) => void
  onPause?: (fileId: string) => void
  onRemove?: (fileId: string) => void
  onResume?: (fileId: string) => void
  onUpload?: () => void
  setError: (error: string | null) => void
  validateFiles: (files: File[]) => { valid: boolean; errorMessage?: string }
}

const FileUploadContext = createContext<FileUploadContextType | undefined>(undefined)

export function useFileUpload() {
  const context = useContext(FileUploadContext)

  if (!context) {
    throw new Error('useFileUpload must be used within a FileUploadProvider')
  }

  return context
}

export interface FileErrorProps {
  autoHideDuration?: number
  className?: string
  message?: string
  onClose?: () => void
}

export function FileError({ autoHideDuration, className, message, onClose }: FileErrorProps) {
  const { error } = useFileUpload()
  const [closedMessage, setClosedMessage] = useState<string | null>(null)
  const displayMessage = message || error
  const isVisible = Boolean(displayMessage && displayMessage !== closedMessage)

  useEffect(() => {
    if (!autoHideDuration || !displayMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setClosedMessage(displayMessage)
      onClose?.()
    }, autoHideDuration)

    return () => window.clearTimeout(timeoutId)
  }, [autoHideDuration, displayMessage, onClose])

  if (!displayMessage) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive',
            className,
          )}
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <CircleAlert aria-hidden="true" />
            <p className="text-sm">{displayMessage}</p>
          </div>
          <Button
            aria-label="첨부파일 오류 닫기"
            className="size-8 rounded-full hover:bg-destructive/20"
            onClick={() => {
              setClosedMessage(displayMessage)
              onClose?.()
            }}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function FileTypeIcon({ type }: { type: string }) {
  return type.includes('image') ? <ImageIcon aria-hidden="true" /> : <FileText aria-hidden="true" />
}

export interface FileProgressProps {
  className?: string
  fileId?: string
  progress?: number
  status?: FileInfo['status']
}

export function FileProgress({ className, fileId, progress, status }: FileProgressProps) {
  const { files } = useFileUpload()
  let fileProgress = progress
  let fileStatus = status

  if (fileId) {
    const file = files.find((item) => item.id === fileId)

    if (file) {
      fileProgress = file.progress
      fileStatus = file.status
    }
  }

  if (fileStatus === undefined || fileProgress === undefined || fileStatus === FileStatus.Completed) {
    return null
  }

  return (
    <div className={cn('mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className={cn(
          'h-full rounded-full',
          fileStatus === FileStatus.Error
            ? 'bg-destructive'
            : fileStatus === FileStatus.Paused
              ? 'bg-muted-foreground'
              : 'bg-primary',
        )}
        style={{ width: `${fileProgress}%` }}
      />
    </div>
  )
}

export interface FileItemProps {
  canRemove?: boolean
  canResume?: boolean
  className?: string
  file?: FileInfo
  fileId?: string
  onPause?: (fileId: string) => void
  onRemove?: (fileId: string) => void
  onResume?: (fileId: string) => void
  showProgress?: boolean
}

export function FileItem({
  canRemove = true,
  canResume = false,
  className,
  file: propFile,
  fileId,
  onPause = () => {},
  onRemove = () => {},
  onResume = () => {},
  showProgress = false,
}: FileItemProps) {
  const { files } = useFileUpload()
  const file = propFile ?? (fileId ? files.find((item) => item.id === fileId) : undefined)

  if (!file) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-3 rounded-md border bg-background p-3 shadow-xs', className)}>
      <div className="shrink-0 text-muted-foreground">
        <FileTypeIcon type={file.type} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
          {file.status === FileStatus.Error && (
            <span className="ml-2 text-destructive">{file.error || '업로드할 수 없습니다.'}</span>
          )}
        </p>
        {showProgress && <FileProgress progress={file.progress} status={file.status} />}
      </div>

      {canResume && (
        <div className="flex shrink-0 items-center gap-1">
          {file.status === FileStatus.Uploading && (
            <Button
              aria-label={`${file.name} 업로드 일시정지`}
              className="size-8"
              onClick={() => onPause(file.id)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Pause aria-hidden="true" />
            </Button>
          )}
          {file.status === FileStatus.Paused && (
            <Button
              aria-label={`${file.name} 업로드 재개`}
              className="size-8"
              onClick={() => onResume(file.id)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Play aria-hidden="true" />
            </Button>
          )}
        </div>
      )}

      {canRemove && (
        <Button
          aria-label={`${file.name} 삭제`}
          className="size-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(file.id)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Trash aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}

export interface FileListProps {
  canRemove?: boolean
  canResume?: boolean
  className?: string
  files?: FileInfo[]
  onClear?: () => void
  onPause?: (fileId: string) => void
  onRemove?: (fileId: string) => void
  onResume?: (fileId: string) => void
  onUpload?: () => void
  showUploadButton?: boolean
}

export function FileList({
  canRemove,
  canResume,
  className,
  files: propFiles,
  onClear = () => {},
  onPause,
  onRemove,
  onResume,
  showUploadButton = false,
}: FileListProps) {
  const { files: contextFiles, onUpload = () => {} } = useFileUpload()
  const files = propFiles ?? contextFiles

  if (files.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">첨부파일</h3>
        <div className="flex gap-2">
          {showUploadButton && files.some((file) => file.status === FileStatus.Pending) && (
            <Button onClick={onUpload} size="sm" type="button">
              업로드
            </Button>
          )}
          <Button onClick={onClear} size="sm" type="button" variant="outline">
            전체 삭제
          </Button>
        </div>
      </div>
      <div className="flex max-h-[300px] flex-col gap-2 overflow-y-auto">
        {files.map((file) => (
          <FileItem
            canRemove={canRemove}
            canResume={canResume}
            file={file}
            key={file.id}
            onPause={onPause}
            onRemove={onRemove}
            onResume={onResume}
          />
        ))}
      </div>
    </div>
  )
}

export interface DropZoneProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop' | 'onError'
  > {
  accept?: string
  inputName?: string
  maxCount?: number
  maxSize?: number
  multiple?: boolean
  onBlur?: () => void
  onError?: (message: string) => void
  onFileSelect?: (files: File[]) => void
  prompt?: string
}

export const DropZone = forwardRef<HTMLDivElement, DropZoneProps>(function DropZone({
  accept: propAccept,
  className,
  inputName,
  maxSize: propMaxSize,
  multiple: propMultiple,
  onBlur,
  onError: propOnError,
  onFileSelect: propOnFileSelect,
  onKeyDown,
  prompt = '클릭하거나 파일을 끌어 놓아 업로드',
  ...rootProps
}, ref) {
  const {
    accept: contextAccept,
    disabled,
    files: contextFiles,
    maxSize: contextMaxSize,
    multiple: contextMultiple,
    onFileSelect: contextOnFileSelect,
    onFileSelectChange,
    setError,
    validateFiles,
  } = useFileUpload()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const accept = propAccept || contextAccept
  const maxSize = propMaxSize || contextMaxSize
  const multiple = propMultiple ?? contextMultiple
  const onError = propOnError || setError
  const onFileSelect = propOnFileSelect || contextOnFileSelect

  useEffect(() => {
    if (fileInputRef.current && contextFiles.length === 0) {
      fileInputRef.current.value = ''
    }
  }, [contextFiles])

  const handleSelectedFiles = (selectedFiles: File[]) => {
    const validation = validateFiles(selectedFiles)

    if (!validation.valid) {
      onError(validation.errorMessage ?? '첨부파일을 확인해 주세요.')
      return
    }

    setError(null)
    onFileSelect?.(selectedFiles)
    onFileSelectChange?.(getFileInfos(selectedFiles))
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    if (disabled || event.dataTransfer.files.length === 0) {
      return
    }

    handleSelectedFiles(Array.from(event.dataTransfer.files))
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleSelectedFiles(Array.from(event.target.files))
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)

    if (event.defaultPrevented || disabled) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      fileInputRef.current?.click()
    }
  }

  return (
    <div
      {...rootProps}
      ref={ref}
      aria-disabled={disabled || undefined}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={(event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragging(false)
      }}
      onKeyDown={handleKeyDown}
      onDragOver={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onDrop={handleDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <Upload aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{prompt}</p>
      {maxSize && (
        <p className="text-xs text-muted-foreground">
          파일당 최대 {maxSize}MB까지 첨부할 수 있습니다.
        </p>
      )}
      <input
        accept={accept}
        className="hidden"
        disabled={disabled}
        multiple={multiple}
        name={inputName}
        onBlur={onBlur}
        onChange={handleFileInputChange}
        ref={fileInputRef}
        type="file"
      />
    </div>
  )
})

export interface FileUploadProviderProps {
  accept?: string
  children: ReactNode
  disabled?: boolean
  files?: FileInfo[]
  maxCount?: number
  maxSize?: number
  multiple?: boolean
  onFileSelect?: (files: File[]) => void
  onFileSelectChange?: (files: FileInfo[]) => void
  onPause?: (fileId: string) => void
  onRemove?: (fileId: string) => void
  onResume?: (fileId: string) => void
  onUpload?: () => void
  showUploadButton?: boolean
}

export function FileUploadProvider({
  accept,
  children,
  disabled = false,
  files = [],
  maxCount = 1,
  maxSize = 1,
  multiple = false,
  onFileSelect,
  onFileSelectChange,
  onPause,
  onRemove,
  onResume,
  onUpload,
}: FileUploadProviderProps) {
  const [error, setError] = useState<string | null>(null)

  const validateFiles = (selectedFiles: File[]): { valid: boolean; errorMessage?: string } => {
    if (maxCount && selectedFiles.length > maxCount) {
      return {
        errorMessage: `최대 ${maxCount}개 파일까지 첨부할 수 있습니다.`,
        valid: false,
      }
    }

    if (maxSize) {
      const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize * 1024 * 1024)

      if (oversizedFiles.length > 0) {
        return {
          errorMessage: `파일 용량이 ${maxSize}MB를 초과했습니다: ${oversizedFiles
            .map((file) => file.name)
            .join(', ')}`,
          valid: false,
        }
      }
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map((type) => type.trim())
      const invalidFiles = selectedFiles.filter((file) => {
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`

        return !acceptedTypes.some(
          (type) => type === fileExt || type === file.type || (type.includes('/*') && file.type.startsWith(type.replace('/*', '/'))),
        )
      })

      if (invalidFiles.length > 0) {
        return {
          errorMessage: `지원하지 않는 파일 형식입니다: ${invalidFiles.map((file) => file.name).join(', ')}`,
          valid: false,
        }
      }
    }

    return { valid: true }
  }

  return (
    <FileUploadContext.Provider
      value={{
        accept,
        disabled,
        error,
        files,
        maxCount,
        maxSize,
        multiple,
        onFileSelect,
        onFileSelectChange,
        onPause,
        onRemove,
        onResume,
        onUpload,
        setError,
        validateFiles,
      }}
    >
      {children}
    </FileUploadContext.Provider>
  )
}

export interface FileUploadProps extends FileUploadProviderProps {
  className?: string
}

export default function FileUpload({
  children,
  className,
  disabled,
  ...providerProps
}: FileUploadProps) {
  return (
    <FileUploadProvider {...providerProps} disabled={disabled}>
      <div
        className={cn(
          'flex flex-1 flex-col gap-4',
          className,
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {children}
      </div>
    </FileUploadProvider>
  )
}

function getFileInfos(files: File[]) {
  return files.map((file) => ({
    file,
    id: createFileId(file),
    name: file.name,
    progress: 0,
    size: file.size,
    status: FileStatus.Pending,
    type: file.type,
  }))
}

function createFileId(file: File) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`
}

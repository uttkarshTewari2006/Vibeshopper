import {useEffect, useRef, useState, useCallback} from 'react'
import {useCreateImageContent, useImagePicker} from '@shopify/shop-minis-react'

type AgentInputProps = {
  onSend?: (payload: {prompt: string; imageFile?: File}) => void
  placeholder?: string
  variant?: 'light' | 'dark'
  defaultPrompt?: string
  debounceMs?: number
}

export function AgentInput({onSend, placeholder = 'Vibe something...', variant = 'light', defaultPrompt, debounceMs = 300}: AgentInputProps) {
  const [prompt, setPrompt] = useState('')
  const [debouncedPrompt, setDebouncedPrompt] = useState('')
  const [imageFile, setImageFile] = useState<File | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [showPickerMenu, setShowPickerMenu] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  const {openCamera, openGallery} = useImagePicker()
  const {createImageContent, loading: uploading} = useCreateImageContent()

  // Debounce the prompt updates
  const debouncedSetPrompt = useCallback((value: string) => {
    setPrompt(value)
    setIsThinking(value.length > 0)
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedPrompt(value)
    }, debounceMs)
  }, [debounceMs])

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setImageFile(file ?? undefined)
  }

  function autoSizeTextarea() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`
  }

  useEffect(() => {
    autoSizeTextarea()
  }, [prompt])

  useEffect(() => {
    if (defaultPrompt && defaultPrompt !== prompt) {
      setPrompt(defaultPrompt)
      setDebouncedPrompt(defaultPrompt)
    }
  }, [defaultPrompt])

  async function handleSend() {
    console.log('[AgentInput] handleSend called with prompt:', debouncedPrompt || prompt, 'imageFile:', imageFile)
    if (!debouncedPrompt && !prompt && !imageFile) {
      console.log('[AgentInput] No prompt or imageFile, returning early')
      return
    }
    setIsThinking(true)
    try {
      let uploadedFile: File | undefined = imageFile
      if (imageFile) {
        await createImageContent({
          image: imageFile,
          contentTitle: 'Agent input image',
        })
      }
      const finalPrompt = debouncedPrompt || prompt
      console.log('[AgentInput] Calling onSend with:', {prompt: finalPrompt, imageFile: uploadedFile})
      onSend?.({prompt: finalPrompt, imageFile: uploadedFile})
    } finally {
      setIsThinking(false)
    }
  }

  function handleReset() {
    setPrompt('')
    setDebouncedPrompt('')
    setImageFile(undefined)
    setIsThinking(false)
  }

  return (
    <div className="w-full">
      <div
        className={`relative flex items-end gap-2 rounded-3xl p-3 sm:p-4 ring-1 ring-[#5433EB26] bg-white/55 backdrop-blur-5xl backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.65)] transition-colors duration-500 ease-out ${
          isThinking ? 'ai-surface-thinking' : 'ai-surface'
        }`}
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPickerMenu(prev => !prev)}
            className="shrink-0 h-10 w-10 rounded-full grid place-items-center text-[#5433EB] bg-white/50 backdrop-blur ring-1 ring-[#5433EB1A] hover:bg-white/70 active:scale-[0.98] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
            aria-label="Add image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        {showPickerMenu && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-10 w-40 rounded-xl ring-1 ring-black/5 bg-white shadow-lg p-1">
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
              onClick={async () => {
                setShowPickerMenu(false)
                try {
                  const file = await openCamera()
                  if (file) setImageFile(file)
                } catch {}
              }}
            >
              Use camera
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
              onClick={async () => {
                setShowPickerMenu(false)
                try {
                  const file = await openGallery()
                  if (file) setImageFile(file)
                } catch {}
              }}
            >
              Choose from gallery
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload from files
            </button>
          </div>
        )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={e => {
              debouncedSetPrompt(e.target.value)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={placeholder}
            className="w-full resize-none bg-transparent outline-none text-[15px] placeholder:text-gray-500 leading-6 max-h-[5rem] overflow-y-auto"
            style={{
              maxHeight: '4.5rem', // ~3 lines of text
              // Hide scrollbar for all browsers
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE/Edge
            }}
          />
          <style dangerouslySetInnerHTML={{
            __html: `
              textarea::-webkit-scrollbar {
                display: none; /* Chrome/Safari/Opera */
              }
            `
          }} />
        </div>

        {/* Send button */}
        <div className="flex items-center gap-2">
          {(() => {
            const disabled = uploading || (!debouncedPrompt && !prompt && !imageFile)
            return (
              <button
                type="button"
                onClick={handleSend}
                disabled={disabled}
                aria-label="Send"
                className={`shrink-0 h-10 w-10 rounded-full grid place-items-center transition-all active:scale-[0.98] shadow-md ring-1 ${
                  disabled
                    ? 'bg-gray-100 text-gray-400 ring-black/5'
                    : 'bg-[#5433EB] text-white ring-[#5433EB33] hover:bg-[#4b2fda]'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5" />
                  <path d="M5 12l7-7 7 7" />
                </svg>
              </button>
            )
          })()}
        </div>
      </div>

      {imageFile ? (
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div className="h-10 w-10 overflow-hidden rounded-lg ring-1 ring-black/5">
            {/* image preview */}
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Selected"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="truncate">{imageFile.name}</span>
          <button
            type="button"
            onClick={() => setImageFile(undefined)}
            className="ml-auto text-[#5433EB] hover:underline"
          >
            Remove
          </button>
        </div>
      ) : null}
    </div>
  )
}


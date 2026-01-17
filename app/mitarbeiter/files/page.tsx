'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Folder,
  File,
  Upload,
  FolderPlus,
  Search,
  Download,
  Trash2,
  Edit2,
  X,
  Home,
  ChevronRight,
  HardDrive
} from 'lucide-react'
import BackButton from '@/components/BackButton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface FileItem {
  id: string
  name: string
  mimeType: string
  size: number
  downloads: number
  uploadedBy: {
    firstName: string
    lastName: string
  }
  createdAt: string
  description?: string
}

interface FolderItem {
  id: string
  name: string
  createdBy: {
    firstName: string
    lastName: string
  }
  createdAt: string
  _count: {
    files: number
    subfolders: number
  }
}

interface CurrentFolder {
  id: string
  name: string
  parent?: {
    id: string
    name: string
  }
  createdBy: {
    firstName: string
    lastName: string
  }
}

export default function MitarbeiterFilesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const folderId = searchParams.get('folder')
  
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<CurrentFolder | null>(null)
  const [storageUsed, setStorageUsed] = useState(0)
  const [storageLimit, setStorageLimit] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<'file' | 'folder'>('file')
  
  const [newFolderName, setNewFolderName] = useState('')
  const [newName, setNewName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Nur B24_EMPLOYEE dürfen auf diese Seite
    if (session.user.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
      return
    }

    fetchFiles()
  }, [session, status, router, folderId, search])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (folderId) params.append('folder', folderId)
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/admin/files?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
        setFiles(data.files || [])
        setCurrentFolder(data.currentFolder || null)
        setStorageUsed(data.storageUsed || 0)
        setStorageLimit(data.storageLimit || 0)
      } else {
        console.error('Failed to fetch files')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    
    try {
      const res = await fetch('/api/admin/files/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          parentId: folderId
        })
      })
      
      if (!res.ok) throw new Error('Failed to create folder')
      
      setNewFolderName('')
      setShowNewFolderDialog(false)
      fetchFiles()
    } catch (error: any) {
      alert('Fehler beim Erstellen des Ordners: ' + error.message)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    
    try {
      setUploading(true)
      setUploadProgress(0)
      
      const formData = new FormData()
      formData.append('file', file)
      if (folderId) formData.append('folderId', folderId)
      
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setUploadProgress(Math.round(progress))
        }
      })
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          fetchFiles()
          setUploading(false)
          setUploadProgress(0)
        } else {
          throw new Error('Upload failed')
        }
      })
      
      xhr.addEventListener('error', () => {
        alert('Upload fehlgeschlagen')
        setUploading(false)
      })
      
      xhr.open('POST', '/api/admin/files')
      xhr.send(formData)
      
    } catch (error: any) {
      alert('Fehler beim Hochladen: ' + error.message)
      setUploading(false)
    }
  }

  const handleRename = async () => {
    if (!newName.trim() || !selectedItem) return
    
    try {
      const endpoint = selectedType === 'folder'
        ? `/api/admin/files/folders/${selectedItem.id}`
        : `/api/admin/files/${selectedItem.id}`
      
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })
      
      if (!res.ok) throw new Error('Failed to rename')
      
      setShowRenameDialog(false)
      setNewName('')
      setSelectedItem(null)
      fetchFiles()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleDelete = async (id: string, type: 'file' | 'folder') => {
    const itemName = type === 'folder' 
      ? folders.find(f => f.id === id)?.name
      : files.find(f => f.id === id)?.name
    
    if (!confirm(`Möchten Sie "${itemName}" wirklich löschen?${type === 'folder' ? ' Alle Inhalte werden ebenfalls gelöscht!' : ''}`)) {
      return
    }
    
    try {
      const endpoint = type === 'folder'
        ? `/api/admin/files/folders/${id}`
        : `/api/admin/files/${id}`
      
      const res = await fetch(endpoint, {
        method: 'DELETE'
      })
      
      if (!res.ok) throw new Error('Failed to delete')
      
      fetchFiles()
    } catch (error) {
      alert('Fehler beim Löschen')
    }
  }

  const handleDownload = async (fileId: string) => {
    window.open(`/api/admin/files/${fileId}`, '_blank')
  }

  const navigateToFolder = (folderId: string | null) => {
    const url = folderId ? `/mitarbeiter/files?folder=${folderId}` : '/mitarbeiter/files'
    window.location.href = url
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '🗜️'
    return '📄'
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
      e.dataTransfer.clearData()
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const storagePercentage = (storageUsed / storageLimit) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dateiverwaltung
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gemeinsame Dateien & Ordner
              </p>
            </div>
            <BackButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Storage Info */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-gray-600" />
              <span className="font-medium">Speicherplatz</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                storagePercentage > 90 ? 'bg-red-500' :
                storagePercentage > 75 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
        </Card>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button
            onClick={() => navigateToFolder(null)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Home className="w-4 h-4" />
            <span>Startseite</span>
          </button>
          {currentFolder && (
            <>
              {currentFolder.parent && (
                <>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => navigateToFolder(currentFolder.parent!.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {currentFolder.parent.name}
                  </button>
                </>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium">{currentFolder.name}</span>
            </>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button onClick={() => setShowNewFolderDialog(true)}>
            <FolderPlus className="w-4 h-4 mr-2" />
            Neuer Ordner
          </Button>
          <Button
            onClick={() => {
              setShowUploadDialog(true)
              fileInputRef.current?.click()
            }}
            variant="secondary"
          >
            <Upload className="w-4 h-4 mr-2" />
            Datei hochladen
          </Button>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
          }`}
        >
          <div className="text-center">
            <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="text-gray-600">
              {isDragging
                ? 'Datei hier ablegen...'
                : 'Dateien hierher ziehen oder auf "Datei hochladen" klicken'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Maximale Dateigröße: 100MB
            </p>
          </div>
        </div>

        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileUpload(e.target.files[0])
            }
          }}
        />

        {/* Content Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Lädt...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Folders */}
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="p-4 hover:shadow-lg transition-shadow group relative"
              >
                <div 
                  onClick={() => navigateToFolder(folder.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Folder className="w-12 h-12 text-blue-500" />
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedItem(folder)
                          setSelectedType('folder')
                          setNewName(folder.name)
                          setShowRenameDialog(true)
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(folder.id, 'folder')
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2 truncate">{folder.name}</h3>
                  <p className="text-xs text-gray-500">
                    {folder._count.subfolders} Ordner, {folder._count.files} Dateien
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {folder.createdBy.firstName} {folder.createdBy.lastName}
                  </p>
                </div>
              </Card>
            ))}

            {/* Files */}
            {files.map((file) => (
              <Card
                key={file.id}
                className="p-4 hover:shadow-lg transition-shadow group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{getFileIcon(file.mimeType)}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDownload(file.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Herunterladen"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(file)
                          setSelectedType('file')
                          setNewName(file.name)
                          setShowRenameDialog(true)
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Umbenennen"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id, 'file')}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1 truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1">{formatFileSize(file.size)}</p>
                  <p className="text-xs text-gray-400">
                    {file.uploadedBy.firstName} {file.uploadedBy.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(file.createdAt)}</p>
                  {file.downloads > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {file.downloads}x heruntergeladen
                    </p>
                  )}
                </div>
              </Card>
            ))}

            {folders.length === 0 && files.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                {search ? 'Keine Ergebnisse gefunden' : 'Dieser Ordner ist leer'}
              </div>
            )}
          </div>
        )}

        {/* New Folder Dialog */}
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuer Ordner</DialogTitle>
              <DialogDescription>
                Erstellen Sie einen neuen Ordner{currentFolder ? ` in "${currentFolder.name}"` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Ordnername"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreateFolder}>
                  Erstellen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Umbenennen</DialogTitle>
              <DialogDescription>
                {selectedType === 'folder' ? 'Ordner' : 'Datei'} umbenennen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Neuer Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRename()}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleRename}>
                  Speichern
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Progress */}
        {uploading && (
          <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-80 border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Wird hochgeladen...</span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

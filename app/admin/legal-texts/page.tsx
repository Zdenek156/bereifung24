'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, FileText, Shield, Scale, Eye, Loader2, Code, Globe, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TiptapLink from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'

interface LegalText {
  id: string
  key: string
  title: string
  content: string
  version: number
  target: 'web' | 'app'
  updatedAt: string
  lastUpdatedBy?: string
}

const LEGAL_KEYS = [
  { key: 'agb', label: 'AGB', icon: Scale, description: 'Allgemeine Geschäftsbedingungen' },
  { key: 'impressum', label: 'Impressum', icon: FileText, description: 'Angaben gemäß § 5 TMG' },
  { key: 'datenschutz', label: 'Datenschutz', icon: Shield, description: 'Datenschutzerklärung' },
]

// ─── Toolbar Component ───
function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('URL eingeben:')
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  const btnClass = (active: boolean) =>
    `p-1.5 rounded text-sm transition-colors ${
      active
        ? 'bg-primary-100 text-primary-700 font-bold'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50/50">
      <select
        onChange={(e) => {
          const val = e.target.value
          if (val === 'paragraph') editor.chain().focus().setParagraph().run()
          else editor.chain().focus().toggleHeading({ level: parseInt(val) as 1|2|3|4 }).run()
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? '1' :
          editor.isActive('heading', { level: 2 }) ? '2' :
          editor.isActive('heading', { level: 3 }) ? '3' :
          editor.isActive('heading', { level: 4 }) ? '4' : 'paragraph'
        }
        className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white mr-2"
      >
        <option value="paragraph">Absatz</option>
        <option value="1">Überschrift 1</option>
        <option value="2">Überschrift 2</option>
        <option value="3">Überschrift 3</option>
        <option value="4">Überschrift 4</option>
      </select>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Fett (Ctrl+B)"><b>F</b></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Kursiv (Ctrl+I)"><i>K</i></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Unterstrichen (Ctrl+U)"><u>U</u></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Durchgestrichen"><s>D</s></button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={btnClass(editor.isActive('highlight'))} title="Markierung">
        <span className="bg-yellow-200 px-1 rounded text-xs">H</span>
      </button>

      <label className="relative cursor-pointer p-1.5" title="Textfarbe">
        <span className="text-sm font-bold" style={{ color: editor.getAttributes('textStyle').color || '#000' }}>A</span>
        <input type="color" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
      </label>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Aufzählungsliste">
        <span className="text-xs">• Liste</span>
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Nummerierte Liste">
        <span className="text-xs">1. Liste</span>
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Linksbündig">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Zentriert">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Zitat">
        <span className="text-xs">❝</span>
      </button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-1.5 rounded text-sm text-gray-600 hover:bg-gray-100" title="Trennlinie">
        <span className="text-xs">—</span>
      </button>

      <button onClick={addLink} className={btnClass(editor.isActive('link'))} title="Link einfügen">
        <span className="text-xs">🔗</span>
      </button>
      {editor.isActive('link') && (
        <button onClick={() => editor.chain().focus().unsetLink().run()} className="p-1.5 rounded text-sm text-red-500 hover:bg-red-50" title="Link entfernen">
          <span className="text-xs">✕🔗</span>
        </button>
      )}

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30" title="Rückgängig (Ctrl+Z)">↩</button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-30" title="Wiederholen (Ctrl+Y)">↪</button>
    </div>
  )
}

// ─── Main Page ───
export default function LegalTextsPage() {
  const [texts, setTexts] = useState<LegalText[]>([])
  const [activeKey, setActiveKey] = useState<string>('agb')
  const [activeTarget, setActiveTarget] = useState<'web' | 'app'>('web')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [preview, setPreview] = useState(false)
  const [showHtml, setShowHtml] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TiptapLink.configure({ openOnClick: false }),
      Highlight,
      TextStyle,
      Color,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      setEditContent(editor.getHTML())
    },
  })

  const loadTexts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/legal-texts')
      if (res.ok) {
        const data = await res.json()
        setTexts(data)
        const active = data.find((t: LegalText) => t.key === activeKey && t.target === activeTarget)
        if (active) {
          setEditTitle(active.title)
          setEditContent(active.content)
          editor?.commands.setContent(active.content)
        } else {
          setEditTitle('')
          setEditContent('')
          editor?.commands.setContent('')
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Fehler beim Laden der Texte' })
    } finally {
      setLoading(false)
    }
  }, [activeKey, activeTarget, editor])

  useEffect(() => {
    loadTexts()
  }, [loadTexts])

  const selectEntry = (key: string, target: 'web' | 'app') => {
    setActiveKey(key)
    setActiveTarget(target)
    setPreview(false)
    setShowHtml(false)
    const text = texts.find(t => t.key === key && t.target === target)
    if (text) {
      setEditTitle(text.title)
      setEditContent(text.content)
      editor?.commands.setContent(text.content)
    } else {
      const config = LEGAL_KEYS.find(k => k.key === key)
      setEditTitle(config?.description || '')
      setEditContent('')
      editor?.commands.setContent('')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/legal-texts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: activeKey,
          title: editTitle,
          content: editContent,
          target: activeTarget,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        setTexts(prev => {
          const idx = prev.findIndex(t => t.key === activeKey && t.target === activeTarget)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = updated
            return next
          }
          return [...prev, updated]
        })
        const label = LEGAL_KEYS.find(k => k.key === activeKey)?.label
        const targetLabel = activeTarget === 'web' ? 'Webseite' : 'App'
        setMessage({ type: 'success', text: `${label} (${targetLabel}) erfolgreich gespeichert (Version ${updated.version})` })
      } else {
        setMessage({ type: 'error', text: 'Fehler beim Speichern' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Netzwerkfehler beim Speichern' })
    } finally {
      setSaving(false)
    }
  }

  const toggleHtmlMode = () => {
    if (showHtml) {
      editor?.commands.setContent(editContent)
    }
    setShowHtml(!showHtml)
  }

  const activeText = texts.find(t => t.key === activeKey && t.target === activeTarget)
  const activeConfig = LEGAL_KEYS.find(k => k.key === activeKey)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Rechtliche Texte</h1>
        <p className="mt-1 text-gray-600">AGB, Impressum und Datenschutz verwalten — getrennt für Webseite und App.</p>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {LEGAL_KEYS.map(({ key, label, icon: Icon, description }) => {
            const webText = texts.find(t => t.key === key && t.target === 'web')
            const appText = texts.find(t => t.key === key && t.target === 'app')
            const isActiveKey = activeKey === key

            return (
              <div
                key={key}
                className={`rounded-xl border transition-all ${
                  isActiveKey ? 'border-primary-300 shadow-sm ring-1 ring-primary-100' : 'border-gray-200 bg-white'
                }`}
              >
                {/* Document header */}
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${isActiveKey ? 'bg-primary-100' : 'bg-gray-100'}`}>
                      <Icon className={`w-4 h-4 ${isActiveKey ? 'text-primary-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${isActiveKey ? 'text-primary-700' : 'text-gray-900'}`}>{label}</p>
                      <p className="text-xs text-gray-400">{description}</p>
                    </div>
                  </div>
                </div>

                {/* Web / App buttons */}
                <div className="p-1.5 space-y-1">
                  {/* Web */}
                  <button
                    onClick={() => selectEntry(key, 'web')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all ${
                      isActiveKey && activeTarget === 'web'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Globe className={`w-3.5 h-3.5 ${isActiveKey && activeTarget === 'web' ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span>Webseite</span>
                    {webText && webText.content ? (
                      <span className="ml-auto text-xs text-gray-400">v{webText.version}</span>
                    ) : (
                      <span className="ml-auto text-xs text-orange-500">leer</span>
                    )}
                  </button>

                  {/* App */}
                  <button
                    onClick={() => selectEntry(key, 'app')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-all ${
                      isActiveKey && activeTarget === 'app'
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Smartphone className={`w-3.5 h-3.5 ${isActiveKey && activeTarget === 'app' ? 'text-green-500' : 'text-gray-400'}`} />
                    <span>App</span>
                    {appText && appText.content ? (
                      <span className="ml-auto text-xs text-gray-400">v{appText.version}</span>
                    ) : (
                      <span className="ml-auto text-xs text-orange-500">leer</span>
                    )}
                  </button>
                </div>
              </div>
            )
          })}

          {/* Info box */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Hinweis:</p>
            <p><Globe className="w-3 h-3 inline mr-1" /><strong>Webseite</strong> — wird auf bereifung24.de angezeigt</p>
            <p><Smartphone className="w-3 h-3 inline mr-1" /><strong>App</strong> — wird in der mobilen App angezeigt</p>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Editor header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {activeConfig && <activeConfig.icon className="w-5 h-5 text-primary-600" />}
                {activeConfig?.label}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  activeTarget === 'web'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {activeTarget === 'web' ? <><Globe className="w-3 h-3" /> Webseite</> : <><Smartphone className="w-3 h-3" /> App</>}
                </span>
              </h2>
              {activeText && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Letzte Änderung: {new Date(activeText.updatedAt).toLocaleString('de-DE')} · Version {activeText.version}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleHtmlMode}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  showHtml ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Zwischen Editor und HTML-Quellcode wechseln"
              >
                <Code className="w-4 h-4" />
                HTML
              </button>
              <button
                onClick={() => setPreview(!preview)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  preview ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                Vorschau
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editContent.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Speichere...' : 'Speichern'}
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="p-4 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="z.B. Allgemeine Geschäftsbedingungen"
            />
          </div>

          {/* Content area */}
          {preview ? (
            <div className="p-6">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: editContent }} />
            </div>
          ) : showHtml ? (
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HTML-Quellcode
                <span className="text-xs text-gray-400 ml-2">Direktes Bearbeiten des HTML-Codes</span>
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={30}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
                placeholder="HTML-Inhalt hier eingeben..."
              />
            </div>
          ) : (
            <div>
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>
          )}
        </div>
      </div>

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 500px;
          padding: 1rem;
          outline: none;
        }
        .ProseMirror > * + * { margin-top: 0.75em; }
        .ProseMirror h1 { font-size: 2em; font-weight: 700; color: #111827; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: 700; color: #111827; }
        .ProseMirror h3 { font-size: 1.25em; font-weight: 600; color: #111827; }
        .ProseMirror h4 { font-size: 1.1em; font-weight: 600; color: #374151; }
        .ProseMirror p { line-height: 1.6; color: #374151; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5em; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5em; }
        .ProseMirror li { margin-bottom: 0.25em; }
        .ProseMirror blockquote {
          border-left: 3px solid #d1d5db;
          padding-left: 1em;
          color: #6b7280;
          font-style: italic;
        }
        .ProseMirror hr { border: none; border-top: 2px solid #e5e7eb; margin: 1.5em 0; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; cursor: pointer; }
        .ProseMirror mark { background-color: #fef08a; padding: 0.1em 0.2em; border-radius: 2px; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: 'Text hier eingeben...';
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import BackButton from '@/components/BackButton'
import {
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  Share2,
  FileText,
  Zap,
  BarChart3,
  Globe,
  Calendar,
  Sparkles,
  Send,
  Eye,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  AtSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon,
  TrendingUp,
  Lightbulb,
  Plus,
  Star,
  RefreshCw,
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

interface DashboardStats {
  posts: { total: number; draft: number; scheduled: number; published: number; failed: number }
  accounts: { total: number; active: number }
  templates: number
  automations: { total: number; active: number }
  engagement: { likes: number; shares: number; comments: number; clicks: number; reach: number; impressions: number }
  recentPosts: Post[]
}

interface Post {
  id: string
  title: string | null
  content: string
  hashtags: string | null
  imageUrl: string | null
  postType: string
  status: string
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  platforms: PostPlatform[]
}

interface PostPlatform {
  id: string
  status: string
  publishedAt: string | null
  likes: number; shares: number; comments: number
  account: { id: string; platform: string; accountName: string }
}

interface Account {
  id: string
  platform: string
  accountName: string
  pageId: string | null
  isActive: boolean
  tokenExpiresAt: string | null
  createdAt: string
  _count: { posts: number }
}

interface Template {
  id: string
  name: string
  description: string | null
  postType: string
  textTemplate: string
  htmlTemplate: string | null
  platforms: string[] | null
  isActive: boolean
  createdAt: string
  _count: { posts: number; automations: number }
}

interface Automation {
  id: string
  name: string
  description: string | null
  trigger: string
  templateId: string
  template: { id: string; name: string; postType: string }
  platforms: string[] | null
  isActive: boolean
  autoPublish: boolean
  lastTriggeredAt: string | null
  createdAt: string
  _count: { posts: number }
}

// ============================================
// HELPERS
// ============================================

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  FACEBOOK: <Facebook className="h-4 w-4 text-blue-600" />,
  INSTAGRAM: <Instagram className="h-4 w-4 text-pink-500" />,
  LINKEDIN: <Linkedin className="h-4 w-4 text-blue-700" />,
  YOUTUBE: <Youtube className="h-4 w-4 text-red-600" />,
  TIKTOK: <Globe className="h-4 w-4 text-gray-800" />,
  THREADS: <AtSign className="h-4 w-4 text-gray-900" />,
}

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  THREADS: 'Threads',
}

const POST_TYPE_LABELS: Record<string, string> = {
  PARTNER_INTRO: '🏪 Neuer Partner',
  TIRE_TIP: '💡 Reifen-Tipp',
  BLOG_PROMO: '📰 Blog-Promo',
  REVIEW_HIGHLIGHT: '⭐ Bewertungs-Highlight',
  STATS: '📊 Statistiken',
  OFFER: '🎉 Angebot/Aktion',
  SERVICE: '🔧 Service',
  REEL: '🎬 Reel/Short',
  CUSTOM: '✏️ Eigener Beitrag',
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  DRAFT: { label: 'Entwurf', variant: 'secondary' },
  SCHEDULED: { label: 'Geplant', variant: 'outline' },
  PUBLISHING: { label: 'Wird veröffentlicht...', variant: 'default' },
  PUBLISHED: { label: 'Veröffentlicht', variant: 'default' },
  FAILED: { label: 'Fehlgeschlagen', variant: 'outline' },
}

const TRIGGER_LABELS: Record<string, string> = {
  WORKSHOP_VERIFIED: '🏪 Werkstatt verifiziert',
  BLOG_PUBLISHED: '📰 Blog-Artikel veröffentlicht',
  REVIEW_RECEIVED: '⭐ Neue Bewertung erhalten',
  WEEKLY_SCHEDULE: '📅 Wöchentlich',
  MONTHLY_SCHEDULE: '📅 Monatlich',
  MANUAL: '✋ Manuell',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SocialMediaPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Show LinkedIn OAuth result
  useEffect(() => {
    const linkedinSuccess = searchParams.get('linkedin_success')
    const linkedinError = searchParams.get('linkedin_error')
    if (linkedinSuccess) {
      alert(`✅ LinkedIn: ${linkedinSuccess}`)
      router.replace('/admin/social-media')
    } else if (linkedinError) {
      alert(`❌ LinkedIn Fehler: ${linkedinError}`)
      router.replace('/admin/social-media')
    }
  }, [searchParams, router])

  // Global state
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // Posts
  const [posts, setPosts] = useState<Post[]>([])
  const [postsTotal, setPostsTotal] = useState(0)
  const [postsLoading, setPostsLoading] = useState(false)
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  // Accounts
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [convertingToken, setConvertingToken] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<Template[]>([])
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  // Automations
  const [automations, setAutomations] = useState<Automation[]>([])
  const [showAutomationDialog, setShowAutomationDialog] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)

  // Trends
  const [defaultMockupUrl, setDefaultMockupUrl] = useState('')
  const [favoriteKeywords, setFavoriteKeywords] = useState<string[]>([])
  const [trendKeywords, setTrendKeywords] = useState<string[]>([])
  const [trendKeywordInput, setTrendKeywordInput] = useState('')
  const [trendAudience, setTrendAudience] = useState<'CUSTOMER' | 'WORKSHOP' | 'BOTH'>('BOTH')
  const [trendStyle, setTrendStyle] = useState<'INFORMATIVE' | 'FUNNY' | 'PROVOCATIVE' | 'STORY' | 'EMOTIONAL'>('INFORMATIVE')
  const [trendCount, setTrendCount] = useState(3)
  const [trendInspirations, setTrendInspirations] = useState<{ saisonal: any[]; news: any[]; ki: any[] } | null>(null)
  const [loadingInspirations, setLoadingInspirations] = useState(false)
  const [generatingTrendPosts, setGeneratingTrendPosts] = useState(false)
  const [generatedTrendPosts, setGeneratedTrendPosts] = useState<Array<{ title: string; content: string; hashtags: string; imagePrompt: string }>>([])
  const [threadsCompatible, setThreadsCompatible] = useState(false)
  const [copiedPromptIdx, setCopiedPromptIdx] = useState<number | null>(null)
  const [uploadingMockup, setUploadingMockup] = useState(false)
  const [savingMockup, setSavingMockup] = useState(false)

  // Post form
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    hashtags: '',
    imageUrl: '',
    postType: 'CUSTOM',
    scheduledAt: '',
    accountIds: [] as string[],
  })
  const [generating, setGenerating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  // Account form
  const [accountForm, setAccountForm] = useState({
    platform: 'FACEBOOK',
    accountName: '',
    pageId: '',
    accessToken: '',
  })

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    postType: 'PARTNER_INTRO',
    textTemplate: '',
    platforms: [] as string[],
  })

  // Automation form
  const [automationForm, setAutomationForm] = useState({
    name: '',
    description: '',
    trigger: 'WORKSHOP_VERIFIED',
    templateId: '',
    platforms: [] as string[],
    autoPublish: false,
  })

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchStats()
      fetchAccounts()
    }
  }, [authStatus])

  useEffect(() => {
    if (activeTab === 'posts') fetchPosts()
    if (activeTab === 'accounts') fetchAccounts()
    if (activeTab === 'templates') fetchTemplates()
    if (activeTab === 'automations') fetchAutomations()
    if (activeTab === 'trends') {
      fetchSettings()
      if (!trendInspirations) fetchTrendInspirations()
    }
  }, [activeTab])

  // ============================================
  // TRENDS
  // ============================================

  async function fetchSettings() {
    try {
      const res = await fetch('/api/admin/social-media/settings')
      if (res.ok) {
        const data = await res.json()
        setDefaultMockupUrl(data.defaultMockupUrl || '')
        setFavoriteKeywords(Array.isArray(data.favoriteKeywords) ? data.favoriteKeywords : [])
      }
    } catch (err) {
      console.error('fetchSettings', err)
    }
  }

  async function fetchTrendInspirations() {
    setLoadingInspirations(true)
    try {
      const res = await fetch('/api/admin/social-media/trends/inspirations')
      if (res.ok) {
        const data = await res.json()
        setTrendInspirations(data)
      } else {
        const err = await res.json()
        alert(err.error || 'Inspirationen konnten nicht geladen werden')
      }
    } catch {
      alert('Inspirationen konnten nicht geladen werden')
    } finally {
      setLoadingInspirations(false)
    }
  }

  async function handleMockupUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingMockup(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/admin/social-media/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Upload fehlgeschlagen')
        return
      }
      const data = await res.json()
      // Direkt persistieren
      setSavingMockup(true)
      const saveRes = await fetch('/api/admin/social-media/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultMockupUrl: data.imageUrl })
      })
      if (saveRes.ok) {
        setDefaultMockupUrl(data.imageUrl)
      } else {
        alert('Mockup hochgeladen, Speichern fehlgeschlagen')
      }
    } catch {
      alert('Upload fehlgeschlagen')
    } finally {
      setUploadingMockup(false)
      setSavingMockup(false)
    }
  }

  async function handleRemoveMockup() {
    if (!confirm('Standard-Mockup wirklich entfernen?')) return
    setSavingMockup(true)
    try {
      const res = await fetch('/api/admin/social-media/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultMockupUrl: '' })
      })
      if (res.ok) setDefaultMockupUrl('')
    } finally {
      setSavingMockup(false)
    }
  }

  function addTrendKeyword(kw: string) {
    const v = kw.trim()
    if (!v) return
    if (trendKeywords.includes(v)) return
    setTrendKeywords([...trendKeywords, v])
    setTrendKeywordInput('')
  }

  function removeTrendKeyword(kw: string) {
    setTrendKeywords(trendKeywords.filter(k => k !== kw))
  }

  async function toggleFavoriteKeyword(kw: string) {
    const exists = favoriteKeywords.includes(kw)
    const next = exists ? favoriteKeywords.filter(k => k !== kw) : [...favoriteKeywords, kw]
    setFavoriteKeywords(next)
    try {
      await fetch('/api/admin/social-media/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favoriteKeywords: next })
      })
    } catch (err) {
      console.error('toggleFavoriteKeyword', err)
    }
  }

  async function handleGenerateTrendPosts() {
    if (trendKeywords.length === 0) {
      alert('Bitte mindestens ein Keyword/Trend hinzufügen')
      return
    }
    setGeneratingTrendPosts(true)
    setGeneratedTrendPosts([])
    try {
      const res = await fetch('/api/admin/social-media/trends/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: trendKeywords,
          audience: trendAudience,
          style: trendStyle,
          count: trendCount,
          threadsCompatible,
        })
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Generierung fehlgeschlagen')
        return
      }
      const data = await res.json()
      setGeneratedTrendPosts(data.posts || [])
    } catch {
      alert('Generierung fehlgeschlagen')
    } finally {
      setGeneratingTrendPosts(false)
    }
  }

  function takeTrendPostToEditor(p: { title: string; content: string; hashtags: string; imagePrompt: string }) {
    resetPostForm()
    setPostForm({
      title: p.title,
      content: p.content,
      hashtags: p.hashtags,
      imageUrl: defaultMockupUrl || '',
      postType: 'CUSTOM',
      scheduledAt: '',
      accountIds: [],
    })
    setShowPostDialog(true)
  }

  async function copyImagePrompt(prompt: string, idx: number) {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPromptIdx(idx)
      setTimeout(() => setCopiedPromptIdx(null), 2000)
    } catch {
      alert('Kopieren fehlgeschlagen')
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/social-media/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (e) {
      console.error('Error fetching stats:', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPosts() {
    setPostsLoading(true)
    try {
      const res = await fetch('/api/admin/social-media/posts')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts)
        setPostsTotal(data.total)
      }
    } catch (e) {
      console.error('Error fetching posts:', e)
    } finally {
      setPostsLoading(false)
    }
  }

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/admin/social-media/accounts')
      if (res.ok) setAccounts(await res.json())
    } catch (e) {
      console.error('Error fetching accounts:', e)
    }
  }

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/admin/social-media/templates')
      if (res.ok) setTemplates(await res.json())
    } catch (e) {
      console.error('Error fetching templates:', e)
    }
  }

  async function fetchAutomations() {
    try {
      const res = await fetch('/api/admin/social-media/automations')
      if (res.ok) setAutomations(await res.json())
    } catch (e) {
      console.error('Error fetching automations:', e)
    }
  }

  // ============================================
  // POST ACTIONS
  // ============================================

  async function handleSavePost() {
    // Block Threads posting if total length > 500
    const threadsAccountIds = accounts
      .filter(a => a.platform === 'THREADS' && postForm.accountIds.includes(a.id))
      .map(a => a.id)
    if (threadsAccountIds.length > 0) {
      const totalLength = postForm.content.length + (postForm.hashtags ? postForm.hashtags.length + 2 : 0)
      if (totalLength > 500) {
        alert(
          `❌ Beitrag zu lang für Threads (${totalLength}/500 Zeichen).\n\n` +
          `Bitte entweder:\n` +
          `• Text & Hashtags kürzen, oder\n` +
          `• Threads-Account aus den Plattformen entfernen.`
        )
        return
      }
    }

    const method = editingPost ? 'PUT' : 'POST'
    const url = editingPost
      ? `/api/admin/social-media/posts/${editingPost.id}`
      : '/api/admin/social-media/posts'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...postForm,
        scheduledAt: postForm.scheduledAt ? new Date(postForm.scheduledAt).toISOString() : null,
      })
    })

    if (res.ok) {
      setShowPostDialog(false)
      resetPostForm()
      fetchPosts()
      fetchStats()
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm('Diesen Beitrag wirklich löschen?')) return
    const res = await fetch(`/api/admin/social-media/posts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchPosts()
      fetchStats()
    }
  }

  async function handlePublishPost(id: string) {
    if (!confirm('Diesen Beitrag jetzt veröffentlichen?')) return
    setPublishing(id)
    try {
      const res = await fetch(`/api/admin/social-media/posts/${id}/publish`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(`Veröffentlicht! ${data.results?.filter((r: any) => r.success).length || 0} von ${data.results?.length || 0} Plattformen erfolgreich.`)
      } else {
        alert(`Fehler: ${data.error}`)
      }
      fetchPosts()
      fetchStats()
    } catch (error) {
      alert('Fehler beim Veröffentlichen')
    } finally {
      setPublishing(null)
    }
  }

  async function handleGenerateText() {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/social-media/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postType: postForm.postType })
      })
      if (res.ok) {
        const data = await res.json()
        setPostForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          content: data.content,
          hashtags: data.hashtags
        }))
      }
    } catch (e) {
      console.error('Error generating text:', e)
    } finally {
      setGenerating(false)
    }
  }

  function openEditPost(post: Post) {
    setEditingPost(post)
    setPostForm({
      title: post.title || '',
      content: post.content,
      hashtags: post.hashtags || '',
      imageUrl: post.imageUrl || '',
      postType: post.postType,
      scheduledAt: post.scheduledAt ? (() => { const d = new Date(post.scheduledAt); const pad = (n: number) => n.toString().padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; })() : '',
      accountIds: post.platforms.map(p => p.account.id),
    })
    setShowPostDialog(true)
  }

  function resetPostForm() {
    setEditingPost(null)
    setPostForm({ title: '', content: '', hashtags: '', imageUrl: '', postType: 'CUSTOM', scheduledAt: '', accountIds: [] })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/admin/social-media/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setPostForm(prev => ({ ...prev, imageUrl: data.imageUrl }))
      } else {
        const err = await res.json()
        alert(err.error || 'Fehler beim Hochladen')
      }
    } catch {
      alert('Fehler beim Hochladen')
    } finally {
      setUploadingImage(false)
    }
  }

  // ============================================
  // ACCOUNT ACTIONS
  // ============================================

  async function handleSaveAccount() {
    if (editingAccount) {
      // Update existing account
      const res = await fetch(`/api/admin/social-media/accounts/${editingAccount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm)
      })
      if (res.ok) {
        setShowAccountDialog(false)
        setEditingAccount(null)
        setAccountForm({ platform: 'FACEBOOK', accountName: '', pageId: '', accessToken: '' })
        fetchAccounts()
        fetchStats()
      }
    } else {
      // Create new account
      const res = await fetch('/api/admin/social-media/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm)
      })
      if (res.ok) {
        setShowAccountDialog(false)
        setAccountForm({ platform: 'FACEBOOK', accountName: '', pageId: '', accessToken: '' })
        fetchAccounts()
        fetchStats()
      }
    }
  }

  function openEditAccount(account: Account) {
    setEditingAccount(account)
    setAccountForm({
      platform: account.platform,
      accountName: account.accountName,
      pageId: account.pageId || '',
      accessToken: '', // Don't pre-fill token for security
    })
    setShowAccountDialog(true)
  }

  async function handleConvertToLongLived() {
    // If editing and no new token entered, use the stored token from the account
    const tokenToConvert = accountForm.accessToken || (editingAccount ? '__USE_STORED__' : '')
    if (!tokenToConvert) {
      alert('Bitte zuerst einen Access Token eintragen')
      return
    }
    setConvertingToken(true)
    try {
      const body: Record<string, string> = { platform: accountForm.platform }
      if (tokenToConvert === '__USE_STORED__' && editingAccount) {
        body.accountId = editingAccount.id
      } else {
        body.shortLivedToken = tokenToConvert
      }
      const res = await fetch('/api/admin/social-media/accounts/long-lived-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.longLivedToken) {
        setAccountForm(p => ({ ...p, accessToken: data.longLivedToken }))
        alert(`✅ Long-Lived Token erstellt!\nGültig bis: ${data.expiresAt || 'ca. 60 Tage'}\n\nDer Token wurde ins Feld übernommen. Klicke "Speichern" um ihn zu speichern.`)
      } else {
        alert(`❌ Token-Konvertierung fehlgeschlagen:\n${data.error}`)
      }
    } catch {
      alert('Fehler bei der Token-Konvertierung')
    } finally {
      setConvertingToken(false)
    }
  }

  async function handleVerifyAccount() {
    if (!accountForm.pageId || !accountForm.accessToken) {
      alert('Page-ID und Access Token sind für die Verifizierung erforderlich')
      return
    }
    setVerifying(true)
    try {
      const res = await fetch('/api/admin/social-media/accounts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: accountForm.platform,
          pageId: accountForm.pageId,
          accessToken: accountForm.accessToken,
        })
      })
      const data = await res.json()
      if (data.valid) {
        alert(`✅ Verbindung erfolgreich!\n${data.pageName || data.username || 'Account verifiziert'}`)
      } else {
        alert(`❌ Verbindung fehlgeschlagen:\n${data.error}`)
      }
    } catch {
      alert('Fehler bei der Verifizierung')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDeleteAccount(id: string) {
    if (!confirm('Diesen Account wirklich trennen?')) return
    const res = await fetch(`/api/admin/social-media/accounts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchAccounts()
      fetchStats()
    }
  }

  async function handleToggleAccount(id: string, isActive: boolean) {
    await fetch(`/api/admin/social-media/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive })
    })
    fetchAccounts()
  }

  // ============================================
  // TEMPLATE ACTIONS
  // ============================================

  async function handleSaveTemplate() {
    const method = editingTemplate ? 'PUT' : 'POST'
    const url = editingTemplate
      ? `/api/admin/social-media/templates/${editingTemplate.id}`
      : '/api/admin/social-media/templates'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateForm)
    })
    if (res.ok) {
      setShowTemplateDialog(false)
      setEditingTemplate(null)
      setTemplateForm({ name: '', description: '', postType: 'PARTNER_INTRO', textTemplate: '', platforms: [] })
      fetchTemplates()
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Diese Vorlage wirklich löschen?')) return
    const res = await fetch(`/api/admin/social-media/templates/${id}`, { method: 'DELETE' })
    if (res.ok) fetchTemplates()
  }

  function openEditTemplate(t: Template) {
    setEditingTemplate(t)
    setTemplateForm({
      name: t.name,
      description: t.description || '',
      postType: t.postType,
      textTemplate: t.textTemplate,
      platforms: (t.platforms as string[]) || [],
    })
    setShowTemplateDialog(true)
  }

  // ============================================
  // AUTOMATION ACTIONS
  // ============================================

  async function handleSaveAutomation() {
    const method = editingAutomation ? 'PUT' : 'POST'
    const url = editingAutomation
      ? `/api/admin/social-media/automations/${editingAutomation.id}`
      : '/api/admin/social-media/automations'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(automationForm)
    })
    if (res.ok) {
      setShowAutomationDialog(false)
      setEditingAutomation(null)
      setAutomationForm({ name: '', description: '', trigger: 'WORKSHOP_VERIFIED', templateId: '', platforms: [], autoPublish: false })
      fetchAutomations()
    }
  }

  async function handleDeleteAutomation(id: string) {
    if (!confirm('Diese Automatisierung wirklich löschen?')) return
    const res = await fetch(`/api/admin/social-media/automations/${id}`, { method: 'DELETE' })
    if (res.ok) fetchAutomations()
  }

  async function handleToggleAutomation(id: string, isActive: boolean) {
    await fetch(`/api/admin/social-media/automations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive })
    })
    fetchAutomations()
  }

  function openEditAutomation(a: Automation) {
    setEditingAutomation(a)
    setAutomationForm({
      name: a.name,
      description: a.description || '',
      trigger: a.trigger,
      templateId: a.templateId,
      platforms: (a.platforms as string[]) || [],
      autoPublish: a.autoPublish,
    })
    setShowAutomationDialog(true)
  }

  // Toggle platform in multi-select
  function togglePlatform(arr: string[], platform: string): string[] {
    return arr.includes(platform) ? arr.filter(p => p !== platform) : [...arr, platform]
  }

  // ============================================
  // RENDER
  // ============================================

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Share2 className="h-6 w-6 text-pink-500" />
              Social Media Marketing
            </h1>
            <p className="text-sm text-gray-500">Beiträge erstellen, planen und automatisiert veröffentlichen</p>
          </div>
        </div>
        <Button onClick={() => { resetPostForm(); setShowPostDialog(true) }}>
          <PlusCircle className="h-4 w-4 mr-2" /> Neuer Beitrag
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-1">
            <FileText className="h-4 w-4" /> Beiträge
            {stats && stats.posts.total > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{stats.posts.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> Trends
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1">
            <FileText className="h-4 w-4" /> Vorlagen
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-1">
            <Zap className="h-4 w-4" /> Automatisierungen
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-1">
            <Globe className="h-4 w-4" /> Accounts
            {stats && (
              <Badge variant="secondary" className="ml-1 text-xs">{stats.accounts.active}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ============ DASHBOARD TAB ============ */}
        <TabsContent value="dashboard">
          {stats && (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Beiträge gesamt</CardDescription>
                    <CardTitle className="text-3xl">{stats.posts.total}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {stats.posts.scheduled} geplant</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> {stats.posts.published}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Verknüpfte Accounts</CardDescription>
                    <CardTitle className="text-3xl">{stats.accounts.active}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500">{stats.accounts.total} Accounts insgesamt</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Vorlagen</CardDescription>
                    <CardTitle className="text-3xl">{stats.templates}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500">Für schnelle Posts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Automatisierungen</CardDescription>
                    <CardTitle className="text-3xl">{stats.automations.active}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500">{stats.automations.total} konfiguriert</p>
                  </CardContent>
                </Card>
              </div>

              {/* Engagement overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engagement-Übersicht</CardTitle>
                  <CardDescription>Gesamt-Metriken aller veröffentlichten Beiträge</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{stats.engagement.likes}</p>
                      <p className="text-xs text-gray-500">Likes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.engagement.shares}</p>
                      <p className="text-xs text-gray-500">Shares</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.engagement.comments}</p>
                      <p className="text-xs text-gray-500">Kommentare</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.engagement.clicks}</p>
                      <p className="text-xs text-gray-500">Klicks</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.engagement.reach.toLocaleString('de-DE')}</p>
                      <p className="text-xs text-gray-500">Reichweite</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.engagement.impressions.toLocaleString('de-DE')}</p>
                      <p className="text-xs text-gray-500">Impressionen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent posts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Letzte Beiträge</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.recentPosts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Share2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Noch keine Beiträge erstellt</p>
                      <Button variant="outline" className="mt-4" onClick={() => { resetPostForm(); setShowPostDialog(true) }}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Ersten Beitrag erstellen
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Typ</TableHead>
                          <TableHead>Inhalt</TableHead>
                          <TableHead>Plattformen</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Datum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.recentPosts.map(post => (
                          <TableRow key={post.id}>
                            <TableCell className="whitespace-nowrap">{POST_TYPE_LABELS[post.postType] || post.postType}</TableCell>
                            <TableCell className="max-w-xs truncate">{post.content}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {post.platforms?.map(p => (
                                  <span key={p.id} title={PLATFORM_LABELS[p.account.platform]}>
                                    {PLATFORM_ICONS[p.account.platform]}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={STATUS_BADGES[post.status]?.variant || 'secondary'}>
                                {STATUS_BADGES[post.status]?.label || post.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(post.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Quick start guide */}
              {stats.accounts.total === 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-800">🚀 Schnellstart: Social Media einrichten</CardTitle>
                  </CardHeader>
                  <CardContent className="text-blue-700 space-y-3">
                    <p>1. <strong>Account verbinden</strong> — Gehe zum &quot;Accounts&quot;-Tab und verknüpfe deinen Facebook, Instagram oder LinkedIn Account.</p>
                    <p>2. <strong>Vorlage erstellen</strong> — Erstelle im &quot;Vorlagen&quot;-Tab Templates für wiederkehrende Posts (z.B. Partner-Vorstellung).</p>
                    <p>3. <strong>Automatisierung einrichten</strong> — Im &quot;Automatisierungen&quot;-Tab kannst du festlegen, dass Posts automatisch erstellt werden (z.B. wenn eine Werkstatt verifiziert wird).</p>
                    <p>4. <strong>Ersten Beitrag erstellen</strong> — Oder erstelle direkt manuell deinen ersten Post mit KI-Unterstützung!</p>
                    <Button onClick={() => setActiveTab('accounts')} className="mt-2">
                      <Globe className="h-4 w-4 mr-2" /> Zum Accounts-Tab
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ============ POSTS TAB ============ */}
        <TabsContent value="posts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Beiträge ({postsTotal})</CardTitle>
                <CardDescription>Alle Social-Media-Beiträge verwalten</CardDescription>
              </div>
              <Button onClick={() => { resetPostForm(); setShowPostDialog(true) }}>
                <PlusCircle className="h-4 w-4 mr-2" /> Neuer Beitrag
              </Button>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Noch keine Beiträge vorhanden</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Typ</TableHead>
                      <TableHead>Titel / Inhalt</TableHead>
                      <TableHead>Plattformen</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Geplant</TableHead>
                      <TableHead>Erstellt</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map(post => (
                      <TableRow key={post.id}>
                        <TableCell className="whitespace-nowrap">{POST_TYPE_LABELS[post.postType] || post.postType}</TableCell>
                        <TableCell className="max-w-sm">
                          {post.title && <p className="font-medium text-sm">{post.title}</p>}
                          <p className="text-sm text-gray-500 truncate">{post.content}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {post.platforms?.map(p => (
                              <span key={p.id} title={PLATFORM_LABELS[p.account.platform]}>
                                {PLATFORM_ICONS[p.account.platform]}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGES[post.status]?.variant || 'secondary'}>
                            {STATUS_BADGES[post.status]?.label || post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(post.scheduledAt)}</TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(post.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {(post.status === 'DRAFT' || post.status === 'SCHEDULED' || post.status === 'FAILED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePublishPost(post.id)}
                                disabled={publishing === post.id}
                                title="Jetzt veröffentlichen"
                              >
                                {publishing === post.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => openEditPost(post)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ TRENDS TAB ============ */}
        <TabsContent value="trends">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left/Main: Generator */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-pink-500" /> Trend-Generator
                  </CardTitle>
                  <CardDescription>
                    Trage Keywords aus Google Trends oder eigene Themen ein. Die KI erstellt mehrere abwechslungsreiche Posts daraus.
                    <a
                      href="https://trends.google.de/trends/explore?geo=DE"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-600 hover:underline"
                    >
                      Google Trends öffnen ↗
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Keyword Input */}
                  <div>
                    <Label>Keywords / Trends</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={trendKeywordInput}
                        onChange={e => setTrendKeywordInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addTrendKeyword(trendKeywordInput)
                          }
                        }}
                        placeholder='z.B. "Sommerreifen 2026", "E-Auto Reifenverschleiß"...'
                      />
                      <Button onClick={() => addTrendKeyword(trendKeywordInput)} variant="outline">
                        <Plus className="h-4 w-4 mr-1" /> Hinzufügen
                      </Button>
                    </div>
                    {trendKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {trendKeywords.map(kw => {
                          const isFav = favoriteKeywords.includes(kw)
                          return (
                            <Badge key={kw} variant="secondary" className="pl-2 pr-1 py-1 gap-1 text-sm">
                              {kw}
                              <button
                                onClick={() => toggleFavoriteKeyword(kw)}
                                title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                                className="ml-1 hover:text-yellow-500"
                              >
                                <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                              </button>
                              <button
                                onClick={() => removeTrendKeyword(kw)}
                                className="ml-0.5 hover:text-red-500"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                    {favoriteKeywords.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">⭐ Favoriten (Klick zum Hinzufügen):</p>
                        <div className="flex flex-wrap gap-1">
                          {favoriteKeywords.map(kw => (
                            <Button
                              key={kw}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addTrendKeyword(kw)}
                              disabled={trendKeywords.includes(kw)}
                            >
                              {kw}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audience + Style + Count */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Zielgruppe</Label>
                      <Select value={trendAudience} onValueChange={v => setTrendAudience(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUSTOMER">🚗 Endkunden</SelectItem>
                          <SelectItem value="WORKSHOP">🔧 Werkstätten</SelectItem>
                          <SelectItem value="BOTH">🤝 Beide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Stil</Label>
                      <Select value={trendStyle} onValueChange={v => setTrendStyle(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INFORMATIVE">📋 Sachlich</SelectItem>
                          <SelectItem value="FUNNY">😄 Humorvoll</SelectItem>
                          <SelectItem value="PROVOCATIVE">⚡ Provokant</SelectItem>
                          <SelectItem value="STORY">📖 Story-Telling</SelectItem>
                          <SelectItem value="EMOTIONAL">❤️ Emotional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Anzahl Posts</Label>
                      <Select value={String(trendCount)} onValueChange={v => setTrendCount(parseInt(v, 10))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Post</SelectItem>
                          <SelectItem value="2">2 Posts</SelectItem>
                          <SelectItem value="3">3 Posts</SelectItem>
                          <SelectItem value="4">4 Posts</SelectItem>
                          <SelectItem value="5">5 Posts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateTrendPosts}
                    disabled={generatingTrendPosts || trendKeywords.length === 0}
                    className="w-full"
                  >
                    {generatingTrendPosts
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generiere {trendCount} Beiträge...</>
                      : <><Sparkles className="h-4 w-4 mr-2" /> {trendCount} Beiträge generieren</>}
                  </Button>

                  {/* Threads-Compatible Toggle */}
                  <label className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={threadsCompatible}
                      onChange={e => setThreadsCompatible(e.target.checked)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <AtSign className="h-3.5 w-3.5" /> Threads-kompatibel (max 500 Zeichen)
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Erzeugt kurze Beiträge die auch auf Threads gepostet werden können. Ohne Haken: längere Beiträge – dann aber kein Threads-Posting möglich.
                      </p>
                    </div>
                  </label>
                </CardContent>
              </Card>

              {/* Generated Posts */}
              {generatedTrendPosts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generierte Beiträge ({generatedTrendPosts.length})</CardTitle>
                    <CardDescription>Klicke auf &quot;Übernehmen&quot;, um den Beitrag in den Editor zu laden.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {generatedTrendPosts.map((p, i) => {
                      const totalLen = p.content.length + (p.hashtags ? p.hashtags.length + 2 : 0)
                      const overThreads = totalLen > 500
                      return (
                        <div key={i} className="border rounded-lg p-3 space-y-2 bg-card">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm">{p.title}</h4>
                            <Button size="sm" onClick={() => takeTrendPostToEditor(p)}>
                              <Send className="h-3.5 w-3.5 mr-1" /> Übernehmen
                            </Button>
                          </div>
                          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{p.content}</p>
                          <p className="text-xs text-blue-600 break-words">{p.hashtags}</p>

                          {/* Char count */}
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <Badge variant="outline" className="font-mono">
                              Text: {p.content.length}
                            </Badge>
                            <Badge variant="outline" className="font-mono">
                              Hashtags: {p.hashtags.length}
                            </Badge>
                            <Badge
                              variant={overThreads ? 'destructive' : 'secondary'}
                              className="font-mono"
                              title="Gesamt-Zeichen (Text + Hashtags)"
                            >
                              <AtSign className="h-3 w-3 mr-1" />
                              {totalLen} / 500 {overThreads ? '— zu lang für Threads' : '— Threads OK'}
                            </Badge>
                          </div>

                          {/* Image Prompt */}
                          {p.imagePrompt && (
                            <div className="mt-2 p-2 rounded bg-muted/50 border-l-2 border-purple-400">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="text-xs font-semibold flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3 text-purple-500" />
                                  Bild-Prompt (für Midjourney / DALL·E / Stable Diffusion)
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => copyImagePrompt(p.imagePrompt, i)}
                                >
                                  {copiedPromptIdx === i ? <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> : null}
                                  {copiedPromptIdx === i ? 'Kopiert!' : 'Kopieren'}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                                {p.imagePrompt}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar: Mockup + Inspirations */}
            <div className="space-y-4">
              {/* Default Mockup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ImageIcon className="h-4 w-4" /> Standard-Mockup
                  </CardTitle>
                  <CardDescription>Wird automatisch bei generierten Posts eingehängt.</CardDescription>
                </CardHeader>
                <CardContent>
                  {defaultMockupUrl ? (
                    <div className="space-y-2">
                      <img src={defaultMockupUrl} alt="Standard-Mockup" className="w-full rounded-lg border object-cover max-h-48" />
                      <div className="flex gap-2">
                        <label className="flex-1">
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <span>
                              {uploadingMockup
                                ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                : <Upload className="h-3.5 w-3.5 mr-1" />}
                              Ersetzen
                            </span>
                          </Button>
                          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleMockupUpload} disabled={uploadingMockup || savingMockup} />
                        </label>
                        <Button variant="ghost" size="sm" onClick={handleRemoveMockup} disabled={savingMockup}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                      {uploadingMockup
                        ? <Loader2 className="h-5 w-5 animate-spin" />
                        : <Upload className="h-5 w-5 text-muted-foreground" />}
                      <span className="text-xs text-center text-muted-foreground">
                        {uploadingMockup ? 'Wird hochgeladen...' : 'Mockup hochladen (JPG/PNG, max 8MB)'}
                      </span>
                      <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleMockupUpload} disabled={uploadingMockup} />
                    </label>
                  )}
                </CardContent>
              </Card>

              {/* Inspirations */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-4 w-4 text-amber-500" /> KI-Inspiration
                    </CardTitle>
                    <CardDescription>Klick = ins Trend-Feld übernehmen</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchTrendInspirations} disabled={loadingInspirations}>
                    {loadingInspirations
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RefreshCw className="h-3.5 w-3.5" />}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!trendInspirations && !loadingInspirations && (
                    <p className="text-xs text-muted-foreground">Noch keine Inspirationen geladen.</p>
                  )}
                  {trendInspirations?.saisonal?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">🌸 Saisonal</p>
                      <div className="space-y-1">
                        {trendInspirations.saisonal.slice(0, 6).map((it, i) => (
                          <button
                            key={`s-${i}`}
                            onClick={() => addTrendKeyword(it.title)}
                            className="block w-full text-left text-xs p-2 rounded hover:bg-muted transition"
                          >
                            <span className="font-medium">{it.title}</span>
                            {it.hint && <span className="block text-muted-foreground text-[10px] mt-0.5">{it.hint}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {trendInspirations?.ki?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">✨ KI-Vorschläge</p>
                      <div className="space-y-1">
                        {trendInspirations.ki.map((it, i) => (
                          <button
                            key={`k-${i}`}
                            onClick={() => addTrendKeyword(it.title)}
                            className="block w-full text-left text-xs p-2 rounded hover:bg-muted transition"
                          >
                            <span className="font-medium">{it.title}</span>
                            {it.hint && <span className="block text-muted-foreground text-[10px] mt-0.5">{it.hint}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {trendInspirations?.news?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">📰 News-Schlagzeilen</p>
                      <div className="space-y-1">
                        {trendInspirations.news.slice(0, 6).map((it, i) => (
                          <button
                            key={`n-${i}`}
                            onClick={() => addTrendKeyword(it.title)}
                            className="block w-full text-left text-xs p-2 rounded hover:bg-muted transition"
                          >
                            <span className="font-medium line-clamp-2">{it.title}</span>
                            {it.source && <span className="block text-muted-foreground text-[10px] mt-0.5">{it.source}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ============ TEMPLATES TAB ============ */}
        <TabsContent value="templates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vorlagen ({templates.length})</CardTitle>
                <CardDescription>Text- und Design-Vorlagen für wiederkehrende Posts</CardDescription>
              </div>
              <Button onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', description: '', postType: 'PARTNER_INTRO', textTemplate: '', platforms: [] }); setShowTemplateDialog(true) }}>
                <PlusCircle className="h-4 w-4 mr-2" /> Neue Vorlage
              </Button>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Noch keine Vorlagen erstellt</p>
                  <p className="text-sm mt-1">Erstelle Vorlagen mit Variablen wie {'{{workshopName}}'} und {'{{city}}'}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Plattformen</TableHead>
                      <TableHead>Verwendet</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map(t => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <p className="font-medium">{t.name}</p>
                          {t.description && <p className="text-xs text-gray-400 truncate max-w-xs">{t.description}</p>}
                        </TableCell>
                        <TableCell>{POST_TYPE_LABELS[t.postType] || t.postType}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {((t.platforms as string[]) || []).map(p => (
                              <span key={p} title={PLATFORM_LABELS[p]}>{PLATFORM_ICONS[p]}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{t._count.posts} Posts, {t._count.automations} Automations</TableCell>
                        <TableCell>
                          <Badge variant={t.isActive ? 'default' : 'secondary'}>{t.isActive ? 'Aktiv' : 'Inaktiv'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditTemplate(t)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(t.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ AUTOMATIONS TAB ============ */}
        <TabsContent value="automations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Automatisierungen ({automations.length})</CardTitle>
                <CardDescription>Regeln für automatische Post-Erstellung</CardDescription>
              </div>
              <Button onClick={() => { setEditingAutomation(null); setAutomationForm({ name: '', description: '', trigger: 'WORKSHOP_VERIFIED', templateId: '', platforms: [], autoPublish: false }); setShowAutomationDialog(true) }}>
                <PlusCircle className="h-4 w-4 mr-2" /> Neue Automatisierung
              </Button>
            </CardHeader>
            <CardContent>
              {automations.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Automatisierungen konfiguriert</p>
                  <p className="text-sm mt-1">z.B. &quot;Werkstatt verifiziert → Automatisch Willkommens-Post erstellen&quot;</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Vorlage</TableHead>
                      <TableHead>Plattformen</TableHead>
                      <TableHead>Auto-Publish</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Letzte Ausführung</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automations.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <p className="font-medium">{a.name}</p>
                          {a.description && <p className="text-xs text-gray-400 truncate max-w-xs">{a.description}</p>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{TRIGGER_LABELS[a.trigger] || a.trigger}</TableCell>
                        <TableCell>{a.template?.name || '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {((a.platforms as string[]) || []).map(p => (
                              <span key={p} title={PLATFORM_LABELS[p]}>{PLATFORM_ICONS[p]}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {a.autoPublish ? (
                            <Badge variant="default" className="bg-green-600">Sofort</Badge>
                          ) : (
                            <Badge variant="outline">Freigabe nötig</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAutomation(a.id, a.isActive)}
                          >
                            <Badge variant={a.isActive ? 'default' : 'secondary'}>
                              {a.isActive ? 'Aktiv' : 'Inaktiv'}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(a.lastTriggeredAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditAutomation(a)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAutomation(a.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ ACCOUNTS TAB ============ */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Verknüpfte Accounts ({accounts.length})</CardTitle>
                <CardDescription>Social-Media-Accounts für automatisches Posting</CardDescription>
              </div>
              <Button onClick={() => { setAccountForm({ platform: 'FACEBOOK', accountName: '', pageId: '', accessToken: '' }); setShowAccountDialog(true) }}>
                <PlusCircle className="h-4 w-4 mr-2" /> Account verbinden
              </Button>
              <Button variant="outline" onClick={async () => {
                const res = await fetch('/api/admin/api-settings')
                if (!res.ok) return alert('API-Einstellungen konnten nicht geladen werden')
                const settings = await res.json()
                const clientId = settings.find((s: any) => s.key === 'LINKEDIN_CLIENT_ID')?.value
                if (!clientId) return alert('LinkedIn Client-ID fehlt! Bitte zuerst in Admin → API-Einstellungen eintragen.')
                const redirectUri = encodeURIComponent('https://bereifung24.de/api/admin/social-media/linkedin/callback')
                const scopes = encodeURIComponent('openid profile w_organization_social')
                window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=bereifung24`
              }}>
                <Linkedin className="h-4 w-4 mr-2" /> Mit LinkedIn verbinden
              </Button>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Noch keine Accounts verknüpft</p>
                  <p className="text-sm mt-1">Verbinde Facebook, Instagram, LinkedIn oder YouTube</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {accounts.map(account => (
                    <Card key={account.id} className={!account.isActive ? 'opacity-50' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {PLATFORM_ICONS[account.platform]}
                            <CardTitle className="text-base">{account.accountName}</CardTitle>
                          </div>
                          <Badge variant={account.isActive ? 'default' : 'secondary'}>
                            {account.isActive ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                        <CardDescription>{PLATFORM_LABELS[account.platform]}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {account.pageId && <p className="text-gray-500">Page-ID: {account.pageId}</p>}
                          <p className="text-gray-500">{account._count.posts} Posts</p>
                          {account.tokenExpiresAt && (
                            <p className={`text-xs ${new Date(account.tokenExpiresAt) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                              Token gültig bis: {formatDate(account.tokenExpiresAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditAccount(account)}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Bearbeiten
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAccount(account.id, account.isActive)}
                          >
                            {account.isActive ? 'Deaktivieren' : 'Aktivieren'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAccount(account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform setup guide */}
          <Card className="mt-4 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg text-amber-800">📋 Einrichtungsanleitung</CardTitle>
            </CardHeader>
            <CardContent className="text-amber-700 space-y-3 text-sm">
              <p><strong>Facebook + Instagram:</strong> Erstelle eine Meta App unter <code>developers.facebook.com</code>, aktiviere &quot;Facebook Pages API&quot; und &quot;Instagram Graph API&quot;, generiere einen Page Access Token.</p>
              <p><strong>LinkedIn:</strong> Erstelle eine App unter <code>linkedin.com/developers</code>, beantrage &quot;Marketing Developer Platform&quot;-Zugang, generiere einen Access Token.</p>
              <p><strong>YouTube:</strong> Erstelle ein Google Cloud-Projekt, aktiviere &quot;YouTube Data API v3&quot;, richte OAuth 2.0 ein.</p>
              <p className="text-xs text-amber-600">Trage die generierten Access Tokens hier ein. In einer zukünftigen Version wird OAuth direkt im Browser unterstützt.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ POST DIALOG ============ */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Beitrag bearbeiten' : 'Neuen Beitrag erstellen'}</DialogTitle>
            <DialogDescription>
              Erstelle einen Social-Media-Beitrag mit optionaler KI-Unterstützung
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Beitragstyp</Label>
                <Select value={postForm.postType} onValueChange={v => setPostForm(p => ({ ...p, postType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(POST_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titel (optional)</Label>
                <Input value={postForm.title} onChange={e => setPostForm(p => ({ ...p, title: e.target.value }))} placeholder="Interner Titel..." />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Text</Label>
                <Button variant="outline" size="sm" onClick={handleGenerateText} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  KI-Text generieren
                </Button>
              </div>
              <Textarea
                value={postForm.content}
                onChange={e => setPostForm(p => ({ ...p, content: e.target.value }))}
                placeholder="Beitragstext..."
                rows={6}
              />
              {(() => {
                const threadsSelected = accounts.some(a => a.platform === 'THREADS' && postForm.accountIds.includes(a.id))
                const totalLength = postForm.content.length + (postForm.hashtags ? postForm.hashtags.length + 2 : 0)
                if (!threadsSelected) return null
                const isOver = totalLength > 500
                return (
                  <div className={`flex items-center justify-between mt-1 text-xs ${isOver ? 'text-red-500' : 'text-muted-foreground'}`}>
                    <span>
                      {isOver
                        ? `⚠️ Text zu lang für Threads! Hashtags werden dort automatisch weggelassen${postForm.content.length > 500 ? ', Text wird gekürzt.' : '.'}`
                        : 'Threads: max. 500 Zeichen (inkl. Hashtags)'}
                    </span>
                    <span className={`font-mono ${isOver ? 'font-bold' : ''}`}>{totalLength}/500</span>
                  </div>
                )
              })()}
            </div>

            <div>
              <Label>Hashtags</Label>
              <Input
                value={postForm.hashtags}
                onChange={e => setPostForm(p => ({ ...p, hashtags: e.target.value }))}
                placeholder="#Bereifung24 #Reifen #Werkstatt..."
              />
            </div>

            <div>
              <Label>Bild (optional)</Label>
              {postForm.imageUrl ? (
                <div className="relative mt-1 inline-block">
                  <img src={postForm.imageUrl} alt="Post-Bild" className="h-32 rounded-lg object-cover border" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => setPostForm(p => ({ ...p, imageUrl: '' }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 mt-1 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {uploadingImage ? 'Wird hochgeladen...' : 'Bild auswählen (JPG/PNG, max 8MB)'}
                  </span>
                  <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              )}
            </div>

            <div>
              <Label>Plattformen</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {accounts.filter(a => a.isActive).length === 0 ? (
                  <p className="text-sm text-gray-400">Keine aktiven Accounts — zuerst im &quot;Accounts&quot;-Tab verknüpfen</p>
                ) : (
                  accounts.filter(a => a.isActive).map(account => (
                    <Button
                      key={account.id}
                      variant={postForm.accountIds.includes(account.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPostForm(p => ({
                        ...p,
                        accountIds: p.accountIds.includes(account.id)
                          ? p.accountIds.filter(id => id !== account.id)
                          : [...p.accountIds, account.id]
                      }))}
                    >
                      {PLATFORM_ICONS[account.platform]}
                      <span className="ml-1">{account.accountName}</span>
                    </Button>
                  ))
                )}
              </div>
            </div>

            <div>
              <Label>Planung (optional)</Label>
              <Input
                type="datetime-local"
                value={postForm.scheduledAt}
                onChange={e => setPostForm(p => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>Abbrechen</Button>
            <Button
              onClick={handleSavePost}
              disabled={!postForm.content}
            >
              <Send className="h-4 w-4 mr-2" />
              {postForm.scheduledAt ? 'Planen' : 'Als Entwurf speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ ACCOUNT DIALOG ============ */}
      <Dialog open={showAccountDialog} onOpenChange={(open) => { setShowAccountDialog(open); if (!open) setEditingAccount(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Account bearbeiten' : 'Account verbinden'}</DialogTitle>
            <DialogDescription>{editingAccount ? 'Access Token und Einstellungen aktualisieren' : 'Verknüpfe einen Social-Media-Account'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Plattform</Label>
              <Select value={accountForm.platform} onValueChange={v => setAccountForm(p => ({ ...p, platform: v }))} disabled={!!editingAccount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Account-Name</Label>
              <Input value={accountForm.accountName} onChange={e => setAccountForm(p => ({ ...p, accountName: e.target.value }))} placeholder="z.B. Bereifung24" />
            </div>
            <div>
              <Label>Page-ID / Company-ID (optional)</Label>
              <Input value={accountForm.pageId} onChange={e => setAccountForm(p => ({ ...p, pageId: e.target.value }))} placeholder="Numerische ID der Seite..." />
            </div>
            <div>
              <Label>Access Token {editingAccount && <span className="text-xs text-gray-400">(leer lassen = Token beibehalten)</span>}</Label>
              <Textarea value={accountForm.accessToken} onChange={e => setAccountForm(p => ({ ...p, accessToken: e.target.value }))} placeholder={editingAccount ? 'Neuen Token einfügen oder leer lassen...' : 'Long-lived Access Token...'} rows={3} />
              {(accountForm.platform === 'FACEBOOK' || accountForm.platform === 'INSTAGRAM' || accountForm.platform === 'THREADS') && (accountForm.accessToken || editingAccount) && (
                <Button variant="link" size="sm" className="mt-1 p-0 h-auto text-xs" onClick={handleConvertToLongLived} disabled={convertingToken}>
                  {convertingToken ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Clock className="h-3 w-3 mr-1" />}
                  {editingAccount && !accountForm.accessToken ? 'Gespeicherten Token in Long-Lived Token umwandeln' : 'In Long-Lived Token umwandeln (60 Tage)'}
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAccountDialog(false); setEditingAccount(null) }}>Abbrechen</Button>
            {(accountForm.platform === 'FACEBOOK' || accountForm.platform === 'INSTAGRAM' || accountForm.platform === 'THREADS') && accountForm.pageId && accountForm.accessToken && (
              <Button variant="secondary" onClick={handleVerifyAccount} disabled={verifying}>
                {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Verbindung testen
              </Button>
            )}
            <Button onClick={handleSaveAccount} disabled={!accountForm.accountName || !accountForm.platform}>
              {editingAccount ? 'Speichern' : 'Verbinden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ TEMPLATE DIALOG ============ */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}</DialogTitle>
            <DialogDescription>Vorlagen mit Variablen: {'{{workshopName}}'}, {'{{city}}'}, {'{{services}}'}, {'{{rating}}'}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={templateForm.name} onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))} placeholder="z.B. Werkstatt Willkommen" />
              </div>
              <div>
                <Label>Beitragstyp</Label>
                <Select value={templateForm.postType} onValueChange={v => setTemplateForm(p => ({ ...p, postType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(POST_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Input value={templateForm.description} onChange={e => setTemplateForm(p => ({ ...p, description: e.target.value }))} placeholder="Kurze Beschreibung..." />
            </div>

            <div>
              <Label>Text-Vorlage</Label>
              <Textarea
                value={templateForm.textTemplate}
                onChange={e => setTemplateForm(p => ({ ...p, textTemplate: e.target.value }))}
                placeholder="🎉 Willkommen {{workshopName}} aus {{city}}! Wir freuen uns auf die Zusammenarbeit! #Bereifung24 #NeuPartner"
                rows={6}
              />
            </div>

            <div>
              <Label>Plattformen</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={templateForm.platforms.includes(key) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTemplateForm(p => ({ ...p, platforms: togglePlatform(p.platforms, key) }))}
                  >
                    {PLATFORM_ICONS[key]} <span className="ml-1">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Abbrechen</Button>
            <Button onClick={handleSaveTemplate} disabled={!templateForm.name || !templateForm.textTemplate}>
              {editingTemplate ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ AUTOMATION DIALOG ============ */}
      <Dialog open={showAutomationDialog} onOpenChange={setShowAutomationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAutomation ? 'Automatisierung bearbeiten' : 'Neue Automatisierung'}</DialogTitle>
            <DialogDescription>Lege fest, wann automatisch Posts erstellt werden</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={automationForm.name} onChange={e => setAutomationForm(p => ({ ...p, name: e.target.value }))} placeholder="z.B. Neuer Partner Willkommen" />
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Input value={automationForm.description} onChange={e => setAutomationForm(p => ({ ...p, description: e.target.value }))} placeholder="Wird ausgelöst wenn..." />
            </div>

            <div>
              <Label>Trigger (Auslöser)</Label>
              <Select value={automationForm.trigger} onValueChange={v => setAutomationForm(p => ({ ...p, trigger: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Vorlage</Label>
              <Select value={automationForm.templateId} onValueChange={v => setAutomationForm(p => ({ ...p, templateId: v }))}>
                <SelectTrigger><SelectValue placeholder="Vorlage auswählen..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({POST_TYPE_LABELS[t.postType]})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">Erstelle zuerst eine Vorlage im &quot;Vorlagen&quot;-Tab</p>
              )}
            </div>

            <div>
              <Label>Plattformen</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                  <Button
                    key={key}
                    variant={automationForm.platforms.includes(key) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAutomationForm(p => ({ ...p, platforms: togglePlatform(p.platforms, key) }))}
                  >
                    {PLATFORM_ICONS[key]} <span className="ml-1">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              <input
                type="checkbox"
                id="autoPublish"
                checked={automationForm.autoPublish}
                onChange={e => setAutomationForm(p => ({ ...p, autoPublish: e.target.checked }))}
                className="h-4 w-4"
              />
              <div>
                <Label htmlFor="autoPublish" className="cursor-pointer">Automatisch veröffentlichen</Label>
                <p className="text-xs text-gray-500">Wenn deaktiviert, wird der Post als Entwurf erstellt und muss manuell freigegeben werden</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutomationDialog(false)}>Abbrechen</Button>
            <Button onClick={handleSaveAutomation} disabled={!automationForm.name || !automationForm.templateId}>
              {editingAutomation ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

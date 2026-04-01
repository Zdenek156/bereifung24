import { prisma } from '@/lib/prisma'
import { SocialMediaTrigger } from '@prisma/client'

/**
 * Content Generator Service - Uses Gemini for AI-powered social media text generation
 */

interface ContentGenerationParams {
  postType: string
  workshopName?: string
  city?: string
  services?: string[]
  rating?: number
  blogTitle?: string
  blogExcerpt?: string
  platform?: string
  customPrompt?: string
}

/**
 * Generate post text using Gemini AI
 */
export async function generatePostContent(params: ContentGenerationParams): Promise<{
  content: string
  hashtags: string
}> {
  // Fetch Gemini API key from settings
  const apiKeySetting = await prisma.adminApiSetting.findFirst({
    where: { key: 'GEMINI_API_KEY' }
  })

  if (!apiKeySetting?.value) {
    throw new Error('Gemini API key not configured. Go to Admin → API-Einstellungen.')
  }

  const prompt = buildPrompt(params)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeySetting.value}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          maxOutputTokens: 1024
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Parse content and hashtags from response
  const hashtagMatch = text.match(/#[\wäöüÄÖÜß]+/g)
  const hashtags = hashtagMatch ? hashtagMatch.join(' ') : '#Bereifung24 #Reifen #Werkstatt'
  const content = text.replace(/#[\wäöüÄÖÜß]+/g, '').trim()

  return { content, hashtags }
}

function buildPrompt(params: ContentGenerationParams): string {
  const baseInstructions = `Du bist der Social-Media-Manager von Bereifung24, einer Plattform die Kunden mit Reifenwerkstätten verbindet. 
Schreibe einen Social-Media-Post auf Deutsch. Sei professionell aber freundlich. 
Verwende passende Emojis. Generiere am Ende passende Hashtags.
Plattform: ${params.platform || 'Facebook/Instagram'}`

  switch (params.postType) {
    case 'PARTNER_INTRO':
      return `${baseInstructions}

Schreibe einen Willkommens-Post für eine neue Partnerwerkstatt:
- Werkstattname: ${params.workshopName || 'Neue Werkstatt'}
- Stadt: ${params.city || 'Deutschland'}
- Services: ${params.services?.join(', ') || 'Reifenwechsel, Reifeneinlagerung'}

Der Post soll die Werkstatt willkommen heißen und die Partnerschaft hervorheben. Max 200 Wörter.`

    case 'TIRE_TIP':
      return `${baseInstructions}

Schreibe einen nützlichen Saisontipp über Reifen. Aktuelle Saison berücksichtigen.
- Thema: Wann sollte man Reifen wechseln, Profiltiefe, Reifenpflege, etc.
- Sei informativ und hilfreich. Max 150 Wörter.`

    case 'BLOG_PROMO':
      return `${baseInstructions}

Bewerbe einen neuen Blog-Artikel:
- Titel: ${params.blogTitle || 'Neuer Artikel'}
- Zusammenfassung: ${params.blogExcerpt || ''}

Schreibe einen kurzen, neugierig machenden Post der zum Lesen animiert. Max 100 Wörter.`

    case 'REVIEW_HIGHLIGHT':
      return `${baseInstructions}

Stelle eine top-bewertete Werkstatt vor:
- Werkstattname: ${params.workshopName || 'Top Werkstatt'}
- Stadt: ${params.city || 'Deutschland'}
- Bewertung: ${params.rating || 5}/5 Sterne

Schreibe einen Post der die Qualität hervorhebt. Max 120 Wörter.`

    case 'STATS':
      return `${baseInstructions}

Erstelle einen Statistik-Post über das Wachstum von Bereifung24.
Nutze beeindruckende Formulierungen. Max 100 Wörter.`

    case 'OFFER':
      return `${baseInstructions}

Erstelle einen Aktions-Post für ein Sonderangebot oder eine Coupon-Kampagne.
Sei aufmerksamkeitsstark und erstelle einen Call-to-Action. Max 120 Wörter.`

    default:
      return `${baseInstructions}

${params.customPrompt || 'Erstelle einen allgemeinen Post über Bereifung24. Max 150 Wörter.'}`
  }
}

/**
 * Fill a template with variables
 */
export function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

/**
 * Handle automation trigger — creates a post when an event fires
 */
export async function handleAutomationTrigger(
  trigger: SocialMediaTrigger,
  variables: Record<string, string>
) {
  // Find active automations for this trigger
  const automations = await prisma.socialMediaAutomation.findMany({
    where: { trigger, isActive: true },
    include: { template: true }
  })

  const results = []

  for (const automation of automations) {
    try {
      // Fill template with variables
      const content = fillTemplate(automation.template.textTemplate, variables)

      // Get active accounts for the automation platforms
      const platforms = (automation.platforms as string[]) || []
      const accounts = await prisma.socialMediaAccount.findMany({
        where: {
          platform: { in: platforms as any },
          isActive: true
        }
      })

      if (accounts.length === 0) continue

      // Create post
      const post = await prisma.socialMediaPost.create({
        data: {
          title: `Auto: ${automation.name}`,
          content,
          postType: automation.template.postType,
          status: automation.autoPublish ? 'SCHEDULED' : 'DRAFT',
          scheduledAt: automation.autoPublish ? new Date() : null,
          templateId: automation.template.id,
          automationId: automation.id,
          platforms: {
            create: accounts.map((account: { id: string }) => ({
              accountId: account.id,
              status: automation.autoPublish ? 'SCHEDULED' : 'DRAFT' as any
            }))
          }
        }
      })

      // Update last triggered
      await prisma.socialMediaAutomation.update({
        where: { id: automation.id },
        data: { lastTriggeredAt: new Date() }
      })

      results.push({ automationId: automation.id, postId: post.id, status: 'created' })
    } catch (error) {
      console.error(`Automation ${automation.id} failed:`, error)
      results.push({ automationId: automation.id, status: 'error', error: String(error) })
    }
  }

  return results
}

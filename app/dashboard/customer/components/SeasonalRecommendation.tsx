'use client'

import { useRouter } from 'next/navigation'

export default function SeasonalRecommendation() {
  const router = useRouter()
  const month = new Date().getMonth() + 1 // 1-12

  const getSeasonalContent = () => {
    // March-April: Summer tire season starts
    if (month >= 3 && month <= 4) {
      return {
        icon: '☀️',
        title: 'Sommerreifen-Saison startet',
        text: 'Jetzt Wunschtermin sichern, bevor die Werkstätten ausgebucht sind',
        ctaText: 'Reifenservice buchen',
        ctaLink: '/home',
        gradientFrom: 'from-amber-50 dark:from-amber-900/20',
        gradientTo: 'to-orange-50 dark:to-orange-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        textColor: 'text-amber-800 dark:text-amber-300',
        ctaBg: 'bg-amber-600 hover:bg-amber-700'
      }
    }

    // September-October: Winter tire season starts
    if (month >= 9 && month <= 10) {
      return {
        icon: '❄️',
        title: 'Winterreifen-Saison startet',
        text: 'Jetzt rechtzeitig wechseln – sicher durch Herbst und Winter',
        ctaText: 'Reifenservice buchen',
        ctaLink: '/home',
        gradientFrom: 'from-blue-50 dark:from-blue-900/20',
        gradientTo: 'to-indigo-50 dark:to-indigo-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        textColor: 'text-blue-800 dark:text-blue-300',
        ctaBg: 'bg-blue-600 hover:bg-blue-700'
      }
    }

    // May-August: Summer tip
    if (month >= 5 && month <= 8) {
      return {
        icon: '🔧',
        title: 'Tipp: Reifendruck prüfen',
        text: 'Prüfen Sie regelmäßig Ihren Reifendruck – spart Sprit und erhöht die Sicherheit',
        ctaText: 'Reifenservice buchen',
        ctaLink: '/home',
        gradientFrom: 'from-green-50 dark:from-green-900/20',
        gradientTo: 'to-emerald-50 dark:to-emerald-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        iconBg: 'bg-green-100 dark:bg-green-900/40',
        textColor: 'text-green-800 dark:text-green-300',
        ctaBg: 'bg-green-600 hover:bg-green-700'
      }
    }

    // November-February: Winter tip
    return {
      icon: '🔍',
      title: 'Tipp: Profiltiefe prüfen',
      text: 'Überprüfen Sie die Profiltiefe Ihrer Winterreifen – mindestens 4mm sind empfohlen',
      ctaText: 'Reifenservice buchen',
      ctaLink: '/home',
      gradientFrom: 'from-slate-50 dark:from-slate-900/20',
      gradientTo: 'to-gray-50 dark:to-gray-900/20',
      borderColor: 'border-slate-200 dark:border-slate-800',
      iconBg: 'bg-slate-100 dark:bg-slate-900/40',
      textColor: 'text-slate-800 dark:text-slate-300',
      ctaBg: 'bg-slate-600 hover:bg-slate-700'
    }
  }

  const content = getSeasonalContent()

  return (
    <div className={`bg-gradient-to-r ${content.gradientFrom} ${content.gradientTo} rounded-lg border ${content.borderColor} p-5`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${content.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-2xl">{content.icon}</span>
          </div>
          <div>
            <h3 className={`font-bold ${content.textColor} text-base`}>
              {content.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {content.text}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(content.ctaLink)}
          className={`${content.ctaBg} text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm whitespace-nowrap flex-shrink-0`}
        >
          {content.ctaText}
        </button>
      </div>
    </div>
  )
}

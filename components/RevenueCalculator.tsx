'use client'

import { useState, useEffect } from 'react'

export default function RevenueCalculator() {
  const [revenue, setRevenue] = useState(560000)
  const [percentage, setPercentage] = useState(15)
  const [animatedRevenue, setAnimatedRevenue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const additionalRevenue = revenue * (percentage / 100)
  const commissionRate = 0.069
  const commission = additionalRevenue * commissionRate

  // Animate the result number
  useEffect(() => {
    if (!isVisible) return
    const target = additionalRevenue
    const duration = 800
    const startTime = Date.now()
    const startValue = animatedRevenue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedRevenue(Math.round(startValue + (target - startValue) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [additionalRevenue, isVisible])

  // Intersection observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.3 }
    )
    const el = document.getElementById('revenue-calculator')
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <section id="revenue-calculator" className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden relative">
      {/* Subtle animated background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className={`mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block mb-4 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold tracking-wider uppercase text-primary-300">
              Ihr Umsatz-Potenzial
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Was bringt Ihnen Bereifung24?
            </h2>
          </div>

          {/* Calculator Card */}
          <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-10 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-center text-gray-300 mb-8 text-lg">
              Berechnen Sie, wie viel Mehrumsatz Bereifung24 Ihrer Werkstatt bringen kann.
            </p>

            {/* Input: Jahresumsatz */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Ihr Jahresumsatz (€)</label>
              <input
                type="text"
                value={formatCurrency(revenue)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setRevenue(Number(raw) || 0)
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-gray-500"
                placeholder="z.B. 560.000"
              />
            </div>

            {/* Input: Anteil */}
            <div className="mb-10">
              <label className="block text-sm text-gray-400 mb-2">Anteil über Bereifung24 (%)</label>
              <input
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                min={0}
                max={100}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all placeholder-gray-500"
                placeholder="z.B. 15"
              />
              {/* Slider */}
              <input
                type="range"
                min={1}
                max={50}
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full mt-3 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Result */}
            <div className={`bg-gradient-to-r from-primary-900/50 to-primary-800/30 border border-primary-500/20 rounded-2xl p-8 text-center transition-all duration-500 ${isVisible ? 'scale-100' : 'scale-95'}`}>
              <p className="text-gray-300 mb-2 text-lg">
                Zusätzliche Kunden-Aufträge pro Jahr über Bereifung24
              </p>
              <p className="text-5xl md:text-6xl font-extrabold text-white mb-4 tabular-nums tracking-tight">
                {formatCurrency(animatedRevenue)}&nbsp;€
              </p>
              <p className="text-gray-400 text-sm">
                Davon gehen nur <span className="text-primary-300 font-semibold">{formatCurrency(Math.round(commission))} € ({(commissionRate * 100).toFixed(1).replace('.', ',')}%)</span> an Bereifung24 – inkl. aller Zahlungsgebühren.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

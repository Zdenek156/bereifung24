'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Custom hook for scroll-triggered visibility detection.
 * Uses IntersectionObserver with single-fire (once) behavior.
 */
export function useScrollReveal(threshold = 0.1): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element) // only fire once
        }
      },
      { threshold }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, isVisible]
}

/**
 * Custom hook for count-up animation.
 * Counts from 0 to target value over duration (ms) at 60fps.
 * Returns current display value.
 */
export function useCountUp(
  target: number,
  isActive: boolean,
  duration = 2000,
  decimals = 0
): string {
  const [current, setCurrent] = useState(0)
  const frameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isActive || hasAnimated.current) return
    hasAnimated.current = true

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutQuart(progress)
      
      setCurrent(easedProgress * target)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        setCurrent(target)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [isActive, target, duration])

  return current.toFixed(decimals)
}

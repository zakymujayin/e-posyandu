"use client"

import React, { useEffect, useRef } from "react"

interface Props {
  children: React.ReactNode
  className?: string
  delay?: 0 | 1 | 2 | 3 | 4
  as?: React.ElementType
}

export function AnimateOnScroll({ children, className = "", delay = 0, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible")
          observer.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const delayClass = delay > 0 ? `animate-on-scroll-delay-${delay}` : ""

  return (
    <Tag ref={ref} className={`animate-on-scroll ${delayClass} ${className}`}>
      {children}
    </Tag>
  )
}

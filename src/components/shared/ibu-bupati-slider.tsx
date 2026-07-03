"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ImageOff, ChevronLeft, ChevronRight } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { cn } from "@/lib/utils"

export type Slide = {
  url: string
  alt: string
  caption?: string
}

interface IbuBupatiSliderProps {
  variant: "hero" | "login"
  slides?: Slide[]
  defaultSlide?: Slide
  className?: string
}

function SlideImage({ slide, isHero, priority }: { slide: Slide; isHero: boolean; priority: boolean }) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className={cn(
        "relative aspect-[3/4] w-full flex items-center justify-center",
        isHero ? "bg-slate-100" : "bg-white/5",
      )}>
        <div className="flex flex-col items-center gap-2">
          <ImageOff className={cn("size-8", isHero ? "text-slate-300" : "text-white/20")} />
          <span className={cn("text-xs font-medium", isHero ? "text-slate-400" : "text-white/30")}>
            Foto tidak tersedia
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-[3/4] w-full">
      <Image
        src={slide.url}
        alt={slide.alt}
        fill
        className="object-contain"
        sizes={isHero ? "(max-width: 640px) 320px, (max-width: 768px) 384px, 400px" : "(max-width: 640px) 320px, 350px"}
        priority={priority}
        onError={() => setHasError(true)}
      />
    </div>
  )
}

export function IbuBupatiSlider({ variant, slides: slidesProp, defaultSlide, className }: IbuBupatiSliderProps) {
  // Foto default (Ibu Ketua TP PKK) selalu tampil paling depan, lalu diikuti
  // foto tambahan dari admin — agar tidak pernah tertimpa/hilang.
  const slides = defaultSlide ? [defaultSlide, ...(slidesProp ?? [])] : (slidesProp ?? [])

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: slides.length > 1 },
    [Autoplay({ delay: 15000, stopOnInteraction: false, stopOnMouseEnter: true })],
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const snapList = emblaApi.scrollSnapList()
    const current = emblaApi.selectedScrollSnap()
    queueMicrotask(() => {
      setScrollSnaps(snapList)
      setSelectedIndex(current)
    })
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const showDots = scrollSnaps.length > 1

  const isHero = variant === "hero"

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <div className={cn("w-full", isHero ? "max-w-md mx-auto lg:mx-0" : "max-w-sm mx-auto", className)}>
      <div className="relative group">
        {isHero ? (
          <div className="overflow-hidden rounded-2xl border-4 border-white shadow-2xl">
            <div ref={emblaRef}>
              <div className="flex">
                {slides.map((slide, i) => (
                  <div key={i} className="flex-[0_0_100%] min-w-0">
                    <SlideImage slide={slide} isHero={isHero} priority={i === 0} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute -inset-4 rounded-[28px] pointer-events-none"
              style={{ background: "radial-gradient(ellipse 70% 50% at 50% 50%, oklch(0.60 0.20 215 / 0.18) 0%, transparent 70%)" }}
            />
            <div className="overflow-hidden rounded-2xl border-2 border-white/20 shadow-lg relative">
              <div ref={emblaRef}>
                <div className="flex">
                  {slides.map((slide, i) => (
                    <div key={i} className="flex-[0_0_100%] min-w-0">
                      <SlideImage slide={slide} isHero={isHero} priority={i === 0} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {isHero && (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110",
                isHero
                  ? "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-slate-900"
                  : "bg-white/15 backdrop-blur-sm text-white hover:bg-white/30",
              )}
              aria-label="Slide sebelumnya"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-10 size-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110",
                isHero
                  ? "bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white hover:text-slate-900"
                  : "bg-white/15 backdrop-blur-sm text-white hover:bg-white/30",
              )}
              aria-label="Slide berikutnya"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {(slides[selectedIndex]?.caption || slides[selectedIndex]?.alt) && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10">
            <div className="px-4 py-3"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
              }}
            >
              <p className="text-white text-sm font-medium drop-shadow-sm text-center">
                {slides[selectedIndex]?.caption || slides[selectedIndex]?.alt}
              </p>
            </div>
          </div>
        )}
      </div>

      {showDots && (
        <div className="flex justify-center gap-2 mt-4">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                isHero
                  ? cn(
                      "size-2",
                      i === selectedIndex ? "bg-blue-600 w-6" : "bg-slate-300 hover:bg-slate-400",
                    )
                  : cn(
                      "size-2",
                      i === selectedIndex ? "bg-white w-6" : "bg-white/30 hover:bg-white/50",
                    ),
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, Crosshair, Trash2, ChevronDown, ChevronUp, Navigation } from "lucide-react"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { MutedText } from "@/components/ui/typography"

interface Props {
  value: { lat: number; lng: number } | null
  onChange: (loc: { lat: number; lng: number } | null) => void
}

export function LocationPicker({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [gettingLoc, setGettingLoc] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerInstance = useRef<L.Marker | null>(null)
  const LRef = useRef<typeof import("leaflet") | null>(null)

  useEffect(() => {
    if (!expanded || !mapRef.current) return

    async function init() {
      const L = await import("leaflet")
      LRef.current = L

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      if (!mapInstance.current) {
        const map = L.map(mapRef.current!).setView(
          value ? [value.lat, value.lng] : [-6.5644, 106.2522],
          13,
        )

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map)

        if (value) {
          createMarker(L, map, value.lat, value.lng)
        }

        map.on("click", (e: L.LeafletMouseEvent) => {
          upsertMarker(L, map, e.latlng.lat, e.latlng.lng)
          onChange({ lat: e.latlng.lat, lng: e.latlng.lng })
        })

        mapInstance.current = map
        setTimeout(() => map.invalidateSize(), 200)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded])

  function createMarker(L: typeof import("leaflet"), map: L.Map, lat: number, lng: number) {
    if (markerInstance.current) {
      markerInstance.current.setLatLng([lat, lng])
      return markerInstance.current
    }
    markerInstance.current = L.marker([lat, lng], { draggable: true })
      .addTo(map)
      .on("dragend", () => {
        const pos = markerInstance.current!.getLatLng()
        onChange({ lat: pos.lat, lng: pos.lng })
      })
    return markerInstance.current
  }

  function upsertMarker(L: typeof import("leaflet"), map: L.Map, lat: number, lng: number) {
    if (markerInstance.current) {
      markerInstance.current.setLatLng([lat, lng])
    } else if (mapInstance.current) {
      markerInstance.current = L.marker([lat, lng], { draggable: true })
        .addTo(map)
        .on("dragend", () => {
          const pos = markerInstance.current!.getLatLng()
          onChange({ lat: pos.lat, lng: pos.lng })
        })
    }
  }

  function handleGetLocation() {
    if (!navigator.geolocation) return
    setGettingLoc(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        onChange(loc)
        if (mapInstance.current && LRef.current) {
          mapInstance.current.setView([loc.lat, loc.lng], 15)
          upsertMarker(LRef.current, mapInstance.current, loc.lat, loc.lng)
        }
        setGettingLoc(false)
      },
      () => setGettingLoc(false),
    )
  }

  function handleRemove() {
    onChange(null)
    if (markerInstance.current) {
      markerInstance.current.remove()
      markerInstance.current = null
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => setExpanded(!expanded)}
        className="rounded-lg font-bold gap-2"
      >
        <MapPin className="size-4" />
        {expanded ? "Sembunyikan Peta" : value ? "Ubah Lokasi" : "📍 Tambah Lokasi (Opsional)"}
        {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </Button>

      {expanded && (
        <div className="space-y-3 border border-border rounded-lg p-3 bg-card">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleGetLocation}
              disabled={gettingLoc}
              className="rounded-lg font-bold gap-1.5 text-xs"
            >
              <Crosshair className="size-3.5" />
              {gettingLoc ? "Mendapatkan..." : "Gunakan Lokasi Saya"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="rounded-lg font-bold gap-1.5 text-xs text-destructive"
              >
                <Trash2 className="size-3.5" />
                Hapus Lokasi
              </Button>
            )}
          </div>

          <div ref={mapRef} className="w-full h-56 rounded-lg border border-border z-0" />

          {value && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
              <Navigation className="size-3.5 shrink-0" />
              <span className="font-mono">
                {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
              </span>
              <a
                href={`https://www.google.com/maps?q=${value.lat},${value.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-primary font-semibold hover:underline"
              >
                Buka Maps
              </a>
            </div>
          )}

          <MutedText className="italic leading-normal text-xs">
            * Opsional. Klik peta untuk menandai lokasi, atau gunakan tombol &ldquo;Gunakan Lokasi Saya&rdquo; untuk mengisi otomatis.
          </MutedText>
        </div>
      )}
    </div>
  )
}

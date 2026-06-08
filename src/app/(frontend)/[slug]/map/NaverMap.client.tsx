'use client'

import type { CenterLocation } from '@/lib/centerLocations'

import { useEffect, useRef, useState } from 'react'

type NaverLatLng = {
  x?: number
  y?: number
}

type NaverMapInstance = {
  panTo: (latlng: NaverLatLng) => void
  setCenter: (latlng: NaverLatLng) => void
  setZoom: (zoom: number) => void
}

type NaverMarker = {
  setMap: (map: NaverMapInstance | null) => void
  setPosition: (latlng: NaverLatLng) => void
}

type NaverInfoWindow = {
  open: (map: NaverMapInstance, marker: NaverMarker) => void
  setContent: (content: string) => void
}

type NaverMapsNamespace = {
  Event: {
    addListener: (target: NaverMarker, eventName: string, listener: () => void) => void
  }
  InfoWindow: new (options: { borderWidth?: number; content: string }) => NaverInfoWindow
  LatLng: new (lat: number, lng: number) => NaverLatLng
  Map: new (
    element: HTMLElement,
    options: {
      center: NaverLatLng
      mapDataControl?: boolean
      scaleControl?: boolean
      zoom: number
      zoomControl?: boolean
    },
  ) => NaverMapInstance
  Marker: new (options: {
    icon?: {
      anchor?: NaverLatLng
      content?: string
    }
    map: NaverMapInstance
    position: NaverLatLng
    title?: string
  }) => NaverMarker
  Point: new (x: number, y: number) => NaverLatLng
}

declare global {
  interface Window {
    naver?: {
      maps: NaverMapsNamespace
    }
    naverMapsScriptPromise?: Promise<void>
  }
}

type NaverMapProps = {
  location: CenterLocation
  scriptUrl: string | null
}

export function NaverMap({ location, scriptUrl }: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<NaverMapInstance | null>(null)
  const markerRef = useRef<NaverMarker | null>(null)
  const infoWindowRef = useRef<NaverInfoWindow | null>(null)
  const [loadResult, setLoadResult] = useState<'ready' | 'error' | null>(null)
  const status = !scriptUrl ? 'missing-key' : (loadResult ?? 'loading')

  useEffect(() => {
    let isActive = true

    if (!scriptUrl) {
      return
    }

    loadNaverMaps(scriptUrl)
      .then(() => {
        if (!isActive || !containerRef.current || !window.naver) return

        const maps = window.naver.maps
        const center = new maps.LatLng(location.coordinates.lat, location.coordinates.lng)

        if (!mapRef.current) {
          mapRef.current = new maps.Map(containerRef.current, {
            center,
            mapDataControl: false,
            scaleControl: false,
            zoom: 16,
            zoomControl: true,
          })
        }

        const map = mapRef.current

        map.setZoom(16)
        map.panTo(center)

        if (!markerRef.current) {
          markerRef.current = new maps.Marker({
            icon: {
              anchor: new maps.Point(18, 42),
              content: '<span class="map-page__naver-marker" aria-hidden="true"></span>',
            },
            map,
            position: center,
            title: location.name,
          })
        } else {
          markerRef.current.setPosition(center)
          markerRef.current.setMap(map)
        }

        const infoContent = mapInfoWindowContent(location)

        if (!infoWindowRef.current) {
          infoWindowRef.current = new maps.InfoWindow({
            borderWidth: 0,
            content: infoContent,
          })
        } else {
          infoWindowRef.current.setContent(infoContent)
        }

        infoWindowRef.current.open(map, markerRef.current)
        setLoadResult('ready')
      })
      .catch(() => {
        if (isActive) setLoadResult('error')
      })

    return () => {
      isActive = false
    }
  }, [location, scriptUrl])

  return (
    <div className="relative min-h-[420px] overflow-hidden bg-black md:min-h-[586px]">
      <div ref={containerRef} className="h-[420px] w-full md:h-[586px]" />
      {status === 'loading' ? (
        <MapStatus>지도를 불러오는 중입니다.</MapStatus>
      ) : null}
      {status === 'missing-key' ? (
        <MapStatus>네이버 지도 API 키가 설정되지 않았습니다.</MapStatus>
      ) : null}
      {status === 'error' ? (
        <MapStatus>지도를 불러오지 못했습니다. 아래 주소를 확인해 주세요.</MapStatus>
      ) : null}
    </div>
  )
}

function MapStatus({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black text-center text-sm font-semibold text-white/70">
      {children}
    </div>
  )
}

function loadNaverMaps(scriptUrl: string) {
  if (window.naver?.maps) {
    return Promise.resolve()
  }

  if (!window.naverMapsScriptPromise) {
    window.naverMapsScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')

      script.async = true
      script.defer = true
      script.onerror = () => reject(new Error('Failed to load NAVER Maps script'))
      script.onload = () => resolve()
      script.src = scriptUrl

      document.head.appendChild(script)
    })
  }

  return window.naverMapsScriptPromise
}

function mapInfoWindowContent(location: CenterLocation) {
  return `
    <div class="map-page__info-window">
      <strong>${escapeHtml(location.name)}</strong>
      <span>${escapeHtml(location.address)}</span>
    </div>
  `
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

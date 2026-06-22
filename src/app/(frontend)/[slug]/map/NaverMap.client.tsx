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
}

type NaverMapsNamespace = {
  Event: {
    addListener: (target: NaverMarker, eventName: string, listener: () => void) => void
  }
  LatLng: new (lat: number, lng: number) => NaverLatLng
  Map: new (
    element: HTMLElement,
    options: {
      center: NaverLatLng
      customStyleId?: string
      gl?: boolean
      logoControl?: boolean
      mapDataControl?: boolean
      mapTypeControl?: boolean
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
    zIndex?: number
  }) => NaverMarker
  Point: new (x: number, y: number) => NaverLatLng
}

declare global {
  interface Window {
    naver?: {
      maps: NaverMapsNamespace
    }
    naverMapsGlScriptPromise?: Promise<void>
    naverMapsScriptPromise?: Promise<void>
  }
}

type NaverMapProps = {
  location: CenterLocation
  locations: CenterLocation[]
  scriptUrl: string | null
}

const naverMapCustomStyleId = 'c4300a1b-6d48-49cd-8316-c3a91a0a7aa0'
const sameCoordinateMarkerOffset = 0.00002

export function NaverMap({ location, locations, scriptUrl }: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<NaverMapInstance | null>(null)
  const markersRef = useRef<NaverMarker[]>([])
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
          mapRef.current = new maps.Map(containerRef.current, mapOptions(center))
        }

        const map = mapRef.current

        map.setZoom(17)
        map.panTo(center)

        markersRef.current.forEach((marker) => marker.setMap(null))
        markersRef.current = locations.map((centerLocation) => {
          const isActive = centerLocation.slug === location.slug
          const markerPosition = markerPositionFor(centerLocation, locations)

          return new maps.Marker({
            icon: {
              anchor: isActive ? new maps.Point(132, 92) : new maps.Point(52, 18),
              content: mapMarkerContent(centerLocation, isActive),
            },
            map,
            position: new maps.LatLng(markerPosition.lat, markerPosition.lng),
            title: isActive ? centerLocation.name : undefined,
            zIndex: isActive ? 1000 : 100,
          })
        })

        setLoadResult('ready')
      })
      .catch(() => {
        if (isActive) setLoadResult('error')
      })

    return () => {
      isActive = false
    }
  }, [location, locations, scriptUrl])

  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null))
    }
  }, [])

  return (
    <div className="relative z-0 min-h-[420px] overflow-hidden bg-black md:min-h-[586px]">
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

function mapOptions(center: NaverLatLng) {
  const options: ConstructorParameters<NaverMapsNamespace['Map']>[1] = {
    center,
    customStyleId: naverMapCustomStyleId,
    gl: true,
    logoControl: true,
    mapDataControl: false,
    mapTypeControl: false,
    scaleControl: false,
    zoom: 17,
    zoomControl: true,
  }

  return options
}

function MapStatus({ children }: { children: React.ReactNode }) {
  return (
        <div className="absolute inset-0 grid place-items-center bg-black text-center type-label-m font-semibold text-white/70">
      {children}
    </div>
  )
}

function loadNaverMaps(scriptUrl: string) {
  if (window.naver?.maps) {
    return loadNaverMapsGl()
  }

  if (!window.naverMapsScriptPromise) {
    window.naverMapsScriptPromise = new Promise((resolve, reject) => {
      appendScript(scriptUrl, resolve, () => reject(new Error('Failed to load NAVER Maps script')))
    })
  }

  return window.naverMapsScriptPromise.then(loadNaverMapsGl)
}

function loadNaverMapsGl() {
  if (!window.naverMapsGlScriptPromise) {
    window.naverMapsGlScriptPromise = new Promise((resolve, reject) => {
      appendScript(
        'https://oapi.map.naver.com/openapi/v3/maps-gl.js',
        resolve,
        () => reject(new Error('Failed to load NAVER Maps GL script')),
      )
    })
  }

  return window.naverMapsGlScriptPromise
}

function appendScript(src: string, onLoad: () => void, onError: () => void) {
  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)

  if (existingScript) {
    onLoad()
    return
  }

  const script = document.createElement('script')

  script.async = true
  script.defer = true
  script.onerror = onError
  script.onload = onLoad
  script.src = src

  document.head.appendChild(script)
}

function markerPositionFor(location: CenterLocation, locations: CenterLocation[]) {
  const sameCoordinateLocations = locations.filter((candidate) =>
    sameCoordinate(candidate, location),
  )

  if (sameCoordinateLocations.length === 1) {
    return location.coordinates
  }

  const groupIndex = sameCoordinateLocations.findIndex((candidate) => candidate.slug === location.slug)
  const angle = (Math.PI * 2 * groupIndex) / sameCoordinateLocations.length - Math.PI / 2
  const radius = sameCoordinateMarkerOffset

  return {
    lat: location.coordinates.lat + Math.sin(angle) * radius,
    lng: location.coordinates.lng + Math.cos(angle) * radius,
  }
}

function sameCoordinate(a: CenterLocation, b: CenterLocation) {
  return a.coordinates.lat === b.coordinates.lat && a.coordinates.lng === b.coordinates.lng
}

function mapMarkerContent(location: CenterLocation, isActive: boolean) {
  return `
    <div class="map-page__naver-marker" data-active="${isActive ? 'true' : 'false'}" data-center="${location.slug}" aria-hidden="true">
      ${
        isActive
          ? `<div class="map-page__naver-marker-card">
              <strong class="type-title-m font-extrabold leading-[1.2]">${escapeHtml(location.label)}</strong>
              <span class="type-label-s leading-[1.35]">${escapeHtml(location.address)}</span>
            </div>`
          : ''
      }
      <span class="map-page__naver-marker-pin"></span>
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

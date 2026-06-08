'use client'

import type { CenterLocation } from '@/lib/centerLocations'

import { centerLocationList } from '@/lib/centerLocations'
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

type NaverLayer = {
  setMap: (map: NaverMapInstance | null) => void
}

type NaverMapsNamespace = {
  Event: {
    addListener: (target: NaverMarker, eventName: string, listener: () => void) => void
  }
  LabelLayer?: new () => NaverLayer
  LatLng: new (lat: number, lng: number) => NaverLatLng
  Map: new (
    element: HTMLElement,
    options: {
      center: NaverLatLng
      logoControl?: boolean
      mapDataControl?: boolean
      mapTypeControl?: boolean
      mapTypeId?: string
      mapTypes?: unknown
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
  MapTypeRegistry?: new (mapTypes: Record<string, unknown>) => unknown
  NaverStyleMapTypeOptions?: {
    getVectorMap?: () => unknown
  }
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
  const labelLayerRef = useRef<NaverLayer | null>(null)
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
          mapRef.current = new maps.Map(containerRef.current, mapOptions(maps, center))

          if (maps.LabelLayer) {
            labelLayerRef.current = new maps.LabelLayer()
            labelLayerRef.current.setMap(mapRef.current)
          }
        }

        const map = mapRef.current

        map.setZoom(17)
        map.panTo(center)

        markersRef.current.forEach((marker) => marker.setMap(null))
        markersRef.current = centerLocationList.map((centerLocation, index) => {
          const isActive = centerLocation.slug === location.slug
          const markerPosition = markerPositionFor(centerLocation, index)

          return new maps.Marker({
            icon: {
              anchor: isActive ? new maps.Point(132, 92) : new maps.Point(52, 46),
              content: mapMarkerContent(centerLocation, isActive),
            },
            map,
            position: new maps.LatLng(markerPosition.lat, markerPosition.lng),
            title: centerLocation.name,
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
  }, [location, scriptUrl])

  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null))
      labelLayerRef.current?.setMap(null)
    }
  }, [])

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

function mapOptions(maps: NaverMapsNamespace, center: NaverLatLng) {
  const options: ConstructorParameters<NaverMapsNamespace['Map']>[1] = {
    center,
    logoControl: true,
    mapDataControl: false,
    mapTypeControl: false,
    scaleControl: false,
    zoom: 17,
    zoomControl: true,
  }

  if (maps.MapTypeRegistry && maps.NaverStyleMapTypeOptions?.getVectorMap) {
    options.mapTypeId = 'bnb-map'
    options.mapTypes = new maps.MapTypeRegistry({
      'bnb-map': maps.NaverStyleMapTypeOptions.getVectorMap(),
    })
  }

  return options
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

function markerPositionFor(location: CenterLocation, index: number) {
  const sameCoordinateLocations = centerLocationList.filter((candidate) =>
    sameCoordinate(candidate, location),
  )

  if (sameCoordinateLocations.length === 1) {
    return location.coordinates
  }

  const groupIndex = sameCoordinateLocations.findIndex((candidate) => candidate.slug === location.slug)
  const angle = (Math.PI * 2 * groupIndex) / sameCoordinateLocations.length - Math.PI / 2
  const radius = 0.00009 + index * 0.000005

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
    <div class="map-page__naver-marker" data-active="${isActive ? 'true' : 'false'}" aria-hidden="true">
      <div class="map-page__naver-marker-card">
        <span class="map-page__naver-marker-eyebrow">현재 선택</span>
        <strong>${escapeHtml(location.label)}</strong>
        <span>${escapeHtml(location.address)}</span>
      </div>
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

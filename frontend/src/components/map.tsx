"use client"

import React from "react"
import { useEffect, useRef, useState, useCallback } from "react"
import type { Toilet } from "../types/index"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Navigation, MapPin, X, Plus, Minus } from "lucide-react"
import { GeolocationHandler } from "./GeolocationHandler"

interface MapProps {
  toilets: Toilet[]
}

// Константы для проекции Меркатора
const TILE_SIZE = 256
const EARTH_RADIUS = 6378137
const ORIGIN_SHIFT = 2 * Math.PI * EARTH_RADIUS / 2

// Преобразование широты и долготы в метры (проекция Меркатора)
const latLonToMeters = (lat: number, lon: number) => {
  const mx = (lon * ORIGIN_SHIFT) / 180
  const my = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)
  return { x: mx, y: (my * ORIGIN_SHIFT) / 180 }
}

// Преобразование метров в широту и долготу
const metersToLatLon = (mx: number, my: number) => {
  const lon = (mx / ORIGIN_SHIFT) * 180
  const lat = (my / ORIGIN_SHIFT) * 180
  return { lat: (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2), lon }
}

// Преобразование метров в пиксели
const metersToPixels = (mx: number, my: number, zoom: number) => {
  const res = (2 * Math.PI * EARTH_RADIUS) / (TILE_SIZE * Math.pow(2, zoom))
  return { x: (mx + ORIGIN_SHIFT) / res, y: (ORIGIN_SHIFT - my) / res }
}

// Преобразование пикселей в метры
const pixelsToMeters = (px: number, py: number, zoom: number) => {
  const res = (2 * Math.PI * EARTH_RADIUS) / (TILE_SIZE * Math.pow(2, zoom))
  return { x: px * res - ORIGIN_SHIFT, y: ORIGIN_SHIFT - py * res }
}

export function Map({ toilets }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [center, setCenter] = useState<{ lat: number; lon: number }>({ lat: 54.710, lon: 20.511 }) // Калининград по умолчанию
  const [zoom, setZoom] = useState(13)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragStartCenter, setDragStartCenter] = useState<{ lat: number; lon: number } | null>(null)
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null)

  // Обработчик обновления местоположения
  const handleLocationUpdate = useCallback((lat: number, lon: number) => {
    const newLocation = { lat, lon }
    setUserLocation(newLocation)
    setCenter(newLocation)
  }, [])

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    setDragStart({ x: clientX, y: clientY })
    setDragStartCenter({ lat: center.lat, lon: center.lon })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragStart || !dragStartCenter) return

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY

      const dx = clientX - dragStart.x
      const dy = clientY - dragStart.y

      const startMeters = latLonToMeters(dragStartCenter.lat, dragStartCenter.lon)
      const res = (2 * Math.PI * EARTH_RADIUS) / (TILE_SIZE * Math.pow(2, zoom))

      const newCenterMeters = {
        x: startMeters.x - dx * res,
        y: startMeters.y + dy * res,
      }

      const newCenter = metersToLatLon(newCenterMeters.x, newCenterMeters.y)
      setCenter(newCenter)
    },
    [isDragging, dragStart, dragStartCenter, zoom],
  )

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
    setDragStartCenter(null)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("touchmove", handleMouseMove)
      window.addEventListener("touchend", handleMouseUp)

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
        window.removeEventListener("touchmove", handleMouseMove)
        window.removeEventListener("touchend", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove])

  // Масштабирование
  const handleZoomIn = () => setZoom((z) => Math.min(18, z + 1))
  const handleZoomOut = () => setZoom((z) => Math.max(3, z - 1))

  // Центрирование на местоположении пользователя
  const centerOnUser = () => {
    if (userLocation) {
      setCenter(userLocation)
    }
  }

  // Рендеринг тайлов
  const renderTiles = () => {
    if (!containerRef.current) return null

    const containerWidth = containerRef.current.offsetWidth
    const containerHeight = containerRef.current.offsetHeight

    const centerMeters = latLonToMeters(center.lat, center.lon)
    const centerPixels = metersToPixels(centerMeters.x, centerMeters.y, zoom)

    const tilesX = Math.ceil(containerWidth / TILE_SIZE) + 2
    const tilesY = Math.ceil(containerHeight / TILE_SIZE) + 2

    const maxTileIndex = Math.pow(2, zoom) - 1 // Максимальный индекс тайла для текущего уровня масштабирования

    const tiles = []
    for (let x = -Math.floor(tilesX / 2); x <= Math.ceil(tilesX / 2); x++) {
      for (let y = -Math.floor(tilesY / 2); y <= Math.ceil(tilesY / 2); y++) {
        const tileX = Math.floor(centerPixels.x / TILE_SIZE) + x
        const tileY = Math.floor(centerPixels.y / TILE_SIZE) + y

        // Пропускаем тайлы, выходящие за границы
        if (tileX < 0 || tileY < 0 || tileX > maxTileIndex || tileY > maxTileIndex) {
          continue
        }

        const left = containerWidth / 2 + (tileX * TILE_SIZE - centerPixels.x)
        const top = containerHeight / 2 + (tileY * TILE_SIZE - centerPixels.y)

        tiles.push(
          <img
            key={`${zoom}-${tileX}-${tileY}`} // Добавлен zoom для уникальности ключа
            src={`https://a.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`}
            alt=""
            className="absolute"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${TILE_SIZE}px`,
              height: `${TILE_SIZE}px`,
            }}
          />,
        )
      }
    }

    return tiles
  }

  // Рендеринг маркеров
  const renderMarkers = () => {
    if (!containerRef.current) return null

    const containerWidth = containerRef.current.offsetWidth
    const containerHeight = containerRef.current.offsetHeight

    const centerMeters = latLonToMeters(center.lat, center.lon)
    const centerPixels = metersToPixels(centerMeters.x, centerMeters.y, zoom)

    return toilets.map((toilet) => {
      const toiletMeters = latLonToMeters(toilet.latitude, toilet.longitude)
      const toiletPixels = metersToPixels(toiletMeters.x, toiletMeters.y, zoom)

      const left = containerWidth / 2 + (toiletPixels.x - centerPixels.x)
      const top = containerHeight / 2 + (toiletPixels.y - centerPixels.y)

      // Не рендерим маркеры, которые далеко за пределами видимой области
      if (left < -50 || top < -50 || left > containerWidth + 50 || top > containerHeight + 50) {
        return null
      }

      const pinColor = toilet.type === 'free'
        ? "text-green-500"
        : toilet.type === 'paid'
          ? "text-red-500"
          : "text-yellow-500"

      return (
        <div
          key={toilet.id}
          className="absolute z-10 -translate-x-1/2 -translate-y-full transform cursor-pointer"
          style={{ left: `${left}px`, top: `${top}px` }}
          onClick={() => setSelectedToilet(toilet)}
        >
          <MapPin className={`h-8 w-8 ${pinColor}`} />
        </div>
      )
    })
  }

  // Рендеринг маркера пользователя
  const renderUserMarker = () => {
    if (!userLocation || !containerRef.current) return null

    const containerWidth = containerRef.current.offsetWidth
    const containerHeight = containerRef.current.offsetHeight

    const centerMeters = latLonToMeters(center.lat, center.lon)
    const centerPixels = metersToPixels(centerMeters.x, centerMeters.y, zoom)

    const userMeters = latLonToMeters(userLocation.lat, userLocation.lon)
    const userPixels = metersToPixels(userMeters.x, userMeters.y, zoom)

    const left = containerWidth / 2 + (userPixels.x - centerPixels.x)
    const top = containerHeight / 2 + (userPixels.y - centerPixels.y)

    return (
      <div
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transform"
        style={{ left: `${left}px`, top: `${top}px` }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          <div className="relative bg-blue-500 rounded-full p-2">
            <Navigation className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="relative h-full w-full">
        <div
          ref={containerRef}
          className="relative h-full w-full cursor-grab overflow-hidden rounded-lg bg-gray-200 active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {renderTiles()}
          {renderMarkers()}
          {renderUserMarker()}
        </div>

        {/* Карточка с информацией о туалете */}
        {selectedToilet && (
          <Card className="absolute bottom-4 left-1/2 z-30 w-80 -translate-x-1/2 transform shadow-lg">
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1">
                <CardTitle>{selectedToilet.name}</CardTitle>
                <p className="text-sm text-gray-600">{selectedToilet.address}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedToilet(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant={selectedToilet.type === 'free' ? "default" : "destructive"}>
                  {selectedToilet.type === 'free' ? "Бесплатно" : selectedToilet.price ? `${selectedToilet.price} ₽` : "Нужна покупка"}
                </Badge>
                {/* Дополнительная информация может быть добавлена здесь */}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Элементы управления картой */}
        <div className="absolute right-4 top-4 z-30 flex flex-col gap-2">
          {userLocation && (
            <Button size="icon" variant="secondary" onClick={centerOnUser} className="shadow-lg">
              <Navigation className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="secondary" onClick={handleZoomIn} className="shadow-lg">
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleZoomOut} className="shadow-lg">
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Обработчик геолокации */}
      <GeolocationHandler onLocationUpdate={handleLocationUpdate} />
    </>
  )
}
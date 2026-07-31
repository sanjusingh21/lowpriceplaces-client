"use client";

import React, { useEffect, useRef, useState } from "react";

export async function reverseGeocodeHighPrecision(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const landmark =
          data.name ||
          addr.hospital ||
          addr.amenity ||
          addr.building ||
          addr.shop ||
          addr.mall ||
          addr.school ||
          addr.place ||
          addr.house_number ||
          addr.attraction ||
          "";

        const road =
          addr.road ||
          addr.street ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.quarter ||
          addr.city_district ||
          "";

        const city = addr.city || addr.town || addr.village || addr.county || "";
        const state = addr.state || "";

        const parts = [];
        if (landmark && landmark.trim()) {
          const lLower = landmark.toLowerCase();
          if (
            lLower !== road.toLowerCase() &&
            lLower !== city.toLowerCase()
          ) {
            parts.push(`Near ${landmark.trim()}`);
          }
        }
        if (road && road.trim()) {
          parts.push(road.trim());
        }
        if (city && city.trim()) {
          parts.push(city.trim());
        }
        if (state && state.trim()) {
          parts.push(state.trim());
        }

        const fullAddress = parts.filter(Boolean).join(", ");
        if (fullAddress) {
          return fullAddress;
        }
      }
    }
  } catch (err) {
    console.error("High-precision reverse geocode error:", err);
  }

  return null;
}

export default function LocationPickerMap({
  location,
  latitude,
  longitude,
  onLocationChange,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [detecting, setDetecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const defaultLat = latitude ? parseFloat(latitude) : 17.385;
  const defaultLng = longitude ? parseFloat(longitude) : 78.4867;

  useEffect(() => {
    // Load Leaflet CSS & JS dynamically
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const jsId = "leaflet-js";
    let isMounted = true;

    function initMap() {
      if (!window.L || !mapContainerRef.current) return;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = window.L.map(mapContainerRef.current).setView(
        [defaultLat, defaultLng],
        15
      );
      mapInstanceRef.current = map;

      window.L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      const marker = window.L.marker([defaultLat, defaultLng], {
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      // Handle marker dragend
      marker.on("dragend", async () => {
        const position = marker.getLatLng();
        const newLat = position.lat;
        const newLng = position.lng;
        setStatusMsg("Resolving pinpoint address...");
        const address = await reverseGeocodeHighPrecision(newLat, newLng);
        const finalAddr = address || location || "Hyderabad, Telangana";
        setStatusMsg("");
        if (onLocationChange) {
          onLocationChange({
            location: finalAddr,
            lat: newLat,
            lng: newLng,
          });
        }
      });

      // Handle click on map to move pin
      map.on("click", async (e) => {
        const newLat = e.latlng.lat;
        const newLng = e.latlng.lng;
        marker.setLatLng([newLat, newLng]);
        setStatusMsg("Resolving pinpoint address...");
        const address = await reverseGeocodeHighPrecision(newLat, newLng);
        const finalAddr = address || location || "Hyderabad, Telangana";
        setStatusMsg("");
        if (onLocationChange) {
          onLocationChange({
            location: finalAddr,
            lat: newLat,
            lng: newLng,
          });
        }
      });
    }

    if (!window.L) {
      if (!document.getElementById(jsId)) {
        const script = document.createElement("script");
        script.id = jsId;
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => {
          if (isMounted) initMap();
        };
        document.head.appendChild(script);
      } else {
        const script = document.getElementById(jsId);
        script.addEventListener("load", initMap);
      }
    } else {
      initMap();
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position if props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && latitude && longitude) {
      const nLat = parseFloat(latitude);
      const nLng = parseFloat(longitude);
      if (!isNaN(nLat) && !isNaN(nLng)) {
        mapInstanceRef.current.setView([nLat, nLng], 15);
        markerRef.current.setLatLng([nLat, nLng]);
      }
    }
  }, [latitude, longitude]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetecting(true);
    setStatusMsg("Capturing high-accuracy GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: nLat, longitude: nLng, accuracy } = position.coords;
        setStatusMsg(`GPS position acquired (${Math.round(accuracy)}m accuracy). Resolving address...`);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([nLat, nLng], 16);
          markerRef.current.setLatLng([nLat, nLng]);
        }

        const address = await reverseGeocodeHighPrecision(nLat, nLng);
        const finalAddr = address || location || "Hyderabad, Telangana";
        setStatusMsg("");
        setDetecting(false);

        if (onLocationChange) {
          onLocationChange({
            location: finalAddr,
            lat: nLat,
            lng: nLng,
          });
        }
      },
      (error) => {
        console.error("GPS error:", error);
        setDetecting(false);
        setStatusMsg("");
        alert("Unable to acquire high-precision GPS. You can click or drag the map pin to set your exact location manually.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div style={{ marginTop: "12px", width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            fontWeight: "var(--font-weight-medium)",
          }}
        >
          📍 Click or Drag map pin to fine-tune exact listing location
        </span>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={detecting}
          style={{
            background: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "var(--primary)",
            fontSize: "11px",
            fontWeight: "var(--font-weight-semibold)",
            padding: "4px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {detecting ? "⏳ Locating..." : "🎯 Auto-Detect GPS"}
        </button>
      </div>

      {statusMsg && (
        <div
          style={{
            fontSize: "11px",
            color: "var(--primary)",
            marginBottom: "6px",
            fontWeight: "var(--font-weight-semibold)",
          }}
        >
          {statusMsg}
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{
          height: "260px",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid var(--border-glass)",
          zIndex: 1,
        }}
      />
    </div>
  );
}

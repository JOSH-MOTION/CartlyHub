"use client";

import { useState, useRef, useEffect } from "react";

export default function ColorPicker({ value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const pickerRef = useRef(null);
  const saturationRef = useRef(null);
  const hueRef = useRef(null);

  // Convert HSL to Hex
  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert Hex to HSL
  const hexToHsl = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  // Initialize from existing value
  useEffect(() => {
    if (value) {
      const hsl = hexToHsl(value);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaturationLightnessChange = (e) => {
    if (!saturationRef.current) return;
    const rect = saturationRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newSaturation = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newLightness = Math.max(0, Math.min(100, (1 - y / rect.height) * 100));
    
    setSaturation(newSaturation);
    setLightness(newLightness);
    
    const hex = hslToHex(hue, newSaturation, newLightness);
    onChange(hex);
  };

  const handleHueChange = (e) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newHue = Math.max(0, Math.min(360, (x / rect.width) * 360));
    
    setHue(newHue);
    const hex = hslToHex(newHue, saturation, lightness);
    onChange(hex);
  };

  const currentColor = hslToHex(hue, saturation, lightness);

  return (
    <div className="relative" ref={pickerRef}>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Color"
          className="bg-white px-4 py-2 rounded-xl outline-none font-bold flex-grow"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
          style={{ backgroundColor: value || '#ccc' }}
          title={value || 'No color'}
        />
      </div>
      
      {showPicker && (
        <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          {/* Saturation/Lightness Square */}
          <div className="mb-4">
            <div
              ref={saturationRef}
              className="w-64 h-64 rounded cursor-crosshair relative"
              style={{
                background: `linear-gradient(to bottom, transparent, black),
                           linear-gradient(to right, white, transparent),
                           hsl(${hue}, 100%, 50%)`
              }}
              onMouseDown={(e) => {
                handleSaturationLightnessChange(e);
                const handleMouseMove = (moveEvent) => {
                  handleSaturationLightnessChange(moveEvent);
                };
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              {/* Crosshair indicator */}
              <div
                className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none"
                style={{
                  left: `${saturation}%`,
                  top: `${100 - lightness}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
          </div>
          
          {/* Hue Slider */}
          <div className="mb-4">
            <div
              ref={hueRef}
              className="w-64 h-8 rounded cursor-pointer relative"
              style={{
                background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
              }}
              onMouseDown={(e) => {
                handleHueChange(e);
                const handleMouseMove = (moveEvent) => {
                  handleHueChange(moveEvent);
                };
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              {/* Hue indicator */}
              <div
                className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none"
                style={{
                  left: `${(hue / 360) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
          </div>
          
          {/* Color Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: currentColor }}
              />
              <span className="font-mono">{currentColor}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

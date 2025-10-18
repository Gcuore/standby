import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTime } from '../hooks/useTime';
import { SunIcon, YouTubeIcon, LocationIcon, LoadingIcon, CloudIcon, CloudRainIcon, CloudSnowIcon, ZapIcon } from './Icons';
import { WIDGET_REGISTRY, AVAILABLE_WIDGETS } from '../App';

// Declare global types for CDN scripts
declare global {
  interface Window {
    jsmediatags: any;
  }
}
declare const FastAverageColor: any;


// --- TYPES ---
export interface WidgetConfig {
  id: string;
  component: keyof typeof WIDGET_REGISTRY;
  props?: any;
}

// --- HOOKS ---
const useLongPress = (callback: () => void, ms = 400) => {
  const timeoutRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Prevent context menu on long press
    e.preventDefault();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPressing(true);
    timeoutRef.current = window.setTimeout(() => {
      callback();
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPressing(false);
  }, []);

  const handlers = {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchEnd: stop,
  };
  
  return { handlers, isPressing };
};


// Base container for all widgets for consistent styling
const WidgetContainer: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
  <div className={`h-full w-full bg-zinc-900/70 backdrop-blur-md p-6 lg:p-8 flex flex-col justify-between overflow-hidden ${className}`}>
    {children}
  </div>
);

// Wrapper for individual widgets in edit mode
const WidgetWrapper: React.FC<{
  widget: WidgetConfig;
  index: number;
  isEditing: boolean;
  onRemove: () => void;
  onMove: (dragIndex: number, dropIndex: number) => void;
}> = ({ widget, index, isEditing, onRemove, onMove }) => {
  const WidgetComponent = WIDGET_REGISTRY[widget.component];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('widgetIndex', index.toString());
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('widgetIndex'), 10);
    if (draggedIndex !== index) {
      onMove(draggedIndex, index);
    }
  };

  return (
    <div
      className="h-full w-full flex-shrink-0 snap-center rounded-3xl lg:rounded-4xl overflow-hidden relative"
      draggable={isEditing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={`w-full h-full transition-transform duration-200 ${isEditing ? 'jiggle scale-90' : ''}`}>
        {WidgetComponent ? <WidgetComponent {...widget.props} /> : <div className="text-white">Unknown Widget</div>}
      </div>
      {isEditing && (
        <button
          onClick={onRemove}
          className="absolute top-2 left-2 z-10 w-8 h-8 bg-zinc-700/80 text-white rounded-full flex items-center justify-center text-xl font-bold"
          aria-label="Remove widget"
        >
          -
        </button>
      )}
    </div>
  );
};


// A stack for widgets, with vertical scrolling and snapping
export const WidgetStack: React.FC<{
  widgets: WidgetConfig[];
  onUpdateWidgets: (newWidgets: WidgetConfig[]) => void;
  isEditing: boolean;
  onSetEditing: (isEditing: boolean) => void;
  onAddWidgetClick: () => void;
  initialScrollIndex?: number;
}> = ({ widgets, onUpdateWidgets, isEditing, onSetEditing, onAddWidgetClick, initialScrollIndex = 0 }) => {
  const stackRef = useRef<HTMLDivElement>(null);
  const { handlers: longPressHandlers, isPressing } = useLongPress(() => onSetEditing(true));

  useEffect(() => {
    if (!isEditing && initialScrollIndex > 0) {
      const timer = setTimeout(() => {
        if (stackRef.current) {
          const widgetElements = stackRef.current.children;
          if (widgetElements.length > initialScrollIndex) {
            const targetWidget = widgetElements[initialScrollIndex] as HTMLElement;
            if (targetWidget) {
              targetWidget.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialScrollIndex, isEditing]);

  const handleRemoveWidget = (indexToRemove: number) => {
    onUpdateWidgets(widgets.filter((_, index) => index !== indexToRemove));
  };
  
  const handleMoveWidget = (dragIndex: number, dropIndex: number) => {
    const newWidgets = [...widgets];
    const [draggedItem] = newWidgets.splice(dragIndex, 1);
    newWidgets.splice(dropIndex, 0, draggedItem);
    onUpdateWidgets(newWidgets);
  };

  return (
    <div className="w-1/2 h-full relative">
      {isEditing && (
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between p-2">
          <button
            onClick={onAddWidgetClick}
            className="w-10 h-10 bg-zinc-700/80 text-white rounded-full flex items-center justify-center text-2xl font-light backdrop-blur-sm"
            aria-label="Add widget"
          >
            +
          </button>
          <button
            onClick={() => onSetEditing(false)}
            className="px-4 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold backdrop-blur-sm"
          >
            Done
          </button>
        </div>
      )}
      <div 
        {...longPressHandlers}
        ref={stackRef} 
        className={`w-full h-full flex flex-col overflow-y-auto snap-y snap-mandatory no-scrollbar overscroll-behavior-y-contain transition-transform duration-200 ${isPressing ? 'scale-95' : 'scale-100'} ${isEditing ? 'pt-14' : ''}`}
      >
        {widgets.map((widget, index) => (
          <WidgetWrapper
            key={widget.id}
            widget={widget}
            index={index}
            isEditing={isEditing}
            onRemove={() => handleRemoveWidget(index)}
            onMove={handleMoveWidget}
          />
        ))}
        {widgets.length === 0 && (
          <div className="h-full w-full flex-shrink-0 snap-center rounded-3xl lg:rounded-4xl bg-zinc-900/70 backdrop-blur-md p-6 lg:p-8 flex flex-col justify-center items-center text-zinc-500">
            Long-press to add widgets
          </div>
        )}
      </div>
    </div>
  );
};


// Gallery Modal for adding new widgets
export const WidgetGallery: React.FC<{
  // FIX: Updated the type for availableWidgets to include the 'name' property, which is used for display in the gallery.
  availableWidgets: (Omit<WidgetConfig, 'id'> & { name: string })[];
  onAddWidget: (widget: Omit<WidgetConfig, 'id'>) => void;
  onClose: () => void;
}> = ({ availableWidgets, onAddWidget, onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-800 p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-white">Add Widget</h2>
        <div className="grid grid-cols-2 gap-4">
          {availableWidgets.map((widget, index) => (
            <button
              key={index}
              onClick={() => onAddWidget(widget)}
              className="bg-zinc-700 p-4 rounded-lg text-white font-semibold hover:bg-zinc-600 transition"
            >
              {widget.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full p-2 mt-4 text-sm font-bold bg-zinc-600 text-white rounded-md hover:bg-zinc-700 transition">
          Cancel
        </button>
      </div>
    </div>
  );
};


// Presentational component for the clock face, now with layout, font, and size control
const ClockDisplay: React.FC<{
  color: string;
  layout: 'vertical' | 'horizontal';
  fontFamily: string;
  size: number;
}> = ({ color, layout, fontFamily, size }) => {
  const { timeString } = useTime();
  const [hour, minute] = timeString.split(':');
  
  if (layout === 'horizontal') {
    const timeStyle = { fontFamily: fontFamily, fontSize: `${size * 0.8}rem` };
    return (
      <div
        className={`flex flex-row items-center justify-center h-full w-full flex-shrink-0 snap-center cursor-pointer select-none ${color}`}
      >
        <h1 style={timeStyle} className="font-black leading-none tracking-tighter">{timeString}</h1>
      </div>
    );
  }

  // Vertical layout
  const timeStyle = { fontFamily: fontFamily, fontSize: `${size}rem` };
  const minuteStyle = { ...timeStyle, marginTop: `-${size / 4}rem` };
  return (
    <div
      className={`flex flex-col items-center justify-center h-full w-full flex-shrink-0 snap-center cursor-pointer select-none ${color}`}
    >
      <h1 style={timeStyle} className="w-full text-center font-black leading-none tracking-tighter">
        {hour}
      </h1>
      <h1 style={minuteStyle} className="w-full text-center font-black leading-none tracking-tighter">
        {minute}
      </h1>
    </div>
  );
};

// Full screen clock component with settings menu
export const FullScreenClock: React.FC = () => {
  const colors = ['text-white', 'text-orange-500', 'text-blue-500', 'text-green-700'];
  const stackRef = useRef<HTMLDivElement>(null);

  // State for menu and settings
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clockLayout, setClockLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [clockSize, setClockSize] = useState(14);
  const [fonts, setFonts] = useState([{ name: 'SF Pro Display', family: "'SF Pro Display Black'" }]);
  const [activeFontFamily, setActiveFontFamily] = useState(fonts[0].family);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tapTimeoutRef = useRef<number | null>(null);
  const tapCountRef = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Create and manage a <style> tag for dynamically loaded fonts
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-fonts-style-sheet';
    document.head.appendChild(styleEl);
    return () => {
      const existingStyleEl = document.getElementById('dynamic-fonts-style-sheet');
      if (existingStyleEl) {
        document.head.removeChild(existingStyleEl);
      }
    };
  }, []);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Handler for triple tap
  const handleContainerClick = () => {
    tapCountRef.current++;
    if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
    }
    tapTimeoutRef.current = window.setTimeout(() => {
        tapCountRef.current = 0;
    }, 400); // 400ms window between taps

    if (tapCountRef.current === 3) {
        tapCountRef.current = 0;
        clearTimeout(tapTimeoutRef.current);
        setIsMenuOpen(true);
    }
  };

  // Handlers for menu actions
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.startsWith('font/') || /\.(ttf|otf|woff|woff2)$/i.test(file.name))) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const dataUrl = loadEvent.target?.result as string;
            if (dataUrl) {
                const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '');
                const fontFamily = `imported-${fontName}-${Date.now()}`;
                
                const styleEl = document.getElementById('dynamic-fonts-style-sheet');
                if (styleEl) {
                    styleEl.innerHTML += `
                        @font-face {
                            font-family: '${fontFamily}';
                            src: url(${dataUrl});
                        }
                    `;
                }
                setFonts(prevFonts => [...prevFonts, { name: file.name, family: fontFamily }]);
            }
        };
        reader.readAsDataURL(file);
    } else {
      alert('Please select a valid font file (e.g., .ttf, .otf, .woff).');
    }
  };
  
  const handleSetLayout = (layout: 'vertical' | 'horizontal') => {
    setClockLayout(layout);
  };

  const handleSetFont = (fontFamily: string) => {
    setActiveFontFamily(fontFamily);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsMenuOpen(false);
    }
  };

  const handleOpenInNewTab = () => {
    const newTab = window.open('about:blank', '_blank');
    if (newTab) {
      newTab.location.href = window.location.href;
    }
  };

  // Initial scroll effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stackRef.current) {
        const initialClockIndex = 0; // Start on white
        const clockElements = stackRef.current.children;
        if (clockElements.length > initialClockIndex) {
          const targetClock = clockElements[initialClockIndex] as HTMLElement;
          if (targetClock) {
            targetClock.scrollIntoView({ behavior: 'auto', block: 'start' });
          }
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const menuButtonClass = (isActive: boolean) =>
    `w-full text-left p-2 rounded-md transition text-sm ${isActive ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'}`;

  // Render method
  return (
    <div
      onClick={handleContainerClick}
      className="w-full h-full relative"
    >
      <div
        className="absolute inset-0 flex flex-col overflow-y-auto snap-y snap-mandatory no-scrollbar overscroll-behavior-y-contain"
        ref={stackRef}
      >
        {colors.map((color, index) => (
          <ClockDisplay key={index} color={color} layout={clockLayout} fontFamily={activeFontFamily} size={clockSize} />
        ))}
      </div>

      {isMenuOpen && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-zinc-800 p-6 rounded-2xl w-full max-w-xs flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 mb-2 tracking-wider">CLOCK LAYOUT</h3>
              <div className="flex gap-2">
                <button onClick={() => handleSetLayout('vertical')} className={menuButtonClass(clockLayout === 'vertical')}>Vertical</button>
                <button onClick={() => handleSetLayout('horizontal')} className={menuButtonClass(clockLayout === 'horizontal')}>Horizontal</button>
              </div>
            </div>
             <div>
              <h3 className="text-sm font-bold text-zinc-400 mb-2 tracking-wider">CLOCK SIZE</h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={clockSize}
                  onChange={(e) => setClockSize(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
                  aria-label="Clock size"
                />
                <span className="text-sm font-mono text-zinc-300 w-8 text-center">{clockSize}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-400 mb-2 tracking-wider">FONT</h3>
              <div className="flex flex-col gap-2 max-h-32 overflow-y-auto no-scrollbar">
                {fonts.map(font => (
                  <button key={font.family} onClick={() => handleSetFont(font.family)} className={menuButtonClass(activeFontFamily === font.family)}>{font.name}</button>
                ))}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".ttf,.otf,.woff,.woff2,font/*" className="hidden" />
              <button onClick={handleImportClick} className="w-full p-2 mt-3 text-sm font-bold bg-zinc-600 text-white rounded-md hover:bg-zinc-700 transition">
                Import Font File...
              </button>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-400 mb-2 tracking-wider">APP ACTIONS</h3>
              <div className="flex flex-col gap-2">
                <button onClick={toggleFullScreen} className={menuButtonClass(false)}>
                  {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                </button>
                <button onClick={handleOpenInNewTab} className={menuButtonClass(false)}>
                  Open in New Tab
                </button>
                {deferredPrompt && (
                  <button onClick={handleInstallClick} className={menuButtonClass(false)}>
                    Install Web App
                  </button>
                )}
              </div>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="w-full p-2 mt-2 text-sm font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Calendar widget
export const CalendarWidget: React.FC = () => {
  const { dayOfWeek, dayOfMonth } = useTime();
  return (
    <WidgetContainer className="items-center justify-center text-center">
        <p className="text-3xl lg:text-4xl text-zinc-400 font-bold tracking-widest">{dayOfWeek}</p>
        <p className="text-8xl lg:text-9xl font-black text-zinc-100 leading-none mt-2">{dayOfMonth}</p>
    </WidgetContainer>
  );
};


// Real-time weather widget
export const WeatherWidget: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'loading' | 'success' | 'error'>('idle');
  const [weatherData, setWeatherData] = useState<{ temperature: number; weatherCode: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const WMO_CODES: { [key: number]: string } = {
      0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      66: 'Light freezing rain', 67: 'Heavy freezing rain',
      71: 'Slight snow fall', 73: 'Moderate snow fall', 75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
      85: 'Slight snow showers', 86: 'Heavy snow showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
  };

  const getWeatherIcon = (code: number) => {
      const iconClass = "w-16 h-16 lg:w-20 lg:h-20";
      if (code <= 1) return <SunIcon className={`${iconClass} text-yellow-400`} />;
      if (code <= 3 || code === 45 || code === 48) return <CloudIcon className={`${iconClass} text-gray-400`} />;
      if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRainIcon className={`${iconClass} text-blue-400`} />;
      if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnowIcon className={`${iconClass} text-white`} />;
      if (code >= 95) return <ZapIcon className={`${iconClass} text-yellow-300`} />;
      return <SunIcon className={`${iconClass} text-gray-400`} />; // Fallback
  };

  const handleRequestLocation = () => {
      if (!navigator.geolocation) {
          setError("Geolocation is not supported by your browser.");
          setStatus('error');
          return;
      }

      setStatus('requesting');

      navigator.geolocation.getCurrentPosition(
          async (position) => {
              setStatus('loading');
              const { latitude, longitude } = position.coords;

              try {
                  const [weatherResponse, locationResponse] = await Promise.all([
                      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`),
                      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                  ]);

                  if (!weatherResponse.ok || !locationResponse.ok) {
                      throw new Error('Failed to fetch data from services.');
                  }

                  const weatherJson = await weatherResponse.json();
                  const locationJson = await locationResponse.json();
                  
                  if (weatherJson.error) throw new Error(weatherJson.reason);
                  
                  setWeatherData({
                      temperature: Math.round(weatherJson.current.temperature_2m),
                      weatherCode: weatherJson.current.weather_code,
                  });

                  setLocationName(locationJson.address?.city || locationJson.address?.town || locationJson.address?.village || 'Current Location');
                  setStatus('success');
              } catch (err: any) {
                  setError(err.message || "Could not fetch weather data.");
                  setStatus('error');
              }
          },
          (err) => {
              switch (err.code) {
                  case err.PERMISSION_DENIED: setError("Location access denied. Please enable it in your browser settings."); break;
                  case err.POSITION_UNAVAILABLE: setError("Location information is unavailable."); break;
                  case err.TIMEOUT: setError("The request to get user location timed out."); break;
                  default: setError("An unknown error occurred while getting location."); break;
              }
              setStatus('error');
          }
      );
  };
  
  const renderContent = () => {
      switch (status) {
          case 'idle':
              return (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-zinc-400 mb-4">Location is not active.</p>
                      <button onClick={handleRequestLocation} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
                          Activate Location
                      </button>
                  </div>
              );
          case 'requesting':
              return (
                   <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
                      <LocationIcon className="w-12 h-12 mb-4 animate-pulse" />
                      <p>Waiting for permission...</p>
                      <p className="text-sm mt-2">Check your browser for a prompt.</p>
                  </div>
              );
          case 'loading':
               return (
                   <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400">
                       <LoadingIcon className="w-12 h-12" />
                       <p className="mt-4">Fetching weather...</p>
                  </div>
              );
          case 'success':
              if (!weatherData || !locationName) return null;
              return (
                  <>
                      <div className="w-full text-center">
                          <p className="text-2xl lg:text-3xl font-bold truncate">{locationName}</p>
                          <p className="text-zinc-400 text-xl lg:text-2xl">{WMO_CODES[weatherData.weatherCode] || 'Weather'}</p>
                      </div>
                      <div className="flex items-baseline justify-between">
                          <p className="text-8xl lg:text-9xl font-black">{weatherData.temperature}°</p>
                          {getWeatherIcon(weatherData.weatherCode)}
                      </div>
                  </>
              );
          case 'error':
               return (
                   <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <p className="text-red-500 mb-4">{error}</p>
                      <button onClick={handleRequestLocation} className="bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-zinc-600 transition">
                          Try Again
                      </button>
                  </div>
              );
      }
  };
  
  return (
      <WidgetContainer className="justify-center">
          {renderContent()}
      </WidgetContainer>
  );
};

// Photo display widget
export const PhotosWidget: React.FC<{ initialImageUrl: string }> = ({ initialImageUrl }) => {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = () => {
    setUrlInput(imageUrl.startsWith('data:') ? '' : imageUrl);
    setIsEditing(true);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setImageUrl(urlInput.trim());
    }
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setImageUrl(loadEvent.target.result as string);
        }
        setIsEditing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="h-full w-full flex-shrink-0 snap-center rounded-3xl lg:rounded-4xl overflow-hidden bg-zinc-800 flex flex-col items-center justify-center p-4 gap-4">
        <h3 className="text-lg font-bold text-white">Change Picture</h3>
        <form onSubmit={handleUrlSubmit} className="w-full flex flex-col gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL"
            className="w-full p-2 text-sm rounded-md bg-zinc-700 text-white border border-zinc-600 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Image URL"
          />
          <button type="submit" className="w-full p-2 text-sm font-bold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Set from URL
          </button>
        </form>
        <div className="text-sm text-zinc-400">or</div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button onClick={handleImportClick} className="w-full p-2 text-sm font-bold bg-zinc-600 text-white rounded-md hover:bg-zinc-700 transition">
          Import from Device
        </button>
        <button onClick={handleCancel} className="mt-2 text-sm text-zinc-300 hover:text-white">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full flex-shrink-0 snap-center rounded-3xl lg:rounded-4xl overflow-hidden cursor-pointer bg-zinc-900"
      onDoubleClick={handleDoubleClick}
    >
      <img src={imageUrl} alt="Standby photo" className="w-full h-full object-cover" />
    </div>
  );
};


// YouTube widget
export const YouTubeWidget: React.FC = () => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const hideControls = () => setIsControlsVisible(false);
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(hideControls, 10000);
    };
    if (videoId && isControlsVisible) resetTimer();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [videoId, isControlsVisible]);

  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const id = extractVideoId(inputValue);
    if (id) {
      setVideoId(id);
      setIsControlsVisible(true);
    } else {
      setInputValue('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleUserInteraction = () => {
    if (!isControlsVisible) {
      setIsControlsVisible(true);
    }
  };

  const handleCloseVideo = () => {
    setVideoId(null);
  };

  if (videoId) {
    return (
      <div
        className="relative h-full w-full flex-shrink-0 snap-center rounded-3xl lg:rounded-4xl overflow-hidden"
        onMouseMove={handleUserInteraction}
        onTouchStart={handleUserInteraction}
      >
        <button
          onClick={handleCloseVideo}
          className={`absolute top-2 right-2 z-10 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Close video"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <WidgetContainer>
      <div className="flex flex-col justify-center items-center h-full text-center gap-4">
        <YouTubeIcon className="w-12 h-12 text-white mb-2" />
        <form onSubmit={handleSubmit} className="w-full">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste YouTube link here and press Enter"
            className="w-full h-24 p-3 text-sm rounded-lg bg-zinc-800 text-white border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none no-scrollbar"
            aria-label="YouTube video URL"
          />
        </form>
      </div>
    </WidgetContainer>
  );
};

// Full Screen YouTube Component
export const FullScreenYouTube: React.FC = () => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const hideControls = () => setIsControlsVisible(false);
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(hideControls, 5000);
    };
    if (videoId && isControlsVisible) resetTimer();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [videoId, isControlsVisible]);

  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const id = extractVideoId(inputValue);
    if (id) {
      setVideoId(id);
      setIsControlsVisible(true);
    } else {
      setInputValue('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleUserInteraction = () => {
    if (!isControlsVisible) {
      setIsControlsVisible(true);
    }
  };

  const handleCloseVideo = () => {
    setVideoId(null);
  };

  if (videoId) {
    return (
      <div
        className="relative h-full w-full bg-black"
        onMouseMove={handleUserInteraction}
        onTouchStart={handleUserInteraction}
      >
        <button
          onClick={handleCloseVideo}
          className={`absolute top-4 right-4 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Close video"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-full text-center gap-8 max-w-xl w-full px-4">
      <YouTubeIcon className="w-24 h-24 text-white" />
      <form onSubmit={handleSubmit} className="w-full">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste YouTube link here and press Enter"
          className="w-full h-32 p-4 text-lg rounded-xl bg-zinc-900/80 text-white border-2 border-zinc-700 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none no-scrollbar"
          aria-label="YouTube video URL"
        />
      </form>
    </div>
  );
};

// Full Screen MP3 Player
export const FullScreenMP3Player: React.FC = () => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [glowColor, setGlowColor] = useState<string>('rgba(0,0,0,0)');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverArtRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Cleanup object URL on component unmount or when src changes
    const currentSrc = audioSrc;
    return () => {
      if (currentSrc) {
        URL.revokeObjectURL(currentSrc);
      }
    };
  }, [audioSrc]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset state for new file
      setMetadata(null); // Show loading state
      setProgress(0);
      setDuration(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      const objectUrl = URL.createObjectURL(file);
      setAudioSrc(objectUrl);
      
      window.jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          const { title, artist, album, picture } = tag.tags;
          let imageUrl = null;
          if (picture) {
            // Safer base64 encoding to prevent stack overflow on large images
            let binary = '';
            const bytes = new Uint8Array(picture.data);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64String = btoa(binary);
            imageUrl = `data:${picture.format};base64,${base64String}`;
          }
          setMetadata({ 
            title: title || file.name.replace(/\.[^/.]+$/, ''), // Use filename as fallback
            artist: artist || 'Unknown Artist', 
            album: album || 'Unknown Album', 
            imageUrl 
          });
        },
        onError: (error: any) => {
          console.error('Error reading MP3 tags:', error);
          setMetadata({ 
            title: file.name.replace(/\.[^/.]+$/, ''), 
            artist: 'Unknown Artist', 
            album: 'Unknown Album', 
            imageUrl: null 
          });
        }
      });
    }
  };

  const handleCoverArtLoad = () => {
    if (coverArtRef.current) {
      const fac = new FastAverageColor();
      fac.getColorAsync(coverArtRef.current)
        .then((color: any) => {
          setGlowColor(color.rgba);
        })
        .catch((e: any) => {
          console.error('Error getting color from cover art:', e);
          setGlowColor('rgba(50,50,50,0.5)'); // default glow
        });
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioSrc) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center text-center gap-8">
        <input type="file" accept="audio/mpeg" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-48 h-48 rounded-full border-4 border-dashed border-zinc-600 text-zinc-600 hover:border-zinc-400 hover:text-zinc-400 transition-all duration-300 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
        </button>
        <p className="text-zinc-400">Select an MP3 file to play</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8">
        <div 
          className="relative w-full max-w-sm aspect-square transition-all duration-1000"
          style={{boxShadow: `0px 0px 100px 50px ${glowColor}`}}
        >
          <img
              ref={coverArtRef}
              src={metadata?.imageUrl || 'https://via.placeholder.com/500?text=No+Art'}
              alt="Album Art"
              className="w-full h-full object-cover rounded-3xl"
              onLoad={handleCoverArtLoad}
              crossOrigin="anonymous"
           />
        </div>

        <div className="text-center w-full max-w-sm">
            <h2 className="text-3xl font-bold truncate">{metadata?.title || 'Loading...'}</h2>
            <p className="text-xl text-zinc-400 truncate">{metadata?.artist || '...'}</p>
            <p className="text-md text-zinc-500 truncate">{metadata?.album || '...'}</p>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-2">
            <input
                type="range"
                min="0"
                max={duration || 0}
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-zinc-400">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
        
        <div className="flex items-center gap-8">
            <button onClick={togglePlayPause} className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-white active:bg-zinc-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                    {isPlaying 
                        ? <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1H7zm5 0a1 1 0 00-1 1v2a1 1 0 001 1h1a1 1 0 001-1V9a1 1 0 00-1-1h-1z" clipRule="evenodd" />
                        : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    }
                </svg>
            </button>
        </div>
      <audio
        ref={audioRef}
        src={audioSrc}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="hidden"
      ></audio>
    </div>
  );
};
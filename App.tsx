import React, { useState } from 'react';
import { WidgetStack, FullScreenClock, WeatherWidget, CalendarWidget, PhotosWidget, YouTubeWidget, FullScreenYouTube, FullScreenMP3Player, WidgetConfig, WidgetGallery } from './components/Widgets';

// --- WIDGET REGISTRY ---
// This allows us to dynamically render widgets from a string name.
export const WIDGET_REGISTRY: { [key: string]: React.FC<any> } = {
  WeatherWidget,
  CalendarWidget,
  PhotosWidget,
  YouTubeWidget,
};

// --- AVAILABLE WIDGETS for the gallery ---
export const AVAILABLE_WIDGETS = [
  { name: 'Calendar', component: 'CalendarWidget', props: {} },
  { name: 'Weather', component: 'WeatherWidget', props: {} },
  { name: 'Photos', component: 'PhotosWidget', props: { initialImageUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 200)}/800/800` } },
  { name: 'YouTube', component: 'YouTubeWidget', props: {} },
];

// --- INITIAL WIDGET LAYOUT ---
const initialLeftWidgets: WidgetConfig[] = [
  { id: 'l-yt-1', component: 'YouTubeWidget', props: {} },
  { id: 'l-ph-1', component: 'PhotosWidget', props: { initialImageUrl: 'https://picsum.photos/id/10/800/800' } },
];

const initialRightWidgets: WidgetConfig[] = [
  { id: 'r-cl-1', component: 'CalendarWidget', props: {} },
  { id: 'r-wt-1', component: 'WeatherWidget', props: {} },
];


const App: React.FC = () => {
  const [leftWidgets, setLeftWidgets] = useState<WidgetConfig[]>(initialLeftWidgets);
  const [rightWidgets, setRightWidgets] = useState<WidgetConfig[]>(initialRightWidgets);
  
  // State to track which stack is in editing mode ('left', 'right', or null)
  const [editingStack, setEditingStack] = useState<'left' | 'right' | null>(null);
  
  // State to control the visibility of the widget gallery
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const handleAddWidget = (widget: Omit<WidgetConfig, 'id'>) => {
    const newWidget = { ...widget, id: crypto.randomUUID() };
    if (editingStack === 'left') {
      setLeftWidgets(prev => [...prev, newWidget]);
    } else if (editingStack === 'right') {
      setRightWidgets(prev => [...prev, newWidget]);
    }
    setIsGalleryOpen(false);
  };

  return (
    <div className="h-screen w-screen bg-black text-white font-sfpro overflow-hidden relative">
      <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        
        {/* Widget View */}
        <div id="widgets" className="w-full h-full flex-shrink-0 flex items-center justify-center p-8 lg:p-12 gap-6 lg:gap-8 snap-center">
          <WidgetStack
            widgets={leftWidgets}
            onUpdateWidgets={setLeftWidgets}
            isEditing={editingStack === 'left'}
            onSetEditing={(isEditing) => setEditingStack(isEditing ? 'left' : null)}
            onAddWidgetClick={() => setIsGalleryOpen(true)}
            initialScrollIndex={1}
          />
          <WidgetStack
            widgets={rightWidgets}
            onUpdateWidgets={setRightWidgets}
            isEditing={editingStack === 'right'}
            onSetEditing={(isEditing) => setEditingStack(isEditing ? 'right' : null)}
            onAddWidgetClick={() => setIsGalleryOpen(true)}
            initialScrollIndex={1}
          />
        </div>
        
        {/* Full Screen Clock View */}
        <div id="fullscreen-clock" className="w-full h-full flex-shrink-0 snap-center">
          <FullScreenClock />
        </div>

        {/* Full Screen YouTube View */}
        <div id="fullscreen-youtube" className="w-full h-full flex-shrink-0 flex items-center justify-center snap-center">
          <FullScreenYouTube />
        </div>

        {/* Full Screen MP3 Player View */}
        <div id="fullscreen-mp3player" className="w-full h-full flex-shrink-0 snap-center">
          <FullScreenMP3Player />
        </div>

      </div>
      
      {isGalleryOpen && editingStack && (
        <WidgetGallery
          availableWidgets={AVAILABLE_WIDGETS}
          onAddWidget={handleAddWidget}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
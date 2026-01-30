import { useEffect, useState } from 'react';
import { Scene } from '../scene/Scene';
import SidebarChat from '../components/SidebarChat';
import LeftControlPanel from '../components/LeftControlPanel';
import Timeline from '../components/Timeline';
import PreviewModal from '../components/PreviewModal';
import CoordinateDisplay from '../components/CoordinateDisplay';
import ZoomDisplay from '../components/ZoomDisplay';
import TutorialModal from '../components/TutorialModal';
import { PhotoUploadModal } from '../components/PhotoUploadModal';
import { useAgentStore } from '../state/useAgentStore';

const Editor = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const sessionId = useAgentStore((s) => s.sessionId);

  const undo = useAgentStore((s) => s.undo);
  const redo = useAgentStore((s) => s.redo);

  // Global keyboard shortcuts: Undo/Redo and Photo Upload
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isZ = e.key.toLowerCase() === 'z';
      const hasCtrlOrMeta = e.ctrlKey || e.metaKey;
      if (hasCtrlOrMeta && isZ && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (hasCtrlOrMeta && isZ && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleTutorialClose = () => {
    setIsTutorialOpen(false);
  };

  return (
    <div className="relative w-screen h-screen m-0 p-0 overflow-hidden bg-[#050505]">
      <LeftControlPanel />
      <Scene 
        isSidebarOpen={isSidebarOpen} 
        onPreviewClick={() => setIsPreviewOpen(true)}
        onPhotoClick={() => setIsPhotoUploadOpen(true)}
      />
      <SidebarChat isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <Timeline />
      <CoordinateDisplay />
      <ZoomDisplay />
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
      <TutorialModal isOpen={isTutorialOpen} onClose={handleTutorialClose} />
      <PhotoUploadModal 
        isOpen={isPhotoUploadOpen} 
        onClose={() => setIsPhotoUploadOpen(false)} 
        sessionId={sessionId}
      />
    </div>
  );
}

export default Editor;
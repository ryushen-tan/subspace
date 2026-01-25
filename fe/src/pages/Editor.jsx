import { useState } from 'react';
import { Scene } from '../scene/Scene';
import SidebarChat from '../components/SidebarChat';
import LeftControlPanel from '../components/LeftControlPanel';
import Timeline from '../components/Timeline';
import PreviewModal from '../components/PreviewModal';

const Editor = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen m-0 p-0 overflow-hidden bg-[#0a0a0a]">
      <LeftControlPanel />
      <Scene isSidebarOpen={isSidebarOpen} onPreviewClick={() => setIsPreviewOpen(true)} />
      <SidebarChat isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <Timeline />
      <PreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
    </div>
  );
}

export default Editor;
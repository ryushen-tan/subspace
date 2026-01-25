import { useState } from 'react';
import { Scene } from '../scene/Scene';
import SidebarChat from '../components/SidebarChat';
import LeftControlPanel from '../components/LeftControlPanel';
import Timeline from '../components/Timeline';

const Editor = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="relative w-screen h-screen m-0 p-0 overflow-hidden bg-[#0a0a0a]">
      <LeftControlPanel />
      <Scene isSidebarOpen={isSidebarOpen} />
      <SidebarChat isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <Timeline />
    </div>
  );
}

export default Editor;
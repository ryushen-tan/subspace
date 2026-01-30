import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { useAuthStore } from '../state/useAuthStore';
import { getProject, createProject, updateProject } from '../services/projectService';

const Su3 = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(true);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const sessionId = useAgentStore((s) => s.sessionId);
  const currentProjectId = useAgentStore((s) => s.currentProjectId);
  const getSnapshotForSave = useAgentStore((s) => s.getSnapshotForSave);
  const setCurrentProjectId = useAgentStore((s) => s.setCurrentProjectId);
  const hydrateFromSnapshot = useAgentStore((s) => s.hydrateFromSnapshot);
  const resetProject = useAgentStore((s) => s.resetProject);
  const projectName = useAgentStore((s) => s.projectName);
  const projectDescription = useAgentStore((s) => s.projectDescription);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user)?.id;

  const undo = useAgentStore((s) => s.undo);
  const redo = useAgentStore((s) => s.redo);

  // Load project or reset for new project. Don't disconnect when entering "new project" so the WebSocket can connect.
  useEffect(() => {
    if (projectId) {
      setLoadError('');
      let cancelled = false;
      (async () => {
        try {
          const project = await getProject(projectId);
          if (cancelled) return;
          setCurrentProjectId(project.id);
          hydrateFromSnapshot(project.snapshot || {});
        } catch (e) {
          if (!cancelled) setLoadError(e?.message || 'Failed to load project');
        }
      })();
      return () => { cancelled = true; };
    } else {
      setCurrentProjectId(null);
      resetProject({ disconnect: false });
      setLoadError('');
    }
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Disconnect when leaving the editor so the WebSocket is closed.
  useEffect(() => {
    return () => {
      useAgentStore.getState().disconnect();
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    setIsSaving(true);
    try {
      const snapshot = getSnapshotForSave();
      if (currentProjectId) {
        await updateProject(currentProjectId, {
          name: projectName,
          description: projectDescription,
          snapshot,
        });
      } else {
        const created = await createProject({
          user: userId,
          name: projectName,
          description: projectDescription,
          snapshot,
        });
        setCurrentProjectId(created.id);
        navigate(`/su3/${created.id}`, { replace: true });
      }
      setLoadError('');
    } catch (e) {
      setLoadError(e?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, userId, currentProjectId, projectName, projectDescription, getSnapshotForSave, setCurrentProjectId, navigate]);

  // Global keyboard shortcuts: Undo/Redo
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
      {loadError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-red-950/90 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {loadError}
        </div>
      )}
      <LeftControlPanel
        onPhotoClick={() => setIsPhotoUploadOpen(true)}
        onSave={handleSave}
        showDashboardLink={isAuthenticated}
        isSaving={isSaving}
      />
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

export default Su3;

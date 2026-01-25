import { useRef, useState, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Raycaster } from 'three';
import { usePointsStore } from '../state/usePointsStore';

export function useDrag3D(options = {}) {
  const { dragPlane = 'xy', onDragStart, onDrag, onDragEnd } = options;
  const { camera, pointer } = useThree();
  const setDragging = usePointsStore((state) => state.setDragging);
  const [dragState, setDragState] = useState({
    isDragging: false,
    pointId: null,
    offset: [0, 0, 0],
  });
  
  const dragPlaneRef = useRef(null);
  const initialPositionRef = useRef(null);
  const objectRef = useRef(null);
  const pointerIdRef = useRef(null);
  const isDraggingRef = useRef(false);

  const endDrag = useCallback(() => {
    if (isDraggingRef.current || objectRef.current) {
      // Release pointer capture if we have it
      if (pointerIdRef.current !== null && objectRef.current) {
        try {
          if (objectRef.current.releasePointerCapture) {
            objectRef.current.releasePointerCapture(pointerIdRef.current);
          }
        } catch {
          // Ignore errors if capture was already released
        }
      }
      
      setDragState({
        isDragging: false,
        pointId: null,
        offset: [0, 0, 0],
      });
      setDragging(false);
      objectRef.current = null;
      dragPlaneRef.current = null;
      initialPositionRef.current = null;
      pointerIdRef.current = null;
      isDraggingRef.current = false;
      
      if (onDragEnd) onDragEnd();
    }
  }, [setDragging, onDragEnd]);

  // Global pointer up handler to ensure drag ends
  useEffect(() => {
    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        endDrag();
      }
    };

    if (dragState.isDragging) {
      isDraggingRef.current = true;
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
      return () => {
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
    } else {
      isDraggingRef.current = false;
    }
  }, [dragState.isDragging, endDrag]);

  const startDrag = (event, object, initialPosition) => {
    event.stopPropagation();
    
    if (event.target.setPointerCapture) {
      event.target.setPointerCapture(event.pointerId);
    }
    pointerIdRef.current = event.pointerId;
    
    const initialPos = new Vector3(...initialPosition);
    initialPositionRef.current = initialPos;
    objectRef.current = object;

    // Calculate drag plane normal based on camera view
    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);

    let planeNormal;
    switch (dragPlane) {
      case 'xy':
        planeNormal = new Vector3(0, 0, 1);
        break;
      case 'xz':
        planeNormal = new Vector3(0, 1, 0);
        break;
      case 'yz':
        planeNormal = new Vector3(1, 0, 0);
        break;
      case 'free':
      default:
        planeNormal = cameraDirection.clone();
        break;
    }

    dragPlaneRef.current = planeNormal;

    // Calculate offset from initial click position
    const raycaster = new Raycaster();
    raycaster.setFromCamera(pointer, camera);
    
    const plane = new Vector3().copy(planeNormal);
    const planePoint = initialPos.clone();
    
    // Find intersection with drag plane
    const denominator = plane.dot(raycaster.ray.direction);
    if (Math.abs(denominator) > 0.0001) {
      const t = plane.dot(planePoint.clone().sub(raycaster.ray.origin)) / denominator;
      const intersection = raycaster.ray.origin.clone().add(
        raycaster.ray.direction.clone().multiplyScalar(t)
      );
      const offset = intersection.sub(initialPos);
      setDragState({
        isDragging: true,
        pointId: object.userData.pointId || null,
        offset: [offset.x, offset.y, offset.z],
      });
      setDragging(true);
    } else {
      setDragState({
        isDragging: true,
        pointId: object.userData.pointId || null,
        offset: [0, 0, 0],
      });
      setDragging(true);
    }

    if (onDragStart) onDragStart();
  };

  useFrame(() => {
    if (!dragState.isDragging || !objectRef.current || !dragPlaneRef.current) {
      return;
    }

    const raycaster = new Raycaster();
    raycaster.setFromCamera(pointer, camera);

    const planeNormal = dragPlaneRef.current;
    const planePoint = initialPositionRef.current;

    // Calculate intersection with drag plane
    const denominator = planeNormal.dot(raycaster.ray.direction);
    if (Math.abs(denominator) > 0.0001) {
      const t =
        planeNormal.dot(planePoint.clone().sub(raycaster.ray.origin)) /
        denominator;
      const intersection = raycaster.ray.origin.clone().add(
        raycaster.ray.direction.clone().multiplyScalar(t)
      );

      // Apply offset
      const newPosition = intersection.sub(
        new Vector3(...dragState.offset)
      );

      const position = [
        newPosition.x,
        newPosition.y,
        newPosition.z,
      ];

      if (onDrag) onDrag(position);
    }
  });

  return {
    dragState,
    startDrag,
    endDrag,
    isDragging: dragState.isDragging,
  };
}

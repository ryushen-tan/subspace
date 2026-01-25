import { useMemo } from 'react';
import { usePointsStore } from '../../state/usePointsStore';
import { useAgentStore } from '../../state/useAgentStore';
import { DraggablePoint } from './DraggablePoint';
import { shallow } from 'zustand/shallow';

export function PointCloud() {
  const points = usePointsStore((state) => state.points);
  const objects = useAgentStore((state) => state.objects, shallow);

  const visibleObjectIds = useMemo(
    () => objects.filter((obj) => obj.visible).map((obj) => obj.id),
    [objects]
  );

  const visiblePoints = useMemo(
    () => points.filter((p) => visibleObjectIds.includes(p.objectId)),
    [points, visibleObjectIds]
  );

  return (
    <>
      {visiblePoints.map((point) => (
        <DraggablePoint key={point.id} point={point} />
      ))}
    </>
  );
}

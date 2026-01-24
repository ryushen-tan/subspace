import { usePointsStore } from '../../state/usePointsStore';
import { DraggablePoint } from './DraggablePoint';

export function PointCloud() {
  const points = usePointsStore((state) => state.points);

  return (
    <>
      {points.map((point) => (
        <DraggablePoint key={point.id} point={point} />
      ))}
    </>
  );
}

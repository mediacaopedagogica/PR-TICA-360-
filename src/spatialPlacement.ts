import { PlacedObject } from "./types";

export interface RoomDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface PlacementResult {
  valid: boolean;
  update: Pick<PlacedObject, "x" | "y" | "rotation">;
  reason?: "collision";
  conflictingObject?: PlacedObject;
}

export const PLACEMENT_GRID_METERS = 0.05;

const round = (value: number) => Math.round(value * 1000) / 1000;

export function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360;
}

export function snapToPlacementGrid(value: number, grid = PLACEMENT_GRID_METERS) {
  return round(Math.round(value / grid) * grid);
}

export function getRotatedFootprint(
  item: Pick<PlacedObject, "width" | "depth" | "rotation">,
  rotation = item.rotation,
) {
  const radians = (normalizeRotation(rotation) * Math.PI) / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  return {
    width: round(item.width * cosine + item.depth * sine),
    depth: round(item.width * sine + item.depth * cosine),
  };
}

export function resolveObjectPlacement(
  item: PlacedObject,
  requested: Partial<Pick<PlacedObject, "x" | "y" | "rotation">>,
  room: RoomDimensions,
  allObjects: PlacedObject[],
  collisionEnabled: (object: PlacedObject) => boolean = () => true,
): PlacementResult {
  const rotation = normalizeRotation(requested.rotation ?? item.rotation);
  const footprint = getRotatedFootprint(item, rotation);
  const maxX = Math.max(0, room.width - footprint.width);
  const maxY = Math.max(0, room.depth - footprint.depth);
  const x = Math.min(maxX, Math.max(0, snapToPlacementGrid(requested.x ?? item.x)));
  const y = Math.min(maxY, Math.max(0, snapToPlacementGrid(requested.y ?? item.y)));
  const update = { x: round(x), y: round(y), rotation };

  if (!collisionEnabled(item)) return { valid: true, update };

  const clearance = 0.015;
  const conflictingObject = allObjects.find((candidate) => {
    if (candidate.id === item.id || !collisionEnabled(candidate)) return false;
    const other = getRotatedFootprint(candidate);
    return (
      x < candidate.x + other.width - clearance &&
      x + footprint.width > candidate.x + clearance &&
      y < candidate.y + other.depth - clearance &&
      y + footprint.depth > candidate.y + clearance
    );
  });

  if (conflictingObject) {
    return { valid: false, update, reason: "collision", conflictingObject };
  }

  return { valid: true, update };
}

import assert from "node:assert/strict";
import { getRotatedFootprint, resolveObjectPlacement } from "../src/spatialPlacement";
import { PlacedObject } from "../src/types";

const room = { width: 5, depth: 4, height: 2.7 };
const desk: PlacedObject = {
  id: "desk",
  catalogId: "desk",
  name: "Mesa de Trabalho",
  category: "Residencial",
  subcategory: "Escritório",
  x: 1,
  y: 1,
  width: 1.4,
  depth: 0.7,
  height: 0.75,
  rotation: 0,
  price: 1200,
  manufacturer: "POC",
  material: "Madeira",
};

const chair: PlacedObject = {
  ...desk,
  id: "chair",
  catalogId: "chair",
  name: "Cadeira operacional",
  x: 3,
  y: 2,
  width: 0.65,
  depth: 0.65,
  height: 1.1,
};

const snapped = resolveObjectPlacement(chair, { x: 0.123, y: 0.126 }, room, [desk, chair]);
assert.deepEqual(snapped.update, { x: 0.1, y: 0.15, rotation: 0 });

const clamped = resolveObjectPlacement(chair, { x: 99, y: -4 }, room, [chair]);
assert.equal(clamped.update.x, 4.35);
assert.equal(clamped.update.y, 0);

const collision = resolveObjectPlacement(chair, { x: 1.2, y: 1.05 }, room, [desk, chair]);
assert.equal(collision.valid, false);
assert.equal(collision.conflictingObject?.id, "desk");

const rotated = getRotatedFootprint(desk, 90);
assert.equal(rotated.width, 0.7);
assert.equal(rotated.depth, 1.4);

console.log("Spatial placement checks passed.");

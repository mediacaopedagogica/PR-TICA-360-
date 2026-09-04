import * as THREE from 'three';
import { Material as ProjectMaterial } from './types';

const seeded = (x: number, y: number) => {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

function makeCanvasTexture(baseHex: string, kind: 'wood' | 'tile' | 'wall' | 'generic') {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const base = new THREE.Color(baseHex);
  const image = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let variation = (seeded(x, y) - 0.5) * 0.05;
      if (kind === 'wood') variation += Math.sin((x / 256) * Math.PI * 18 + Math.sin(y * 0.08)) * 0.035;
      if (kind === 'wall') variation *= 0.35;
      const c = base.clone().offsetHSL(0, 0, variation);
      image.data[i] = Math.round(c.r * 255);
      image.data[i + 1] = Math.round(c.g * 255);
      image.data[i + 2] = Math.round(c.b * 255);
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  if (kind === 'tile') {
    ctx.strokeStyle = 'rgba(80,80,80,0.16)';
    ctx.lineWidth = 2;
    for (let p = 0; p <= size; p += 64) {
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function classify(material: ProjectMaterial | null, surface: 'floor' | 'wall') {
  const text = `${material?.name || ''} ${material?.category || ''} ${material?.material || ''}`.toLocaleLowerCase('pt-BR');
  if (/madeira|laminado|mdf|carvalho|nogueira/.test(text)) return 'wood' as const;
  if (/porcelanato|cer[aâ]mica|pedra|m[aá]rmore|granito/.test(text)) return 'tile' as const;
  return surface === 'wall' ? 'wall' as const : 'generic' as const;
}

export function createSurfaceMaterial(material: ProjectMaterial | null, fallback: string, surface: 'floor' | 'wall') {
  const color = material?.color || fallback;
  const kind = classify(material, surface);
  const map = makeCanvasTexture(color, kind);
  map.repeat.set(kind === 'wood' ? 3 : kind === 'tile' ? 4 : 2, kind === 'wood' ? 5 : kind === 'tile' ? 4 : 2);

  const roughness = kind === 'tile' ? 0.38 : kind === 'wood' ? 0.58 : surface === 'wall' ? 0.9 : 0.68;
  const mat = new THREE.MeshStandardMaterial({
    map,
    color: 0xffffff,
    roughness,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  mat.userData.ownedTexture = map;
  return mat;
}

export function disposeSurfaceMaterial(material: THREE.MeshStandardMaterial) {
  const texture = material.userData.ownedTexture as THREE.Texture | undefined;
  texture?.dispose();
  material.dispose();
}

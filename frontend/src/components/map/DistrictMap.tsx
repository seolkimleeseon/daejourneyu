"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DaejeonDistrict } from "@/types";

interface DistrictMapProps {
  onSelect: (district: DaejeonDistrict) => void;
}

interface Region {
  district: DaejeonDistrict;
  slug: "yuseong" | "daedeok" | "seo" | "jung" | "dong";
  /** map_base.png(720x720) 기준 구 중심 좌표의 비율(0~1). 판정 마스크를 만들 때 군집 시작점으로
   *  쓰고, 키보드 포커스용 히트스팟 위치로도 쓴다. */
  seed: [number, number];
}

const CANVAS_SIZE = 720;
const NONE = 255;

const REGIONS: Region[] = [
  { district: "유성구", slug: "yuseong", seed: [189 / CANVAS_SIZE, 345 / CANVAS_SIZE] },
  { district: "대덕구", slug: "daedeok", seed: [363 / CANVAS_SIZE, 203 / CANVAS_SIZE] },
  { district: "동구", slug: "dong", seed: [490 / CANVAS_SIZE, 270 / CANVAS_SIZE] },
  { district: "중구", slug: "jung", seed: [487 / CANVAS_SIZE, 520 / CANVAS_SIZE] },
  { district: "서구", slug: "seo", seed: [297 / CANVAS_SIZE, 507 / CANVAS_SIZE] },
];

/** RGB의 색상(hue, 0~360도)만 뽑아 단위원 위 좌표(cosθ, sinθ)로 바꾼다. */
function hueVector(r: number, g: number, b: number): [number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return [1, 0];
  let h: number;
  if (max === r) h = 60 * (((g - b) / delta) % 6);
  else if (max === g) h = 60 * ((b - r) / delta + 2);
  else h = 60 * ((r - g) / delta + 4);
  if (h < 0) h += 360;
  const rad = (h * Math.PI) / 180;
  return [Math.cos(rad), Math.sin(rad)];
}

/**
 * map_base.png의 불투명 픽셀 전부를 5개 구 색상 군집(k-means)으로 분류해, 픽셀 좌표 → 구 인덱스
 * 룩업 테이블을 만든다. 구마다 내부에 하이라이트/그림자 음영이 있어 RGB를 그대로 비교하면(특히
 * 대덕구의 청록색과 동구의 파란색처럼 밝기만 다르고 색상은 가까운 쌍에서) 경계 근처 오판정이
 * 잦았다. 밝기·채도는 그림자/하이라이트로 픽셀마다 크게 흔들리지만 색상(hue)은 거의 그대로
 * 유지되므로, RGB가 아니라 hue만 군집 특징으로 쓴다. 군집 시작점을 REGIONS.seed(각 구 중심
 * 좌표)에서 뽑기 때문에, 수렴 후에도 군집 i는 항상 REGIONS[i]에 대응한다.
 */
function buildDistrictMask(data: Uint8ClampedArray): Uint8Array {
  const mask = new Uint8Array(CANVAS_SIZE * CANVAS_SIZE).fill(NONE);
  const centroids = REGIONS.map((region) => {
    const x = Math.round(region.seed[0] * CANVAS_SIZE);
    const y = Math.round(region.seed[1] * CANVAS_SIZE);
    const i = (y * CANVAS_SIZE + x) * 4;
    return hueVector(data[i], data[i + 1], data[i + 2]);
  });

  const STRIDE = 2;
  const samples: number[] = [];
  for (let y = 0; y < CANVAS_SIZE; y += STRIDE) {
    for (let x = 0; x < CANVAS_SIZE; x += STRIDE) {
      const i = (y * CANVAS_SIZE + x) * 4;
      if (data[i + 3] < 128) continue;
      const [hx, hy] = hueVector(data[i], data[i + 1], data[i + 2]);
      samples.push(hx, hy);
    }
  }

  for (let iter = 0; iter < 6; iter++) {
    const sums = centroids.map(() => [0, 0, 0]);
    for (let s = 0; s < samples.length; s += 2) {
      const hx = samples[s];
      const hy = samples[s + 1];
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const [cx, cy] = centroids[c];
        const dist = (hx - cx) ** 2 + (hy - cy) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      sums[best][0] += hx;
      sums[best][1] += hy;
      sums[best][2] += 1;
    }
    for (let c = 0; c < centroids.length; c++) {
      if (sums[c][2] > 0) {
        centroids[c] = [sums[c][0] / sums[c][2], sums[c][1] / sums[c][2]];
      }
    }
  }

  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const i = (y * CANVAS_SIZE + x) * 4;
      if (data[i + 3] < 128) continue;
      const [hx, hy] = hueVector(data[i], data[i + 1], data[i + 2]);
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const [cx, cy] = centroids[c];
        const dist = (hx - cx) ** 2 + (hy - cy) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      mask[y * CANVAS_SIZE + x] = best;
    }
  }

  return smoothMask(mask);
}

/**
 * 경계 부근은 안티앨리어싱으로 두 구 색이 섞여 픽셀 단위로 판정이 튀기 쉽다(마우스를 천천히
 * 그으면 경계를 여러 번 넘나들어 딸깍거리듯 hover가 튐). 각 픽셀을 주변 5x5 이웃의 다수결로
 * 다시 채워 경계를 매끈한 곡선으로 다듬는다.
 */
function smoothMask(mask: Uint8Array): Uint8Array {
  const RADIUS = 3;
  const smoothed = new Uint8Array(mask.length);
  const counts = new Int32Array(REGIONS.length);
  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const idx = y * CANVAS_SIZE + x;
      if (mask[idx] === NONE) {
        smoothed[idx] = NONE;
        continue;
      }
      counts.fill(0);
      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= CANVAS_SIZE) continue;
        const rowOffset = ny * CANVAS_SIZE;
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= CANVAS_SIZE) continue;
          const label = mask[rowOffset + nx];
          if (label !== NONE) counts[label]++;
        }
      }
      let best = mask[idx];
      let bestCount = -1;
      for (let c = 0; c < counts.length; c++) {
        if (counts[c] > bestCount) {
          bestCount = counts[c];
          best = c;
        }
      }
      smoothed[idx] = best;
    }
  }
  return smoothed;
}

/**
 * 디자이너가 만든 실사 블롭 지도 이미지(투명 배경 PNG 6장: 평면 상태 1장 + 구별로 튀어나온 상태
 * 5장)를 겹쳐서 쓴다. 포인터가 지도 위 어디 있는지는 평면 이미지 전체 픽셀을 학습해 만든 판정
 * 마스크로 확인하므로(사각형 히트박스가 아님), 블롭끼리 맞닿은 경계에서도 정확히 반응한다.
 *
 * 누르면 바로 다음 화면으로 넘어가지 않고 "선택" 상태로 고정해 튀어나온 이미지를 계속 보여주다가,
 * 아래에 나타나는 버튼을 한 번 더 눌러야 실제로 이동한다 — 무엇을 골랐는지 바로 사라지지 않고
 * 눈에 보이게 하기 위해서다.
 */
export function DistrictMap({ onSelect }: DistrictMapProps) {
  const maskRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<DaejeonDistrict | null>(null);
  const [selected, setSelected] = useState<DaejeonDistrict | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const img = new Image();
    img.src = "/map/map_base.png";
    img.onload = () => {
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      const { data } = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      maskRef.current = buildDistrictMask(data);
      setReady(true);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const regionAt = (clientX: number, clientY: number, target: Element): Region | null => {
    const mask = maskRef.current;
    if (!mask) return null;
    const rect = target.getBoundingClientRect();
    const px = Math.floor(((clientX - rect.left) / rect.width) * CANVAS_SIZE);
    const py = Math.floor(((clientY - rect.top) / rect.height) * CANVAS_SIZE);
    if (px < 0 || py < 0 || px >= CANVAS_SIZE || py >= CANVAS_SIZE) return null;
    const index = mask[py * CANVAS_SIZE + px];
    return index === NONE ? null : REGIONS[index];
  };

  // 지도 위에 포인터가 있을 땐 실시간 미리보기(hovered)를 우선 보여주고, 포인터가 지도를 벗어나면
  // 방금 고른 구(selected)가 계속 튀어나온 채로 남아 있어야 아래 확인 버튼과 함께 또렷이 보인다.
  const active = hovered ?? selected;

  return (
    <Card className="flex flex-col items-center p-4">
      <div
        className="relative w-full aspect-square"
        style={{ cursor: ready && active ? "pointer" : "default" }}
        onPointerMove={(event) => {
          if (!ready) return;
          const { clientX, clientY, currentTarget } = event;
          if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const region = regionAt(clientX, clientY, currentTarget);
            setHovered(region?.district ?? null);
          });
        }}
        onPointerLeave={() => {
          if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
          setHovered(null);
        }}
        onPointerDown={(event) => {
          if (!ready) return;
          const region = regionAt(event.clientX, event.clientY, event.currentTarget);
          if (region) setSelected(region.district);
        }}
      >
        <img src="/map/map_base.png" alt="" draggable={false} className="absolute inset-0 h-full w-full select-none" />
        {REGIONS.map((region) => (
          <img
            key={region.slug}
            src={`/map/map_${region.slug}.png`}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full select-none transition-[opacity,transform] duration-200 ease-out"
            style={{
              opacity: active === region.district ? 1 : 0,
              transform: active === region.district ? "scale(1)" : "scale(0.98)",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        ))}
        {REGIONS.map((region) => (
          <button
            key={`kbd-${region.slug}`}
            type="button"
            aria-label={`${region.district} 선택`}
            className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ink"
            style={{ left: `${region.seed[0] * 100}%`, top: `${region.seed[1] * 100}%` }}
            onFocus={() => setHovered(region.district)}
            onBlur={() => setHovered((prev) => (prev === region.district ? null : prev))}
            onClick={() => setSelected(region.district)}
          />
        ))}
      </div>

      <div className="mt-4 w-full">
        <Button
          type="button"
          variant={selected ? "primary" : "secondary"}
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          {selected ? `${selected} 둘러보기` : "구를 선택해 주세요"}
        </Button>
      </div>
    </Card>
  );
}

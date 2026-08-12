"use client";

import type { Pet } from "@/types";
import { Tag } from "@/components/ui/Tag";

interface PetSwitcherProps {
  pets: Pet[];
  activeIndex: number;
  onSwitch: (index: number) => void;
  onAddPet: () => void;
}

export function PetSwitcher({ pets, activeIndex, onSwitch, onAddPet }: PetSwitcherProps) {
  if (pets.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 py-3">
      {pets.map((pet, index) => (
        <Tag key={pet.id} active={index === activeIndex} onClick={() => onSwitch(index)}>
          {pet.name}
        </Tag>
      ))}
      <Tag onClick={onAddPet}>+ 반려동물 추가</Tag>
    </div>
  );
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePetStore } from "@/stores/usePetStore";
import { makeMbtiResult, makePet } from "@/test/fixtures";

const api = vi.hoisted(() => ({
  fetchPets: vi.fn(),
  createPetRequest: vi.fn(),
  updatePetRequest: vi.fn(),
  deletePetRequest: vi.fn(),
  savePetMbtiApi: vi.fn(),
}));
vi.mock("@/lib/api/pets", () => api);

const kongi = makePet({ id: "pet-1", name: "콩이" });
const dubu = makePet({ id: "pet-2", name: "두부" });
const bori = makePet({ id: "pet-3", name: "보리" });

const input = {
  name: "보리",
  breed: "시바견",
  weightKg: 9,
  ageYears: 5,
  size: "중형견" as const,
  emoji: "🐕",
};

beforeEach(() => {
  vi.clearAllMocks();
  usePetStore.setState({ pets: [], activePetIndex: 0, hydrated: false });
});

describe("activePet", () => {
  it("인덱스가 가리키는 반려동물을 준다", () => {
    usePetStore.setState({ pets: [kongi, dubu], activePetIndex: 1 });

    expect(usePetStore.getState().activePet()).toEqual(dubu);
  });

  it("등록된 게 없으면 null", () => {
    expect(usePetStore.getState().activePet()).toBeNull();
  });
});

describe("hydrate", () => {
  it("서버 목록을 받아 hydrated를 켠다", async () => {
    api.fetchPets.mockResolvedValue([kongi, dubu]);

    await usePetStore.getState().hydrate();

    expect(usePetStore.getState()).toMatchObject({ pets: [kongi, dubu], hydrated: true });
  });

  it("목록이 줄어 있으면 활성 인덱스를 범위 안으로 당긴다", async () => {
    usePetStore.setState({ pets: [kongi, dubu, bori], activePetIndex: 2 });
    api.fetchPets.mockResolvedValue([kongi]);

    await usePetStore.getState().hydrate();

    expect(usePetStore.getState().activePetIndex).toBe(0);
  });

  it("목록이 비어도 인덱스는 음수가 되지 않는다", async () => {
    usePetStore.setState({ pets: [kongi], activePetIndex: 0 });
    api.fetchPets.mockResolvedValue([]);

    await usePetStore.getState().hydrate();

    expect(usePetStore.getState().activePetIndex).toBe(0);
  });
});

describe("addPet", () => {
  it("방금 등록한 반려동물을 활성으로 둔다", async () => {
    usePetStore.setState({ pets: [kongi], activePetIndex: 0 });
    api.createPetRequest.mockResolvedValue({ ok: true, pet: bori });

    const result = await usePetStore.getState().addPet(input);

    expect(result).toEqual({ ok: true, pet: bori });
    expect(usePetStore.getState()).toMatchObject({ pets: [kongi, bori], activePetIndex: 1 });
  });

  it("실패하면 목록을 건드리지 않는다", async () => {
    usePetStore.setState({ pets: [kongi], activePetIndex: 0 });
    api.createPetRequest.mockResolvedValue({ ok: false, message: "등록 실패" });

    await usePetStore.getState().addPet(input);

    expect(usePetStore.getState().pets).toEqual([kongi]);
  });
});

describe("updatePet / saveMbti", () => {
  it("수정한 개체만 갈아끼우고 순서는 유지한다", async () => {
    const renamed = makePet({ id: "pet-1", name: "콩순이" });
    usePetStore.setState({ pets: [kongi, dubu], activePetIndex: 1 });
    api.updatePetRequest.mockResolvedValue({ ok: true, pet: renamed });

    await usePetStore.getState().updatePet("pet-1", input);

    expect(usePetStore.getState().pets).toEqual([renamed, dubu]);
    expect(usePetStore.getState().activePetIndex).toBe(1);
  });

  it("MBTI 저장도 해당 개체만 갱신한다", async () => {
    const mbti = makeMbtiResult();
    const withMbti = makePet({ id: "pet-2", name: "두부", mbti });
    usePetStore.setState({ pets: [kongi, dubu], activePetIndex: 1 });
    api.savePetMbtiApi.mockResolvedValue({ ok: true, pet: withMbti });

    await usePetStore.getState().saveMbti("pet-2", mbti);

    expect(usePetStore.getState().pets).toEqual([kongi, withMbti]);
  });
});

describe("removePet", () => {
  it("지운 개체를 목록에서 뺀다", async () => {
    usePetStore.setState({ pets: [kongi, dubu], activePetIndex: 0 });
    api.deletePetRequest.mockResolvedValue({ ok: true });

    await usePetStore.getState().removePet("pet-1");

    expect(usePetStore.getState().pets).toEqual([dubu]);
  });

  it("마지막 개체를 지우면 활성 인덱스가 범위 밖으로 나가지 않는다", async () => {
    usePetStore.setState({ pets: [kongi, dubu, bori], activePetIndex: 2 });
    api.deletePetRequest.mockResolvedValue({ ok: true });

    await usePetStore.getState().removePet("pet-3");

    expect(usePetStore.getState().activePetIndex).toBe(1);
    expect(usePetStore.getState().activePet()).toEqual(dubu);
  });

  it("하나뿐인 개체를 지워도 인덱스는 0으로 남는다", async () => {
    usePetStore.setState({ pets: [kongi], activePetIndex: 0 });
    api.deletePetRequest.mockResolvedValue({ ok: true });

    await usePetStore.getState().removePet("pet-1");

    expect(usePetStore.getState()).toMatchObject({ pets: [], activePetIndex: 0 });
    expect(usePetStore.getState().activePet()).toBeNull();
  });

  it("활성 개체보다 앞을 지워도 보고 있던 개체가 그대로 활성으로 남는다", async () => {
    usePetStore.setState({ pets: [kongi, dubu, bori], activePetIndex: 1 });
    api.deletePetRequest.mockResolvedValue({ ok: true });

    await usePetStore.getState().removePet("pet-1");

    expect(usePetStore.getState().activePetIndex).toBe(0);
    expect(usePetStore.getState().activePet()).toEqual(dubu);
  });

  it("활성 개체보다 뒤를 지우면 인덱스는 그대로다", async () => {
    usePetStore.setState({ pets: [kongi, dubu, bori], activePetIndex: 1 });
    api.deletePetRequest.mockResolvedValue({ ok: true });

    await usePetStore.getState().removePet("pet-3");

    expect(usePetStore.getState().activePetIndex).toBe(1);
    expect(usePetStore.getState().activePet()).toEqual(dubu);
  });

  it("실패하면 목록을 건드리지 않는다", async () => {
    usePetStore.setState({ pets: [kongi, dubu], activePetIndex: 1 });
    api.deletePetRequest.mockResolvedValue({ ok: false, message: "삭제 실패" });

    await usePetStore.getState().removePet("pet-2");

    expect(usePetStore.getState().pets).toEqual([kongi, dubu]);
  });
});

describe("clear", () => {
  it("로그아웃하면 목록과 hydrated를 함께 비운다", () => {
    usePetStore.setState({ pets: [kongi, dubu], activePetIndex: 1, hydrated: true });

    usePetStore.getState().clear();

    expect(usePetStore.getState()).toMatchObject({
      pets: [],
      activePetIndex: 0,
      hydrated: false,
    });
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PetRegisterForm } from "@/components/onboarding/PetRegisterForm";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";
import { makePet } from "@/test/fixtures";

/** 수정 화면의 '여행 유형' 칸(PetMbtiCard)이 재검사로 보낼 때 라우터를 쓴다. */
const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const addPet = vi.fn();
const updatePet = vi.fn();
const removePet = vi.fn();

const kongi = makePet({
  id: "pet-1",
  name: "콩이",
  breed: "말티즈",
  weightKg: 3,
  ageYears: 4,
  size: "소형견",
  emoji: "🐕",
});

beforeEach(() => {
  vi.clearAllMocks();
  addPet.mockResolvedValue({ ok: true, pet: kongi });
  updatePet.mockResolvedValue({ ok: true, pet: kongi });
  usePetStore.setState({ pets: [], activePetIndex: 0, hydrated: true, addPet, updatePet, removePet });
  useToastStore.setState({ message: null });
});

function renderCreate() {
  const onCompleted = vi.fn();
  render(<PetRegisterForm mode="create" onCompleted={onCompleted} />);
  return { onCompleted, user: userEvent.setup() };
}

/** 필수 입력만 채운다. 견종은 자동완성 후보를 건드리지 않도록 목록에 없는 값을 쓴다. */
async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("이름"), "콩이");
  await user.type(screen.getByLabelText("견종"), "우리집믹스");
  await user.keyboard("{Escape}");
  await user.type(screen.getByLabelText(/몸무게/), "3");
  await user.type(screen.getByLabelText(/나이/), "4");
}

describe("등록(create)", () => {
  it("필수 입력을 채우면 등록하고 완료 콜백을 부른다", async () => {
    const { user, onCompleted } = renderCreate();

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(addPet).toHaveBeenCalledWith({
      name: "콩이",
      breed: "우리집믹스",
      weightKg: 3,
      ageYears: 4,
      size: "소형견",
      emoji: "🐕",
    });
    expect(useToastStore.getState().message).toBe("콩이 등록을 마쳤어요");
    expect(onCompleted).toHaveBeenCalled();
  });

  it("이름·견종의 앞뒤 공백은 잘라 보낸다", async () => {
    const { user } = renderCreate();

    await user.type(screen.getByLabelText("이름"), "  콩이  ");
    await user.type(screen.getByLabelText("견종"), " 우리집믹스 ");
    await user.keyboard("{Escape}");
    await user.type(screen.getByLabelText(/몸무게/), "3");
    await user.type(screen.getByLabelText(/나이/), "4");
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(addPet).toHaveBeenCalledWith(
      expect.objectContaining({ name: "콩이", breed: "우리집믹스" })
    );
  });

  it("빈 폼으로 제출하면 서버까지 가지 않고 필드별로 알린다", async () => {
    const { user } = renderCreate();

    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(screen.getByText("이름을 입력해주세요")).toBeTruthy();
    expect(screen.getByText("견종을 입력해주세요")).toBeTruthy();
    expect(screen.getByText(/몸무게를 0보다 큰 숫자로/)).toBeTruthy();
    expect(screen.getByText(/나이를 0 이상 숫자로/)).toBeTruthy();
    expect(addPet).not.toHaveBeenCalled();
  });

  it.each([
    ["숫자가 아닌 몸무게", "몸무게", "무거움", /몸무게를 0보다 큰 숫자로/],
    ["오타로 과한 몸무게", "몸무게", "2800", /몸무게는 200kg 이하로/],
    ["음수 나이", "나이", "-1", /나이를 0 이상 숫자로/],
    ["과한 나이", "나이", "80", /나이는 50살 이하로/],
  ])("%s는 서버 왕복 없이 막는다", async (_label, field, value, message) => {
    const { user } = renderCreate();

    await user.type(screen.getByLabelText("이름"), "콩이");
    await user.type(screen.getByLabelText("견종"), "우리집믹스");
    await user.keyboard("{Escape}");
    await user.type(screen.getByLabelText(/몸무게/), "몸무게" === field ? value : "3");
    await user.type(screen.getByLabelText(/나이/), "나이" === field ? value : "4");
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(screen.getByText(message)).toBeTruthy();
    expect(addPet).not.toHaveBeenCalled();
  });

  it("서버가 필드 오류를 주면 폼에 붙이고, 메시지만 오면 한 줄로 띄운다", async () => {
    const { user } = renderCreate();
    addPet.mockResolvedValue({ ok: false, errors: { name: "이름을 확인해주세요" } });

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "등록하기" }));
    expect(screen.getByText("이름을 확인해주세요")).toBeTruthy();

    addPet.mockResolvedValue({ ok: false, message: "서버에 연결할 수 없어요" });
    await user.click(screen.getByRole("button", { name: "등록하기" }));
    expect(screen.getByText("서버에 연결할 수 없어요")).toBeTruthy();
  });

  it("실패하면 화면을 벗어나지 않는다", async () => {
    const { user, onCompleted } = renderCreate();
    addPet.mockResolvedValue({ ok: false, message: "실패" });

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(onCompleted).not.toHaveBeenCalled();
  });

  it("아바타를 고른 대로 보낸다", async () => {
    const { user } = renderCreate();

    await fillRequired(user);
    await user.click(screen.getByRole("button", { name: "🐩" }));
    await user.click(screen.getByRole("button", { name: "등록하기" }));

    expect(addPet).toHaveBeenCalledWith(expect.objectContaining({ emoji: "🐩" }));
  });

  it("등록 화면에는 삭제 버튼이 없다", () => {
    renderCreate();

    expect(screen.queryByRole("button", { name: "삭제하기" })).toBeNull();
  });
});

describe("크기 자동 채우기", () => {
  it("몸무게만 입력해도 크기를 제안한다", async () => {
    const { user } = renderCreate();

    await user.type(screen.getByLabelText(/몸무게/), "18");

    expect(screen.getByRole("button", { name: "중형견" }).className).toContain("bg-brand");
  });

  it("크기를 직접 고른 뒤에는 몸무게를 바꿔도 덮어쓰지 않는다", async () => {
    const { user } = renderCreate();

    await user.click(screen.getByRole("button", { name: "대형견" }));
    await user.type(screen.getByLabelText(/몸무게/), "3");

    expect(screen.getByRole("button", { name: "대형견" }).className).toContain("bg-brand");
  });

  it("목록에서 고른 견종은 몸무게 추정보다 우선한다", async () => {
    const { user } = renderCreate();

    await user.type(screen.getByLabelText("견종"), "골든리트리버");
    await user.click(screen.getByRole("option", { name: /골든리트리버/ }));
    await user.type(screen.getByLabelText(/몸무게/), "3");

    expect(screen.getByRole("button", { name: "대형견" }).className).toContain("bg-brand");
  });

  it("믹스견처럼 체형이 정해지지 않는 견종은 크기를 단정하지 않는다", async () => {
    const { user } = renderCreate();

    await user.type(screen.getByLabelText(/몸무게/), "18");
    await user.type(screen.getByLabelText("견종"), "믹스견");
    await user.click(screen.getByRole("option", { name: /믹스견/ }));

    // 견종 선택이 크기를 건드리지 않았으므로 몸무게가 제안한 값이 남는다.
    expect(screen.getByRole("button", { name: "중형견" }).className).toContain("bg-brand");
  });
});

describe("수정(edit)", () => {
  function renderEdit(petId = "pet-1") {
    const onCompleted = vi.fn();
    render(<PetRegisterForm mode="edit" petId={petId} onCompleted={onCompleted} />);
    return { onCompleted, user: userEvent.setup() };
  }

  it("기존 값을 채워 보여준다", () => {
    usePetStore.setState({ pets: [kongi] });
    renderEdit();

    expect((screen.getByLabelText("이름") as HTMLInputElement).value).toBe("콩이");
    expect((screen.getByLabelText("견종") as HTMLInputElement).value).toBe("말티즈");
    expect((screen.getByLabelText(/몸무게/) as HTMLInputElement).value).toBe("3");
    expect((screen.getByLabelText(/나이/) as HTMLInputElement).value).toBe("4");
  });

  it("목록이 아직 안 왔으면 빈 폼 대신 로딩을 보여준다", () => {
    usePetStore.setState({ pets: [], hydrated: false });
    renderEdit();

    expect(screen.getByText("불러오는 중…")).toBeTruthy();
    expect(screen.queryByLabelText("이름")).toBeNull();
  });

  it("목록은 왔는데 대상이 없으면 돌아갈 길을 준다", async () => {
    usePetStore.setState({ pets: [kongi], hydrated: true });
    const { user, onCompleted } = renderEdit("pet-사라짐");

    expect(screen.getByText("수정할 반려동물을 찾을 수 없어요.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "돌아가기" }));

    expect(onCompleted).toHaveBeenCalled();
  });

  it("목록이 늦게 도착해도 폼을 채운다 — 새로고침으로 바로 들어온 경우", () => {
    usePetStore.setState({ pets: [], hydrated: false });
    const { rerender } = render(
      <PetRegisterForm mode="edit" petId="pet-1" onCompleted={vi.fn()} />
    ) as unknown as { rerender: (ui: React.ReactElement) => void };

    usePetStore.setState({ pets: [kongi], hydrated: true });
    rerender(<PetRegisterForm mode="edit" petId="pet-1" onCompleted={vi.fn()} />);

    expect((screen.getByLabelText("이름") as HTMLInputElement).value).toBe("콩이");
  });

  it("수정하면 updatePet을 부르고 등록으로 새지 않는다", async () => {
    usePetStore.setState({ pets: [kongi] });
    const { user, onCompleted } = renderEdit();

    await user.clear(screen.getByLabelText("이름"));
    await user.type(screen.getByLabelText("이름"), "콩순이");
    await user.click(screen.getByRole("button", { name: "수정 완료" }));

    expect(updatePet).toHaveBeenCalledWith("pet-1", expect.objectContaining({ name: "콩순이" }));
    expect(addPet).not.toHaveBeenCalled();
    expect(useToastStore.getState().message).toBe("콩순이의 정보를 수정했어요");
    expect(onCompleted).toHaveBeenCalled();
  });

  it("수정 화면에서만 삭제로 갈 수 있다", async () => {
    usePetStore.setState({ pets: [kongi] });
    const { user } = renderEdit();

    await user.click(screen.getByRole("button", { name: "삭제하기" }));

    expect(screen.getByText("콩이을(를) 삭제할까요?")).toBeTruthy();
  });
});

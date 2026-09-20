import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResultShareActions } from "@/components/course/ResultShareActions";
import { useToastStore } from "@/stores/useToastStore";

const capture = vi.hoisted(() => ({ saveElementAsImage: vi.fn(), captureElementAsFile: vi.fn() }));
vi.mock("@/lib/captureImage", () => ({
  saveElementAsImage: capture.saveElementAsImage,
  captureElementAsFile: capture.captureElementAsFile,
}));

const kakao = vi.hoisted(() => ({ shareTextToKakao: vi.fn(), shareImageToKakao: vi.fn() }));
vi.mock("@/lib/kakao", () => ({
  shareTextToKakao: kakao.shareTextToKakao,
  shareImageToKakao: kakao.shareImageToKakao,
}));

const target = document.createElement("div");
const capturedFile = new File(["png"], "유성-산책-코스.png", { type: "image/png" });

function setup(props: Partial<React.ComponentProps<typeof ResultShareActions>> = {}) {
  render(
    <ResultShareActions
      captureRef={{ current: target }}
      fileName="유성-산책-코스"
      kakaoTitle="유성 산책 코스"
      kakaoDescription="당일치기 · 3곳"
      {...props}
    />
  );
  return { user: userEvent.setup() };
}

/** 저장 버튼은 진행 중에 문구가 "저장 중..."으로 바뀌어서 이름으로 못 잡는다 — 자리로 고른다. */
const saveButton = () => screen.getAllByRole("button")[0];
const shareButton = () => screen.getByRole("button", { name: /카카오톡 공유/ });

beforeEach(() => {
  vi.clearAllMocks();
  useToastStore.setState({ message: null, key: 0 });
  capture.saveElementAsImage.mockResolvedValue(true);
  capture.captureElementAsFile.mockResolvedValue(capturedFile);
  kakao.shareTextToKakao.mockReturnValue({ ok: true });
  kakao.shareImageToKakao.mockResolvedValue({ ok: true });
});

describe("이미지 저장", () => {
  it("캡처할 영역과 파일명을 그대로 넘긴다", async () => {
    const { user } = setup();

    await user.click(saveButton());

    expect(capture.saveElementAsImage).toHaveBeenCalledWith(target, "유성-산책-코스");
  });

  it("성공하면 저장했다고 알린다", async () => {
    const { user } = setup();

    await user.click(saveButton());

    await waitFor(() => expect(useToastStore.getState().message).toBe("이미지로 저장했어요 🖼️"));
  });

  it("실패해도 조용히 끝내지 않고 다시 해보라고 알린다", async () => {
    capture.saveElementAsImage.mockResolvedValue(false);
    const { user } = setup();

    await user.click(saveButton());

    await waitFor(() => expect(useToastStore.getState().message).toContain("이미지 저장에 실패했어요"));
  });

  it("만드는 동안 버튼을 잠가 두 번 눌리지 않게 한다", async () => {
    let finish = (_ok: boolean) => {};
    capture.saveElementAsImage.mockReturnValue(new Promise<boolean>((resolve) => (finish = resolve)));
    const { user } = setup();

    await user.click(saveButton());

    expect(screen.getByText("저장 중...")).toBeTruthy();
    expect(saveButton().hasAttribute("disabled")).toBe(true);
    expect(useToastStore.getState().message).toBe("이미지를 만드는 중이에요...");

    finish(true);
    await waitFor(() => expect(saveButton().hasAttribute("disabled")).toBe(false));
  });

});

describe("카카오톡 공유", () => {
  it("결과 화면을 캡처해 제목·설명·이동 경로와 함께 넘긴다 — 말풍선 미리보기에 쓸 이미지다", async () => {
    const { user } = setup({ path: "/schedule/course/course-1" });

    await user.click(shareButton());

    expect(capture.captureElementAsFile).toHaveBeenCalledWith(target, "유성-산책-코스");
    await waitFor(() =>
      expect(kakao.shareImageToKakao).toHaveBeenCalledWith({
        title: "유성 산책 코스",
        description: "당일치기 · 3곳",
        path: "/schedule/course/course-1",
        file: capturedFile,
      })
    );
  });

  it("아직 저장 전이라 갈 곳이 없으면 경로 없이 부른다", async () => {
    const { user } = setup();

    await user.click(shareButton());

    await waitFor(() =>
      expect(kakao.shareImageToKakao).toHaveBeenCalledWith(expect.objectContaining({ path: undefined }))
    );
  });

  it("캡처가 안 되면 이미지 없이 텍스트로라도 연다 — 공유창까지 막히면 안 된다", async () => {
    capture.captureElementAsFile.mockResolvedValue(null);
    const { user } = setup();

    await user.click(shareButton());

    await waitFor(() => expect(kakao.shareTextToKakao).toHaveBeenCalled());
    expect(kakao.shareImageToKakao).not.toHaveBeenCalled();
  });

  it("만드는 동안 버튼을 잠가 두 번 눌리지 않게 한다", async () => {
    let finish = (_file: File | null) => {};
    capture.captureElementAsFile.mockReturnValue(new Promise<File | null>((resolve) => (finish = resolve)));
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /카카오톡 공유/ }));

    const sharing = screen.getByRole("button", { name: /여는 중/ });
    expect(sharing.hasAttribute("disabled")).toBe(true);

    finish(capturedFile);
    await waitFor(() => expect(shareButton().hasAttribute("disabled")).toBe(false));
  });

  it("열리면 토스트로 방해하지 않는다", async () => {
    const { user } = setup();

    await user.click(shareButton());

    await waitFor(() => expect(kakao.shareImageToKakao).toHaveBeenCalled());
    expect(useToastStore.getState().message).toBeNull();
  });

  it("못 열면 사유를 그대로 알려준다", async () => {
    kakao.shareImageToKakao.mockResolvedValue({ ok: false, reason: "카카오 SDK를 아직 불러오지 못했어요" });
    const { user } = setup();

    await user.click(shareButton());

    await waitFor(() =>
      expect(useToastStore.getState().message).toBe("카카오 SDK를 아직 불러오지 못했어요")
    );
  });

  it("사유를 모르면 기본 문구라도 남긴다", async () => {
    kakao.shareImageToKakao.mockResolvedValue({ ok: false });
    const { user } = setup();

    await user.click(shareButton());

    await waitFor(() => expect(useToastStore.getState().message).toBe("카카오톡 공유를 열지 못했어요"));
  });
});

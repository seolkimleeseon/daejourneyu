"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Tag } from "@/components/ui/Tag";
import { PostSaveBar } from "@/components/feed/PostSaveBar";
import { useDeletePost, usePost, useUpdatePost } from "@/hooks/usePosts";
import { useToastStore } from "@/stores/useToastStore";
import { formatPostDate, visiblePostTags } from "@/lib/feed";

/** journeyPostDetail — 둘러보기에서 진입하는 공유 코스 상세. */
export default function FeedPostDetailPage() {
  const params = useParams<{ postId: string }>();
  const postId = params.postId;
  const router = useRouter();
  const { data: post, isLoading } = usePost(postId);
  const showToast = useToastStore((state) => state.show);

  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();
  /** 수정 중에는 입력값을 화면이 들고 있다가 저장할 때만 서버로 보낸다. */
  const [draft, setDraft] = useState<{ caption: string; text: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <>
        <TopBar title="공유 코스" showBack />
        <div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <TopBar title="공유 코스" showBack />
        <div className="px-4 py-10 text-center text-xs text-ink-muted">
          게시물을 찾을 수 없어요.
          <div className="mt-3">
            <Link href="/feed" className="text-brand-700 underline">
              둘러보기로 돌아가기
            </Link>
          </div>
        </div>
      </>
    );
  }

  // 목록 카드와 같은 기준으로 거른다 — 같은 글이 화면마다 다른 태그를 달고 있으면 더 헷갈린다.
  const tags = visiblePostTags(post.tags);

  const saveEdit = async () => {
    if (!draft) return;
    const caption = draft.caption.trim();
    // 코스 이름은 목록 카드의 제목이라 비워둘 수 없다.
    if (caption.length === 0) return showToast("코스 이름을 입력해주세요");

    try {
      await updatePost.mutateAsync({ postId, input: { caption, text: draft.text.trim() } });
      setDraft(null);
      showToast("수정했어요");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "수정하지 못했어요");
    }
  };

  const confirmDelete = async () => {
    setDeleteOpen(false);
    try {
      await deletePost.mutateAsync(postId);
      showToast("내 글을 삭제했어요");
      // 삭제된 글로 뒤로가기 하면 빈 화면이 나오므로 히스토리에서 갈아끼운다.
      router.replace("/feed");
    } catch {
      showToast("삭제하지 못했어요. 잠시 후 다시 시도해주세요");
    }
  };

  return (
    <>
      {/* 내 글의 수정·삭제는 본문이 아니라 상단 바 오른쪽에 둔다 — 글 내용 사이에 끼우면
          읽는 흐름을 끊고, 다른 화면들도 화면 단위 동작을 여기 모아두고 있다.
          수정 중에는 폼 자체가 저장·취소를 들고 있으므로 감춘다. */}
      <TopBar
        title="공유 코스"
        showBack
        rightSlot={
          post.isMine && !draft ? (
            <span className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDraft({ caption: post.caption, text: post.text })}
                className="text-xs font-semibold text-brand-700"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="text-xs font-semibold text-ink-muted"
              >
                삭제
              </button>
            </span>
          ) : null
        }
      />
      <div className="px-4 pb-8 pt-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl">
            {post.authorEmoji}
          </span>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-ink">{post.authorName}</span>
            <div className="truncate text-[10px] text-ink-muted">{post.petTypeName}</div>
          </div>
          {/* 유형 배지와 등록일은 목록 카드(PostCard)와 같은 자리 — 줄 오른쪽 끝에 둔다. */}
          {post.sameTypeMatch && !post.isMine ? (
            <span className="shrink-0 rounded-full bg-accent-purple-light px-1.5 py-0.5 text-[9px] font-bold text-accent-purple">
              같은 유형
            </span>
          ) : null}
          <span className="shrink-0 text-[10px] text-ink-muted">
            {formatPostDate(post.createdAt)}
          </span>
        </div>

        {draft ? (
          /* 수정할 수 있는 건 코스 이름과 소개뿐이다 — 방문 장소는 보관함 코스에서 박제된 값이라
             글에서 고치면 이미 담아간 사람들의 사본과 어긋난다. */
          <div className="mt-3 rounded-2xl border border-brand-100 bg-brand-50 p-3">
            <label className="block text-[10px] font-bold text-brand-700" htmlFor="post-caption">
              코스 이름
            </label>
            <input
              id="post-caption"
              value={draft.caption}
              onChange={(event) => setDraft({ ...draft, caption: event.target.value })}
              maxLength={40}
              className="mt-1 w-full rounded-lg border border-line-strong bg-card px-3 py-2 text-sm font-bold text-ink"
            />
            <label className="mt-2.5 block text-[10px] font-bold text-brand-700" htmlFor="post-text">
              코스 소개
            </label>
            <textarea
              id="post-text"
              value={draft.text}
              onChange={(event) => setDraft({ ...draft, text: event.target.value })}
              rows={4}
              maxLength={300}
              className="mt-1 w-full resize-none rounded-lg border border-line-strong bg-card px-3 py-2 text-xs leading-relaxed text-ink"
            />
            <div className="mt-2.5 flex gap-2">
              <Button variant="primary" disabled={updatePost.isPending} onClick={saveEdit}>
                {updatePost.isPending ? "저장 중…" : "저장"}
              </Button>
              <Button variant="secondary" onClick={() => setDraft(null)}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mt-3 text-lg font-extrabold tracking-tight text-ink">{post.caption}</h1>
            <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-ink-muted">
              {post.text}
            </p>
          </>
        )}

        {tags.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Tag key={tag} tone="brand" className="cursor-default px-2 py-1 text-[10px]">
                {tag}
              </Tag>
            ))}
          </div>
        ) : null}

        <div className="mb-1 mt-5 px-1 text-xs font-bold text-ink-muted">
          방문 장소 {post.stops.length}곳
        </div>
        <div className="flex flex-col gap-2">
          {post.stops.map((stop, index) => (
            <Link key={`${stop.placeId}-${index}`} href={`/place/${encodeURIComponent(stop.name)}`}>
              <Card className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-ink">{stop.name}</div>
                  <div className="truncate text-[10px] text-ink-muted">
                    {stop.district} · {stop.category} · {stop.condition}
                  </div>
                </div>
                <span className="shrink-0 text-[9px] text-ink-muted">›</span>
              </Card>
            </Link>
          ))}
        </div>

        {/* 좋아요는 빼고 목록 카드와 같은 '담긴 수 + 담기' 줄만 둔다. */}
        <PostSaveBar
          postId={post.id}
          isMine={post.isMine}
          saves={post.saves}
          saved={post.saved}
          className="mt-4 rounded-2xl border border-line bg-card"
        />
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        emoji="🗑"
        title="이 글을 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요"
      >
        <Button variant="primary" disabled={deletePost.isPending} onClick={confirmDelete}>
          {deletePost.isPending ? "삭제 중…" : "삭제하기"}
        </Button>
        <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
          취소
        </Button>
      </Modal>
    </>
  );
}

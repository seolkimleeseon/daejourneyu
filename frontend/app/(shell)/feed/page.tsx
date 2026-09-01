"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FeedSegments, type FeedSegment } from "@/components/feed/FeedSegments";
import { FeedSortSelect } from "@/components/feed/FeedSortSelect";
import { FeedSearchBar } from "@/components/feed/FeedSearchBar";
import { SameTypeFilter } from "@/components/feed/SameTypeFilter";
import { HotPostCard } from "@/components/feed/HotPostCard";
import { PostCard } from "@/components/feed/PostCard";
import { MyPostCard } from "@/components/feed/MyPostCard";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { FeedPager } from "@/components/feed/FeedPager";
import { FeedEmptyState } from "@/components/feed/FeedEmptyState";
import { LoginModal } from "@/components/my/LoginModal";
import { usePosts, useDeletePost } from "@/hooks/usePosts";
import { useArticles } from "@/hooks/useArticles";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { useToastStore } from "@/stores/useToastStore";
import {
  searchPosts,
  sortPosts,
  sortArticles,
  findHottestPost,
  paginate,
  type PostSortMode,
  type ArticleSortMode,
} from "@/lib/feed";

/** '내 글' 한 페이지에 보여줄 개수 — 프로토타입 jyMyListHtml의 PER과 동일 */
const MY_POSTS_PER_PAGE = 4;

const POST_SORT_OPTIONS: { value: PostSortMode; label: string }[] = [
  { value: "saves", label: "담긴순" },
  { value: "recent", label: "최신순" },
];

const ARTICLE_SORT_OPTIONS: { value: ArticleSortMode; label: string }[] = [
  { value: "popular", label: "인기순" },
  { value: "recent", label: "최신순" },
];

export default function FeedPage() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const hydrated = useAuthStore((state) => state.hydrated);
  const activePet = usePetStore((state) => state.activePet());
  const showToast = useToastStore((state) => state.show);

  const { data: posts, isLoading: postsLoading } = usePosts();
  const deletePost = useDeletePost();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();

  const [segment, setSegment] = useState<FeedSegment>("course");
  const [postSort, setPostSort] = useState<PostSortMode>("saves");
  const [articleSort, setArticleSort] = useState<ArticleSortMode>("popular");
  const [query, setQuery] = useState("");
  const [sameTypeOnly, setSameTypeOnly] = useState(false);
  const [myPostPage, setMyPostPage] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const keyword = query.trim();
  const searching = keyword.length > 0;

  /** 검색 중에는 유형 필터를 무시하고 항상 전체 코스를 훑는다(프로토타입 jyFeedListHtml과 동일). */
  const coursePosts = useMemo(() => {
    const scoped = searching
      ? searchPosts(posts, keyword)
      : sameTypeOnly
        ? posts.filter((post) => post.sameTypeMatch)
        : posts;
    return sortPosts(scoped, postSort);
  }, [posts, keyword, searching, sameTypeOnly, postSort]);

  /** 배너는 필터·검색과 무관하게 전체에서 가장 많이 담긴 코스를 보여준다. */
  const hottestPost = useMemo(() => findHottestPost(posts), [posts]);
  const showHotBanner = !searching && postSort === "saves" && hottestPost !== null;

  const sortedArticles = useMemo(
    () => sortArticles(articles, articleSort),
    [articles, articleSort]
  );

  const myPosts = useMemo(
    () => sortPosts(posts.filter((post) => post.isMine), postSort),
    [posts, postSort]
  );
  const myPage = paginate(myPosts, myPostPage, MY_POSTS_PER_PAGE);

  /** '내 글'은 로그인 사용자의 게시물이므로 비로그인 상태에서는 로그인 모달로 유도한다. */
  const handleSegmentChange = (next: FeedSegment) => {
    // 세션 복구 전에는 로그인 여부를 알 수 없으므로 게이팅을 미룬다.
    if (next === "mine" && !hydrated) return;
    if (next === "mine" && !isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    setMyPostPage(0);
    setSegment(next);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const targetId = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await deletePost.mutateAsync(targetId);
      showToast("내 글을 삭제했어요");
    } catch {
      showToast("삭제하지 못했어요. 잠시 후 다시 시도해주세요");
    }
  };

  return (
    <>
      <TopBar title="둘러보기" />
      <div className="px-4 pb-6 pt-3">
        <div className="flex items-center gap-1.5">
          <FeedSegments value={segment} onChange={handleSegmentChange} />
          {segment === "article" ? (
            <FeedSortSelect
              value={articleSort}
              options={ARTICLE_SORT_OPTIONS}
              onChange={setArticleSort}
            />
          ) : (
            <FeedSortSelect value={postSort} options={POST_SORT_OPTIONS} onChange={setPostSort} />
          )}
        </div>

        {segment === "course" ? (
          <div className="mt-3 flex flex-col gap-2.5">
            <FeedSearchBar value={query} onChange={setQuery} />

            {postsLoading ? (
              <LoadingState />
            ) : (
              <>
                {searching ? (
                  <p className="px-0.5 text-[11px] text-ink-muted">
                    🔍 전체 코스에서 <b className="text-ink">&lsquo;{keyword}&rsquo;</b> 검색 ·{" "}
                    {coursePosts.length}개
                  </p>
                ) : (
                  <>
                    {showHotBanner ? <HotPostCard post={hottestPost} /> : null}
                    <SameTypeFilter
                      active={sameTypeOnly}
                      petTypeName={activePet?.mbti?.name ?? null}
                      onToggle={() => setSameTypeOnly((previous) => !previous)}
                    />
                  </>
                )}

                {coursePosts.length > 0 ? (
                  coursePosts.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <FeedEmptyState
                    emoji={searching ? "🔍" : "🧭"}
                    title={searching ? `'${keyword}' 검색 결과가 없어요` : "아직 코스가 없어요"}
                    description={
                      searching
                        ? "다른 장소명으로 검색해보세요"
                        : "필터를 풀거나 첫 코스를 자랑해보세요"
                    }
                  />
                )}
              </>
            )}
          </div>
        ) : null}

        {segment === "article" ? (
          <div className="mt-3 flex flex-col gap-2.5">
            {articlesLoading ? (
              <LoadingState />
            ) : sortedArticles.length > 0 ? (
              sortedArticles.map((article) => <ArticleCard key={article.id} article={article} />)
            ) : (
              <FeedEmptyState
                emoji="📰"
                title="아직 등록된 아티클이 없어요"
                description="새 소식이 올라오면 이곳에 보여드릴게요"
              />
            )}
          </div>
        ) : null}

        {segment === "mine" ? (
          <div className="mt-3 flex flex-col gap-2.5">
            {/* 코스 작성 화면은 포팅 대상이 아니므로(PLAN.md §1) 보관함에서 공유할 코스를 고르게 한다. */}
            <Link
              href="/schedule/vault"
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand text-sm font-extrabold text-white shadow-md"
            >
              ✎ 새 코스 자랑하기
            </Link>

            {myPosts.length > 0 ? (
              <>
                <div className="px-0.5 text-[10px] text-ink-muted">
                  총 <b className="text-ink">{myPosts.length}</b>개 · {myPage.page + 1}/
                  {myPage.totalPages} 페이지
                </div>
                {myPage.items.map((post) => (
                  <MyPostCard
                    key={post.id}
                    post={post}
                    onDelete={() => setPendingDeleteId(post.id)}
                  />
                ))}
                {myPage.totalPages > 1 ? (
                  <FeedPager
                    page={myPage.page}
                    totalPages={myPage.totalPages}
                    onChange={setMyPostPage}
                  />
                ) : null}
              </>
            ) : (
              <FeedEmptyState
                emoji="✍️"
                title="아직 자랑한 코스가 없어요"
                description="위 “새 코스 자랑하기”로 첫 코스를 올려보세요"
              />
            )}
          </div>
        ) : null}
      </div>

      <Modal
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        emoji="🗑"
        title="이 글을 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요"
      >
        <Button variant="primary" disabled={deletePost.isPending} onClick={confirmDelete}>
          {deletePost.isPending ? "삭제 중…" : "삭제하기"}
        </Button>
        <Button variant="secondary" onClick={() => setPendingDeleteId(null)}>
          취소
        </Button>
      </Modal>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

function LoadingState() {
  return <div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>;
}

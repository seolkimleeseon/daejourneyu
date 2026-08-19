"use client";

import { useState } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { FeedSegments, type FeedSegment } from "@/components/feed/FeedSegments";
import { PostCard } from "@/components/feed/PostCard";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { LoginModal } from "@/components/my/LoginModal";
import { usePosts } from "@/hooks/usePosts";
import { useArticles } from "@/hooks/useArticles";
import { useAuthStore } from "@/stores/useAuthStore";

export default function FeedPage() {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { data: posts = [], isLoading: postsLoading } = usePosts();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();

  const [segment, setSegment] = useState<FeedSegment>("course");
  const [loginOpen, setLoginOpen] = useState(false);

  const myPosts = posts.filter((post) => post.isMine);

  /** '내 글'은 로그인 사용자의 게시물이므로 비로그인 상태에서는 로그인 모달로 유도한다. */
  const handleSegmentChange = (next: FeedSegment) => {
    if (next === "mine" && !isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    setSegment(next);
  };

  return (
    <>
      <TopBar title="둘러보기" />
      <div className="px-4 pb-6 pt-3">
        <FeedSegments value={segment} onChange={handleSegmentChange} />

        <div className="mt-3 flex flex-col gap-2.5">
          {segment === "course" ? (
            postsLoading ? (
              <EmptyState message="불러오는 중…" />
            ) : posts.length === 0 ? (
              <EmptyState message="아직 공유된 코스가 없어요." />
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )
          ) : null}

          {segment === "article" ? (
            articlesLoading ? (
              <EmptyState message="불러오는 중…" />
            ) : articles.length === 0 ? (
              <EmptyState message="아직 등록된 아티클이 없어요." />
            ) : (
              articles.map((article) => <ArticleCard key={article.id} article={article} />)
            )
          ) : null}

          {segment === "mine" ? (
            myPosts.length === 0 ? (
              <EmptyState message="아직 공유한 코스가 없어요. 내 여정에서 코스를 공유해보세요." />
            ) : (
              myPosts.map((post) => <PostCard key={post.id} post={post} />)
            )
          ) : null}
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLoggedIn={() => setSegment("mine")} />
    </>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-10 text-center text-xs text-ink-muted">{message}</div>;
}

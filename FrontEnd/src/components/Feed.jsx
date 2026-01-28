import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import PostCard from './PostCard';
import './Feed.css';

const PER_PAGE = 2;
const DEFAULT_AVATAR = '/assets/avatar_default.png';

export default function Feed({
  posts: postsProp,
  defaultAvatar = DEFAULT_AVATAR,
  onOpenCreate,
  onExpand,
  onEdit,
  onDelete, // callback opcional (ex.: analytics). A remoção local é sempre feita aqui.
  prependPost,
  onPrependConsumed,
  updatedPost,
  onUpdatedConsumed,
  optimisticPost,
  optimisticUpdatedPost,
  revertPost,
  onRevertConsumed,
}) {
  const [posts, setPosts] = useState(postsProp ?? []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(!postsProp?.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const loadPage = useCallback(async (pageNum, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await api.getPosts(pageNum, PER_PAGE);
      const list = res?.data ?? res ?? [];
      const items = Array.isArray(list) ? list : (list?.data ?? []);
      if (append) {
        setPosts((prev) => [...prev, ...items]);
      } else {
        setPosts(items);
      }
      // Suporta 2 formatos:
      // - Backend com paginação completa: { data: [], meta: { current_page, last_page, ... } }
      // - Backend retornando apenas array (sem meta): []
      const lastPage = res?.meta?.last_page ?? null;
      const currentPage = res?.meta?.current_page ?? pageNum;
      if (typeof lastPage === 'number') {
        setHasMore(currentPage < lastPage);
      } else {
        // Sem meta: considera que há mais se veio "cheio" (>= PER_PAGE)
        setHasMore(items.length >= PER_PAGE);
      }
    } catch (e) {
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (postsProp !== undefined && Array.isArray(postsProp)) {
      setPosts(postsProp);
      setLoading(false);
      setHasMore(false);
      return;
    }
    loadPage(1, false);
  }, [loadPage, postsProp]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading || loadingMore) return;
    const el = sentinelRef.current;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setPage((p) => {
            loadPage(p + 1, true);
            return p + 1;
          });
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );
    observerRef.current.observe(el);
    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loading, loadingMore, loadPage]);

  useEffect(() => {
    if (!prependPost) return;
    setPosts((prev) => {
      const exists = prev.some(
        (p) => p.id === prependPost.id || String(p.id) === String(prependPost.id)
      );
      if (exists) return prev;
      return [prependPost, ...prev];
    });
    onPrependConsumed?.();
  }, [prependPost, onPrependConsumed]);

  useEffect(() => {
    if (!updatedPost) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
    onUpdatedConsumed?.();
  }, [updatedPost, onUpdatedConsumed]);

  useEffect(() => {
    if (!revertPost) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === revertPost.id ? revertPost : p))
    );
    onRevertConsumed?.();
  }, [revertPost, onRevertConsumed]);

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => {
      const pid = String(p.id);
      const targetId = String(postId);
      return pid !== targetId;
    }));
  };

  const handleDeleteAndNotify = (postId) => {
    // 1) remove instantaneamente do feed
    handleDeletePost(postId);
    // 2) notifica o pai (se quiser)
    if (typeof onDelete === 'function') {
      onDelete(postId);
    }
  };

  const displayPosts = [...posts];
  if (optimisticPost) {
    const hasOptimistic = displayPosts.some(
      (p) => String(p.id) === String(optimisticPost.id)
    );
    if (!hasOptimistic) {
      displayPosts.unshift(optimisticPost);
    }
  }
  const merged = optimisticUpdatedPost
    ? displayPosts.map((p) =>
        p.id === optimisticUpdatedPost.id ? optimisticUpdatedPost : p
      )
    : displayPosts;

  return (
    <div className="feed">
      {typeof onOpenCreate === 'function' && (
        <div className="feed-actions">
          <button
            type="button"
            className="feed-btn-create"
            onClick={onOpenCreate}
          >
            Criar Post
          </button>
        </div>
      )}

      {loading && merged.length === 0 ? (
        <p className="feed-loading">Carregando...</p>
      ) : (
        <>
          <ul className="feed-list">
            {merged.map((post) => (
              <li key={post.id}>
                <PostCard
                  post={post}
                  defaultAvatar={defaultAvatar}
                  onExpand={onExpand}
                  onEdit={onEdit}
                  onDelete={handleDeleteAndNotify}
                />
              </li>
            ))}
          </ul>
          {optimisticPost && !prependPost && (
            <p className="feed-optimistic-hint">Publicando...</p>
          )}
          <div ref={sentinelRef} className="feed-sentinel" aria-hidden />
          {loadingMore && (
            <p className="feed-loading-more">Carregando mais...</p>
          )}
          {!hasMore && merged.length > 0 && (
            <p className="feed-end">
              Não existem mais itens a serem exibidos.
            </p>
          )}
        </>
      )}
    </div>
  );
}

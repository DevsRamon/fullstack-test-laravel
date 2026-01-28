import { useState } from 'react';
import { api } from '../services/api';
import { formatarDataPublicacao } from '../utils/date';
import './PostCard.css';

const MAX_PREVIEW = 280;
const DEFAULT_AVATAR = '/assets/avatar_default.png';

const CATEGORIA_LABELS = {
  post: 'Post',
  artigo: 'Artigo',
  grupo: 'Grupo',
};

export default function PostCard({
  post,
  defaultAvatar = DEFAULT_AVATAR,
  onExpand,
  onEdit,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const autor = post.autor ?? '';
  const categoria = post.categoria ?? 'post';
  const publicacao = post.publicacao ?? '';
  const created_at = post.created_at ?? null;
  const imagem = post.imagem ?? null;

  const textoCompleto = publicacao.trim();
  const needsExpand = textoCompleto.length > MAX_PREVIEW;
  const displayText = expanded || !needsExpand
    ? textoCompleto
    : textoCompleto.slice(0, MAX_PREVIEW);
  const showLeiaMais = needsExpand && !expanded;
  const showLerMenos = needsExpand && expanded;

  const avatarSrc = post.avatar ? post.avatar : defaultAvatar;
  const categoriaLabel = CATEGORIA_LABELS[categoria] ?? categoria;

  const handleLeiaMais = () => {
    setExpanded(true);
    if (typeof onExpand === 'function') {
      onExpand(post);
    }
  };

  const handleLerMenos = () => {
    setExpanded(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este post?')) return;
    setDeleting(true);
    setMenuOpen(false);
    
    // Remove instantaneamente do feed
    if (typeof onDelete === 'function') {
      onDelete(post.id);
    }
    
    // Faz a chamada da API em background
    try {
      await api.deletePost(post.id);
    } catch (e) {
      // Se der erro, mostra alerta mas o post já foi removido
      alert('Erro ao excluir no servidor. O post foi removido localmente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="post-card">
      <div className="post-card-header">
        <img
          src={avatarSrc}
          alt=""
          className="post-card-avatar"
        />
        <div className="post-card-meta">
          <span className="post-card-author">{autor}</span>
          <span className="post-card-datetime">
            {formatarDataPublicacao(created_at)}
          </span>
        </div>
        {typeof onEdit === 'function' && (
          <div className="post-card-actions">
            <button
              type="button"
              className="post-card-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              disabled={deleting}
            >
              <img src="/assets/dotdotdot.svg" alt="" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="post-card-menu-backdrop"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div className="post-card-menu">
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(post);
                      setMenuOpen(false);
                    }}
                  >
                    <img src="/assets/btn_edit.svg" alt="" /> Editar
                  </button>
                  <button type="button" onClick={handleDelete}>
                    <img src="/assets/btn_delete.svg" alt="" /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="post-card-category-row">
        <img
          src="/assets/feed.svg"
          alt=""
          className="post-card-category-icon"
        />
        <span className="post-card-category">{categoriaLabel}</span>
      </div>

      <div className="post-card-body">
        <p className="post-card-text">
          {displayText}
        </p>
        {showLeiaMais && (
          <button
            type="button"
            className="post-card-leia-mais"
            onClick={handleLeiaMais}
          >
            Leia mais…
          </button>
        )}
        {showLerMenos && (
          <button
            type="button"
            className="post-card-ler-menos"
            onClick={handleLerMenos}
          >
            Ler menos
          </button>
        )}
        {imagem && (
          <div className="post-card-image-wrap">
            <img src={imagem} alt="" className="post-card-image" />
          </div>
        )}
      </div>
    </article>
  );
}

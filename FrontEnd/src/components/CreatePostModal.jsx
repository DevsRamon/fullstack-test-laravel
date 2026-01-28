import { useState, useEffect, useRef } from 'react';
import './CreatePostModal.css';

const CATEGORIAS = [
  { value: 'post', label: 'Post' },
  { value: 'artigo', label: 'Artigo' },
  { value: 'grupo', label: 'Grupo' },
];

export default function CreatePostModal({
  isOpen,
  onClose,
  onSubmit,
  editPost = null,
  categorias = CATEGORIAS,
}) {
  const [autor, setAutor] = useState('');
  const [categoria, setCategoria] = useState('post');
  const [publicacao, setPublicacao] = useState('');
  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editPost) {
      setAutor(editPost.autor ?? '');
      setCategoria(editPost.categoria ?? 'post');
      setPublicacao(editPost.publicacao ?? '');
      setImagem(null);
      setPreview(editPost.imagem ?? null);
    } else {
      setAutor('');
      setCategoria('post');
      setPublicacao('');
      setImagem(null);
      setPreview(null);
    }
  }, [isOpen, editPost]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type;
    if (!/^image\/(jpeg|jpg|png)$/i.test(type)) {
      alert('Envie apenas imagens JPG ou PNG.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setImagem(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagem(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const autorTrim = autor.trim();
    const pubTrim = publicacao.trim();
    if (!autorTrim || !categoria || !pubTrim) return;

    setSubmitting(true);
    const payload = {
      autor: autorTrim,
      categoria,
      publicacao: pubTrim,
      imagem: imagem || undefined,
    };
    if (editPost?.id) {
      payload.id = editPost.id;
      payload.created_at = editPost.created_at;
      payload.updated_at = editPost.updated_at;
    }
    onSubmit(payload);
    setSubmitting(false);
    onClose();
  };

  const canPublish = autor.trim() !== '' && categoria !== '' && publicacao.trim() !== '';

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title">
            {editPost ? 'Editar post' : 'Criar post'}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="modal-label">
            Autor do Post
            <input
              type="text"
              className="modal-input"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              maxLength={60}
              placeholder="Nome do autor"
            />
          </label>
          <label className="modal-label">
            Selecione a categoria
            <select
              className="modal-select"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="modal-label">
            Escrever publicação.
            <textarea
              className="modal-textarea"
              value={publicacao}
              onChange={(e) => setPublicacao(e.target.value)}
              placeholder="Escreva sua publicação..."
              rows={4}
            />
          </label>
          <div className="modal-label">
            {!preview && (
              <button
                type="button"
                className="modal-btn-imagem"
                onClick={() => fileInputRef.current?.click()}
              >
                <img
                  src="/assets/btn_image.svg"
                  alt=""
                  className="modal-btn-imagem-icon"
                />
                <span>IMAGEM</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFile}
              className="modal-input-file-hidden"
              aria-hidden
            />
            {preview && (
              <>
                <div className="modal-preview-wrap">
                  <img src={preview} alt="" className="modal-preview" />
                </div>
                <button
                  type="button"
                  className="modal-btn-remove-img"
                  onClick={handleRemoveImage}
                >
                  Remover imagem
                </button>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={!canPublish || submitting}
            >
              {submitting ? 'Publicando...' : 'PUBLICAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

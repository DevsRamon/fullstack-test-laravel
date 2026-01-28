import { useState } from 'react';
import CreatePostModal from './components/CreatePostModal';
import Feed from './components/Feed';
import { api } from './services/api';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [prependPost, setPrependPost] = useState(null);
  const [updatedPost, setUpdatedPost] = useState(null);
  const [optimisticPost, setOptimisticPost] = useState(null);
  const [optimisticUpdatedPost, setOptimisticUpdatedPost] = useState(null);
  const [revertPost, setRevertPost] = useState(null);

  const handleExpand = (post) => {
    // Exemplo: pode abrir detalhe, scroll ou analytics
    if (post?.id) {
      console.log('Expandir post:', post.id);
    }
  };

  const handleSubmitPost = async (postData) => {
    const isEdit = postData.id && !String(postData.id).startsWith('temp-');
    if (isEdit) {
      const originalPost = editingPost;
      handleCloseModal();
      // Mantém a imagem atual no estado otimista quando o usuário não escolhe uma nova.
      // Isso evita “piscar” (sumir e voltar) enquanto o PUT está em andamento.
      const optimistic = {
        ...postData,
        id: originalPost.id,
        created_at: originalPost.created_at,
        updated_at: new Date().toISOString(),
        imagem: postData.imagem !== undefined ? postData.imagem : originalPost.imagem,
      };
      setOptimisticUpdatedPost(optimistic);
      try {
        // Só envia "imagem" se o usuário selecionou uma nova.
        const updatePayload = {
          autor: postData.autor,
          categoria: postData.categoria,
          publicacao: postData.publicacao,
          ...(postData.imagem !== undefined ? { imagem: postData.imagem } : {}),
        };
        const res = await api.updatePost(postData.id, updatePayload);
        const post = res?.data ?? res;
        if (post) setUpdatedPost(post);
      } catch (e) {
        setRevertPost(originalPost);
        setOptimisticUpdatedPost(null);
        alert('Erro ao atualizar post. Tente novamente.');
      }
      return;
    }
    handleCloseModal();
    const tempPost = {
      ...postData,
      id: 'temp-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setOptimisticPost(tempPost);
    try {
      const created = await api.createPost(postData);
      const post = created?.data ?? created;
      if (post) setPrependPost(post);
    } catch (e) {
      setOptimisticPost(null);
      alert('Erro ao criar post. Tente novamente.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setIsModalOpen(true);
  };

  return (
    <div className="app-container">
      <main className="app-main">
        <div className="feed-wrapper">
          <Feed
            onOpenCreate={handleOpenCreate}
            onExpand={handleExpand}
            onEdit={(post) => {
              setEditingPost(post);
              setIsModalOpen(true);
            }}
            prependPost={prependPost}
            onPrependConsumed={() => {
              setPrependPost(null);
              setOptimisticPost(null);
            }}
            updatedPost={updatedPost}
            onUpdatedConsumed={() => {
              setUpdatedPost(null);
              setOptimisticUpdatedPost(null);
            }}
            optimisticPost={optimisticPost}
            optimisticUpdatedPost={optimisticUpdatedPost}
            revertPost={revertPost}
            onRevertConsumed={() => setRevertPost(null)}
          />
        </div>
      </main>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitPost}
        editPost={editingPost}
      />
    </div>
  );
}

export default App;

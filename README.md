# Feed — Rede Social (Fullstack)

Feed simples de rede social com **backend Laravel** e **frontend React**.

## Stack

- **Backend:** PHP 8.2+, Laravel 12, MySQL 5.6+
- **Frontend:** React 19
- **Docker:** Docker Compose

## Funcionalidades

- Criar, editar e deletar posts
- Upload de imagens (JPG/PNG)
- Feed com rolagem infinita
- Layout responsivo

## Instalação

### Pré-requisitos

- Docker e Docker Compose
- MySQL rodando localmente

### Configuração

1. **Crie o banco de dados:**
```sql
CREATE DATABASE feed CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **Configure o `.env` do backend:**
```env
DB_HOST=host.docker.internal
DB_PORT=3306
DB_DATABASE=feed
DB_USERNAME=root
DB_PASSWORD=sua_senha
```

3. **Inicie os containers:**
```bash
docker-compose up -d
```

4. **Configure o Laravel (dentro do container):**
```bash
docker exec -it backend_laravel composer install
docker exec -it backend_laravel php artisan key:generate
docker exec -it backend_laravel php artisan migrate
```

5. **Acesse:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api

## API

**Base URL:** `http://localhost:8000/api`

| Método | Endpoint      | Descrição        |
|--------|---------------|------------------|
| GET    | /posts        | Lista posts      |
| POST   | /posts        | Cria post        |
| GET    | /posts/{id}   | Retorna post     |
| PUT    | /posts/{id}   | Atualiza post    |
| DELETE | /posts/{id}   | Remove post      |

**Exemplo de payload:**
```json
{
  "autor": "Nome do Autor",
  "categoria": "post",
  "publicacao": "Texto da publicação.",
  "imagem": "data:image/jpeg;base64,..."
}
```

Categorias: `post`, `artigo`, `grupo`

## Banco de Dados

O arquivo `database_dump.sql` na raiz contém o dump completo do banco.

Para restaurar:
```bash
mysql -u root -p feed < database_dump.sql
```

## Notas

- MySQL deve estar rodando **localmente** (não em container)
- Use `host.docker.internal` no `.env` para acessar MySQL local
- Imagens são armazenadas como BLOB no banco

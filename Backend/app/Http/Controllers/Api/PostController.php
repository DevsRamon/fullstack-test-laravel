<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\Imagem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    private const IMAGE_MAX_SIZE_MB = 10;
    private const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

    /**
     * Valida imagem base64 e retorna dados binários. Aceita apenas JPG ou PNG.
     *
     * @param string $imagemBase64
     * @return array{data: string, mime: string}
     * @throws \Exception
     */
    private function validateAndDecodeImage(string $imagemBase64): array
    {
        $prefixMatch = [];
        if (preg_match('/^data:image\/(jpeg|jpg|png);base64,/i', $imagemBase64, $prefixMatch)) {
            $ext = strtolower($prefixMatch[1]);
            $mime = $ext === 'jpg' ? 'image/jpeg' : 'image/' . $ext;
            $imagemBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $imagemBase64);
        } else {
            $mime = null;
            if (preg_match('/^data:image\/\w+;base64,/', $imagemBase64)) {
                throw new \Exception('Apenas formatos JPG ou PNG são permitidos.');
            }
            $imagemBase64 = preg_replace('/^data:image\/\w+;base64,/', '', $imagemBase64);
        }

        $imagemData = base64_decode($imagemBase64, true);
        if ($imagemData === false) {
            throw new \Exception('A imagem deve ser enviada em formato base64 (JPG ou PNG).');
        }

        $size = strlen($imagemData);
        if ($size > self::IMAGE_MAX_SIZE_MB * 1024 * 1024) {
            throw new \Exception('Imagem muito grande. Tamanho máximo: ' . self::IMAGE_MAX_SIZE_MB . 'MB.');
        }

        $detectedMime = $this->getImageMimeFromBytes($imagemData);
        if ($detectedMime === null || !in_array($detectedMime, self::ALLOWED_IMAGE_TYPES, true)) {
            throw new \Exception('Apenas formatos JPG ou PNG são permitidos.');
        }

        return ['data' => $imagemData, 'mime' => $detectedMime];
    }

    /**
     * Detecta MIME da imagem pelos magic bytes (JPEG ou PNG).
     */
    private function getImageMimeFromBytes(string $data): ?string
    {
        if (strlen($data) < 8) {
            return null;
        }
        $head = substr($data, 0, 8);
        if (substr($head, 0, 3) === "\xFF\xD8\xFF") {
            return 'image/jpeg';
        }
        if (substr($head, 0, 8) === "\x89PNG\r\n\x1A\n") {
            return 'image/png';
        }
        return null;
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->input('per_page', 15);
        $perPage = max(5, min(50, $perPage ?: 15));

        $posts = Post::with('imagem')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json(PostResource::collection($posts), 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'autor' => 'required|string|max:60',
            'categoria' => ['required', Rule::in(['post', 'artigo', 'grupo'])],
            'publicacao' => 'required|string',
            'imagem' => 'nullable|string', // Base64 obrigatório: string base64 ou data URL (data:image/jpeg;base64,...). Apenas JPG ou PNG.
        ]);

        DB::beginTransaction();

        try {
            // Criar o post
            $post = Post::create([
                'autor' => $validated['autor'],
                'categoria' => $validated['categoria'],
                'publicacao' => $validated['publicacao'],
            ]);

            // Se houver imagem em base64, processar e salvar (apenas JPG ou PNG)
            if ($request->has('imagem') && !empty($validated['imagem'])) {
                $decoded = $this->validateAndDecodeImage($validated['imagem']);
                $imagem = Imagem::create([
                    'imagem' => $decoded['data'],
                ]);
                $post->imagem_id = $imagem->id;
                $post->save();
            }

            DB::commit();

            // Carregar o post com a imagem
            $post->load('imagem');

            return response()->json(new PostResource($post), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            $isValidationError = str_contains($e->getMessage(), 'base64')
                || str_contains($e->getMessage(), 'JPG ou PNG')
                || str_contains($e->getMessage(), 'muito grande');
            $status = $isValidationError ? 422 : 500;

            return response()->json([
                'error' => 'Erro ao criar post: ' . $e->getMessage()
            ], $status);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Post  $post
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Post $post): JsonResponse
    {
        $post->load('imagem');

        return response()->json(new PostResource($post), 200);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Post  $post
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'autor' => 'sometimes|string|max:60',
            'categoria' => ['sometimes', Rule::in(['post', 'artigo', 'grupo'])],
            'publicacao' => 'sometimes|string',
            'imagem' => 'nullable|string', // Base64 obrigatório: string base64 ou data URL (data:image/jpeg;base64,...). Apenas JPG ou PNG.
        ]);

        DB::beginTransaction();

        try {
            // Atualizar campos do post
            $postData = array_filter([
                'autor' => $validated['autor'] ?? null,
                'categoria' => $validated['categoria'] ?? null,
                'publicacao' => $validated['publicacao'] ?? null,
            ], fn($value) => $value !== null);

            if (!empty($postData)) {
                $post->update($postData);
            }

            // Se houver nova imagem, atualizar ou criar (apenas JPG ou PNG)
            if ($request->has('imagem') && !empty($validated['imagem'])) {
                $decoded = $this->validateAndDecodeImage($validated['imagem']);
                // remove imagem antiga para não ficar órfã
                if ($post->imagem) {
                    $post->imagem->delete();
                }
                $imagem = Imagem::create([
                    'imagem' => $decoded['data'],
                ]);
                $post->imagem_id = $imagem->id;
                $post->save();
            }

            DB::commit();
            $post->load('imagem');

            return response()->json(new PostResource($post), 200);

        } catch (\Exception $e) {
            DB::rollBack();
            $isValidationError = str_contains($e->getMessage(), 'base64')
                || str_contains($e->getMessage(), 'JPG ou PNG')
                || str_contains($e->getMessage(), 'muito grande');
            $status = $isValidationError ? 422 : 500;

            return response()->json([
                'error' => 'Erro ao atualizar post: ' . $e->getMessage()
            ], $status);
        }
    }

    public function destroy(Post $post): JsonResponse
    {
        // remove imagem associada para não ficar órfã
        if ($post->imagem) {
            $post->imagem->delete();
        }
        $post->delete();

        return response()->json(null, 204);
    }
}
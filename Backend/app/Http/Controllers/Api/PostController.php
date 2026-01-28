<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\Imagem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(5, min(50, $perPage));

        $posts = Post::query()
            ->with('imagens')
            ->latest()
            ->paginate($perPage);

        return PostResource::collection($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePost($request, false);

        try {
            $post = DB::transaction(function () use ($request, $validated) {
                $post = Post::create(
                    Arr::only($validated, ['autor', 'categoria', 'publicacao'])
                );

                if ($request->filled('imagem')) {
                    $bytes = $this->decodeBase64Image($validated['imagem']);
                    $post->imagens()->create(['imagem' => $bytes]);
                }

                return $post;
            });

            $post->load('imagens');

            return response()->json(new PostResource($post), 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Erro ao criar post',
            ], 500);
        }
    }

    public function show(Post $post): JsonResponse
    {
        $post->load('imagens');

        return response()->json(new PostResource($post), 200);
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        $validated = $this->validatePost($request, true);

        try {
            DB::transaction(function () use ($request, $validated, $post) {
                $fields = Arr::only($validated, ['autor', 'categoria', 'publicacao']);

                if (!empty($fields)) {
                    $post->fill($fields)->save();
                }

                if ($request->filled('imagem')) {
                    $bytes = $this->decodeBase64Image($validated['imagem']);

                    $post->imagens()->delete();
                    $post->imagens()->create(['imagem' => $bytes]);
                }
            });

            $post->load('imagens');

            return response()->json(new PostResource($post), 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Erro ao atualizar post',
            ], 500);
        }
    }

    public function destroy(Post $post): JsonResponse
    {
        DB::transaction(function () use ($post) {
            $post->imagens()->delete();
            $post->delete();
        });

        return response()->json(null, 204);
    }

    private function validatePost(Request $request, bool $isUpdate): array
    {
        return $request->validate([
            'autor' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:60'],
            'categoria' => [$isUpdate ? 'sometimes' : 'required', Rule::in(['post', 'artigo', 'grupo'])],
            'publicacao' => [$isUpdate ? 'sometimes' : 'required', 'string'],
            'imagem' => ['nullable', 'string'],
        ]);
    }

    private function decodeBase64Image(string $value): string
    {
        if (str_starts_with($value, 'data:image/')) {
            $value = preg_replace('/^data:image\/\w+;base64,/', '', $value);
        }

        $bytes = base64_decode($value, true);

        if ($bytes === false) {
            throw ValidationException::withMessages([
                'imagem' => ['Imagem em base64 inválida.'],
            ]);
        }

        if (strlen($bytes) > 10 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'imagem' => ['Imagem muito grande. Tamanho máximo: 10MB.'],
            ]);
        }

        return $bytes;
    }
}

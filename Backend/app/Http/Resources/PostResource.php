<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray($request)
    {
        $imagem = $this->imagem?->imagem_base64; // base64 (data URL), apenas JPG ou PNG

        return [
            'id' => $this->id,
            'autor' => $this->autor,
            'categoria' => $this->categoria,
            'publicacao' => $this->publicacao,
            'imagem' => $imagem, // base64 (data URL) ou null
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

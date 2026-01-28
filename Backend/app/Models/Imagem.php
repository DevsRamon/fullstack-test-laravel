<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Imagem extends Model
{
    use HasFactory;

    protected $table = 'imagens';

    protected $fillable = [
        'imagem',
    ];

    protected $hidden = [
        'imagem',
    ];

    // Relacionamento inverso (opcional):
    // Um post aponta para esta imagem via posts.imagem_id
    public function post()
    {
        return $this->hasOne(Post::class, 'imagem_id');
    }

    /**
     * Retorna a imagem em base64 (data URL: data:image/jpeg;base64,... ou data:image/png;base64,...).
     * Apenas JPG ou PNG (detectado pelos magic bytes).
     */
    public function getImagemBase64Attribute()
    {
        if (!$this->imagem) {
            return null;
        }
        $mime = $this->getMimeFromImageBytes($this->imagem);
        if ($mime === null) {
            return null;
        }
        return 'data:' . $mime . ';base64,' . base64_encode($this->imagem);
    }

    /**
     * Detecta MIME da imagem pelos magic bytes (apenas JPEG ou PNG).
     */
    private function getMimeFromImageBytes(string $data): ?string
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

    protected $appends = ['imagem_base64'];
}

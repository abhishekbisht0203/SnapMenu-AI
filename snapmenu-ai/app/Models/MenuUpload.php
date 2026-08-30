<?php

namespace App\Models;

use App\Models\Concerns\BelongsToRestaurant;
use Database\Factories\MenuUploadFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuUpload extends Model
{
    /** @use HasFactory<MenuUploadFactory> */
    use BelongsToRestaurant, HasFactory;

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_PARSED = 'parsed';

    public const STATUS_NEEDS_REVIEW = 'needs_review';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'restaurant_id', 'file_path', 'status', 'raw_ocr_text', 'ai_confidence_score',
        'processing_attempts', 'failure_reason', 'parsed_items',
    ];

    protected function casts(): array
    {
        return [
            'ai_confidence_score' => 'float',
            'parsed_items' => 'array',
        ];
    }
}

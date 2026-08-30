<?php

namespace App\Http\Resources;

use App\Models\MenuUpload;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin MenuUpload
 */
class MenuUploadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'ai_confidence_score' => $this->ai_confidence_score,
            'processing_attempts' => $this->processing_attempts,
            'failure_reason' => $this->failure_reason,
            'parsed_items' => $this->parsed_items ?? [],
            'raw_ocr_text' => $this->raw_ocr_text,
            'created_at' => $this->created_at,
        ];
    }
}

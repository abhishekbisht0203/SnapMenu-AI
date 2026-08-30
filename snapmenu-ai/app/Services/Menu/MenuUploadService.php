<?php

namespace App\Services\Menu;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\MenuUpload;
use App\Services\Ocr\OcrEngine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MenuUploadService
{
    public function __construct(
        private readonly OcrEngine $ocr,
        private readonly MenuParser $parser,
    ) {}

    /**
     * Run the OCR + LLM pipeline for one upload and persist the outcome.
     *
     * Transient failures (network, LLM error) bubble up so the queue can retry.
     * A structurally bad result is captured as needs_review / failed instead.
     */
    public function process(MenuUpload $upload): void
    {
        $upload->increment('processing_attempts');

        $rawText = $this->ocr->extract(Storage::disk('local')->path($upload->file_path));

        $rows = $this->parser->parse($rawText);
        $parsed = ParsedMenu::fromRows($rows);

        if ($parsed->isEmpty()) {
            $upload->update([
                'raw_ocr_text' => $rawText,
                'status' => MenuUpload::STATUS_FAILED,
                'failure_reason' => 'No menu items could be extracted from the image.',
            ]);

            return;
        }

        $threshold = (float) config('menu.confidence_threshold');

        $upload->update([
            'raw_ocr_text' => $rawText,
            'ai_confidence_score' => $parsed->confidence,
            'parsed_items' => $parsed->items,
            'status' => $parsed->confidence >= $threshold
                ? MenuUpload::STATUS_PARSED
                : MenuUpload::STATUS_NEEDS_REVIEW,
        ]);
    }

    public function markFailed(MenuUpload $upload, string $reason): void
    {
        $upload->update([
            'status' => MenuUpload::STATUS_FAILED,
            'failure_reason' => Str::limit($reason, 1000),
        ]);
    }

    /**
     * Promote reviewed/approved staged rows into live categories and items.
     *
     * @param  array<int, array{category: ?string, name: string, description: ?string, price: float|int}>  $items
     */
    public function publish(MenuUpload $upload, array $items): int
    {
        return DB::transaction(function () use ($upload, $items) {
            $categories = [];
            $created = 0;

            foreach ($items as $row) {
                $categoryId = null;

                if (! empty($row['category'])) {
                    $name = $row['category'];
                    $categories[$name] ??= MenuCategory::firstOrCreate(
                        ['restaurant_id' => $upload->restaurant_id, 'name' => $name],
                    );
                    $categoryId = $categories[$name]->id;
                }

                MenuItem::create([
                    'restaurant_id' => $upload->restaurant_id,
                    'menu_category_id' => $categoryId,
                    'menu_upload_id' => $upload->id,
                    'name' => $row['name'],
                    'description' => $row['description'] ?? null,
                    'price' => $row['price'] ?? 0,
                ]);

                $created++;
            }

            $upload->update(['status' => MenuUpload::STATUS_PARSED]);

            return $created;
        });
    }
}

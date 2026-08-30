<?php

namespace App\Jobs;

use App\Models\MenuUpload;
use App\Services\Menu\MenuUploadService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Str;
use Throwable;

class ProcessMenuUpload implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [10, 30, 60];

    public function __construct(public readonly int $menuUploadId) {}

    public function handle(MenuUploadService $service): void
    {
        $upload = MenuUpload::query()->withoutTenancy()->findOrFail($this->menuUploadId);

        $service->process($upload);
    }

    public function failed(Throwable $exception): void
    {
        $upload = MenuUpload::query()->withoutTenancy()->find($this->menuUploadId);

        $upload?->update([
            'status' => MenuUpload::STATUS_FAILED,
            'failure_reason' => Str::limit($exception->getMessage(), 1000),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\PublishMenuUploadRequest;
use App\Http\Requests\Menu\StoreMenuUploadRequest;
use App\Http\Resources\MenuUploadResource;
use App\Jobs\ProcessMenuUpload;
use App\Models\MenuUpload;
use App\Services\Menu\MenuUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MenuUploadController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return MenuUploadResource::collection(
            MenuUpload::query()->latest()->get()
        );
    }

    public function show(int $menuUpload): MenuUploadResource
    {
        return MenuUploadResource::make($this->find($menuUpload));
    }

    public function store(StoreMenuUploadRequest $request): JsonResponse
    {
        $path = $request->file('image')->store('menu-uploads', 'local');

        $upload = MenuUpload::create([
            'file_path' => $path,
            'status' => MenuUpload::STATUS_PROCESSING,
        ]);

        ProcessMenuUpload::dispatch($upload->id);

        return MenuUploadResource::make($upload)->response()->setStatusCode(202);
    }

    public function publish(PublishMenuUploadRequest $request, int $menuUpload, MenuUploadService $service): JsonResponse
    {
        $upload = $this->find($menuUpload);

        $count = $service->publish($upload, $request->validated()['items']);

        return response()->json([
            'published_items' => $count,
            'upload' => MenuUploadResource::make($upload->refresh()),
        ]);
    }

    private function find(int $id): MenuUpload
    {
        return MenuUpload::query()->findOrFail($id);
    }
}

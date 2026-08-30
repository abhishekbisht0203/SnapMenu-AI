<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\MenuCategoryRequest;
use App\Http\Resources\MenuCategoryResource;
use App\Models\MenuCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MenuCategoryController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $categories = MenuCategory::query()
            ->with('items')
            ->orderBy('sort_order')
            ->get();

        return MenuCategoryResource::collection($categories);
    }

    public function store(MenuCategoryRequest $request): JsonResponse
    {
        $category = MenuCategory::create($request->validated());

        return MenuCategoryResource::make($category)->response()->setStatusCode(201);
    }

    public function show(int $category): MenuCategoryResource
    {
        return MenuCategoryResource::make($this->find($category)->load('items'));
    }

    public function update(MenuCategoryRequest $request, int $category): MenuCategoryResource
    {
        $model = $this->find($category);
        $model->update($request->validated());

        return MenuCategoryResource::make($model);
    }

    public function destroy(int $category): Response
    {
        $this->find($category)->delete();

        return response()->noContent();
    }

    private function find(int $id): MenuCategory
    {
        return MenuCategory::query()->findOrFail($id);
    }
}

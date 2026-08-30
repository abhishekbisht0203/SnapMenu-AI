<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\MenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MenuItemController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $items = MenuItem::query()
            ->with('category')
            ->orderBy('sort_order')
            ->get();

        return MenuItemResource::collection($items);
    }

    public function store(MenuItemRequest $request): JsonResponse
    {
        $item = MenuItem::create($request->validated());

        return MenuItemResource::make($item->load('category'))->response()->setStatusCode(201);
    }

    public function show(int $menuItem): MenuItemResource
    {
        return MenuItemResource::make($this->find($menuItem)->load('category'));
    }

    public function update(MenuItemRequest $request, int $menuItem): MenuItemResource
    {
        $item = $this->find($menuItem);
        $item->update($request->validated());

        return MenuItemResource::make($item->load('category'));
    }

    public function destroy(int $menuItem): Response
    {
        $this->find($menuItem)->delete();

        return response()->noContent();
    }

    /**
     * Lookup runs after the tenant is bound, so the global scope guarantees
     * this can only ever resolve an item owned by the current restaurant.
     */
    private function find(int $id): MenuItem
    {
        return MenuItem::query()->findOrFail($id);
    }
}

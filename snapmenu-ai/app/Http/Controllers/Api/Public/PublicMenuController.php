<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuCategoryResource;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use App\Models\Table;
use Illuminate\Http\JsonResponse;

class PublicMenuController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $restaurant = Restaurant::query()->where('slug', $slug)->firstOrFail();

        $categories = $restaurant->categories()
            ->with(['items' => fn ($q) => $q->where('is_available', true)->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'restaurant' => RestaurantResource::make($restaurant),
            'categories' => MenuCategoryResource::collection($categories),
        ]);
    }

    public function table(string $token): JsonResponse
    {
        $table = Table::query()->withoutTenancy()
            ->with('restaurant')
            ->where('qr_code_token', $token)
            ->firstOrFail();

        return response()->json([
            'restaurant' => RestaurantResource::make($table->restaurant),
            'table' => ['id' => $table->id, 'label' => $table->label, 'token' => $table->qr_code_token],
        ]);
    }
}

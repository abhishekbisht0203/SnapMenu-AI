<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\RestaurantResource;
use App\Support\TenantManager;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    public function __construct(private readonly TenantManager $tenant) {}

    public function show(): RestaurantResource
    {
        return RestaurantResource::make($this->tenant->get());
    }

    public function update(Request $request): RestaurantResource
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'primary_color' => ['sometimes', 'string', 'max:9'],
            'logo_path' => ['sometimes', 'nullable', 'string'],
        ]);

        $restaurant = $this->tenant->get();
        $restaurant->update($data);

        return RestaurantResource::make($restaurant);
    }
}

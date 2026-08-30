<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\PlaceOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Table;
use App\Services\Orders\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class PublicOrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function store(PlaceOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $restaurant = $this->resolveRestaurant($data);

        $order = $this->orders->place($restaurant, $data);

        return OrderResource::make($order->load('items.menuItem'))
            ->response()
            ->setStatusCode(201);
    }

    public function track(string $trackingToken): OrderResource
    {
        $order = Order::query()->withoutTenancy()
            ->with('items.menuItem')
            ->where('tracking_token', $trackingToken)
            ->firstOrFail();

        return OrderResource::make($order);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveRestaurant(array $data): Restaurant
    {
        if (! empty($data['table_token'])) {
            $table = Table::query()->withoutTenancy()
                ->with('restaurant')
                ->where('qr_code_token', $data['table_token'])
                ->first();

            if ($table === null) {
                throw ValidationException::withMessages(['table_token' => 'Unknown table code.']);
            }

            return $table->restaurant;
        }

        return Restaurant::query()->where('slug', $data['restaurant_slug'])->firstOrFail();
    }
}

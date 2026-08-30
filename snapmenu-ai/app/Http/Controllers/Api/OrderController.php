<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Orders\OrderService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::query()->with('items.menuItem')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->boolean('active')) {
            $query->whereNotIn('status', [Order::STATUS_SERVED, Order::STATUS_CANCELLED]);
        }

        return OrderResource::collection($query->get());
    }

    public function show(int $order): OrderResource
    {
        return OrderResource::make($this->find($order)->load('items.menuItem'));
    }

    public function updateStatus(Request $request, int $order): OrderResource
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(array_keys(Order::TRANSITIONS))],
        ]);

        $updated = $this->orders->transition($this->find($order), $data['status']);

        return OrderResource::make($updated->load('items.menuItem'));
    }

    private function find(int $id): Order
    {
        return Order::query()->findOrFail($id);
    }
}

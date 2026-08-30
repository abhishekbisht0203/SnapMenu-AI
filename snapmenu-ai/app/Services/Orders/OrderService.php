<?php

namespace App\Services\Orders;

use App\Events\OrderPlaced;
use App\Events\OrderStatusUpdated;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Table;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /**
     * Place a customer order for a restaurant.
     *
     * @param  array{table_token?: ?string, customer_name?: ?string, items: array<int, array{menu_item_id: int, quantity: int, notes?: ?string}>}  $data
     */
    public function place(Restaurant $restaurant, array $data): Order
    {
        $table = null;

        if (! empty($data['table_token'])) {
            $table = Table::query()->withoutTenancy()
                ->where('restaurant_id', $restaurant->id)
                ->where('qr_code_token', $data['table_token'])
                ->first();

            if ($table === null) {
                throw ValidationException::withMessages([
                    'table_token' => 'This table does not belong to the restaurant.',
                ]);
            }
        }

        $requestedIds = collect($data['items'])->pluck('menu_item_id')->all();

        $menuItems = MenuItem::query()->withoutTenancy()
            ->where('restaurant_id', $restaurant->id)
            ->whereIn('id', $requestedIds)
            ->get()
            ->keyBy('id');

        foreach ($data['items'] as $line) {
            $item = $menuItems->get($line['menu_item_id']);

            if ($item === null) {
                throw ValidationException::withMessages([
                    'items' => "Menu item {$line['menu_item_id']} is not on this restaurant's menu.",
                ]);
            }

            if (! $item->is_available) {
                throw ValidationException::withMessages([
                    'items' => "\"{$item->name}\" is currently unavailable.",
                ]);
            }
        }

        return DB::transaction(function () use ($restaurant, $data, $table, $menuItems) {
            $order = new Order([
                'table_id' => $table?->id,
                'customer_name' => $data['customer_name'] ?? null,
                'status' => Order::STATUS_PLACED,
                'currency' => $restaurant->menuItems()->value('currency') ?? 'USD',
                'payment_status' => 'unpaid',
            ]);
            $order->restaurant_id = $restaurant->id;
            $order->total_amount = 0;
            $order->save();

            $total = 0;

            foreach ($data['items'] as $line) {
                $item = $menuItems->get($line['menu_item_id']);
                $quantity = max(1, (int) $line['quantity']);
                $total += $item->price * $quantity;

                $order->items()->create([
                    'menu_item_id' => $item->id,
                    'quantity' => $quantity,
                    'unit_price' => $item->price,
                    'notes' => $line['notes'] ?? null,
                ]);
            }

            $order->update(['total_amount' => $total]);

            OrderPlaced::dispatch($order->load('items'));

            return $order;
        });
    }

    public function transition(Order $order, string $status): Order
    {
        if (! $order->canTransitionTo($status)) {
            throw ValidationException::withMessages([
                'status' => "Cannot move an order from {$order->status} to {$status}.",
            ]);
        }

        $order->update(['status' => $status]);

        OrderStatusUpdated::dispatch($order);

        return $order;
    }
}

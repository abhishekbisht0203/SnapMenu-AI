<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::firstOrCreate(
            ['email' => 'owner@demo.test'],
            ['name' => 'Demo Owner', 'password' => Hash::make('password')],
        );
        $owner->assignRole('Owner');

        $staff = User::firstOrCreate(
            ['email' => 'kitchen@demo.test'],
            ['name' => 'Demo Kitchen', 'password' => Hash::make('password')],
        );
        $staff->assignRole('Staff');

        $restaurant = Restaurant::firstOrCreate(
            ['slug' => 'demo-bistro'],
            ['owner_user_id' => $owner->id, 'name' => 'Demo Bistro', 'primary_color' => '#0f766e', 'subscription_status' => 'active'],
        );
        $restaurant->staff()->syncWithoutDetaching([$staff->id => ['role' => 'Staff']]);

        $menu = [
            'Starters' => [
                ['Garlic Focaccia', 'Rosemary, sea salt, olive oil', 5.5],
                ['Burrata', 'Heirloom tomato, basil, aged balsamic', 9.0],
            ],
            'Mains' => [
                ['Margherita Pizza', 'San Marzano, fior di latte, basil', 13.0],
                ['Spaghetti Carbonara', 'Guanciale, pecorino, black pepper', 15.5],
                ['Grilled Sea Bass', 'Salsa verde, charred lemon, greens', 21.0],
            ],
            'Desserts' => [
                ['Tiramisu', 'Mascarpone, espresso, cocoa', 7.0],
                ['Affogato', 'Vanilla gelato, hot espresso', 5.0],
            ],
            'Drinks' => [
                ['Sparkling Water', '500ml', 2.5],
                ['House Red', 'Glass, Sangiovese', 7.5],
            ],
        ];

        $sortCat = 0;
        $firstItem = null;

        foreach ($menu as $categoryName => $items) {
            $category = MenuCategory::firstOrCreate(
                ['restaurant_id' => $restaurant->id, 'name' => $categoryName],
                ['sort_order' => $sortCat++],
            );

            foreach ($items as $sort => [$name, $description, $price]) {
                $item = MenuItem::firstOrCreate(
                    ['restaurant_id' => $restaurant->id, 'name' => $name],
                    [
                        'menu_category_id' => $category->id,
                        'description' => $description,
                        'price' => $price,
                        'sort_order' => $sort,
                    ],
                );
                $firstItem ??= $item;
            }
        }

        foreach (['Table 1', 'Table 2', 'Table 3', 'Patio 1'] as $label) {
            Table::firstOrCreate(['restaurant_id' => $restaurant->id, 'label' => $label]);
        }

        if ($firstItem && Order::query()->withoutTenancy()->where('restaurant_id', $restaurant->id)->doesntExist()) {
            $order = Order::query()->create([
                'restaurant_id' => $restaurant->id,
                'table_id' => $restaurant->tables()->first()->id,
                'customer_name' => 'Walk-in',
                'status' => Order::STATUS_PREPARING,
                'total_amount' => $firstItem->price * 2,
            ]);
            $order->items()->create([
                'menu_item_id' => $firstItem->id,
                'quantity' => 2,
                'unit_price' => $firstItem->price,
            ]);
        }

        $this->command?->info('Demo restaurant ready: /#/r/demo-bistro  (owner@demo.test / password)');
    }
}

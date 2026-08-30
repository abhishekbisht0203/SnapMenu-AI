<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'restaurant_id' => Restaurant::factory(),
            'table_id' => null,
            'customer_name' => fake()->firstName(),
            'status' => 'placed',
            'total_amount' => fake()->randomFloat(2, 5, 120),
            'currency' => 'USD',
            'payment_status' => 'unpaid',
        ];
    }
}

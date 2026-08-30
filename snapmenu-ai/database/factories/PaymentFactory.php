<?php

namespace Database\Factories;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'amount' => fake()->randomFloat(2, 5, 120),
            'currency' => 'USD',
            'status' => 'pending',
            'idempotency_key' => (string) Str::uuid(),
        ];
    }
}

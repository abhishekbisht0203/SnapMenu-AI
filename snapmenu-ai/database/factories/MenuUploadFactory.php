<?php

namespace Database\Factories;

use App\Models\MenuUpload;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MenuUpload>
 */
class MenuUploadFactory extends Factory
{
    public function definition(): array
    {
        return [
            'restaurant_id' => Restaurant::factory(),
            'file_path' => 'menu-uploads/'.fake()->uuid().'.jpg',
            'status' => MenuUpload::STATUS_PROCESSING,
            'processing_attempts' => 0,
        ];
    }
}

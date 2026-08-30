<?php

use App\Events\OrderPlaced;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\Table;
use Illuminate\Support\Facades\Event;

function seedMenu(Restaurant $restaurant): array
{
    $category = MenuCategory::factory()->create(['restaurant_id' => $restaurant->id, 'name' => 'Mains']);
    $pizza = MenuItem::factory()->create([
        'restaurant_id' => $restaurant->id, 'menu_category_id' => $category->id,
        'name' => 'Pizza', 'price' => 10, 'is_available' => true,
    ]);
    $special = MenuItem::factory()->unavailable()->create([
        'restaurant_id' => $restaurant->id, 'menu_category_id' => $category->id, 'name' => 'Sold Out Special',
    ]);

    return [$category, $pizza, $special];
}

test('the public menu only exposes available items for a restaurant', function () {
    $restaurant = Restaurant::factory()->create();
    seedMenu($restaurant);

    $this->getJson("/api/menu/{$restaurant->slug}")
        ->assertOk()
        ->assertJsonPath('categories.0.items.0.name', 'Pizza')
        ->assertJsonCount(1, 'categories.0.items');
});

test('a customer can place an order from a table QR and totals are computed server-side', function () {
    Event::fake([OrderPlaced::class]);
    $restaurant = Restaurant::factory()->create();
    [$category, $pizza] = seedMenu($restaurant);
    $table = Table::factory()->create(['restaurant_id' => $restaurant->id]);

    $response = $this->postJson('/api/orders', [
        'table_token' => $table->qr_code_token,
        'customer_name' => 'Sam',
        'items' => [['menu_item_id' => $pizza->id, 'quantity' => 3]],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'placed')
        ->assertJsonPath('data.total_amount', 30)
        ->assertJsonPath('data.table_id', $table->id);

    Event::assertDispatched(OrderPlaced::class);
});

test('ordering an unavailable item is rejected', function () {
    $restaurant = Restaurant::factory()->create();
    [$category, $pizza, $special] = seedMenu($restaurant);

    $this->postJson('/api/orders', [
        'restaurant_slug' => $restaurant->slug,
        'items' => [['menu_item_id' => $special->id, 'quantity' => 1]],
    ])->assertStatus(422)->assertJsonValidationErrors('items');
});

test('ordering an item from another restaurant is rejected', function () {
    $restaurant = Restaurant::factory()->create();
    seedMenu($restaurant);
    $foreignItem = MenuItem::factory()->create();

    $this->postJson('/api/orders', [
        'restaurant_slug' => $restaurant->slug,
        'items' => [['menu_item_id' => $foreignItem->id, 'quantity' => 1]],
    ])->assertStatus(422)->assertJsonValidationErrors('items');
});

test('a customer can track an order by its tracking token', function () {
    $restaurant = Restaurant::factory()->create();
    [$category, $pizza] = seedMenu($restaurant);

    $token = $this->postJson('/api/orders', [
        'restaurant_slug' => $restaurant->slug,
        'items' => [['menu_item_id' => $pizza->id, 'quantity' => 1]],
    ])->json('data.tracking_token');

    $this->getJson("/api/orders/track/{$token}")
        ->assertOk()
        ->assertJsonPath('data.status', 'placed');
});

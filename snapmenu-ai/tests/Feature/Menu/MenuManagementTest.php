<?php

use App\Models\MenuCategory;
use App\Models\MenuItem;

test('an owner can create a category and add items to it', function () {
    actingAsOwner();

    $category = $this->postJson('/api/categories', ['name' => 'Mains', 'sort_order' => 1])
        ->assertCreated()
        ->json('data');

    $this->postJson('/api/menu-items', [
        'name' => 'Margherita Pizza',
        'price' => 12.50,
        'menu_category_id' => $category['id'],
        'description' => 'Tomato, mozzarella, basil',
    ])->assertCreated()
        ->assertJsonPath('data.category', 'Mains');

    $this->getJson('/api/categories')
        ->assertOk()
        ->assertJsonPath('data.0.items.0.name', 'Margherita Pizza');
});

test('an owner can update and delete a menu item', function () {
    [$owner, $restaurant] = actingAsOwner();
    $item = MenuItem::factory()->create(['restaurant_id' => $restaurant->id]);

    $this->putJson("/api/menu-items/{$item->id}", ['price' => 9.99, 'is_available' => false])
        ->assertOk()
        ->assertJsonPath('data.price', 9.99)
        ->assertJsonPath('data.is_available', false);

    $this->deleteJson("/api/menu-items/{$item->id}")->assertNoContent();
    $this->assertDatabaseMissing('menu_items', ['id' => $item->id]);
});

test('assigning a category from another restaurant is rejected', function () {
    actingAsOwner();
    $otherCategory = MenuCategory::factory()->create();

    $this->postJson('/api/menu-items', [
        'name' => 'Fries',
        'price' => 4,
        'menu_category_id' => $otherCategory->id,
    ])->assertJsonValidationErrors('menu_category_id');
});

test('validation rejects a menu item with no name or a negative price', function () {
    actingAsOwner();

    $this->postJson('/api/menu-items', ['name' => '', 'price' => -5])
        ->assertJsonValidationErrors(['name', 'price']);
});

test('staff can view the menu but cannot modify it', function () {
    [$owner, $restaurant] = actingAsOwner();
    $item = MenuItem::factory()->create(['restaurant_id' => $restaurant->id]);

    actingAsStaff($restaurant);

    $this->getJson('/api/menu-items')->assertOk()->assertJsonCount(1, 'data');
    $this->postJson('/api/menu-items', ['name' => 'Nope', 'price' => 1])->assertForbidden();
    $this->deleteJson("/api/menu-items/{$item->id}")->assertForbidden();
});

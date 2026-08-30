<?php

use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('an owner cannot read another restaurant\'s menu items', function () {
    [$ownerA, $restaurantA] = actingAsOwner();
    $restaurantB = Restaurant::factory()->create();
    $itemB = MenuItem::factory()->create(['restaurant_id' => $restaurantB->id]);
    MenuItem::factory()->create(['restaurant_id' => $restaurantA->id]);

    $response = $this->getJson('/api/menu-items');

    $response->assertOk();
    $ids = collect($response->json('data'))->pluck('id');
    expect($ids)->not->toContain($itemB->id)
        ->and($ids)->toHaveCount(1);
});

test('an owner cannot view a specific menu item belonging to another restaurant', function () {
    actingAsOwner();
    $restaurantB = Restaurant::factory()->create();
    $itemB = MenuItem::factory()->create(['restaurant_id' => $restaurantB->id]);

    $this->getJson("/api/menu-items/{$itemB->id}")->assertNotFound();
});

test('an owner cannot update or delete another restaurant\'s menu item', function () {
    actingAsOwner();
    $restaurantB = Restaurant::factory()->create();
    $itemB = MenuItem::factory()->create(['restaurant_id' => $restaurantB->id, 'name' => 'Untouched']);

    $this->putJson("/api/menu-items/{$itemB->id}", ['name' => 'Hacked'])->assertNotFound();
    $this->deleteJson("/api/menu-items/{$itemB->id}")->assertNotFound();

    expect($itemB->fresh()->name)->toBe('Untouched');
});

test('newly created menu items are stamped with the current restaurant automatically', function () {
    [$owner, $restaurant] = actingAsOwner();

    $this->postJson('/api/menu-items', ['name' => 'Espresso', 'price' => 3.5])
        ->assertCreated();

    $this->assertDatabaseHas('menu_items', [
        'name' => 'Espresso',
        'restaurant_id' => $restaurant->id,
    ]);
});

test('a user with no restaurant is refused dashboard access', function () {
    $user = User::factory()->create();
    $user->assignRole('Owner');
    Sanctum::actingAs($user);

    $this->getJson('/api/menu-items')->assertForbidden();
});

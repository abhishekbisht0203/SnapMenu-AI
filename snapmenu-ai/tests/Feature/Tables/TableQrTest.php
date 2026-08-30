<?php

use App\Models\Restaurant;
use App\Models\Table;

test('creating a table auto-generates a unique QR token and exposes its menu URL', function () {
    actingAsOwner();

    $response = $this->postJson('/api/tables', ['label' => 'Table 7'])->assertCreated();

    $token = $response->json('data.qr_code_token');
    expect($token)->toBeString()->and(strlen($token))->toBe(12);
    expect($response->json('data.menu_url'))->toContain("/t/{$token}");
});

test('the QR endpoint returns a scannable SVG', function () {
    [$owner, $restaurant] = actingAsOwner();
    $table = Table::factory()->create(['restaurant_id' => $restaurant->id]);

    $response = $this->get("/api/tables/{$table->id}/qr");

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('image/svg+xml');
    expect($response->getContent())->toContain('<svg');
});

test('a table QR token publicly resolves to its restaurant', function () {
    $restaurant = Restaurant::factory()->create(['name' => 'The Corner Bistro']);
    $table = Table::factory()->create(['restaurant_id' => $restaurant->id, 'label' => 'Patio 2']);

    $this->getJson("/api/tables/by-token/{$table->qr_code_token}")
        ->assertOk()
        ->assertJsonPath('restaurant.slug', $restaurant->slug)
        ->assertJsonPath('table.label', 'Patio 2');
});

test('another restaurant cannot manage this restaurant\'s tables', function () {
    actingAsOwner();
    $foreign = Table::factory()->create();

    $this->deleteJson("/api/tables/{$foreign->id}")->assertNotFound();
});

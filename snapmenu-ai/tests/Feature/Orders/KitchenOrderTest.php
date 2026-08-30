<?php

use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\Restaurant;
use Illuminate\Support\Facades\Event;

test('staff can list active orders for their restaurant only', function () {
    [$owner, $restaurant] = actingAsOwner();
    Order::factory()->create(['restaurant_id' => $restaurant->id, 'status' => 'placed']);
    Order::factory()->create(['restaurant_id' => $restaurant->id, 'status' => 'served']);
    Order::factory()->create(['restaurant_id' => Restaurant::factory()->create()->id, 'status' => 'placed']);

    actingAsStaff($restaurant);

    $this->getJson('/api/kitchen/orders?active=1')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('staff can advance an order through valid states and it broadcasts', function () {
    Event::fake([OrderStatusUpdated::class]);
    [$owner, $restaurant] = actingAsOwner();
    $order = Order::factory()->create(['restaurant_id' => $restaurant->id, 'status' => 'placed']);

    actingAsStaff($restaurant);

    $this->patchJson("/api/kitchen/orders/{$order->id}/status", ['status' => 'confirmed'])
        ->assertOk()->assertJsonPath('data.status', 'confirmed');

    Event::assertDispatched(OrderStatusUpdated::class);
});

test('an invalid state transition is rejected', function () {
    [$owner, $restaurant] = actingAsOwner();
    $order = Order::factory()->create(['restaurant_id' => $restaurant->id, 'status' => 'placed']);

    $this->patchJson("/api/kitchen/orders/{$order->id}/status", ['status' => 'served'])
        ->assertStatus(422)->assertJsonValidationErrors('status');

    expect($order->refresh()->status)->toBe('placed');
});

test('staff cannot touch another restaurant\'s order', function () {
    [$owner, $restaurant] = actingAsOwner();
    $foreign = Order::factory()->create(['status' => 'placed']);

    actingAsStaff($restaurant);

    $this->patchJson("/api/kitchen/orders/{$foreign->id}/status", ['status' => 'confirmed'])
        ->assertNotFound();
});

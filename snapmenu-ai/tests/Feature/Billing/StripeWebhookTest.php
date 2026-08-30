<?php

use App\Models\Restaurant;

const WEBHOOK_SECRET = 'whsec_test_secret';

beforeEach(function () {
    config()->set('services.stripe.webhook_secret', WEBHOOK_SECRET);
});

function signedPayload(array $event): array
{
    $payload = json_encode($event);
    $timestamp = time();
    $signature = hash_hmac('sha256', "{$timestamp}.{$payload}", WEBHOOK_SECRET);

    return [$payload, "t={$timestamp},v1={$signature}"];
}

function checkoutCompletedEvent(Restaurant $restaurant, string $id = 'evt_1'): array
{
    return [
        'id' => $id,
        'type' => 'checkout.session.completed',
        'data' => ['object' => [
            'metadata' => ['restaurant_id' => (string) $restaurant->id],
            'amount_total' => 2900,
            'currency' => 'usd',
            'payment_intent' => 'pi_123',
        ]],
    ];
}

test('a webhook with a bad signature is rejected', function () {
    $restaurant = Restaurant::factory()->create();
    [$payload] = signedPayload(checkoutCompletedEvent($restaurant));

    $this->call('POST', '/api/webhooks/stripe', [], [], [], [
        'HTTP_STRIPE_SIGNATURE' => 't=1,v1=deadbeef',
        'CONTENT_TYPE' => 'application/json',
    ], $payload)->assertStatus(400);
});

test('a valid checkout.session.completed activates the subscription and records a payment', function () {
    $restaurant = Restaurant::factory()->create(['subscription_status' => 'trial']);
    [$payload, $sig] = signedPayload(checkoutCompletedEvent($restaurant));

    $this->call('POST', '/api/webhooks/stripe', [], [], [], [
        'HTTP_STRIPE_SIGNATURE' => $sig,
        'CONTENT_TYPE' => 'application/json',
    ], $payload)->assertOk()->assertJsonPath('handled', true);

    expect($restaurant->refresh()->subscription_status)->toBe('active');
    $this->assertDatabaseHas('payments', [
        'restaurant_id' => $restaurant->id,
        'status' => 'succeeded',
        'amount' => 29.00,
        'idempotency_key' => 'evt_1',
    ]);
});

test('a duplicate webhook delivery is ignored', function () {
    $restaurant = Restaurant::factory()->create();
    [$payload, $sig] = signedPayload(checkoutCompletedEvent($restaurant));

    $headers = ['HTTP_STRIPE_SIGNATURE' => $sig, 'CONTENT_TYPE' => 'application/json'];

    $this->call('POST', '/api/webhooks/stripe', [], [], [], $headers, $payload)->assertOk();
    $this->call('POST', '/api/webhooks/stripe', [], [], [], $headers, $payload)
        ->assertOk()->assertJsonPath('handled', false);

    $this->assertDatabaseCount('payments', 1);
    $this->assertDatabaseCount('webhook_events', 1);
});

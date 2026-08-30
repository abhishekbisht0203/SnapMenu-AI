<?php

namespace App\Services\Billing;

use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\WebhookEvent;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeWebhookService
{
    public function __construct(
        private readonly string $webhookSecret,
        private readonly int $tolerance = 300,
    ) {}

    /**
     * Verify the Stripe signature and return the decoded event payload.
     *
     * @return array<string, mixed>
     *
     * @throws SignatureVerificationException
     */
    public function verify(string $payload, ?string $signature): array
    {
        if ($this->webhookSecret === '') {
            throw new UnexpectedValueException('Stripe webhook secret is not configured.');
        }

        $event = Webhook::constructEvent($payload, (string) $signature, $this->webhookSecret, $this->tolerance);

        return $event->toArray();
    }

    /**
     * Process an event exactly once. Returns true if handled, false if it was
     * a duplicate delivery that we deliberately ignored.
     *
     * @param  array<string, mixed>  $event
     */
    public function handle(array $event): bool
    {
        $eventId = $event['id'] ?? null;

        if (! is_string($eventId) || $eventId === '') {
            throw new UnexpectedValueException('Webhook event is missing an id.');
        }

        $record = WebhookEvent::query()->firstOrCreate(
            ['event_id' => $eventId],
            ['provider' => 'stripe', 'payload' => $event],
        );

        if ($record->processed_at !== null) {
            Log::info('Ignoring duplicate Stripe webhook', ['event_id' => $eventId]);

            return false;
        }

        match ($event['type'] ?? null) {
            'checkout.session.completed', 'invoice.paid' => $this->activateSubscription($event),
            'customer.subscription.deleted' => $this->cancelSubscription($event),
            default => null,
        };

        $record->update(['processed_at' => Carbon::now()]);

        return true;
    }

    /**
     * @param  array<string, mixed>  $event
     */
    private function activateSubscription(array $event): void
    {
        $object = $event['data']['object'] ?? [];
        $restaurant = $this->resolveRestaurant($object);

        if ($restaurant === null) {
            return;
        }

        $restaurant->update(['subscription_status' => 'active']);

        $amount = isset($object['amount_total'])
            ? $object['amount_total'] / 100
            : ($object['amount_paid'] ?? 0) / 100;

        Payment::query()->updateOrCreate(
            ['idempotency_key' => $event['id']],
            [
                'restaurant_id' => $restaurant->id,
                'stripe_payment_intent_id' => $object['payment_intent'] ?? null,
                'amount' => $amount,
                'currency' => strtoupper($object['currency'] ?? 'usd'),
                'status' => 'succeeded',
                'paid_at' => Carbon::now(),
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $event
     */
    private function cancelSubscription(array $event): void
    {
        $this->resolveRestaurant($event['data']['object'] ?? [])
            ?->update(['subscription_status' => 'cancelled']);
    }

    /**
     * @param  array<string, mixed>  $object
     */
    private function resolveRestaurant(array $object): ?Restaurant
    {
        $restaurantId = $object['metadata']['restaurant_id']
            ?? $object['client_reference_id']
            ?? null;

        return $restaurantId ? Restaurant::query()->find($restaurantId) : null;
    }
}

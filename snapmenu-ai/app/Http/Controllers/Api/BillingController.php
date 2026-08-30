<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\TenantManager;
use Illuminate\Http\JsonResponse;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class BillingController extends Controller
{
    public function __construct(private readonly TenantManager $tenant) {}

    public function status(): JsonResponse
    {
        return response()->json([
            'subscription_status' => $this->tenant->get()->subscription_status,
        ]);
    }

    /**
     * Start a Stripe Checkout subscription for the current restaurant. The
     * webhook (checkout.session.completed) flips the restaurant to "active".
     */
    public function checkout(): JsonResponse
    {
        $restaurant = $this->tenant->get();
        $secret = (string) config('services.stripe.secret');
        $frontend = rtrim(config('app.frontend_url'), '/');

        if ($secret === '' || config('services.stripe.price_id') === null) {
            return response()->json([
                'checkout_url' => "{$frontend}/billing/mock-checkout?restaurant={$restaurant->id}",
                'mock' => true,
            ]);
        }

        Stripe::setApiKey($secret);

        $session = Session::create([
            'mode' => 'subscription',
            'line_items' => [['price' => config('services.stripe.price_id'), 'quantity' => 1]],
            'client_reference_id' => (string) $restaurant->id,
            'metadata' => ['restaurant_id' => (string) $restaurant->id],
            'success_url' => "{$frontend}/billing/success",
            'cancel_url' => "{$frontend}/billing/cancel",
        ]);

        return response()->json(['checkout_url' => $session->url, 'mock' => false]);
    }
}

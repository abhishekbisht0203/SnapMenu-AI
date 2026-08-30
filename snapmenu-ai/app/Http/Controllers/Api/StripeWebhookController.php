<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Billing\StripeWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, StripeWebhookService $service): JsonResponse
    {
        try {
            $event = $service->verify($request->getContent(), $request->header('Stripe-Signature'));
        } catch (SignatureVerificationException $e) {
            return response()->json(['message' => 'Invalid signature.'], 400);
        }

        $handled = $service->handle($event);

        return response()->json(['handled' => $handled]);
    }
}

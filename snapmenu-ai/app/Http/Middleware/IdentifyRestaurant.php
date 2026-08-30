<?php

namespace App\Http\Middleware;

use App\Support\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Binds the authenticated user's restaurant as the current tenant so the
 * BelongsToRestaurant global scope filters every subsequent query.
 */
class IdentifyRestaurant
{
    public function __construct(private readonly TenantManager $tenant) {}

    public function handle(Request $request, Closure $next): Response
    {
        $restaurant = $request->user()?->currentRestaurant();

        abort_if($restaurant === null, 403, 'No restaurant is associated with this account.');

        $this->tenant->set($restaurant);

        return $next($request);
    }
}

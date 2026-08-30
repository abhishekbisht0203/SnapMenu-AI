<?php

namespace App\Support;

use App\Models\Restaurant;

/**
 * Holds the "current restaurant" for the lifetime of a request.
 *
 * Owner/staff API routes populate this via the IdentifyRestaurant middleware,
 * which is what drives the BelongsToRestaurant global scope. Public customer
 * routes never set it and instead query explicitly by restaurant.
 */
class TenantManager
{
    private ?Restaurant $restaurant = null;

    public function set(?Restaurant $restaurant): void
    {
        $this->restaurant = $restaurant;
    }

    public function get(): ?Restaurant
    {
        return $this->restaurant;
    }

    public function id(): ?int
    {
        return $this->restaurant?->id;
    }

    public function check(): bool
    {
        return $this->restaurant !== null;
    }
}

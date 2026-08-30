<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
 * Kitchen dashboard: only owners/staff of a restaurant may listen to its
 * private order channel.
 */
Broadcast::channel('restaurant.{restaurantId}', function (User $user, int $restaurantId) {
    return $user->currentRestaurant()?->id === $restaurantId;
});

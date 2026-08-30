<?php

namespace App\Models\Concerns;

use App\Models\Restaurant;
use App\Models\Scopes\RestaurantScope;
use App\Support\TenantManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Every tenant-owned model uses this trait. It guarantees that:
 *  - reads are automatically constrained to the current restaurant, and
 *  - writes are automatically stamped with the current restaurant_id.
 *
 * When no tenant is bound (console, tests, public customer routes) the scope
 * is inert and callers are responsible for filtering explicitly.
 */
trait BelongsToRestaurant
{
    public static function bootBelongsToRestaurant(): void
    {
        static::addGlobalScope(new RestaurantScope);

        static::creating(function (Model $model): void {
            $tenant = app(TenantManager::class);

            if ($tenant->check() && empty($model->restaurant_id)) {
                $model->restaurant_id = $tenant->id();
            }
        });
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function scopeWithoutTenancy(Builder $query): Builder
    {
        return $query->withoutGlobalScope(RestaurantScope::class);
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\BelongsToRestaurant;
use Database\Factories\MenuCategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuCategory extends Model
{
    /** @use HasFactory<MenuCategoryFactory> */
    use BelongsToRestaurant, HasFactory;

    protected $fillable = ['restaurant_id', 'name', 'sort_order'];

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }
}

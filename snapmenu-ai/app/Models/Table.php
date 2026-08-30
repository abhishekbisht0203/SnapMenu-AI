<?php

namespace App\Models;

use App\Models\Concerns\BelongsToRestaurant;
use Database\Factories\TableFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Table extends Model
{
    /** @use HasFactory<TableFactory> */
    use BelongsToRestaurant, HasFactory;

    protected $fillable = ['restaurant_id', 'label', 'qr_code_token'];

    protected static function booted(): void
    {
        static::creating(function (Table $table): void {
            if (empty($table->qr_code_token)) {
                $table->qr_code_token = static::generateToken();
            }
        });
    }

    public static function generateToken(): string
    {
        do {
            $token = Str::lower(Str::random(12));
        } while (static::withoutTenancy()->where('qr_code_token', $token)->exists());

        return $token;
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}

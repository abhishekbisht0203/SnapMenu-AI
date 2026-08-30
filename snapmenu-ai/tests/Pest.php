<?php

use App\Models\Restaurant;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(fn () => $this->seed(RoleSeeder::class))
    ->in('Feature');

pest()->extend(TestCase::class)->in('Unit');

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/**
 * Create an owner with their restaurant and authenticate as them.
 *
 * @return array{0: User, 1: Restaurant}
 */
function actingAsOwner(): array
{
    $user = User::factory()->create();
    $user->assignRole('Owner');
    $restaurant = Restaurant::factory()->create(['owner_user_id' => $user->id]);
    Sanctum::actingAs($user);

    return [$user, $restaurant];
}

/**
 * Create a staff member attached to the given restaurant and authenticate.
 */
function actingAsStaff(Restaurant $restaurant): User
{
    $user = User::factory()->create();
    $user->assignRole('Staff');
    $restaurant->staff()->attach($user, ['role' => 'Staff']);
    Sanctum::actingAs($user);

    return $user;
}

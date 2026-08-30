<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(fn () => $this->seed(RoleSeeder::class))
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

use App\Models\Restaurant;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

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

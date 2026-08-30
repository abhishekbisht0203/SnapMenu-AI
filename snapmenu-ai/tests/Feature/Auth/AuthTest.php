<?php

use App\Models\User;
use Database\Seeders\RoleSeeder;

beforeEach(function () {
    $this->seed(RoleSeeder::class);
});

test('a user can register and receives a token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'Jane Owner',
        'email' => 'jane@example.com',
        'restaurant_name' => "Jane's Cafe",
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['user' => ['id', 'name', 'email', 'roles'], 'token']);

    $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);

    $user = User::where('email', 'jane@example.com')->first();
    expect($user->hasRole('Owner'))->toBeTrue();
    expect($user->currentRestaurant()->name)->toBe("Jane's Cafe");
    $this->assertDatabaseHas('restaurants', ['slug' => 'janes-cafe']);
});

test('registration fails with invalid data', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => '',
        'email' => 'not-an-email',
        'password' => 'short',
        'password_confirmation' => 'mismatch',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

test('registration fails when email is already taken', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $response = $this->postJson('/api/auth/register', [
        'name' => 'Jane Owner',
        'email' => 'taken@example.com',
        'restaurant_name' => "Jane's Cafe",
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('a user can login with correct credentials', function () {
    $user = User::factory()->create(['password' => bcrypt('correct-password')]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'correct-password',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['user' => ['id', 'name', 'email', 'roles'], 'token']);
});

test('login fails with incorrect credentials', function () {
    $user = User::factory()->create(['password' => bcrypt('correct-password')]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertUnauthorized();
});

test('an authenticated user can fetch their own profile via /me', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/auth/me');

    $response->assertOk()
        ->assertJsonPath('user.email', $user->email);
});

test('an unauthenticated user cannot fetch /me', function () {
    $response = $this->getJson('/api/auth/me');

    $response->assertUnauthorized();
});

test('a user can logout and their token is revoked', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/auth/logout');

    $response->assertOk();

    // The auth guard resolves the user once per application lifecycle; in tests
    // multiple requests share that instance, so flush it before re-checking.
    $this->app['auth']->forgetGuards();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/auth/me')
        ->assertUnauthorized();
});

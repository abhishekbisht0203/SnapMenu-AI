<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MenuCategoryController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\RestaurantController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

/*
 * Owner / staff dashboard API. Every route is tenant-scoped via `restaurant`.
 */
Route::middleware(['auth:sanctum', 'restaurant'])->group(function () {
    Route::get('/restaurant', [RestaurantController::class, 'show']);

    // Read access for any authenticated staff member.
    Route::get('/categories', [MenuCategoryController::class, 'index']);
    Route::get('/categories/{category}', [MenuCategoryController::class, 'show']);
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::get('/menu-items/{menuItem}', [MenuItemController::class, 'show']);

    // Management access for owners only.
    Route::middleware('role:Owner')->group(function () {
        Route::put('/restaurant', [RestaurantController::class, 'update']);

        Route::post('/categories', [MenuCategoryController::class, 'store']);
        Route::put('/categories/{category}', [MenuCategoryController::class, 'update']);
        Route::patch('/categories/{category}', [MenuCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [MenuCategoryController::class, 'destroy']);

        Route::post('/menu-items', [MenuItemController::class, 'store']);
        Route::put('/menu-items/{menuItem}', [MenuItemController::class, 'update']);
        Route::patch('/menu-items/{menuItem}', [MenuItemController::class, 'update']);
        Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy']);
    });
});

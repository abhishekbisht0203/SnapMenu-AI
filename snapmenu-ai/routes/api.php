<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\MenuCategoryController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\MenuUploadController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\Public\PublicMenuController;
use App\Http\Controllers\Api\Public\PublicOrderController;
use App\Http\Controllers\Api\RestaurantController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\TableController;
use Illuminate\Support\Facades\Route;

/*
 * Authentication
 */
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

/*
 * Public customer ordering API (no auth — access is scoped by restaurant slug
 * or table QR token).
 */
Route::get('/menu/{slug}', [PublicMenuController::class, 'show']);
Route::get('/tables/by-token/{token}', [PublicMenuController::class, 'table']);
Route::post('/orders', [PublicOrderController::class, 'store']);
Route::get('/orders/track/{trackingToken}', [PublicOrderController::class, 'track']);

Route::post('/webhooks/stripe', StripeWebhookController::class);

/*
 * Owner / staff dashboard API. Every route is tenant-scoped via `restaurant`.
 */
Route::middleware(['auth:sanctum', 'restaurant'])->group(function () {
    Route::get('/restaurant', [RestaurantController::class, 'show']);
    Route::get('/billing/status', [BillingController::class, 'status']);

    // Read access for any authenticated staff member.
    Route::get('/categories', [MenuCategoryController::class, 'index']);
    Route::get('/categories/{category}', [MenuCategoryController::class, 'show']);
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::get('/menu-items/{menuItem}', [MenuItemController::class, 'show']);

    // Kitchen dashboard — owners and staff.
    Route::get('/kitchen/orders', [OrderController::class, 'index']);
    Route::get('/kitchen/orders/{order}', [OrderController::class, 'show']);
    Route::patch('/kitchen/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // Management access for owners only.
    Route::middleware('role:Owner')->group(function () {
        Route::put('/restaurant', [RestaurantController::class, 'update']);
        Route::post('/billing/checkout', [BillingController::class, 'checkout']);

        Route::post('/categories', [MenuCategoryController::class, 'store']);
        Route::match(['put', 'patch'], '/categories/{category}', [MenuCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [MenuCategoryController::class, 'destroy']);

        Route::post('/menu-items', [MenuItemController::class, 'store']);
        Route::match(['put', 'patch'], '/menu-items/{menuItem}', [MenuItemController::class, 'update']);
        Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy']);

        Route::get('/menu-uploads', [MenuUploadController::class, 'index']);
        Route::get('/menu-uploads/{menuUpload}', [MenuUploadController::class, 'show']);
        Route::post('/menu-uploads', [MenuUploadController::class, 'store']);
        Route::post('/menu-uploads/{menuUpload}/publish', [MenuUploadController::class, 'publish']);

        Route::get('/tables', [TableController::class, 'index']);
        Route::post('/tables', [TableController::class, 'store']);
        Route::match(['put', 'patch'], '/tables/{table}', [TableController::class, 'update']);
        Route::delete('/tables/{table}', [TableController::class, 'destroy']);
        Route::get('/tables/{table}/qr', [TableController::class, 'qr'])->name('tables.qr');
    });
});

<?php

use App\Models\Order;

test('valid forward transitions are allowed', function () {
    $order = new Order(['status' => Order::STATUS_PLACED]);
    expect($order->canTransitionTo(Order::STATUS_CONFIRMED))->toBeTrue();

    $order->status = Order::STATUS_PREPARING;
    expect($order->canTransitionTo(Order::STATUS_READY))->toBeTrue();
});

test('skipping states is rejected', function () {
    $order = new Order(['status' => Order::STATUS_PLACED]);

    expect($order->canTransitionTo(Order::STATUS_SERVED))->toBeFalse()
        ->and($order->canTransitionTo(Order::STATUS_READY))->toBeFalse();
});

test('terminal states allow no further transitions', function () {
    $served = new Order(['status' => Order::STATUS_SERVED]);
    $cancelled = new Order(['status' => Order::STATUS_CANCELLED]);

    expect($served->canTransitionTo(Order::STATUS_PREPARING))->toBeFalse()
        ->and($cancelled->canTransitionTo(Order::STATUS_CONFIRMED))->toBeFalse();
});

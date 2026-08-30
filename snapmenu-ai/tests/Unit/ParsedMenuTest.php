<?php

use App\Services\Menu\ParsedMenu;

test('confidence is the fraction of complete, well-typed rows', function () {
    $parsed = ParsedMenu::fromRows([
        ['category' => 'Mains', 'name' => 'Pizza', 'description' => null, 'price' => 10],
        ['category' => 'Mains', 'name' => 'Pasta', 'description' => null, 'price' => 12.5],
        ['category' => null, 'name' => 'Mystery line', 'description' => null, 'price' => null],
        ['category' => 'Drinks', 'name' => 'Cola', 'description' => null, 'price' => '3.00'],
    ]);

    expect($parsed->confidence)->toBe(0.75)
        ->and($parsed->items)->toHaveCount(4)
        ->and($parsed->items[3]['price'])->toBe(3.0);
});

test('rows without a usable name are dropped entirely', function () {
    $parsed = ParsedMenu::fromRows([
        ['category' => 'Mains', 'name' => '', 'price' => 10],
        ['category' => 'Mains', 'name' => 'Steak', 'price' => 25],
    ]);

    expect($parsed->items)->toHaveCount(1)
        ->and($parsed->confidence)->toBe(1.0);
});

test('an empty parse is reported as empty with zero confidence', function () {
    $parsed = ParsedMenu::fromRows([]);

    expect($parsed->isEmpty())->toBeTrue()
        ->and($parsed->confidence)->toBe(0.0);
});

test('negative prices are rejected as untyped', function () {
    $parsed = ParsedMenu::fromRows([
        ['category' => 'Mains', 'name' => 'Weird', 'price' => -5],
    ]);

    expect($parsed->items[0]['price'])->toBeNull()
        ->and($parsed->items[0]['valid'])->toBeFalse();
});

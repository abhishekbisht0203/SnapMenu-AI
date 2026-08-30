<?php

namespace App\Services\Menu;

interface MenuParser
{
    /**
     * Turn raw OCR text into a flat list of menu item rows.
     *
     * @return array<int, array{category: ?string, name: ?string, description: ?string, price: mixed}>
     */
    public function parse(string $rawText): array;
}

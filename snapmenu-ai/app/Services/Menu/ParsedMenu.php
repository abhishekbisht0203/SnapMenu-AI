<?php

namespace App\Services\Menu;

/**
 * The validated, scored result of parsing one menu upload.
 */
class ParsedMenu
{
    /**
     * @param  array<int, array{category: ?string, name: string, description: ?string, price: ?float, valid: bool}>  $items
     */
    public function __construct(
        public readonly array $items,
        public readonly float $confidence,
    ) {}

    /**
     * Defensively validate and normalise raw parser output, then score it by
     * how many rows came back complete and well-typed.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    public static function fromRows(array $rows): self
    {
        $items = [];
        $validCount = 0;

        foreach ($rows as $row) {
            $name = is_string($row['name'] ?? null) ? trim($row['name']) : '';
            $price = self::normalisePrice($row['price'] ?? null);
            $category = is_string($row['category'] ?? null) && trim($row['category']) !== ''
                ? trim($row['category'])
                : null;
            $description = is_string($row['description'] ?? null) && trim($row['description']) !== ''
                ? trim($row['description'])
                : null;

            if ($name === '') {
                continue; // unusable, drop it entirely
            }

            $valid = $price !== null && $category !== null;
            $validCount += $valid ? 1 : 0;

            $items[] = compact('category', 'name', 'description', 'price', 'valid');
        }

        $confidence = count($items) === 0 ? 0.0 : round($validCount / count($items), 3);

        return new self($items, $confidence);
    }

    public function isEmpty(): bool
    {
        return count($this->items) === 0;
    }

    private static function normalisePrice(mixed $price): ?float
    {
        if (is_int($price) || is_float($price)) {
            return $price >= 0 ? (float) $price : null;
        }

        if (is_string($price) && preg_match('/-?\d+(\.\d+)?/', $price, $m)) {
            return (float) $m[0] >= 0 ? (float) $m[0] : null;
        }

        return null;
    }
}

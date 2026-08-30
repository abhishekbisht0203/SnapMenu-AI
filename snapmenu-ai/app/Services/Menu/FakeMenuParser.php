<?php

namespace App\Services\Menu;

/**
 * Deterministic offline parser used for local dev and tests. Understands the
 * common "CATEGORY" header + "Item Name - 0.00" line layout.
 */
class FakeMenuParser implements MenuParser
{
    public function parse(string $rawText): array
    {
        $rows = [];
        $category = null;

        foreach (preg_split('/\r\n|\r|\n/', $rawText) as $line) {
            $line = trim($line);

            if ($line === '') {
                continue;
            }

            if (preg_match('/^([A-Z][A-Z\s&]{2,})$/', $line)) {
                $category = ucwords(strtolower(trim($line)));

                continue;
            }

            if (preg_match('/^(.+?)\s*[-–—]\s*\$?(\d+(?:\.\d{1,2})?)\s*$/', $line, $m)) {
                $rows[] = [
                    'category' => $category,
                    'name' => trim($m[1]),
                    'description' => null,
                    'price' => (float) $m[2],
                ];

                continue;
            }

            // A line we could not confidently interpret — still surface it so the
            // confidence score drops and a human reviews it.
            $rows[] = [
                'category' => $category,
                'name' => $line,
                'description' => null,
                'price' => null,
            ];
        }

        return $rows;
    }
}

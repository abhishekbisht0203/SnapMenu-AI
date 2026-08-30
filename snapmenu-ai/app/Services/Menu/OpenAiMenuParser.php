<?php

namespace App\Services\Menu;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use JsonException;
use RuntimeException;

/**
 * Production parser. Sends the raw OCR text to an LLM with a strict JSON-only
 * contract and defensively decodes the response.
 */
class OpenAiMenuParser implements MenuParser
{
    private const SYSTEM_PROMPT = <<<'PROMPT'
    You convert raw OCR text from a restaurant menu into structured data.
    Respond with ONLY a JSON object of the shape:
    {"items":[{"category":string|null,"name":string,"description":string|null,"price":number|null}]}
    Do not include markdown fences, commentary, or any text outside the JSON.
    PROMPT;

    public function __construct(
        private readonly string $apiKey,
        private readonly string $model = 'gpt-4o-mini',
        private readonly int $timeout = 30,
    ) {}

    public function parse(string $rawText): array
    {
        $response = $this->client()->post('https://api.openai.com/v1/chat/completions', [
            'model' => $this->model,
            'temperature' => 0,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => self::SYSTEM_PROMPT],
                ['role' => 'user', 'content' => $rawText],
            ],
        ]);

        $response->throw();

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || $content === '') {
            throw new RuntimeException('LLM returned an empty menu payload.');
        }

        try {
            $decoded = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new RuntimeException('LLM returned malformed JSON: '.$e->getMessage());
        }

        $items = $decoded['items'] ?? null;

        if (! is_array($items)) {
            throw new RuntimeException('LLM payload is missing an "items" array.');
        }

        return array_values(array_map(fn ($row) => [
            'category' => $row['category'] ?? null,
            'name' => $row['name'] ?? null,
            'description' => $row['description'] ?? null,
            'price' => $row['price'] ?? null,
        ], $items));
    }

    private function client(): PendingRequest
    {
        return Http::withToken($this->apiKey)
            ->timeout($this->timeout)
            ->retry(3, 200, throw: false)
            ->acceptJson();
    }
}

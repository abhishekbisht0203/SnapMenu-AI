<?php

use App\Services\Menu\OpenAiMenuParser;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

function fakeCompletion(string $content): array
{
    return ['choices' => [['message' => ['content' => $content]]]];
}

test('it maps a well-formed LLM JSON response into rows', function () {
    Http::fake([
        'api.openai.com/*' => Http::response(fakeCompletion(json_encode([
            'items' => [
                ['category' => 'Mains', 'name' => 'Pizza', 'description' => null, 'price' => 10],
            ],
        ]))),
    ]);

    $rows = (new OpenAiMenuParser('sk-test'))->parse('raw');

    expect($rows)->toHaveCount(1)
        ->and($rows[0]['name'])->toBe('Pizza');
});

test('malformed JSON from the LLM raises a runtime error', function () {
    Http::fake(['api.openai.com/*' => Http::response(fakeCompletion('not json at all'))]);

    (new OpenAiMenuParser('sk-test'))->parse('raw');
})->throws(RuntimeException::class);

test('a missing items array raises a runtime error', function () {
    Http::fake(['api.openai.com/*' => Http::response(fakeCompletion(json_encode(['foo' => 'bar'])))]);

    (new OpenAiMenuParser('sk-test'))->parse('raw');
})->throws(RuntimeException::class);

test('an upstream 500 propagates as an exception so the queue can retry', function () {
    Http::fake(['api.openai.com/*' => Http::response('boom', 500)]);

    (new OpenAiMenuParser('sk-test'))->parse('raw');
})->throws(RequestException::class);

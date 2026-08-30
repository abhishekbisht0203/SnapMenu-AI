<?php

use App\Jobs\ProcessMenuUpload;
use App\Models\MenuUpload;
use App\Services\Menu\MenuParser;
use App\Services\Menu\MenuUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

test('uploading a menu image stores the file and dispatches the processing job', function () {
    Storage::fake('local');
    Queue::fake();
    actingAsOwner();

    $response = $this->postJson('/api/menu-uploads', [
        'image' => UploadedFile::fake()->image('menu.jpg'),
    ]);

    $response->assertStatus(202)->assertJsonPath('data.status', 'processing');

    $upload = MenuUpload::firstOrFail();
    Storage::disk('local')->assertExists($upload->file_path);
    Queue::assertPushed(ProcessMenuUpload::class);
});

test('the pipeline parses a clean menu to "parsed" with full confidence', function () {
    Storage::fake('local');
    [$owner, $restaurant] = actingAsOwner();
    $upload = MenuUpload::factory()->create(['restaurant_id' => $restaurant->id]);
    Storage::disk('local')->put($upload->file_path, 'binary');

    app(MenuUploadService::class)->process($upload);

    $upload->refresh();
    expect($upload->status)->toBe(MenuUpload::STATUS_PARSED)
        ->and($upload->ai_confidence_score)->toBe(1.0)
        ->and($upload->processing_attempts)->toBe(1)
        ->and(count($upload->parsed_items))->toBe(6);
});

test('a low-confidence parse is held for human review', function () {
    Storage::fake('local');
    [$owner, $restaurant] = actingAsOwner();
    $upload = MenuUpload::factory()->create(['restaurant_id' => $restaurant->id]);
    Storage::disk('local')->put($upload->file_path, 'binary');

    $this->app->bind(MenuParser::class, fn () => new class implements MenuParser
    {
        public function parse(string $rawText): array
        {
            return [
                ['category' => 'Mains', 'name' => 'Burger', 'description' => null, 'price' => 9],
                ['category' => null, 'name' => 'garbled ocr line', 'description' => null, 'price' => null],
                ['category' => null, 'name' => 'another bad line', 'description' => null, 'price' => null],
            ];
        }
    });

    app(MenuUploadService::class)->process($upload);

    expect($upload->refresh()->status)->toBe(MenuUpload::STATUS_NEEDS_REVIEW)
        ->and($upload->ai_confidence_score)->toBeLessThan(0.8);
});

test('a parse that yields no items fails gracefully', function () {
    Storage::fake('local');
    [$owner, $restaurant] = actingAsOwner();
    $upload = MenuUpload::factory()->create(['restaurant_id' => $restaurant->id]);
    Storage::disk('local')->put($upload->file_path, 'binary');

    $this->app->bind(MenuParser::class, fn () => new class implements MenuParser
    {
        public function parse(string $rawText): array
        {
            return [];
        }
    });

    app(MenuUploadService::class)->process($upload);

    expect($upload->refresh()->status)->toBe(MenuUpload::STATUS_FAILED)
        ->and($upload->failure_reason)->not->toBeNull();
});

test('an owner reviews and publishes staged items into the live menu', function () {
    [$owner, $restaurant] = actingAsOwner();
    $upload = MenuUpload::factory()->create([
        'restaurant_id' => $restaurant->id,
        'status' => MenuUpload::STATUS_NEEDS_REVIEW,
    ]);

    $response = $this->postJson("/api/menu-uploads/{$upload->id}/publish", [
        'items' => [
            ['category' => 'Starters', 'name' => 'Olives', 'price' => 3.5, 'description' => null],
            ['category' => 'Starters', 'name' => 'Bruschetta', 'price' => 5, 'description' => 'Tomato & basil'],
            ['category' => 'Mains', 'name' => 'Risotto', 'price' => 14, 'description' => null],
        ],
    ]);

    $response->assertOk()->assertJsonPath('published_items', 3);

    $this->assertDatabaseCount('menu_categories', 2);
    $this->assertDatabaseHas('menu_items', ['name' => 'Risotto', 'menu_upload_id' => $upload->id]);
    expect($upload->refresh()->status)->toBe(MenuUpload::STATUS_PARSED);
});

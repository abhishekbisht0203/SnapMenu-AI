<?php

namespace App\Providers;

use App\Services\Billing\StripeWebhookService;
use App\Services\Menu\FakeMenuParser;
use App\Services\Menu\MenuParser;
use App\Services\Menu\OpenAiMenuParser;
use App\Services\Ocr\FakeOcrEngine;
use App\Services\Ocr\OcrEngine;
use App\Services\Ocr\TesseractOcrEngine;
use App\Support\TenantManager;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantManager::class);

        $this->app->bind(OcrEngine::class, function () {
            return config('menu.ocr.driver') === 'tesseract'
                ? new TesseractOcrEngine(config('menu.ocr.tesseract_binary'))
                : new FakeOcrEngine;
        });

        $this->app->bind(MenuParser::class, function () {
            if (config('menu.ai_provider') === 'openai') {
                return new OpenAiMenuParser(
                    (string) config('menu.openai.key'),
                    (string) config('menu.openai.model'),
                );
            }

            return new FakeMenuParser;
        });

        $this->app->bind(StripeWebhookService::class, fn () => new StripeWebhookService(
            (string) config('services.stripe.webhook_secret'),
            (int) config('services.stripe.tolerance', 300),
        ));
    }

    public function boot(): void
    {
        //
    }
}

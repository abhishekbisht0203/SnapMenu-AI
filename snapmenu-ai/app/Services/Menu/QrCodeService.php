<?php

namespace App\Services\Menu;

use App\Models\Restaurant;
use App\Models\Table;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrCodeService
{
    /**
     * The customer-facing URL a table's QR code points to.
     */
    public function urlFor(Restaurant $restaurant, Table $table): string
    {
        $base = rtrim(config('app.frontend_url'), '/');

        return "{$base}/r/{$restaurant->slug}/t/{$table->qr_code_token}";
    }

    /**
     * Render the QR code as an inline SVG string (no imagick dependency).
     */
    public function svgFor(Restaurant $restaurant, Table $table, int $size = 320): string
    {
        return QrCode::format('svg')->size($size)->margin(1)
            ->generate($this->urlFor($restaurant, $table));
    }
}

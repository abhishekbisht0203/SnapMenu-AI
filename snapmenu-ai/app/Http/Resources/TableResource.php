<?php

namespace App\Http\Resources;

use App\Models\Table;
use App\Services\Menu\QrCodeService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Table
 */
class TableResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $qr = app(QrCodeService::class);

        return [
            'id' => $this->id,
            'label' => $this->label,
            'qr_code_token' => $this->qr_code_token,
            'menu_url' => $qr->urlFor($this->restaurant, $this->resource),
            'qr_svg_url' => route('tables.qr', ['token' => $this->qr_code_token]),
        ];
    }
}

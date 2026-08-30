<?php

namespace App\Http\Resources;

use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin OrderItem
 */
class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_item_id' => $this->menu_item_id,
            'name' => $this->whenLoaded('menuItem', fn () => $this->menuItem->name),
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'notes' => $this->notes,
        ];
    }
}

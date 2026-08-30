<?php

namespace App\Http\Requests\Menu;

use App\Models\MenuCategory;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class MenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => [$required, 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'is_available' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'menu_category_id' => ['nullable', 'integer', $this->categoryBelongsToTenant()],
        ];
    }

    /**
     * The global scope already restricts MenuCategory lookups to the current
     * restaurant, so a miss here means the category is not ours (or absent).
     */
    private function categoryBelongsToTenant(): ValidationRule
    {
        return new class implements ValidationRule
        {
            public function validate(string $attribute, mixed $value, \Closure $fail): void
            {
                if ($value !== null && ! MenuCategory::whereKey($value)->exists()) {
                    $fail('The selected category is invalid.');
                }
            }
        };
    }
}

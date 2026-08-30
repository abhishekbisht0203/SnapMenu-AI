<?php

namespace App\Services\Ocr;

/**
 * Local/dev OCR stand-in. If a ".txt" sidecar sits next to the uploaded image
 * it is used verbatim; otherwise a small sample menu is returned so the rest of
 * the pipeline can be exercised without Tesseract installed.
 */
class FakeOcrEngine implements OcrEngine
{
    public function extract(string $absolutePath): string
    {
        $sidecar = preg_replace('/\.[^.]+$/', '.txt', $absolutePath);

        if ($sidecar && is_file($sidecar)) {
            return (string) file_get_contents($sidecar);
        }

        return <<<'TXT'
        STARTERS
        Garlic Bread - 4.50
        Soup of the Day - 5.00

        MAINS
        Margherita Pizza - 11.00
        Spaghetti Carbonara - 12.50

        DRINKS
        Sparkling Water - 2.00
        House Red Wine - 6.00
        TXT;
    }
}

<?php

namespace App\Services\Ocr;

interface OcrEngine
{
    /**
     * Extract raw text from an image stored on the given disk path.
     */
    public function extract(string $absolutePath): string;
}

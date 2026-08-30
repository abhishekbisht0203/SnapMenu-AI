<?php

namespace App\Services\Ocr;

use RuntimeException;
use Symfony\Component\Process\Process;

/**
 * Dev/prod OCR via the Tesseract CLI. Prod can swap this for a Google Cloud
 * Vision implementation behind the same interface with no pipeline changes.
 */
class TesseractOcrEngine implements OcrEngine
{
    public function __construct(private readonly string $binary = 'tesseract') {}

    public function extract(string $absolutePath): string
    {
        $process = new Process([$this->binary, $absolutePath, 'stdout', '--psm', '6']);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('Tesseract failed: '.$process->getErrorOutput());
        }

        return trim($process->getOutput());
    }
}

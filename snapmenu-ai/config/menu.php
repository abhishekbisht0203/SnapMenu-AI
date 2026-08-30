<?php

return [

    /*
     * Which OCR + LLM implementations to resolve. "fake" keeps everything
     * offline for local dev, CI and tests; "openai" wires the real LLM.
     */
    'ai_provider' => env('AI_PROVIDER', 'fake'),

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    ],

    'ocr' => [
        'driver' => env('OCR_DRIVER', 'fake'), // fake | tesseract
        'tesseract_binary' => env('TESSERACT_BINARY', 'tesseract'),
    ],

    /*
     * A parsed upload scoring at or above this lands as "parsed"; anything
     * lower is held as "needs_review" for a human to approve.
     */
    'confidence_threshold' => (float) env('MENU_CONFIDENCE_THRESHOLD', 0.8),

    'max_processing_attempts' => 3,
];

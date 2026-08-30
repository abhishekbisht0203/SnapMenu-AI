<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('file_path');
            $table->enum('status', ['processing', 'parsed', 'needs_review', 'failed'])->default('processing');
            $table->text('raw_ocr_text')->nullable();
            $table->float('ai_confidence_score')->nullable();
            $table->unsignedInteger('processing_attempts')->default(0);
            $table->text('failure_reason')->nullable();
            $table->json('parsed_items')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_uploads');
    }
};

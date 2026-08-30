<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TableResource;
use App\Models\Table;
use App\Services\Menu\QrCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TableController extends Controller
{
    public function __construct(private readonly QrCodeService $qr) {}

    public function index(): AnonymousResourceCollection
    {
        return TableResource::collection(Table::query()->with('restaurant')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['label' => ['required', 'string', 'max:255']]);

        $table = Table::create($data)->load('restaurant');

        return TableResource::make($table)->response()->setStatusCode(201);
    }

    public function update(Request $request, int $table): TableResource
    {
        $data = $request->validate(['label' => ['required', 'string', 'max:255']]);

        $model = $this->find($table);
        $model->update($data);

        return TableResource::make($model->load('restaurant'));
    }

    public function destroy(int $table): Response
    {
        $this->find($table)->delete();

        return response()->noContent();
    }

    public function qr(int $table): Response
    {
        $model = $this->find($table);

        return response(
            $this->qr->svgFor($model->restaurant, $model),
            200,
            ['Content-Type' => 'image/svg+xml']
        );
    }

    private function find(int $id): Table
    {
        return Table::query()->findOrFail($id);
    }
}

import { useEffect, useMemo, useState } from 'react';
import { ProductCard, useCuratedProducts, useProductMedia } from '@shopify/shop-minis-react';
import { RoomPreview, type PreviewModel } from './RoomPreview';

interface ARCategoryRowProps {}

// helpers left out; not needed with useProductMedia

// keep helpers in case of future expansion

export function ARCategoryRow({}: ARCategoryRowProps) {
  // Use curated collection intended for AR-capable items
  const { products, loading } = useCuratedProducts({
    handle: 'ar-models',
  });

  // Debug: print curated AR collection results
  useEffect(() => {
    const ids = (products ?? []).map((p: any) => String(p?.id ?? p?.gid)).filter(Boolean);
    console.log('[ARCategoryRow] Curated products', { handle: 'ar-models', count: ids.length, ids });
  }, [products]);

  // Deduplicate and keep only products with a model media
  const arProducts = useMemo(() => {
    if (!products) return [] as any[];
    const seen = new Set<string>();
    const result: any[] = [];
    for (const p of products) {
      const id: string = String((p as any)?.id ?? (p as any)?.gid ?? '');
      if (!id) continue;
      if (seen.has(id)) continue;
      // We don't know media yet; we'll filter after fetching media per product
      seen.add(id);
      result.push(p);
    }
    return result;
  }, [products]);

  // Selection state of model ids
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewModels, setPreviewModels] = useState<PreviewModel[]>([]);
  const [modelMap, setModelMap] = useState<Record<string, PreviewModel>>({});

  function toggleSelected(modelId: string | null) {
    if (!modelId) return;
    setSelectedModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId); else next.add(modelId);
      return next;
    });
  }

  // Shopify XR initialization (best-effort)
  useEffect(() => {
    const w = window as any;
    const Shopify = w?.Shopify;
    function setupShopifyXr() {
      const xr = (window as any)?.ShopifyXR;
      if (!xr) return;
      // Best-effort: register models if possible, then set up handlers
      try {
        // We rely primarily on data attributes and launchXR; addModels is optional here
      } catch {}
      try { xr.setupXRElements?.(); } catch {}
    }
    if (Shopify?.loadFeatures) {
      Shopify.loadFeatures?.([
        { name: 'shopify-xr', version: '1.0', onLoad: setupShopifyXr },
      ]);
    } else {
      // If features already loaded, try to set up directly
      setupShopifyXr();
    }
  }, [arProducts]);

// Kept for future AR native launch; currently unused as we show 3D preview instead
console.log('arProducts', arProducts);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">AR Models</h3>
          <p className="text-sm text-gray-600">Products with 3D/AR previews</p>
        </div>
        <button
          onClick={() => {
            const selected = Array.from(selectedModelIds);
            const models = (selected.length > 0
              ? selected.map((id) => modelMap[id]).filter(Boolean)
              : Object.values(modelMap)
            ) as PreviewModel[];
            setPreviewModels(models);
            setPreviewOpen(true);
          }}
          className="px-3 py-2 rounded-md text-white text-sm bg-blue-600"
        >
          {selectedModelIds.size > 0 ? `Show in AR (${selectedModelIds.size} selected)` : 'Show in AR'}
        </button>
      </div>

      {loading && arProducts.length === 0 && (
        <div className="flex space-x-4 overflow-x-hidden pb-2">
          {[0,1,2].map((i) => (
            <div key={i} className="flex-shrink-0 w-48 h-56 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!loading && arProducts.length === 0 && (
        <p className="text-sm text-gray-400">No AR-capable items found for this query.</p>
      )}

      {arProducts.length > 0 && (
        <div className="flex space-x-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {arProducts.map((product: any) => (
            <ARProductTile
              key={String(product?.id ?? product?.gid)}
              product={product}
              selectedModelIds={selectedModelIds}
              onToggleSelected={(modelId) => toggleSelected(modelId)}
              onModelInfo={(m) => m && setModelMap((prev) => ({ ...prev, [m.id]: m }))}
            />
          ))}
        </div>
      )}

      {previewOpen && (
        <RoomPreview models={previewModels} onClose={() => setPreviewOpen(false)} />)
      }
    </div>
  );
}

interface ARProductTileProps {
  product: any;
  selectedModelIds: Set<string>;
  onToggleSelected: (modelId: string | null) => void;
  onModelInfo: (model: PreviewModel | null) => void;
}

function ARProductTile({ product, selectedModelIds, onToggleSelected, onModelInfo }: ARProductTileProps) {
  const productId: string = String((product as any)?.id ?? (product as any)?.gid ?? '');
  const { media } = useProductMedia({ id: productId, first: 10 });

  // Debug: print media summary for this product
  useEffect(() => {
    const types = (media ?? []).map((m: any) => m?.mediaContentType).filter(Boolean);
    console.log('[ARProductTile] Media', { productId, types });
  }, [productId, media]);

  console.log('media', media)
  console.log('media id', productId);

  const modelInfo = useMemo(() => {
    if (!media) return { id: null as string | null, url: null as string | null };
    const model = media.find((m: any) => m?.mediaContentType === 'MODEL_3D');
    const sources: any[] = (model as any)?.sources ?? [];
    const preferred = sources.find((s) => /gltf|glb/i.test(String(s?.mimeType)) || /gltf|glb/i.test(String(s?.format)) || String(s?.url ?? '').match(/\.(gltf|glb)$/i));
    const sourceUrl = preferred?.url ?? sources[0]?.url ?? null;
    return { id: model?.id ?? null, url: sourceUrl };
  }, [media]);

  useEffect(() => {
    if (modelInfo.id && modelInfo.url) {
      onModelInfo({ id: modelInfo.id, url: modelInfo.url, title: String(product?.title ?? '') });
    } else {
      onModelInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelInfo.id, modelInfo.url]);

  const isSelected = modelInfo.id ? selectedModelIds.has(modelInfo.id) : false;

  return (
    <div
      className={`relative flex-shrink-0 w-48 snap-start border ${isSelected ? 'border-blue-500' : 'border-transparent'} rounded`}
    >
      <div className={`absolute top-2 left-2 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-white/90 text-gray-700 border border-gray-300'}`}>
        {isSelected ? '✓' : '+'}
      </div>
      <ProductCard product={product} />
      <div className="mt-2">
        <button
          onClick={() => onToggleSelected(modelInfo.id)}
          disabled={!modelInfo.id}
          className={`w-full px-2 py-1 rounded text-xs border ${isSelected ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'} disabled:opacity-50`}
        >
          {isSelected ? 'Selected' : 'Select for AR'}
        </button>
      </div>
    </div>
  );
}



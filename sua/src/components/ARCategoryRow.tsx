import { useEffect, useMemo, useState } from 'react';
import { ProductCard, useCuratedProducts, useProductMedia } from '@shopify/shop-minis-react';
import { fal } from '@fal-ai/client';
import { type PreviewModel } from './RoomPreview';
import { RoomFinal } from './RoomFinal'

interface ARCategoryRowProps { query?: string }

// helpers left out; not needed with useProductMedia

// keep helpers in case of future expansion

export function ARCategoryRow({ query }: ARCategoryRowProps) {
  // Prefer search by the user's query; fallback to curated AR handle
  const useSearch = !!(query && query.trim().length > 0);
  const baseQuery = useSearch ? query!.trim() : '';
  const KNOWN_TAGS = useMemo(() => ['beds', 'chairs', 'office', 'sofas', 'storage', 'tables', 'plants'], []);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const TAG_HIERARCHY = useMemo(
    () => ({
      plants: [
        'Aquatic Plants',
        'Flowers',
        'Indoor & Outdoor Plants',
        'Plant & Herb Growing Kits',
        'Seeds, Bulbs & Accessories',
        'Trees',
      ],
      beds: ['Bed', 'Bed Frame', 'Headboard', 'Mattress', 'Bedding'],
      chairs: ['Chair', 'Armchair', 'Recliner', 'Stool', 'Dining Chair', 'Office Chair'],
      office: ['Desk', 'Office Chair', 'Bookcase', 'Filing Cabinet', 'Monitor Stand'],
      sofas: ['Sofa', 'Couch', 'Loveseat', 'Sectional', 'Ottoman'],
      storage: ['Cabinet', 'Shelf', 'Closet', 'Storage Bench', 'Drawer Unit'],
      tables: ['Dining Table', 'Coffee Table', 'Side Table', 'Console Table', 'Nightstand'],
    }),
    []
  );
  const selectedSubTags = useMemo(() => {
    const roots = (selectedTags || []).map((t) => t.toLowerCase());
    const set = new Set<string>();
    roots.forEach((r) => {
      const children = (TAG_HIERARCHY as any)[r] as string[] | undefined;
      if (children && children.length) children.forEach((c) => set.add(c));
      // Also include the root keyword itself as a tag hint
      set.add(r);
    });
    return Array.from(set);
  }, [selectedTags, TAG_HIERARCHY]);

  // Base curated collection (used only to surface errors)
  const { error: curatedError } = useCuratedProducts({ handle: 'ar-models' });
  // Fetch curated subset constrained by hierarchical tags chosen by AI (anyTags)
  const { products: curatedTaggedProducts, loading: curatedTaggedLoading } = useCuratedProducts({
    handle: 'ar-models',
    anyTags: selectedSubTags.length > 0 ? selectedSubTags : undefined,
  } as any);

  // Pick title keywords from KNOWN_TAGS using AI; no furniture/tag fallback
  useEffect(() => {
    let cancelled = false;
    async function pickTags() {
      if (!useSearch) {
        setSelectedTags([]);
        return;
      }
      try {
        const prompt = `User query: "${baseQuery}"

From ONLY this list of valid product tags: ${KNOWN_TAGS.join(', ')}

Choose the single most relevant 1-2 tags. Respond as a comma-separated list with ONLY tags from the list.`;
        console.log('[ARCategoryRow] AI title-key prompt', { baseQuery, KNOWN_TAGS });
        const result: any = await fal.subscribe('fal-ai/any-llm', {
          input: { model: 'anthropic/claude-3.5-sonnet', prompt },
        });
        console.log('[ARCategoryRow] AI raw result keys', result ? Object.keys(result) : null);
        let text = '';
        if (typeof result === 'string') text = result;
        else if (typeof result?.output === 'string') text = result.output;
        else if (typeof result?.text === 'string') text = result.text;
        else if (typeof result?.data?.output === 'string') text = result.data.output;
        console.log('[ARCategoryRow] AI extracted text', text);
        const picked = String(text || '')
          .split(/[,\n]/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .filter((t) => KNOWN_TAGS.includes(t));
        if (!cancelled) {
          if (picked.length > 0) {
            const final = picked.slice(0, 2);
            console.log('[ARCategoryRow] AI-picked title parts', final);
            setSelectedTags(final);
          } else {
            console.error('[ARCategoryRow] AI returned no valid title parts; showing all AR models');
            setSelectedTags([]);
          }
        }
      } catch (e) {
        console.error('[ARCategoryRow] AI tag-pick failed; showing all AR models', e);
        if (!cancelled) setSelectedTags([]);
      }
    }
    pickTags();
    return () => {
      cancelled = true;
    };
  }, [useSearch, baseQuery, KNOWN_TAGS]);

  // Log hook errors
  useEffect(() => {
    if (curatedError) console.error('[ARCategoryRow] Curated products error', curatedError);
  }, [curatedError]);

  // Log the anyTags used for the curated fetch
  useEffect(() => {
    console.log('[ARCategoryRow] anyTags for curated products', { selectedTags, selectedSubTags });
  }, [selectedTags, selectedSubTags]);

  // Deduplicate and keep only products with a model media; no fallbacks if AI didn't pick tags
  const arProducts = useMemo(() => {
    if (selectedSubTags.length === 0) return [] as any[];
    const productsList = curatedTaggedProducts || [];
    if (!productsList) return [] as any[];
    const seen = new Set<string>();
    const result: any[] = [];
    for (const p of productsList) {
      const id: string = String((p as any)?.id ?? (p as any)?.gid ?? '');
      if (!id) continue;
      if (seen.has(id)) continue;
      // We don't know media yet; we'll filter after fetching media per product
      seen.add(id);
      result.push(p);
    }
    console.log('[ARCategoryRow] Deduped products for media pass', { inCount: (productsList || []).length, outCount: result.length, selectedTags });
    return result;
  }, [curatedTaggedProducts, selectedSubTags]);

  const loading = curatedTaggedLoading;

  console.log('[ARCategoryRow] selectedTags', selectedTags, 'selectedSubTags', selectedSubTags);
  console.log('[ARCategoryRow] arProducts', arProducts?.map((p: any) => p.title));

  // Selection state of model ids
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewModels, setPreviewModels] = useState<PreviewModel[]>([]);
  const [modelMap, setModelMap] = useState<Record<string, PreviewModel>>({});
  const [hasModel3DMap, setHasModel3DMap] = useState<Record<string, boolean>>({});

  // Whenever model map updates, dump all resolved GLTF/GLB URLs alongside selected tags
  useEffect(() => {
    const urls = Object.values(modelMap).map((m) => m.url).filter(Boolean);
    if (urls.length > 0) {
      console.log('[ARCategoryRow] Resolved GLTF URLs for current results', { urls, selectedTags });
    } else {
      console.log('[ARCategoryRow] No GLTF URLs resolved yet', { selectedTags });
    }
  }, [modelMap, selectedTags]);

  function toggleSelected(modelId: string | null) {
    if (!modelId) return;
    setSelectedModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        console.log('[ARCategoryRow] Unselect model', { modelId });
        next.delete(modelId);
      } else {
        console.log('[ARCategoryRow] Select model', { modelId });
        next.add(modelId);
      }
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
            console.log('[ARCategoryRow] Show in AR click', {
              selectedCount: selected.length,
              availableModelCount: Object.keys(modelMap).length,
              modelsCount: models.length,
            });
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
          {([...arProducts]
            .sort((a: any, b: any) => {
              const aid = String(a?.id ?? a?.gid ?? '');
              const bid = String(b?.id ?? b?.gid ?? '');
              const as = hasModel3DMap[aid] ? 1 : 0;
              const bs = hasModel3DMap[bid] ? 1 : 0;
              return bs - as; // 3D first
            })
          ).map((product: any) => (
            <ARProductTile
              key={String(product?.id ?? product?.gid)}
              product={product}
              selectedModelIds={selectedModelIds}
              onToggleSelected={(modelId) => toggleSelected(modelId)}
              onModelInfo={(m) => m && setModelMap((prev) => ({ ...prev, [m.id]: m }))}
              onHasModel3D={(pid, has3d) => setHasModel3DMap((prev) => (prev[pid] === has3d ? prev : { ...prev, [pid]: has3d }))}
            />
          ))}
        </div>
      )}

      {previewOpen && (
        <RoomFinal models={previewModels} onClose={() => setPreviewOpen(false)} />)
      }
    </div>
  );
}

interface ARProductTileProps {
  product: any;
  selectedModelIds: Set<string>;
  onToggleSelected: (modelId: string | null) => void;
  onModelInfo: (model: PreviewModel | null) => void;
  onHasModel3D?: (productId: string, has3d: boolean) => void;
}

function ARProductTile({ product, selectedModelIds, onToggleSelected, onModelInfo, onHasModel3D }: ARProductTileProps) {
  const productId: string = String((product as any)?.id ?? (product as any)?.gid ?? '');
  const { media } = useProductMedia({ id: productId, first: 50 });
  console.log('media', media);
  console.log('[ARProductTile] product', { id: productId, title: String((product as any)?.title ?? '') });

  // Debug: print media summary for this product
  useEffect(() => {
    const types = (media ?? []).map((m: any) => m?.mediaContentType).filter(Boolean);
    console.log('[ARProductTile] Media', { productId, types });
  }, [productId, media]);

  // Removed noisy media dumps

  const modelInfo = useMemo(() => {
    if (!media) {
      console.warn('[ARProductTile] No media returned for product', { productId });
      return { id: null as string | null, url: null as string | null };
    }
    const model = media.find((m: any) => m?.mediaContentType === 'MODEL_3D');
    if (!model) {
      console.warn('[ARProductTile] No MODEL_3D media found for product', { productId });
      return { id: null as string | null, url: null as string | null };
    }
    const sources: any[] = (model as any)?.sources ?? [];
    if (!sources || sources.length === 0) {
      console.error('[ARProductTile] MODEL_3D has no sources', { productId, modelId: (model as any)?.id });
    }
    // Be less strict: prefer GLB/GLTF, but fall back to the first available source URL
    const preferred = sources.find((s) => /gltf|glb/i.test(String(s?.mimeType)) || /gltf|glb/i.test(String(s?.format)) || /\.(gltf|glb)(\?|$)/i.test(String(s?.url ?? '')));
    const sourceUrl = preferred?.url ?? (sources[0]?.url ?? null);
    if (!preferred && sources?.length) {
      console.warn('[ARProductTile] Falling back to first source (not GLTF/GLB)', { productId, modelId: (model as any)?.id });
    }
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

  // Show only items that have MODEL_3D media; still allow selection when a URL exists (even if extension is not obvious)
  const hasModel3D = (media ?? []).some((m: any) => m?.mediaContentType === 'MODEL_3D');
  useEffect(() => {
    onHasModel3D?.(productId, hasModel3D);
  }, [onHasModel3D, productId, hasModel3D]);
  const isRenderable = !!(modelInfo.id && modelInfo.url);

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
          disabled={!isRenderable}
          className={`w-full px-2 py-1 rounded text-xs border ${isSelected ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'} disabled:opacity-50`}
        >
          {isRenderable ? (isSelected ? 'Selected' : 'Select for AR') : '3D Unavailable'}
        </button>
      </div>
    </div>
  );
}



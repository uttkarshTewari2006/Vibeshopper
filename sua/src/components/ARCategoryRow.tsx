import { useEffect, useMemo, useState } from 'react';
import { ProductCard, useCuratedProducts, useProductMedia } from '@shopify/shop-minis-react';
import { RoomPreview, type PreviewModel } from './RoomPreview';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './ARCategoryRow.css';

interface ARCategoryRowProps {}


export function ARCategoryRow({}: ARCategoryRowProps) {
  const { products, loading } = useCuratedProducts({
    handle: 'ar-models',
  });

  useEffect(() => {
    const ids = (products ?? []).map((p: any) => String(p?.id ?? p?.gid)).filter(Boolean);
    console.log('[ARCategoryRow] Curated products', { handle: 'ar-models', count: ids.length, ids });
  }, [products]);

  const arProducts = useMemo(() => {
    if (!products) return [] as any[];
    const seen = new Set<string>();
    const result: any[] = [];
    for (const p of products) {
      const id: string = String((p as any)?.id ?? (p as any)?.gid ?? '');
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(p);
    }
    return result;
  }, [products]);

  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [modelMap, setModelMap] = useState<Record<string, PreviewModel>>({});
  
  const previewModels = useMemo(() => {
    return Array.from(selectedModelIds)
      .map(id => modelMap[id])
      .filter((model): model is PreviewModel => Boolean(model));
  }, [selectedModelIds, modelMap]);

  function toggleSelected(modelId: string | null) {
    if (!modelId) return;
    setSelectedModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId); else next.add(modelId);
      return next;
    });
  }

  useEffect(() => {
    const w = window as any;
    const Shopify = w?.Shopify;
    function setupShopifyXr() {
      const xr = (window as any)?.ShopifyXR;
      if (!xr) return;
      try {
      } catch {}
      try { xr.setupXRElements?.(); } catch {}
    }
    if (Shopify?.loadFeatures) {
      Shopify.loadFeatures?.([
        { name: 'shopify-xr', version: '1.0', onLoad: setupShopifyXr },
      ]);
    } else {
      setupShopifyXr();
    }
  }, [arProducts]);

console.log('arProducts', arProducts);
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white/80 px-3 py-3 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-sm">
      {previewOpen ? (
        <div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-white">
          <RoomPreview models={previewModels} onClose={() => setPreviewOpen(false)} />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 overflow-visible">
            <div 
              className="absolute inset-0 bg-[length:40px_40px] opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #5433EB 1px, transparent 1px),
                  linear-gradient(to bottom, #5433EB 1px, transparent 1px)
                `,
                transform: 'perspective(500px) rotateX(60deg) scaleY(1.5)',
                transformOrigin: 'center bottom',
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
                width: '300%',
                left: '-100%',
                right: '-100%',
                margin: '0 auto'
              }}
            />
          </div>
          
          <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[#5433EB]/5 blur-xl" />
          <div className="pointer-events-none absolute -right-10 -top-20 h-40 w-40 rounded-full bg-[#5433EB]/5 blur-xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-10 h-40 w-40 rounded-full bg-[#5433EB]/8 blur-xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-[#5433EB]/10 blur-xl" />
          <div className="relative z-10 w-full">
            <div className="text-center">
              <h3 className="inline-block text-2xl font-bold px-4 py-1 mt-2 rounded-full">
                <span className="bg-[#260d93] bg-clip-text text-transparent">
                  Vibe with it!
                </span>
              </h3>
            </div>

        {loading && arProducts.length === 0 && (
        <div className="flex space-x-4 overflow-x-hidden pb-2">
            {[0,1,2].map((i) => (
            <div key={i} className="flex-shrink-0 w-48 h-56 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        )}

        {!loading && arProducts.length === 0 && (
          <div className="py-4 text-center text-gray-500">
            No AR products found
          </div>
        )}

        {arProducts.length > 0 && (
          <div className="">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              spaceBetween={-30}
              coverflowEffect={{
                rotate: 20,
                stretch: -30,
                depth: 50,
                modifier: 1.2,
                slideShadows: false,
              }}
              modules={[EffectCoverflow]}
              className="swiper-container"
            >
              {arProducts.map((product) => (
                <SwiperSlide key={product.id}>
                  <div>
                    <ARProductTile
                      product={product}
                      selectedModelIds={selectedModelIds}
                      onToggleSelected={toggleSelected}
                      onModelInfo={(m) => m && setModelMap((prev) => ({ ...prev, [m.id]: m }))}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
            {selectedModelIds.size > 0 && (
              <div className="">
                <button
                  onClick={() => setPreviewOpen(true)}
                  disabled={previewModels.length === 0}
                  className={`w-full py-3 rounded-3xl text-sm font-medium transition-all ${
                    previewModels.length > 0 
                      ? 'bg-gradient-to-r from-[#5433EB] to-[#935BDD] text-white hover:opacity-90' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {previewModels.length > 0 
                    ? `Show in AR [${previewModels.length} selected]`
                    : 'Loading models...'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
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

  useEffect(() => {
    const types = (media ?? []).map((m: any) => m?.mediaContentType).filter(Boolean);
  }, [productId, media]);



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
  }, [modelInfo.id, modelInfo.url]);

  const isSelected = modelInfo.id ? selectedModelIds.has(modelInfo.id) : false;

  return (
    <div
      className={`relative flex-shrink-0 w-48 snap-start border ${isSelected ? 'border-[#60dbb4] bg-[#60dbb4]/10'  : 'border-transparent'} rounded-xl p-2`}
    >
      <ProductCard product={product} />
      <div className="mt-2">
        <button
          onClick={() => onToggleSelected(modelInfo.id)}
          disabled={!modelInfo.id}
          className={`w-[80%] px-2 py-1 rounded-3xl text-xs border mx-auto block ${isSelected ? 'bg-[#60dbb4] text-white' : 'bg-white border-gray-300 text-gray-700'} disabled:opacity-50`}
        >
          {isSelected ? 'Selected' : 'Vibe it Visually'}
        </button>
      </div>
    </div>
  );
}


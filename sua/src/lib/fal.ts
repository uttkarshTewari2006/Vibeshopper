import * as fal from "@fal-ai/serverless-client";

// Configure Fal AI with your API key
// In production, make sure to use environment variables
const FAL_KEY = import.meta.env.VITE_FAL_KEY || "";

if (FAL_KEY) {
  fal.config({
    credentials: FAL_KEY,
  });
}

export { fal };

// Common Fal AI model endpoints
export const FAL_MODELS = {
  // Text-to-Image models
  FLUX_PRO: "fal-ai/flux-pro",
  FLUX_SCHNELL: "fal-ai/flux/schnell",
  STABLE_DIFFUSION_XL: "fal-ai/stable-diffusion-xl",
  
  // Image-to-Image models
  FLUX_PRO_REDUX: "fal-ai/flux-pro/redux",
  
  // Other popular models
  FACE_TO_STICKER: "fal-ai/face-to-sticker",
  REMOVE_BACKGROUND: "fal-ai/imageutils/rembg",
} as const;

export type FalModel = typeof FAL_MODELS[keyof typeof FAL_MODELS];

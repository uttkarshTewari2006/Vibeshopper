import { useState, useCallback } from 'react';
import { fal, FalModel } from '../lib/fal';

interface FalResult {
  images?: Array<{ url: string; width: number; height: number }>;
  image?: { url: string; width: number; height: number };
  [key: string]: any;
}

interface UseFalOptions {
  onSuccess?: (result: FalResult) => void;
  onError?: (error: Error) => void;
}

export function useFal(options: UseFalOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FalResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(async (model: FalModel, input: Record<string, any>) => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await fal.subscribe(model, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log(`Queue position: ${update.queue_position}`);
          }
        },
      });

      setResult(response as FalResult);
      options.onSuccess?.(response as FalResult);
      
      return response as FalResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    generate,
    isLoading,
    result,
    error,
    reset,
  };
}

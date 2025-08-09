import React, { useState, useEffect, useRef } from 'react';
import { useProductSearch } from '@shopify/shop-minis-react';
import { fal } from "@fal-ai/client";
import { CategoryRow } from './CategoryRow';

// Add Vite env types
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_FAL_KEY: string;
    };
  }
}

export interface GeneratedCategory {
  name: string;
  description: string;
  searchTerms: string[];
  priority: number;
}

export function ProductList() {
  const [userPrompt, setUserPrompt] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters] = useState({});
  const [generatedCategories, setGeneratedCategories] = useState<GeneratedCategory[]>([]);
  const [isGeneratingCategories, setIsGeneratingCategories] = useState(false);
  const autoLoadAllRef = useRef(false);

  // Fetch products using the search hook with filters
  const { products, loading, hasNextPage, fetchMore } = useProductSearch({
    query: debouncedQuery,
    filters: filters,
    first: 50
  });

  // Start auto-load-all on query change
  useEffect(() => {
    autoLoadAllRef.current = true;
  }, [debouncedQuery]);

  // Keep fetching pages until we've loaded everything
  useEffect(() => {
    if (!autoLoadAllRef.current) return;
    if (loading) return;
    if (hasNextPage) {
      fetchMore?.();
    } else {
      autoLoadAllRef.current = false;
    }
  }, [hasNextPage, loading, fetchMore]);

  fal.config({
    credentials: import.meta.env.VITE_FAL_KEY
  });

  // Debounce user prompt for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(userPrompt);
    }, 500);

    return () => clearTimeout(timer);
  }, [userPrompt]);

  // Generate categories using Fal.AI
  const generateCategoriesWithAI = async (prompt: string) => {
    setIsGeneratingCategories(true);
    
    try {
      const result = await fal.subscribe("fal-ai/any-llm", {
        input: {
          model: "anthropic/claude-3.5-sonnet",
          prompt: `Based on this project description: "${prompt}", generate 4-6 relevant product categories that could help someone find project templates, starter kits, tools, and related products to support their goal.

For each category, provide:
1. A clear, descriptive name
2. A brief description of what types of products would fit in this category (including diverse types such as software tools, physical equipment, supplements, guides, apps, or planners)
3. 3-5 search terms that would help find relevant products in that category
4. A priority score (1-5, where 5 is most relevant to the project)

Examples of diverse categories might include fitness planners, workout equipment, nutritional supplements, mobile apps, or instructional guides.

Return the response as a valid JSON array with this structure:
[
  {
    "name": "Category Name",
    "description": "Brief description",
    "searchTerms": ["term1", "term2", "term3"],
    "priority": 5
  }
]

Focus on practical, actionable categories that would help someone find a broad range of useful products and tools related to their project goal.`,
        },
      });

      if (result) {
        try {
          // Debug logging - print the complete result structure
          console.log('🔍 Fal.AI Complete Result:', result);
          console.log('🔍 Result keys:', Object.keys(result));
          console.log('🔍 Result type:', typeof result);
          
          // Try different ways to extract categories or a JSON string containing them
          let categories: GeneratedCategory[] | null = null;
          let outputText: string | null = null;

          if (Array.isArray(result)) {
            categories = result as any;
          } else if (typeof result === 'string') {
            outputText = result;
          } else if (result && typeof result === 'object') {
            const r: any = result;
            if (Array.isArray(r.output)) {
              categories = r.output;
            } else if (typeof r.output === 'string') {
              outputText = r.output;
            } else if (r.data) {
              if (Array.isArray(r.data.output)) {
                categories = r.data.output;
              } else if (typeof r.data.output === 'string') {
                outputText = r.data.output;
              }
            } else if (typeof r.text === 'string') {
              outputText = r.text;
            } else if (typeof r.content === 'string') {
              outputText = r.content;
            }
          }

          console.log('📝 Extracted categories:', categories);
          console.log('📝 Extracted outputText:', outputText);

          if (!categories) {
            if (!outputText) {
              throw new Error('No response data found in AI result');
            }

            // Sanitize potential code fences and attempt to parse JSON
            let text = outputText.trim();
            text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();

            let parsed: any;
            try {
              parsed = JSON.parse(text);
            } catch {
              // Try to extract the first JSON array in the text
              const match = text.match(/\[[\s\S]*\]/);
              if (!match) throw new Error('Failed to parse AI output as JSON array');
              parsed = JSON.parse(match[0]);
            }
            if (typeof parsed === 'string') {
              try { parsed = JSON.parse(parsed); } catch {}
            }
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              const fromObj = (parsed as any).output ?? (parsed as any).data?.output ?? (parsed as any).result ?? (parsed as any).content ?? (parsed as any).text;
              if (Array.isArray(fromObj)) {
                parsed = fromObj;
              } else if (typeof fromObj === 'string') {
                try { parsed = JSON.parse(fromObj); } catch { /* ignore */ }
              }
            }
            if (!Array.isArray(parsed)) {
              throw new Error('AI output did not produce an array');
            }
            categories = parsed as GeneratedCategory[];
          }

          // Normalize category objects to expected shape
          categories = categories.map((c: any) => ({
            name: String(c?.name ?? c?.title ?? 'Untitled'),
            description: String(c?.description ?? ''),
            searchTerms: Array.isArray(c?.searchTerms) ? c.searchTerms.map((t: any) => String(t)) : [],
            priority: Number.isFinite(Number(c?.priority)) ? Number(c.priority) : 3,
          }));
          
          // Debug logging - print the parsed categories
          console.log('🏷️ Generated Categories:', categories);
          
          // Sort by priority (highest first)
          const sortedCategories = categories.sort((a: GeneratedCategory, b: GeneratedCategory) => b.priority - a.priority);
          
          // Debug logging - print the sorted categories
          console.log('📊 Sorted Categories by Priority:', sortedCategories);
          
          setGeneratedCategories(sortedCategories);
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          console.error('🔍 Raw result that failed to parse:', result);
          console.error('🔍 Result structure:', JSON.stringify(result, null, 2));
          
          // Fallback to default categories
          setGeneratedCategories([
            {
              name: "Project Templates",
              description: "General project starter kits and templates",
              searchTerms: ["template", "starter", "kit"],
              priority: 3
            }
          ]);
        }
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      // Fallback to default categories
      setGeneratedCategories([
        {
          name: "Project T - Out",
          description: "General project starter kits and templates",
          searchTerms: ["template", "starter", "kit"],
          priority: 3
        }
      ]);
    } finally {
      setIsGeneratingCategories(false);
    }
  };

  // We no longer group globally; each category renders its own query via CategoryRow

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userPrompt.trim()) {
      setDebouncedQuery(userPrompt.trim());
      // Generate AI-powered categories
      await generateCategoriesWithAI(userPrompt.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Project Prompt Input */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          What project would you like to start?
        </h2>
        <form onSubmit={handlePromptSubmit} className="space-y-3">
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Describe your project idea... (e.g., 'I want to build a mobile app for fitness tracking')"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={loading || isGeneratingCategories || !userPrompt.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading || isGeneratingCategories ? 'Analyzing...' : 'Find Project Templates'}
          </button>
        </form>
      </div>

      {/* AI-Generated Categories and Products */}
      {generatedCategories.length > 0 && (
        <div className="space-y-6">
          {generatedCategories.map((category) => (
            <CategoryRow key={category.name} category={category} baseQuery={debouncedQuery} />
          ))}
        </div>
      )}

      {/* Category Generation Loading */}
      {isGeneratingCategories && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Analyzing your project and generating relevant categories...</p>
        </div>
      )}

      {/* No Results */}
      {products && products.length === 0 && debouncedQuery && !loading && !isGeneratingCategories && (
        <div className="text-center py-8">
          <p className="text-gray-500">No project templates found for "{debouncedQuery}"</p>
          <p className="text-sm text-gray-400 mt-2">Try different keywords or browse popular templates</p>
        </div>
      )}

      {/* Search Loading State */}
      {loading && !isGeneratingCategories && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Searching for project templates...</p>
        </div>
      )}
    </div>
  );
}

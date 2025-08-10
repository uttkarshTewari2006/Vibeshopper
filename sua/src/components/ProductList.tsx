import { useState, useEffect } from 'react';
import { fal } from "@fal-ai/client";
import { CategoryRow } from './CategoryRow';
import { LoadingState } from './LoadingState';

// Add Vite env types
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_FAL_KEY: string;
    };
  }
}

export interface GeneratedCategory {
  id: string; // unique identifier for each category
  name: string;
  description: string;
  searchTerms: string[];
  priority: number;
  type?: 'planning_app' | 'tools' | 'consumables' | 'containers' | 'seeds_plants' | 'accessories' | 'other';
  reason?: string;
  isUpdating?: boolean; // track if this category is being updated
}

export interface AIResponse {
  categories: GeneratedCategory[];
}

interface ProductListProps {
  basePrompt?: string; // initial prompt from intro
  prompt?: string; // latest refinement
  resetCounter?: number; // increments to signal a user-initiated reset
 // onVibeTagGenerated?: (vibeTag: string) => void; // callback for when vibe tag is generated
}

export function ProductList({ basePrompt, prompt, resetCounter }: ProductListProps) {
  const [generatedCategories, setGeneratedCategories] = useState<GeneratedCategory[]>([]);
  const [isGeneratingCategories, setIsGeneratingCategories] = useState(false);

  // Fetch products using the search hook with filters
  // We fetch products per-category inside CategoryRow

  const falKey = import.meta.env.VITE_FAL_KEY;
  if (!falKey) {
    console.error('[ProductList] Missing VITE_FAL_KEY. Add it to sua/.env');
  }
  fal.config({
    credentials: falKey
  });



  // Generate categories using Fal.AI
  const generateCategoriesWithAI = async (prompt: string) => {
    setIsGeneratingCategories(true);
    
    try {
      const result = await fal.subscribe("fal-ai/any-llm", {
        input: {
          model: "anthropic/claude-3.5-sonnet",
          prompt: `You are helping a shopper. Combine their initial intent and latest refinement to propose practical shopping categories.

Initial intent (may be empty): ${basePrompt ?? ''}
Latest refinement (may be empty): ${prompt ?? ''}

Task: Generate 5–6 diverse, shoppable categories that help them progress. Return a JSON array only, with items of this shape:
{
  "name": string,
  "description": string,
  "type": one of ["planning_app","tools","consumables","containers","seeds_plants","accessories","other"],
  "searchTerms": string[3..5],
  "priority": integer 1..5,
  "reason": string
}

Rules:
- Ensure coverage across types when relevant: include at least one each of planning_app, tools, consumables, and containers if the goal implies acquiring physical items (e.g., planting/gardening). Use best judgment otherwise.
- Make categories concrete and shoppable. The searchTerms must be specific, commercially useful queries (e.g., "garden hand trowel", "terracotta pots", "potting soil", "seed starter kit", "garden planner app").
- Assign higher priority to categories that are essential next purchases to achieve the goal.
- Use both initial and latest intent; when the latest refines color/style (e.g., "something blue"), bias categories and terms accordingly.
- The vibeTag should be trendy, concise, and capture the essence of what they're shopping for.`,
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
            // If result is an array, it might be the old format or new format
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
          categories = categories.map((c: any, index: number) => ({
            id: c?.id ?? `ai-generated-${Date.now()}-${index}`,
            name: String(c?.name ?? c?.title ?? 'Untitled'),
            description: String(c?.description ?? ''),
            searchTerms: Array.isArray(c?.searchTerms) ? c.searchTerms.map((t: any) => String(t)) : [],
            priority: Number.isFinite(Number(c?.priority)) ? Number(c.priority) : 3,
            type: ((): GeneratedCategory['type'] => {
              const t = String(c?.type ?? 'other');
              const allowed = [
                'planning_app','tools','consumables','containers','seeds_plants','accessories','other'
              ];
              return (allowed as string[]).includes(t) ? (t as any) : 'other';
            })(),
            reason: c?.reason ? String(c.reason) : undefined,
          }));
          
          // Debug logging - print the parsed categories
          console.log('🏷️ Generated Categories:', categories);
          
          // Sort by priority (highest first)
          const sortedCategories = categories.sort((a: GeneratedCategory, b: GeneratedCategory) => b.priority - a.priority);
          
          // Debug logging - print the sorted categories
          console.log('📊 AI Generated Categories:', sortedCategories);
          
          setGeneratedCategories(sortedCategories);
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          console.error('🔍 Raw result that failed to parse:', result);
          console.error('🔍 Result structure:', JSON.stringify(result, null, 2));
          
          // Simple fallback based on the original prompt
          const fallbackCategories: GeneratedCategory[] = [
            {
              id: "fallback-general",
              name: "General Results",
              description: "Broad search results",
              searchTerms: [prompt.split(' ').slice(0, 3).join(' ')], // Use first 3 words of prompt
              priority: 3,
              type: 'other'
            }
          ];
          console.warn('[ProductList] Using fallback categories due to parse error');
          setGeneratedCategories(fallbackCategories);
        }
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      // Simple fallback based on the original prompt
      const fallbackCategories: GeneratedCategory[] = [
        {
          id: "fallback-general-2",
          name: "Search Results",
          description: "General search results",
          searchTerms: [prompt.split(' ').slice(0, 3).join(' ')], // Use first 3 words of prompt
          priority: 3,
          type: 'other'
        }
      ];
      console.warn('[ProductList] Using fallback categories due to API error');
      setGeneratedCategories(fallbackCategories);
    } finally {
      setIsGeneratingCategories(false);
    }
  };

  // Simple function to handle category updates
  const handleCategoryUpdate = async (newPrompt: string) => {
    if (!basePrompt || !newPrompt) {
      // No base prompt, do full generation
      generateCategoriesWithAI(newPrompt);
      return;
    }

    // Step 1: Store current category names for reference
    const categoryNames = generatedCategories.map(cat => cat.name);
    console.log('[ProductList] Current categories:', categoryNames);

    // Step 2: Ask AI to determine if this is specific category update or full refresh
    try {
      const analysisResult = await fal.subscribe("fal-ai/any-llm", {
        input: {
          model: "anthropic/claude-3.5-sonnet",
          prompt: `You are analyzing a user's shopping request to determine their intent.

Current categories: ${categoryNames.join(', ')}

User's new request: "${newPrompt}"

Task: Determine if the user wants to:
1. Update specific categories (they mention specific items that match existing categories)
2. Do a full refresh (they changed their mind completely)

Respond with JSON only:
{
  "intent": "specific" or "full",
  "targetCategories": ["category1", "category2"] // only if intent is "specific", empty array if "full"
}

Examples:
- "show me yellow dresses instead" → specific update to clothing/dress categories
- "I want tools now" → full refresh (completely different)
- "make the shirts blue" → specific update to clothing categories`,
        },
      });

      if (analysisResult) {
        let analysis: any = {};
        
        // Parse the AI response
        if (typeof analysisResult === 'string') {
          try { analysis = JSON.parse(analysisResult); } catch { /* ignore */ }
        } else if (analysisResult && typeof analysisResult === 'object') {
          // Check for different response structures
          const fromObj = (analysisResult as any)?.data?.output || 
                          (analysisResult as any)?.output || 
                          analysisResult;
          if (typeof fromObj === 'string') {
            try { 
              analysis = JSON.parse(fromObj);
              console.log('[ProductList] Parsed analysis from string:', analysis);
            } catch (e) { 
              console.error('[ProductList] Failed to parse analysis JSON:', e);
            }
          } else {
            analysis = fromObj;
            console.log('[ProductList] Using analysis object directly:', analysis);
          }
        }

        console.log('[ProductList] AI Analysis:', analysis);

        // Step 3: Handle based on intent
        if (analysis.intent === 'specific' && Array.isArray(analysis.targetCategories) && analysis.targetCategories.length > 0) {
          // Specific category update
          console.log('[ProductList] Specific update for categories:', analysis.targetCategories);
          
          // Find matching categories by name similarity
          console.log('[ProductList] Looking for target categories:', analysis.targetCategories);
          console.log('[ProductList] Available category names:', generatedCategories.map(cat => cat.name));
          
          const targetCategoryIds = generatedCategories
            .filter(cat => {
              const matches = analysis.targetCategories.some((targetName: string) => {
                const catNameLower = cat.name.toLowerCase();
                const targetNameLower = targetName.toLowerCase();
                const match1 = catNameLower.includes(targetNameLower);
                const match2 = targetNameLower.includes(catNameLower);
                console.log(`[ProductList] Comparing "${cat.name}" vs "${targetName}": includes1=${match1}, includes2=${match2}`);
                return match1 || match2;
              });
              return matches;
            })
            .map(cat => cat.id);

          console.log('[ProductList] Found target category IDs:', targetCategoryIds);

          if (targetCategoryIds.length > 0) {
            // Mark only target categories as updating
            setGeneratedCategories(prev => prev.map(cat => ({
              ...cat,
              isUpdating: targetCategoryIds.includes(cat.id)
            })));

            // Update only the target categories
            const targetCategories = generatedCategories.filter(cat => targetCategoryIds.includes(cat.id));
            
            const updateResult = await fal.subscribe("fal-ai/any-llm", {
              input: {
                model: "anthropic/claude-3.5-sonnet",
                prompt: `Update these specific categories based on the user's request:

Categories to update:
${targetCategories.map(cat => `- ID: ${cat.id}, Name: ${cat.name}, Current terms: [${cat.searchTerms.join(', ')}]`).join('\n')}

User request: "${newPrompt}"

Return JSON array with updated categories. Keep the exact same IDs:
[{"id": "same-id", "name": "Updated Name", "searchTerms": ["new", "terms"], "priority": 3, "type": "same_type"}]`,
              },
            });

            // Process update results
            if (updateResult) {
              let updatedCategories: any[] = [];
              
              console.log('[ProductList] Update result structure:', updateResult);
              
              if (Array.isArray(updateResult)) {
                updatedCategories = updateResult;
              } else if (typeof updateResult === 'string') {
                try { updatedCategories = JSON.parse(updateResult); } catch { /* ignore */ }
              } else if (updateResult && typeof updateResult === 'object') {
                // Check for different response structures
                const fromObj = (updateResult as any)?.data?.output || 
                               (updateResult as any)?.output || 
                               updateResult;
                if (Array.isArray(fromObj)) {
                  updatedCategories = fromObj;
                } else if (typeof fromObj === 'string') {
                  try { 
                    updatedCategories = JSON.parse(fromObj);
                    console.log('[ProductList] Parsed updated categories:', updatedCategories);
                  } catch (e) {
                    console.error('[ProductList] Failed to parse update JSON:', e);
                  }
                }
              }

              if (Array.isArray(updatedCategories)) {
                setGeneratedCategories(prev => prev.map(cat => {
                  const updated = updatedCategories.find(u => u.id === cat.id);
                  if (updated) {
                    return { ...cat, ...updated, isUpdating: false };
                  }
                  return { ...cat, isUpdating: false };
                }));
                console.log('[ProductList] Successfully updated specific categories');
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[ProductList] Analysis failed:', error);
    }

    console.log('[ProductList] Doing full refresh');
    generateCategoriesWithAI(newPrompt);
  };

  useEffect(() => {
    const trimmed = (prompt ?? '').trim();
    if (trimmed) {
      console.log('[ProductList] prompt prop provided/changed, triggering category update:', trimmed);
      handleCategoryUpdate(trimmed);
    }
  }, [prompt]);

  // Clear results when an explicit reset is requested
  useEffect(() => {
    if (resetCounter === undefined) return;
    console.log('[ProductList] resetCounter changed -> clearing results');
    setGeneratedCategories([]);
  }, [resetCounter]);

  // Debug: observe categories changes
  useEffect(() => {
    console.log('[ProductList] generatedCategories count:', generatedCategories.length);
    if (generatedCategories.length <= 1) {
      console.warn('[ProductList] Only one (or zero) categories generated. This may be due to AI output. Categories:', generatedCategories);
    } else {
      console.log('[ProductList] Categories:', generatedCategories);
    }
  }, [generatedCategories]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* AI-Generated Categories and Products */}
      {generatedCategories.length > 0 && (
        <div className="space-y-4">
          {generatedCategories.map((category) => (
            <CategoryRow key={category.name} category={category} baseQuery="" />
          ))}
        </div>
      )}

      {/* Category Generation Loading */}
      {isGeneratingCategories && (
        <LoadingState message="Analyzing your project and generating relevant categories..." />
      )}

      {/* Per-category loading and empty states are handled inside CategoryRow */}
    </div>
  );
}
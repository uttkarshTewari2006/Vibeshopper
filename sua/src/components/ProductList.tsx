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
  name: string;
  description: string;
  searchTerms: string[];
  priority: number;
  type?: 'planning_app' | 'tools' | 'consumables' | 'containers' | 'seeds_plants' | 'accessories' | 'other';
  reason?: string;
}

interface ProductListProps {
  basePrompt?: string; // initial prompt from intro
  prompt?: string; // latest refinement
  resetCounter?: number; // increments to signal a user-initiated reset
}

export function ProductList({ basePrompt, prompt, resetCounter }: ProductListProps) {
  const [userPrompt, setUserPrompt] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  // Filters can be added later if needed for shop-specific constraints
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
- Use both initial and latest intent; when the latest refines color/style (e.g., "something blue"), bias categories and terms accordingly.`,
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
          let sortedCategories = categories.sort((a: GeneratedCategory, b: GeneratedCategory) => b.priority - a.priority);

          // Enforce diversity coverage: ensure presence of key types when relevant
          const requiredTypes: GeneratedCategory['type'][] = ['planning_app','tools','consumables','containers'];
          const present = new Set(sortedCategories.map(c => c.type ?? 'other'));
          const missing = requiredTypes.filter(t => !present.has(t ?? 'other'));
          if (missing.length > 0) {
            const synthesized: GeneratedCategory[] = missing.map((t) => {
              switch (t) {
                case 'planning_app':
                  return { name: 'Planning App', description: 'Plan tasks and track progress', type: 'planning_app', searchTerms: ['planner app','task tracker app','project planner'], priority: 3, reason: 'Ensure organized execution' };
                case 'tools':
                  return { name: 'Tool Set', description: 'Essential kit for the job', type: 'tools', searchTerms: ['tool set','hand tools','starter tool kit'], priority: 3, reason: 'Core physical tools' };
                case 'consumables':
                  return { name: 'Consumables', description: 'Materials used up during work', type: 'consumables', searchTerms: ['consumables','supplies','materials'], priority: 2, reason: 'Common recurring needs' };
                case 'containers':
                  return { name: 'Containers', description: 'Storage or holders needed', type: 'containers', searchTerms: ['containers','bins','pots'], priority: 2, reason: 'Organization/usage' };
                default:
                  return { name: 'Accessories', description: 'Helpful add-ons', type: 'accessories', searchTerms: ['accessories','add-ons'], priority: 1, reason: 'Support items' };
              }
            });
            sortedCategories = [...sortedCategories, ...synthesized];
          }
          
          // Debug logging - print the sorted categories
          console.log('📊 Sorted Categories by Priority:', sortedCategories);
          
          setGeneratedCategories(sortedCategories);
        } catch (parseError) {
          console.error('❌ Failed to parse AI response:', parseError);
          console.error('🔍 Raw result that failed to parse:', result);
          console.error('🔍 Result structure:', JSON.stringify(result, null, 2));
          
          // Fallback to multiple default categories so UI shows multiple rows
          const fallbackCategories: GeneratedCategory[] = [
            {
              name: "Project Templates",
              description: "General project starter kits and templates",
              searchTerms: ["template", "starter", "kit"],
              priority: 5
            },
            {
              name: "Tools & Equipment",
              description: "Hardware, gear and tools to get the job done",
              searchTerms: ["tool", "equipment", "gear"],
              priority: 4
            },
            {
              name: "Guides & Courses",
              description: "Instructions, tutorials and learning resources",
              searchTerms: ["guide", "course", "tutorial"],
              priority: 3
            },
            {
              name: "Apps & Software",
              description: "Apps, SaaS and software to help your project",
              searchTerms: ["app", "software", "tracker"],
              priority: 2
            }
          ];
          console.warn('[ProductList] Using fallback categories due to parse error');
          setGeneratedCategories(fallbackCategories);
        }
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      // Fallback to multiple default categories so UI shows multiple rows
      const fallbackCategories: GeneratedCategory[] = [
        {
          name: "Project Templates",
          description: "General project starter kits and templates",
          searchTerms: ["template", "starter", "kit"],
          priority: 5
        },
        {
          name: "Tools & Equipment",
          description: "Hardware, gear and tools to get the job done",
          searchTerms: ["tool", "equipment", "gear"],
          priority: 4
        },
        {
          name: "Guides & Courses",
          description: "Instructions, tutorials and learning resources",
          searchTerms: ["guide", "course", "tutorial"],
          priority: 3
        },
        {
          name: "Apps & Software",
          description: "Apps, SaaS and software to help your project",
          searchTerms: ["app", "software", "tracker"],
          priority: 2
        }
      ];
      console.warn('[ProductList] Using fallback categories due to API error');
      setGeneratedCategories(fallbackCategories);
    } finally {
      setIsGeneratingCategories(false);
    }
  };

  // React to controlled prompt updates (e.g., persisted AgentInput across screens)
  useEffect(() => {
    const trimmed = (prompt ?? '').trim();
    if (trimmed) {
      console.log('[ProductList] prompt prop provided/changed, triggering generation:', trimmed);
      setUserPrompt(trimmed);
      setDebouncedQuery(trimmed);
      // fire and forget
      generateCategoriesWithAI(trimmed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  // Clear results when an explicit reset is requested
  useEffect(() => {
    if (resetCounter === undefined) return;
    console.log('[ProductList] resetCounter changed -> clearing results');
    setUserPrompt('');
    setDebouncedQuery('');
    setGeneratedCategories([]);
  }, [resetCounter]);

  // Debug: observe categories and query changes
  useEffect(() => {
    console.log('[ProductList] debouncedQuery:', debouncedQuery);
    console.log('[ProductList] generatedCategories count:', generatedCategories.length);
    if (generatedCategories.length <= 1) {
      console.warn('[ProductList] Only one (or zero) categories generated. This may be due to AI output. Categories:', generatedCategories);
    } else {
      console.log('[ProductList] Categories:', generatedCategories);
    }
  }, [generatedCategories, debouncedQuery]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* AI-Generated Categories and Products */}
      {generatedCategories.length > 0 && (
        <div className="space-y-4">
          {generatedCategories.map((category) => (
            <CategoryRow key={category.name} category={category} baseQuery={debouncedQuery} />
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

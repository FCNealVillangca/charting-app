import { useEffect, useRef } from 'react';
import { apiClient } from '../lib/api-client';
import type { Drawing } from '../components/charts/chart-types';

interface UseDrawingsPersistenceOptions {
  pair: string;
  drawings: Drawing[];
  enabled?: boolean;
  addDrawing: (drawing: Drawing) => void;
  replaceDrawing: (oldDrawing: Drawing, newDrawing: Drawing) => void;
  setIsLoading: (loading: boolean) => void;
}

/**
 * Hook to automatically save drawings to the backend when completed
 * and load them on mount. Ensures all drawings in state have server IDs
 * (except incomplete ones).
 */
export function useDrawingsPersistence({
  pair,
  drawings,
  enabled = true,
  addDrawing,
  replaceDrawing,
  setIsLoading,
}: UseDrawingsPersistenceOptions) {
  // Track which drawings have been saved (server IDs only)
  const savedDrawingIds = useRef<Set<number>>(new Set());
  const isInitialLoad = useRef(true);
  // Track last saved state to detect updates (by server ID)
  const lastSavedState = useRef<Map<number, string>>(new Map());
  // Track if we've loaded for this pair to prevent double-loading
  const hasLoadedForPair = useRef<string | null>(null);

  // Load drawings on mount
  useEffect(() => {
    if (!enabled || !pair) return;
    
    // Prevent double-loading for the same pair
    if (hasLoadedForPair.current === pair) return;

    let cancelled = false;

    const loadDrawings = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getDrawings(pair);
        
        // Check if effect was cancelled (cleanup ran)
        if (cancelled) return;
        
        // Mark this pair as loaded
        hasLoadedForPair.current = pair;
        
        // Add each loaded drawing to context
        response.drawings.forEach((drawing) => {
          addDrawing(drawing as any); // Type cast needed - API type is slightly different
          // Mark as saved and track state
          savedDrawingIds.current.add(drawing.id);
          lastSavedState.current.set(drawing.id, JSON.stringify(drawing));
        });
        
        return response.drawings;
      } catch (error) {
        console.error('Error loading drawings:', error);
        return [];
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          isInitialLoad.current = false;
        }
      }
    };

    loadDrawings();

    // Cleanup function to prevent double-loading in React StrictMode
    return () => {
      cancelled = true;
    };
  }, [pair, enabled, addDrawing, setIsLoading]);

  // Auto-save completed drawings and update modified drawings
  useEffect(() => {
    if (!enabled || !pair || isInitialLoad.current) return;

    const saveDrawings = async () => {
      for (const drawing of drawings) {
        const isComplete = !drawing.series.some(s => s?.style?.isIncomplete);

        // Skip incomplete drawings
        if (!isComplete) continue;

        // Check if this drawing has a server ID
        if (drawing.id === null) {
          // New complete drawing - persist to backend first
          try {
            setIsLoading(true);
            const createdDrawing = await apiClient.createDrawing({
              name: drawing.name,
              type: drawing.type,
              color: drawing.color,
              series: drawing.series as any,
              pair: pair.toUpperCase(),
            });

            // Update the local drawing's ID with the server ID (mutate in place)
            drawing.id = createdDrawing.id;
            
            // Also update series and point IDs
            createdDrawing.series.forEach((serverSeries, idx) => {
              if (drawing.series[idx]) {
                drawing.series[idx].id = serverSeries.id;
                serverSeries.points.forEach((serverPoint, pointIdx) => {
                  if (drawing.series[idx].points[pointIdx]) {
                    drawing.series[idx].points[pointIdx].id = serverPoint.id;
                  }
                });
              }
            });

            // Track as saved
            savedDrawingIds.current.add(createdDrawing.id);
            lastSavedState.current.set(createdDrawing.id, JSON.stringify(drawing));

            console.log('Created drawing with ID:', createdDrawing.id);
          } catch (error) {
            console.error('Error creating drawing:', error);
            // Keep drawing as incomplete or handle error
          } finally {
            setIsLoading(false);
          }
        } else {
          // Existing drawing with server ID - check if it changed
          const drawingJson = JSON.stringify(drawing);
          const lastSaved = lastSavedState.current.get(drawing.id);
          const hasChanged = lastSaved !== drawingJson;

          if (hasChanged) {
            try {
              setIsLoading(true);
              await apiClient.updateDrawing(drawing.id, {
                name: drawing.name,
                color: drawing.color,
                series: drawing.series as any,
              });

              // Update tracking with current state (IDs stay the same now)
              lastSavedState.current.set(drawing.id, JSON.stringify(drawing));

              console.log('Updated drawing with ID:', drawing.id);
            } catch (error) {
              console.error(`Error updating drawing ${drawing.id}:`, error);
            } finally {
              setIsLoading(false);
            }
          }
        }
      }
    };

    saveDrawings();
  }, [drawings, pair, enabled, replaceDrawing, setIsLoading]);

  // Auto-delete from backend when deleted locally
  useEffect(() => {
    if (!enabled || !pair || isInitialLoad.current) return;

    // Build set of current server IDs (only drawings with real IDs)
    const currentDrawingIds = new Set<number>();
    for (const drawing of drawings) {
      if (drawing.id !== null) {
        currentDrawingIds.add(drawing.id);
      }
    }

    // Find drawings that were saved but are now missing (deleted)
    const deletedDrawingIds = Array.from(savedDrawingIds.current).filter(
      (id) => !currentDrawingIds.has(id)
    );

    if (deletedDrawingIds.length > 0) {
      deletedDrawingIds.forEach(async (drawingId) => {
        try {
          setIsLoading(true);
          await apiClient.deleteDrawing(drawingId);
          savedDrawingIds.current.delete(drawingId);
          lastSavedState.current.delete(drawingId);
          console.log('Deleted drawing with ID:', drawingId);
        } catch (error) {
          console.error(`Error deleting drawing ${drawingId}:`, error);
        } finally {
          setIsLoading(false);
        }
      });
    }
  }, [drawings, pair, enabled, setIsLoading]);

  return {
    savedCount: savedDrawingIds.current.size,
  };
}

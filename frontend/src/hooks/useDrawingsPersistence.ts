import { useEffect, useRef } from 'react';
import { apiClient } from '../lib/api-client';
import type { Drawing } from '../components/charts/chart-types';

interface UseDrawingsPersistenceOptions {
  pair: string;
  drawings: Drawing[];
  enabled?: boolean;
}

/**
 * Hook to automatically save drawings to the backend when completed
 * and load them on mount
 */
export function useDrawingsPersistence({
  pair,
  drawings,
  enabled = true,
}: UseDrawingsPersistenceOptions) {
  // Track which drawings have been saved to avoid duplicate saves
  const savedDrawingIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);
  // Track last saved state to detect updates
  const lastSavedState = useRef<Map<string, string>>(new Map());

  // Load drawings on mount
  useEffect(() => {
    if (!enabled || !pair) return;

    const loadDrawings = async () => {
      try {
        const response = await apiClient.getDrawings(pair);
        return response.drawings;
      } catch (error) {
        console.error('Error loading drawings:', error);
        return [];
      }
    };

    loadDrawings().then((savedDrawings) => {
      // Mark all loaded drawings as saved and track their state
      savedDrawings.forEach((drawing) => {
        savedDrawingIds.current.add(drawing.id);
        lastSavedState.current.set(drawing.id, JSON.stringify(drawing));
      });
      isInitialLoad.current = false;
    });
  }, [pair, enabled]);

  // Auto-save completed drawings and update modified drawings
  useEffect(() => {
    if (!enabled || !pair || isInitialLoad.current) return;

    const saveDrawings = async () => {
      for (const drawing of drawings) {
        const isComplete = !drawing.metadata?.isIncomplete;
        if (!isComplete) continue; // Skip incomplete drawings
        
        const drawingJson = JSON.stringify(drawing);
        const lastSaved = lastSavedState.current.get(drawing.id);
        const hasChanged = lastSaved !== drawingJson;
        const isSaved = savedDrawingIds.current.has(drawing.id);

        // Save if: (new complete drawing) OR (existing drawing that changed)
        if (hasChanged && (isSaved || !isSaved)) {
          try {
            if (isSaved && drawing.id !== null) {
              // Update existing drawing
              await apiClient.updateDrawing(drawing.id, {
                name: drawing.name,
                type: drawing.type,
                color: drawing.color,
                series: drawing.series,
                metadata: drawing.metadata,
                pair: pair.toUpperCase(),
              });
              // Update last saved state
              lastSavedState.current.set(drawing.id, drawingJson);
            } else if (drawing.id === null) {
              // Create new drawing (no ID yet)
              const createdDrawing = await apiClient.createDrawing({
                name: drawing.name,
                type: drawing.type,
                color: drawing.color,
                series: drawing.series,
                metadata: drawing.metadata,
                pair: pair.toUpperCase(),
              });
              // Track as saved using the new database ID
              savedDrawingIds.current.add(createdDrawing.id);
              lastSavedState.current.set(createdDrawing.id, JSON.stringify(createdDrawing));
              
              // TODO: Update local drawing with database ID
              console.log('Created drawing with ID:', createdDrawing.id);
            }
          } catch (error) {
            console.error(`Error saving drawing ${drawing.id}:`, error);
          }
        }
      }
    };

    saveDrawings();
  }, [drawings, pair, enabled]);

  // Auto-delete from backend when deleted locally
  useEffect(() => {
    if (!enabled || !pair || isInitialLoad.current) return;

    const currentDrawingIds = new Set(drawings.map((d) => d.id));

    // Find drawings that were saved but are now missing (deleted)
    const deletedDrawingIds = Array.from(savedDrawingIds.current).filter(
      (id) => !currentDrawingIds.has(id)
    );

    if (deletedDrawingIds.length > 0) {
      deletedDrawingIds.forEach(async (drawingId) => {
        if (drawingId === null) return; // Skip drawings that were never saved
        try {
          await apiClient.deleteDrawing(drawingId);
          savedDrawingIds.current.delete(drawingId);
          lastSavedState.current.delete(drawingId);
        } catch (error) {
          console.error(`Error deleting drawing ${drawingId}:`, error);
        }
      });
    }
  }, [drawings, pair, enabled]);

  return {
    savedCount: savedDrawingIds.current.size,
  };
}


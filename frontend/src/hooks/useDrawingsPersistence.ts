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
      // Mark all loaded drawings as saved
      savedDrawings.forEach((drawing) => {
        savedDrawingIds.current.add(drawing.id);
      });
      isInitialLoad.current = false;
    });
  }, [pair, enabled]);

  // Auto-save completed drawings
  useEffect(() => {
    if (!enabled || !pair || isInitialLoad.current) return;

    const saveCompletedDrawings = async () => {
      for (const drawing of drawings) {
        // Check if drawing is complete and not yet saved
        const isComplete = !drawing.metadata?.isIncomplete;
        const notSaved = !savedDrawingIds.current.has(drawing.id);

        if (isComplete && notSaved) {
          try {
            await apiClient.createDrawing({
              id: drawing.id,
              name: drawing.name,
              type: drawing.type,
              color: drawing.color,
              series: drawing.series,
              metadata: drawing.metadata,
              pair: pair.toUpperCase(),
            });

            // Mark as saved
            savedDrawingIds.current.add(drawing.id);
          } catch (error) {
            console.error(`Error saving drawing ${drawing.id}:`, error);
          }
        }
      }
    };

    saveCompletedDrawings();
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
        try {
          await apiClient.deleteDrawing(drawingId);
          savedDrawingIds.current.delete(drawingId);
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


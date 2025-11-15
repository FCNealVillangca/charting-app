import { useEffect, useRef } from 'react'; 
// Import React hooks for managing side effects and references
import { apiClient } from '../lib/api-client'; 
// Import the API client for backend communication
import type { Drawing } from '../components/charts/chart-types'; 
// Import the Drawing type for type safety

interface UseDrawingsPersistenceOptions {
  pair: string; 
  // The trading pair (e.g., "BTC/USD") for which drawings are being managed
  drawings: Drawing[]; 
  // The list of drawings currently in the state
  enabled?: boolean; 
  // Whether the persistence functionality is enabled
  addDrawing: (drawing: Drawing) => void; 
  // Function to add a drawing to the state
  replaceDrawing: (oldDrawing: Drawing, newDrawing: Drawing) => void; 
  // Function to replace an existing drawing with a new one
  setIsLoading: (loading: boolean) => void; 
  // Function to set the loading state
}

/**
 * Hook to automatically save drawings to the backend when completed
 * and load them on mount. Ensures all drawings in state have server IDs
 * (except incomplete ones).
 */
export function useDrawingsPersistence({
  pair, 
  // The trading pair for which drawings are being managed
  drawings, 
  // The current list of drawings in the state
  enabled = true, 
  // Whether the persistence functionality is enabled (default: true)
  addDrawing, 
  // Function to add a drawing to the state
  replaceDrawing, 
  // Function to replace an existing drawing with a new one
  setIsLoading, 
  // Function to set the loading state
}: UseDrawingsPersistenceOptions) {
  const savedDrawingIds = useRef<Set<number>>(new Set()); 
  // A set to store IDs of saved drawings

  const isInitialLoad = useRef(true); 
  // A flag to track whether this is the initial load of the hook

  const lastSavedState = useRef<Map<number, string>>(new Map()); 
  // A map to store the last saved state of each drawing

  const hasLoadedForPair = useRef<string | null>(null); 
  // A reference to track if the current pair has been loaded

  useEffect(() => {
    if (!enabled || !pair) return; 
    // Skip if persistence is disabled or no pair is provided

    if (hasLoadedForPair.current === pair) return; 
    // Prevent double-loading for the same pair

    let cancelled = false; 
    // Flag to handle cleanup in React StrictMode

    const loadDrawings = async () => {
      try {
        setIsLoading(true); 
        // Set loading state to true while fetching data
        const response = await apiClient.getDrawings(pair); 
        // Fetch drawings from the backend
        
        if (cancelled) return; 
        // Check if effect was cancelled (cleanup ran)
        
        hasLoadedForPair.current = pair; 
        // Mark this pair as loaded
        
        response.drawings.forEach((serverDrawing) => {
          // Iterate over each drawing returned from the backend
          const normalized: any = {
            ...serverDrawing, 
            // Spread the server drawing properties
            series: serverDrawing.series.map((s: any) => ({
              ...s, 
              // Spread the series properties
              style: (() => {
                const st = { ...(s.style || {}) } as any; 
                // Ensure the style object exists
                if (serverDrawing.color && !st.color) st.color = serverDrawing.color; 
                // Move color from the drawing to the series style if missing
                if (st.role !== undefined) delete st.role; 
                // Remove the "role" property if it exists
                return st; 
                // Return the updated style object
              })(), 
              // Immediately invoke the function to compute the style
            })), 
            // Map over the series to normalize their styles
          }; 
          delete normalized.color; 
          // Remove the top-level color property from the drawing

          addDrawing(normalized as any); 
          // Add the normalized drawing to the state
          savedDrawingIds.current.add(serverDrawing.id); 
          // Add the drawing ID to the saved set
          lastSavedState.current.set(serverDrawing.id, JSON.stringify(normalized)); 
          // Track the last saved state of the drawing
        });
        
        return response.drawings; 
        // Return the loaded drawings
      } catch (error) {
        console.error('Error loading drawings:', error); 
        // Log any errors that occur during the loading process
        return []; 
        // Return an empty array if an error occurs
      } finally {
        if (!cancelled) {
          setIsLoading(false); 
          // Reset the loading state
          isInitialLoad.current = false; 
          // Mark the initial load as complete
        }
      }
    };

    loadDrawings(); 
    // Trigger the loading of drawings

    return () => {
      cancelled = true; 
      // Cleanup function to prevent double-loading in React StrictMode
    };
  }, [pair, enabled, addDrawing, setIsLoading]); 
  // Dependencies for the useEffect hook

  useEffect(() => {
    if (!enabled || !pair || isInitialLoad.current) return; 
    // Skip if disabled, no pair, or during initial load

    const saveDrawings = async () => {
      for (const drawing of drawings) {
        // Iterate over each drawing in the state
        const isComplete = !drawing.isIncomplete; 
        // Check if the drawing is complete

        if (!isComplete) continue; 
        // Skip incomplete drawings

        if (drawing.id === null) {
          // Check if the drawing has no server ID (new drawing)
          try {
            setIsLoading(true); 
            // Set loading state
            const color = (drawing.series[0] as any)?.style?.color || '#000000'; 
            // Extract the color from the first series or use a default color
            const createdDrawing = await apiClient.createDrawing({
              name: drawing.name, 
              // The name of the drawing
              type: drawing.type, 
              // The type of the drawing
              color, 
              // The color of the drawing
              series: drawing.series as any, 
              // The series data for the drawing
              pair: pair.toUpperCase(), 
              // The trading pair in uppercase
            });

            drawing.id = createdDrawing.id; 
            // Update the local drawing's ID with the server-assigned ID
            
            createdDrawing.series.forEach((serverSeries, idx) => {
              // Iterate over the series returned from the server
              if (drawing.series[idx]) {
                drawing.series[idx].id = serverSeries.id; 
                // Update the series ID
                serverSeries.points.forEach((serverPoint, pointIdx) => {
                  // Iterate over the points in the series
                  if (drawing.series[idx].points[pointIdx]) {
                    drawing.series[idx].points[pointIdx].id = serverPoint.id; 
                    // Update the point ID
                  }
                });
              }
            });

            savedDrawingIds.current.add(createdDrawing.id); 
            // Add the drawing ID to the saved set
            lastSavedState.current.set(createdDrawing.id, JSON.stringify(drawing)); 
            // Track the last saved state of the drawing

            // Replace the drawing in state to trigger any updates
            console.log('Created drawing with ID:', createdDrawing.id); 
            // Log the created drawing ID
          } catch (error) {
            console.error('Error creating drawing:', error); 
            // Log any errors that occur during the creation process
          } finally {
            setIsLoading(false); 
            // Reset the loading state
          }
        } else {
          // Existing drawing - check if it has changed
          const drawingJson = JSON.stringify(drawing); 
          // Serialize the current state of the drawing
          const lastSaved = lastSavedState.current.get(drawing.id); 
          // Get the last saved state of the drawing
          const hasChanged = lastSaved !== drawingJson; 
          // Check if the drawing has changed since the last save

          if (hasChanged) {
            try {
              setIsLoading(true); 
              // Set loading state
              const color = (drawing.series[0] as any)?.style?.color || '#000000'; 
              // Extract the color from the first series or use a default color
              await apiClient.updateDrawing(drawing.id, {
                name: drawing.name, 
                // The name of the drawing
                color, 
                // The color of the drawing
                series: drawing.series as any, 
                // The series data for the drawing
              });

              lastSavedState.current.set(drawing.id, JSON.stringify(drawing)); 
              // Update the last saved state of the drawing

            } catch (error) {
              console.error(`Error updating drawing ${drawing.id}:`, error); 
              // Log any errors that occur during the update process
            } finally {
              setIsLoading(false); 
              // Reset the loading state
            }
          }
        }
      }
    };

    saveDrawings(); 
    // Trigger the save logic
  }, [drawings, pair, enabled, replaceDrawing, setIsLoading]); 
  // Dependencies for the useEffect hook

  useEffect(() => {
    if (!enabled || !pair || isInitialLoad.current) return; 
    // Skip if disabled, no pair, or during initial load

    const currentDrawingIds = new Set<number>(); 
    // Build a set of current server IDs (only drawings with real IDs)
    for (const drawing of drawings) {
      // Iterate over each drawing in the state
      if (drawing.id !== null) {
        currentDrawingIds.add(drawing.id); 
        // Add the drawing's ID to the set
      }
    }

    const deletedDrawingIds = Array.from(savedDrawingIds.current).filter(
      (id) => !currentDrawingIds.has(id) 
      // Find drawings that were saved but are now missing (deleted locally)
    );

    if (deletedDrawingIds.length > 0) {
      // Check if there are any deleted drawings
      deletedDrawingIds.forEach(async (drawingId) => {
        // Iterate over each deleted drawing ID
        try {
          setIsLoading(true); 
          // Set loading state
          await apiClient.deleteDrawing(drawingId); 
          // Delete the drawing from the backend
          savedDrawingIds.current.delete(drawingId); 
          // Remove the drawing ID from the saved set
          lastSavedState.current.delete(drawingId); 
          // Remove the drawing's state from the last saved state
          console.log('Deleted drawing with ID:', drawingId); 
          // Log the deleted drawing ID
        } catch (error) {
          console.error(`Error deleting drawing ${drawingId}:`, error); 
          // Log any errors that occur during the deletion process
        } finally {
          setIsLoading(false); 
          // Reset the loading state
        }
      });
    }
  }, [drawings, pair, enabled, setIsLoading]); 
  // Dependencies for the useEffect hook

  return {
    savedCount: savedDrawingIds.current.size, 
    // Return the count of saved drawings
  };
}

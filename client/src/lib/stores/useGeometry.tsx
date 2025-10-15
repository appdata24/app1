import { create } from "zustand";

export interface GeometryParameter {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface GeometryEdge {
  name: string;
  from: string;
  to: string;
  length: number;
  unit: string;
}

export interface GeometryAngle {
  name: string;
  vertices: [string, string, string];
  value: number;
  unit: string;
}

export interface GeometryData {
  type: string;
  description: string;
  threeJsCode: string;
  properties?: Record<string, string | number>;
  formulas?: Array<{
    name: string;
    formula: string;
  }>;
  vertices?: Array<{
    position: [number, number, number];
    label: string;
  }>;
  initialVertices?: Array<{
    position: [number, number, number];
    label: string;
  }>;
  initialParameters?: Record<string, number>; // Initial parameter values for scaling reference
  hiddenEdges?: Array<[string, string]>; // Pairs of vertex labels for hidden edges
  auxiliaryLines?: Array<[string, string]>; // Auxiliary lines (height, median, etc.) - dashed blue
  userEdges?: Array<[string, string]>; // User-created straight lines between two vertices (solid)
  userVertices?: Array<{ position: [number, number, number]; label: string }>; // User-created points
  parameters?: GeometryParameter[]; // Editable parameters
  edges?: GeometryEdge[]; // All edges with individual lengths
  angles?: GeometryAngle[]; // Important angles
}

export type DistanceMode = 'line-line' | 'plane-plane' | 'line-plane' | null;

export interface DistanceResult {
  value: number;
  formula: string;
  description: string;
}

interface GeometryState {
  geometry: GeometryData | null;
  isLoading: boolean;
  error: string | null;
  labelScale: number;
  distanceMode: DistanceMode;
  editMode: 'edge-length' | 'angle' | 'connect-vertices' | 'add-vertex-free' | 'add-vertex-on-edge' | 'delete-vertex' | null;
  selectedElements: string[];
  distanceResult: DistanceResult | null;
  
  setGeometry: (geometry: GeometryData | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateParameter: (paramName: string, value: number) => void;
  updateEdge: (edgeName: string, length: number) => void;
  updateAngle: (angleName: string, value: number) => void;
  setLabelScale: (scale: number) => void;
  setDistanceMode: (mode: DistanceMode) => void;
  setEditMode: (mode: 'edge-length' | 'angle' | 'connect-vertices' | 'add-vertex-free' | 'add-vertex-on-edge' | 'delete-vertex' | null) => void;
  addSelectedElement: (element: string) => void;
  clearSelection: () => void;
  setDistanceResult: (result: DistanceResult | null) => void;
  addUserEdge: (v1: string, v2: string) => void;
  addUserVertex: (position: [number, number, number], preferredLabel?: string) => void;
  removeUserVertex: (label: string) => void;
}

export const useGeometry = create<GeometryState>((set, get) => ({
  geometry: null,
  isLoading: false,
  error: null,
  labelScale: 1.0,
  distanceMode: null,
  editMode: null,
  selectedElements: [],
  distanceResult: null,
  
  setGeometry: (geometry) => {
    // Store initial vertices and parameters for scaling reference
    if (geometry && geometry.vertices && !geometry.initialVertices) {
      geometry.initialVertices = JSON.parse(JSON.stringify(geometry.vertices));
      
      // Store initial parameter values
      if (geometry.parameters) {
        geometry.initialParameters = {};
        geometry.parameters.forEach(p => {
          geometry.initialParameters![p.name] = p.value;
        });
      }
    }
    set({ geometry });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLabelScale: (labelScale) => set({ labelScale }),
  // Khi vào chế độ chỉnh sửa, xóa chọn để tránh lẫn; khi thoát (null), giữ nguyên chọn hiện có
  setEditMode: (editMode) => set((state) => {
    if (editMode) {
      return { editMode, selectedElements: [], distanceResult: null };
    }
    return { editMode: null };
  }),
  
  updateParameter: (paramName: string, value: number) => {
    const { geometry } = get();
    if (!geometry?.parameters) return;
    
    const updatedParams = geometry.parameters.map(p => 
      p.name === paramName ? { ...p, value } : p
    );
    
    set({ 
      geometry: { 
        ...geometry, 
        parameters: updatedParams 
      } 
    });
  },
  
  updateEdge: (edgeName: string, length: number) => {
    const { geometry } = get();
    if (!geometry?.edges) return;
    
    const updatedEdges = geometry.edges.map(e => 
      e.name === edgeName ? { ...e, length } : e
    );
    
    set({ 
      geometry: { 
        ...geometry, 
        edges: updatedEdges 
      } 
    });
  },
  
  updateAngle: (angleName: string, value: number) => {
    const { geometry } = get();
    if (!geometry?.angles) return;
    
    const updatedAngles = geometry.angles.map(a => 
      a.name === angleName ? { ...a, value } : a
    );
    
    set({ 
      geometry: { 
        ...geometry, 
        angles: updatedAngles 
      } 
    });
  },
  
  setDistanceMode: (distanceMode) => set({ distanceMode, editMode: null, selectedElements: [], distanceResult: null }),
  
  addSelectedElement: (element) => {
    const { selectedElements, distanceMode, editMode, geometry } = get();
    
    // Prevent duplicates
    if (selectedElements.includes(element)) {
      console.warn('[Selection] Element already selected:', element);
      return;
    }
    
    // Determine selection cap based on mode
    const maxSelections = editMode === 'edge-length' ? 1 : 2;
    if (selectedElements.length >= maxSelections) {
      console.warn('[Selection] Already selected maximum elements');
      return;
    }
    
    // Verify element type matches mode
    const isEdge = element.includes('-') && !element.includes('base-') && !element.includes('top-') && !element.includes('side-') && !element.includes('face-');
    const isFace = element.includes('base-') || element.includes('top-') || element.includes('side-') || element.includes('face-');
    const isVertex = !isEdge && !isFace; // plain labels like A, B, C, S, A'

    // Editing modes only accept edges
    if (editMode === 'edge-length' || editMode === 'angle') {
      if (!isEdge) {
        console.warn('[Selection] Edit mode requires edge selection, got:', element);
        return;
      }
      // Add selection respecting cap
      if (selectedElements.length === 0) {
        set({ selectedElements: [element] });
      } else if (selectedElements.length < maxSelections) {
        set({ selectedElements: [...selectedElements, element] });
      }
      return;
    }

    // Connect vertices mode: accept only vertex labels
    if (editMode === 'connect-vertices') {
      if (!isVertex) {
        console.warn('[Selection] Connect mode requires vertex selection, got:', element);
        return;
      }
      // Validate vertex exists (built-in or user)
      const exists = (geometry?.vertices?.some(v => v.label === element)) || (geometry?.userVertices?.some(v => v.label === element));
      if (!exists) {
        console.warn('[Selection] Vertex does not exist in current geometry:', element);
        return;
      }
      const updated = selectedElements.length === 0 ? [element] : [...selectedElements, element];
      set({ selectedElements: updated });
      // Auto-create edge when two vertices selected
      if (updated.length === 2) {
        const [v1, v2] = updated;
        get().addUserEdge(v1, v2);
      }
      return;
    }

    if (distanceMode === 'line-line' && !isEdge) {
      console.warn('[Selection] Line-line mode requires edge selection, got:', element);
      return;
    }
    
    if (distanceMode === 'plane-plane' && !isFace) {
      console.warn('[Selection] Plane-plane mode requires face selection, got:', element);
      return;
    }
    
    if (distanceMode === 'line-plane') {
      // First selection should be edge or face, second should be opposite
      if (selectedElements.length === 0) {
        // First selection - accept either
        set({ selectedElements: [element] });
      } else {
        // Second selection - must be opposite type
        const firstIsEdge = selectedElements[0].includes('-') && !selectedElements[0].includes('base-') && !selectedElements[0].includes('top-') && !selectedElements[0].includes('side-') && !selectedElements[0].includes('face-');
        if ((firstIsEdge && isFace) || (!firstIsEdge && isEdge)) {
          set({ selectedElements: [...selectedElements, element] });
        } else {
          console.warn('[Selection] Line-plane mode requires one edge and one face');
        }
      }
      return;
    }
    
    set({ selectedElements: [...selectedElements, element] });
  },
  
  clearSelection: () => set({ distanceMode: null, selectedElements: [], distanceResult: null }),
  
  setDistanceResult: (distanceResult) => set({ distanceResult }),

  addUserEdge: (v1, v2) => set((state) => {
    const geometry = state.geometry;
    if (!geometry) return {};
    const userEdges = geometry.userEdges || [];
    const exists = userEdges.some(([a, b]) => (a === v1 && b === v2) || (a === v2 && b === v1));
    if (exists) {
      console.warn('[UserEdge] Edge already exists:', v1, v2);
      return { selectedElements: [] };
    }
    // Compute length from current vertices
    const p1 = geometry.vertices?.find(v => v.label === v1)?.position || geometry.userVertices?.find(v => v.label === v1)?.position;
    const p2 = geometry.vertices?.find(v => v.label === v2)?.position || geometry.userVertices?.find(v => v.label === v2)?.position;
    let length = 0;
    if (p1 && p2) {
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const dz = p2[2] - p1[2];
      length = Math.sqrt(dx*dx + dy*dy + dz*dz);
    }

    // Add to geometry.edges list so it becomes editable like built-in edges
    const existingEdges = geometry.edges || [];
    const alreadyInEdges = existingEdges.some(e => (e.from === v1 && e.to === v2) || (e.from === v2 && e.to === v1));
    const newEdge = alreadyInEdges ? [] : [{
      name: `${v1}${v2}`,
      from: v1,
      to: v2,
      length: parseFloat(length.toFixed(4)),
      unit: 'm'
    } as GeometryEdge];

    const updatedGeom: GeometryData = {
      ...geometry,
      userEdges: [...userEdges, [v1, v2]],
      edges: [...existingEdges, ...newEdge]
    };
    console.log('[UserEdge] Added edge:', v1, v2);
    return { geometry: updatedGeom, selectedElements: [] };
  }),

  addUserVertex: (position, preferredLabel) => set((state) => {
    const geometry = state.geometry;
    if (!geometry) return {};
    const existingLabels = new Set<string>();
    geometry.vertices?.forEach(v => existingLabels.add(v.label));
    geometry.userVertices?.forEach(v => existingLabels.add(v.label));
    geometry.edges?.forEach(e => { existingLabels.add(e.from); existingLabels.add(e.to); });

    let label = preferredLabel?.trim();
    if (!label || existingLabels.has(label)) {
      // Generate next Pn label
      let i = 1;
      while (existingLabels.has(`P${i}`)) i++;
      label = `P${i}`;
    }

    const newUserVertices = [...(geometry.userVertices || []), { position, label }];
    const updatedGeom: GeometryData = { ...geometry, userVertices: newUserVertices };
    console.log('[UserVertex] Added vertex:', label, position);
    return { geometry: updatedGeom };
  }),

  removeUserVertex: (label) => set((state) => {
    const geometry = state.geometry;
    if (!geometry) return {};
    const newUserVertices = (geometry.userVertices || []).filter(v => v.label !== label);
    const newUserEdges = (geometry.userEdges || []).filter(([a, b]) => a !== label && b !== label);
    const newEdges = (geometry.edges || []).filter(e => e.from !== label && e.to !== label);
    const newSelected = (state.selectedElements || []).filter(sel => sel !== label && !sel.includes(`${label}-`) && !sel.includes(`-${label}`));
    const updatedGeom: GeometryData = { 
      ...geometry, 
      userVertices: newUserVertices,
      userEdges: newUserEdges,
      edges: newEdges
    };
    console.log('[UserVertex] Removed vertex:', label);
    return { geometry: updatedGeom, selectedElements: newSelected };
  })
}));

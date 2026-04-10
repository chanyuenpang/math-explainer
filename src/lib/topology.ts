// Topology Engine - Auto-derive edges and angles from point connections

import type { GeoPoint, GeoConnection, GeoEdge, GeoAngleLegacy } from './types';

// 使用统一点类型 (向后兼容)
export type Point = GeoPoint;

// 使用统一连接类型 (向后兼容)
export type Connection = GeoConnection;

// 使用统一边类型 (向后兼容)
export type Edge = GeoEdge;

// 使用统一角类型 (向后兼容)
export type Angle = GeoAngleLegacy;

// Re-export for backward compatibility (without the conflicting re-export)
export type { GeoPoint as TopoPoint, GeoConnection as TopoConnection, GeoEdge };

/**
 * Normalize edge ID to canonical form (alphabetical order)
 * Examples: "BA" -> "AB", "DC" -> "CD"
 */
export function normalizeEdgeId(id: string): string {
  if (id.length !== 2) return id;
  const chars = id.split('');
  return chars.sort().join('');
}

/**
 * TopologyGraph - Auto-derive geometry elements from connections
 */
export class TopologyGraph {
  private points: Map<string, Point>;
  private connections: Connection[];
  private edges: Map<string, Edge>;
  private angles: Map<string, Angle>;
  private edgeColors?: Record<string, string>;

  constructor(points: Point[], connections: Connection[], edgeColors?: Record<string, string>) {
    this.points = new Map(points.map(p => [p.id, p]));
    this.connections = connections;
    this.edges = new Map();
    this.angles = new Map();
    this.edgeColors = edgeColors;
    
    this.deriveEdges();
    this.deriveAngles();
  }

  /**
   * Derive edges from connections (bidirectional)
   */
  private deriveEdges(): void {
    this.connections.forEach(conn => {
      const id = normalizeEdgeId(conn.from + conn.to);
      if (!this.edges.has(id)) {
        const edge: Edge = {
          id,
          from: conn.from,
          to: conn.to
        };
        // Apply color if specified
        if (this.edgeColors && this.edgeColors[id]) {
          edge.color = this.edgeColors[id];
        }
        this.edges.set(id, edge);
      }
    });
  }

  /**
   * Derive angles from connections
   * For each vertex, find all connected points and generate angle combinations
   */
  private deriveAngles(): void {
    // Build adjacency map
    const adjacency = new Map<string, Set<string>>();
    
    this.connections.forEach(conn => {
      if (!adjacency.has(conn.from)) {
        adjacency.set(conn.from, new Set());
      }
      if (!adjacency.has(conn.to)) {
        adjacency.set(conn.to, new Set());
      }
      adjacency.get(conn.from)!.add(conn.to);
      adjacency.get(conn.to)!.add(conn.from);
    });

    // For each vertex with 2+ connections, generate angles
    adjacency.forEach((connectedPoints, vertex) => {
      const points = Array.from(connectedPoints);
      if (points.length < 2) return;

      // Generate all angle combinations (order matters for from/to)
      for (let i = 0; i < points.length; i++) {
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;
          
          const from = points[i];
          const to = points[j];
          const angleId = `angle-${vertex}-${from}-${to}`;
          
          this.angles.set(angleId, {
            id: angleId,
            vertex,
            from,
            to
          });
        }
      }
    });
  }

  /**
   * Get all edges
   */
  getEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  /**
   * Get edge by ID (supports both AB and BA)
   */
  getEdge(id: string): Edge | undefined {
    const normalized = normalizeEdgeId(id);
    return this.edges.get(normalized);
  }

  /**
   * Get all angles
   */
  getAngles(): Angle[] {
    return Array.from(this.angles.values());
  }

  /**
   * Get angle by vertex and arms
   */
  getAngle(vertex: string, from: string, to: string): Angle | undefined {
    const angleId = `angle-${vertex}-${from}-${to}`;
    return this.angles.get(angleId);
  }

  /**
   * Get connected points for a given point
   */
  getConnectedPoints(pointId: string): string[] {
    const connected = new Set<string>();
    
    this.connections.forEach(conn => {
      if (conn.from === pointId) connected.add(conn.to);
      if (conn.to === pointId) connected.add(conn.from);
    });
    
    return Array.from(connected);
  }

  /**
   * Resolve edge ID (normalize AB/BA to same edge object)
   */
  resolveEdge(id: string): Edge | undefined {
    return this.getEdge(id);
  }

  /**
   * Get the two edges that form an angle
   */
  getAngleEdges(vertex: string, arm1: string, arm2: string): [Edge, Edge] | undefined {
    const edge1 = this.getEdge(vertex + arm1);
    const edge2 = this.getEdge(vertex + arm2);
    
    if (!edge1 || !edge2) return undefined;
    
    return [edge1, edge2];
  }

  /**
   * Get point by ID
   */
  getPoint(id: string): Point | undefined {
    return this.points.get(id);
  }

  /**
   * Get all points
   */
  getPoints(): Point[] {
    return Array.from(this.points.values());
  }
}

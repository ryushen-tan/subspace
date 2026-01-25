from typing import Any
from .base import Tool
from models.agent import AgentState
from config.settings import get_settings
import uuid
import json


class VerifyStructureTool(Tool):
    name = "verify_structure"
    description = "Analyze the current mesh structure and provide fixes for issues. Automatically detects broken faces, invalid vertex references, degenerate geometry and can auto-fix them. Use this before finalizing to ensure mesh integrity."
    parameters = {
        "type": "object",
        "properties": {
            "analysis_type": {
                "type": "string",
                "enum": ["basic", "printability", "completeness"],
                "description": "Analysis depth: 'basic' for integrity checks with auto-fix for invalid geometry, 'printability' for 3D printing issues, 'completeness' for missing loops/structure detection",
                "default": "basic"
            },
            "auto_fix": {
                "type": "boolean",
                "description": "If true, automatically fix basic issues (remove invalid edges/faces) and apply LLM-suggested structure improvements",
                "default": False
            }
        },
    }

    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        mesh = state.mesh
        analysis_type = kwargs.get("analysis_type", "basic")
        auto_fix = kwargs.get("auto_fix", False)

        if not mesh.vertices:
            return {
                "valid": False,
                "message": "No mesh available to analyze",
                "issues": ["No vertices defined"],
            }

        issues = []
        warnings = []
        suggestions = {}

        vertex_ids = {v.id for v in mesh.vertices}
        id_to_vertex = {v.id: v for v in mesh.vertices}

        for edge in mesh.edges:
            for vid in edge:
                if vid not in vertex_ids:
                    issues.append(f"Edge references unknown vertex: {vid}")

        for i, face in enumerate(mesh.faces):
            if len(face) < 3:
                issues.append(f"Face {i} has fewer than 3 vertices")
            if len(face) != len(set(face)):
                issues.append(f"Face {i} has duplicate vertices (degenerate)")
            for vid in face:
                if vid not in vertex_ids:
                    issues.append(f"Face {i} references unknown vertex: {vid}")

        basic_valid = len(issues) == 0

        # Generate fix suggestions even for basic mode when issues are found
        if not basic_valid and auto_fix:
            applied = self._fix_basic_issues(state, issues)
            if applied:
                suggestions["applied_fixes"] = applied
            # Re-check validity after fixes
            vertex_ids = {v.id for v in state.mesh.vertices}
            new_issues = []
            for edge in state.mesh.edges:
                if edge[0] not in vertex_ids or edge[1] not in vertex_ids:
                    new_issues.append(f"Edge references unknown vertex")
            for face in state.mesh.faces:
                if len(face) < 3:
                    new_issues.append(f"Face has fewer than 3 vertices")
                elif len(face) != len(set(face)):
                    new_issues.append(f"Face has duplicate vertices")
                elif any(vid not in vertex_ids for vid in face):
                    new_issues.append(f"Face references unknown vertex")
            basic_valid = len(new_issues) == 0
        elif not basic_valid:
            suggestions["fix_suggestions"] = self._generate_fix_suggestions(issues)

        if analysis_type == "basic":
            return {
                "valid": basic_valid,
                "analysis_type": analysis_type,
                "issues": issues,
                "warnings": warnings,
                "suggestions": suggestions,
                "stats": {
                    "vertices": len(mesh.vertices),
                    "edges": len(mesh.edges),
                    "faces": len(mesh.faces),
                    "loops": len(mesh.loops) if mesh.loops else 0,
                },
            }

        if analysis_type in ["printability", "completeness"]:
            mesh_summary = self._create_mesh_summary(mesh)
            llm_analysis = self._llm_analyze(analysis_type, mesh_summary, issues)

            if llm_analysis:
                suggestions = llm_analysis.get("suggestions", {})
                suggestions.update(llm_analysis.get("structures", {}))

                if auto_fix and suggestions:
                    applied = self._apply_suggestions(state, suggestions)
                    if applied:
                        suggestions["applied_fixes"] = applied

        return {
            "valid": basic_valid,
            "analysis_type": analysis_type,
            "issues": issues,
            "warnings": warnings,
            "suggestions": suggestions,
            "stats": {
                "vertices": len(mesh.vertices),
                "edges": len(mesh.edges),
                "faces": len(mesh.faces),
                "loops": len(mesh.loops) if mesh.loops else 0,
                "stitch": len(mesh.stitch) if mesh.stitch else 0,
            },
        }

    def _create_mesh_summary(self, mesh) -> dict:
        vertex_coords = [{"id": v.id, "p": list(v.p)} for v in mesh.vertices[:50]]

        min_x = min(v.p[0] for v in mesh.vertices)
        max_x = max(v.p[0] for v in mesh.vertices)
        min_y = min(v.p[1] for v in mesh.vertices)
        max_y = max(v.p[1] for v in mesh.vertices)
        min_z = min(v.p[2] for v in mesh.vertices)
        max_z = max(v.p[2] for v in mesh.vertices)

        return {
            "vertex_count": len(mesh.vertices),
            "face_count": len(mesh.faces),
            "edge_count": len(mesh.edges),
            "has_loops": bool(mesh.loops),
            "loops_count": len(mesh.loops) if mesh.loops else 0,
            "has_stitch": bool(mesh.stitch),
            "sample_vertices": vertex_coords,
            "bounds": {
                "x": [min_x, max_x],
                "y": [min_y, max_y],
                "z": [min_z, max_z],
            },
        }

    def _llm_analyze(self, analysis_type: str, mesh_summary: dict, current_issues: list) -> dict[str, Any] | None:
        settings = get_settings()

        try:
            if settings.llm_provider == "gemini":
                from ai.gemini import GeminiClient as LLMClient
            else:
                from ai.openrouter import OpenRouterClient as LLMClient

            client = LLMClient()

            prompt = self._build_analysis_prompt(analysis_type, mesh_summary, current_issues)

            response = client.chat(
                messages=[{"role": "user", "content": prompt}],
                tools=None,
                json_mode=True,
            )

            if hasattr(response, "choices"):
                content = response.choices[0].message.content
            else:
                content = response.text if hasattr(response, "text") else str(response)

            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return None

        except Exception as e:
            return None

    def _build_analysis_prompt(self, analysis_type: str, mesh_summary: dict, current_issues: list) -> str:
        prompt = f"""You are a 3D mesh analysis expert. Analyze the following mesh and provide suggestions.

Analysis Type: {analysis_type}

Mesh Data:
- Vertices: {mesh_summary['vertex_count']}
- Faces: {mesh_summary['face_count']}
- Edges: {mesh_summary['edge_count']}
- Loops: {mesh_summary['loops_count']}
- Bounds X: {mesh_summary['bounds']['x']}
- Bounds Y: {mesh_summary['bounds']['y']}
- Bounds Z: {mesh_summary['bounds']['z']}

Current Issues:
{current_issues if current_issues else "None"}

Sample vertices:
{mesh_summary['sample_vertices'][:10]}

"""

        if analysis_type == "printability":
            prompt += """Focus on:
1. Identify thin walls (< 2mm thickness)
2. Detect overhangs > 45 degrees needing support
3. Check for disconnected/isolated components
4. Highlight any structural weak points

Return JSON with:
{
  "suggestions": {
    "issues_found": ["list of identified problems"],
    "reinforcement_points": [{"id": "point_id", "position": [x,y,z], "reason": "explanation"}]
  }
}
"""
        elif analysis_type == "completeness":
            prompt += """Focus on:
1. Identify potential loops that should exist (limb boundaries, feature outlines)
2. Suggest stitch pairs that would improve the mesh
3. Detect missing symmetry elements

Return JSON with:
{
  "structures": {
    "loops": {"loop_name": ["vertex_id_1", "vertex_id_2", ...]},
    "stitch": [["loop_name_1", "loop_name_2"], ...],
    "suggestions": ["text explanations"]
  }
}
"""

        return prompt

    def _apply_suggestions(self, state: AgentState, suggestions: dict[str, Any]) -> dict[str, Any]:
        applied = {}

        if isinstance(suggestions, dict):
            structures = suggestions.get("structures", {})

            new_loops = structures.get("loops", {})
            if new_loops:
                if not state.mesh.loops:
                    state.mesh.loops = {}
                state.mesh.loops.update(new_loops)
                applied["added_loops"] = list(new_loops.keys())

            new_stitch = structures.get("stitch", [])
            if new_stitch:
                if not state.mesh.stitch:
                    state.mesh.stitch = []
                state.mesh.stitch.extend(new_stitch)
                applied["added_stitch_pairs"] = len(new_stitch)

        return applied

    def _generate_fix_suggestions(self, issues: list) -> list[dict]:
        """Generate suggested fixes for basic integrity issues."""
        suggestions = []

        for issue in issues:
            if "Edge references unknown vertex" in issue:
                suggestions.append({
                    "type": "remove_invalid_edge",
                    "description": "Remove edges that reference non-existent vertices",
                    "action": "filter out invalid edges from mesh.edges"
                })
            elif "has fewer than 3 vertices" in issue:
                suggestions.append({
                    "type": "remove_small_face",
                    "description": "Remove faces with fewer than 3 vertices (triangles minimum)",
                    "action": "filter out degenerate faces from mesh.faces"
                })
            elif "has duplicate vertices" in issue:
                suggestions.append({
                    "type": "fix_degenerate_face",
                    "description": "Remove or fix faces with duplicate vertices",
                    "action": "filter out faces with duplicate vertex IDs"
                })
            elif "references unknown vertex" in issue:
                suggestions.append({
                    "type": "face_with_missing_vertex",
                    "description": "Faces reference vertices that don't exist",
                    "action": "remove faces with invalid vertex references or add missing vertices"
                })

        return suggestions

    def _fix_basic_issues(self, state: AgentState, issues: list) -> dict[str, Any]:
        """Automatically fix basic integrity issues."""
        applied = {}

        mesh = state.mesh
        vertex_ids = {v.id for v in mesh.vertices}

        # Fix invalid edges
        invalid_edges = []
        for edge in mesh.edges:
            if edge[0] not in vertex_ids or edge[1] not in vertex_ids:
                invalid_edges.append(edge)

        if invalid_edges:
            mesh.edges = [e for e in mesh.edges if e not in invalid_edges]
            applied["removed_invalid_edges"] = len(invalid_edges)

        # Fix invalid faces
        invalid_faces = []
        for i, face in enumerate(mesh.faces):
            if len(face) < 3:
                invalid_faces.append((i, face))
            elif len(face) != len(set(face)):
                invalid_faces.append((i, "duplicate vertices"))
            elif any(vid not in vertex_ids for vid in face):
                invalid_faces.append((i, "unknown vertex"))

        if invalid_faces:
            valid_faces = []
            for i, face in enumerate(mesh.faces):
                if (len(face) >= 3 and
                    len(face) == len(set(face)) and
                    all(vid in vertex_ids for vid in face)):
                    valid_faces.append(face)
            mesh.faces = valid_faces
            applied["removed_invalid_faces"] = len(invalid_faces)

        return applied

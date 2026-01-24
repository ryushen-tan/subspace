from pydantic import BaseModel
from typing import Optional


class Vertex(BaseModel):
    id: str
    p: tuple[float, float, float]


class Mesh(BaseModel):
    vertices: list[Vertex] = []
    edges: list[tuple[str, str]] = []
    faces: list[tuple[str, ...]] = []
    loops: Optional[dict[str, tuple[str, ...]]] = None
    stitch: Optional[list[tuple[str, str]]] = None

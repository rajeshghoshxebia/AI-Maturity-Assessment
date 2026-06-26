from __future__ import annotations

from dataclasses import dataclass, field


MATURITY_BANDS: list[tuple[float, float, str]] = [
    (1.0, 1.9, "Planning"),
    (2.0, 2.9, "Experimenting"),
    (3.0, 3.4, "Standardizing"),
    (3.5, 4.2, "Scaling"),
    (4.3, 5.0, "Optimizing"),
]


@dataclass
class DimensionScore:
    dimension_code: str = ""
    dimension_name: str = ""
    score: float = 0.0
    label: str = ""
    response_count: int = 0


def maturity_label(score: float) -> str:
    for low, high, label in MATURITY_BANDS:
        if low <= score <= high:
            return label
    return "Planning"


def compute_dimension_score(
    responses: list[tuple[float, float]],  # (score, weight) pairs
) -> DimensionScore:
    ds = DimensionScore()
    if not responses:
        return ds
    total_weight = sum(w for _, w in responses)
    if total_weight == 0:
        return ds
    ds.score = sum(s * w for s, w in responses) / total_weight
    ds.label = maturity_label(ds.score)
    ds.response_count = len(responses)
    return ds


def compute_overall_score(dimension_scores: list[DimensionScore]) -> float:
    if not dimension_scores:
        return 0.0
    return sum(ds.score for ds in dimension_scores) / len(dimension_scores)

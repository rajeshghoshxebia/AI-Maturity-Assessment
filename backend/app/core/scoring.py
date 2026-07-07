from __future__ import annotations

from dataclasses import dataclass, field


# Maturity bands as contiguous upper-inclusive thresholds (spec scale).
# A score is labelled by the first band whose upper bound it does not exceed.
MATURITY_BANDS: list[tuple[float, str]] = [
    (1.0, "Initial"),
    (2.5, "Developing"),
    (3.5, "Managed"),
    (4.5, "Advanced"),
    (5.0, "Optimized"),
]


@dataclass
class DimensionScore:
    dimension_code: str = ""
    dimension_name: str = ""
    score: float = 0.0
    label: str = ""
    response_count: int = 0


def maturity_label(score: float) -> str:
    for upper, label in MATURITY_BANDS:
        if score <= upper:
            return label
    return "Optimized"


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

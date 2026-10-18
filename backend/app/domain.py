from __future__ import annotations

import json


def completion(sop: dict) -> dict:
    steps = sop.get("steps") or []
    try:
        evaluation = json.loads(sop.get("evaluation") or "[]")
    except (json.JSONDecodeError, TypeError):
        evaluation = []
    has_steps = bool(steps)
    has_images = has_steps and all(step.get("image_path") for step in steps)
    has_risks_controls = has_steps and all(step.get("risk_codes") and step.get("control_codes") for step in steps)
    has_evaluation = bool(evaluation) and all(
        isinstance(question, dict)
        and str(question.get("question_text", "")).strip()
        and str(question.get("correct", "")).strip()
        and all(str(question.get(option, "")).strip() for option in ("a", "b", "c", "d"))
        for question in evaluation
    )
    return {
        "hasSteps": has_steps,
        "hasImages": has_images,
        "hasRisksControls": has_risks_controls,
        "hasEval": has_evaluation,
        "isReadyToFinalize": has_steps and has_images and has_risks_controls and has_evaluation,
    }


def finalization_error(sop: dict) -> str | None:
    state = completion(sop)
    if not state["hasSteps"]:
        return "El SOP debe tener al menos un paso para ser Finalizado."
    if not state["hasImages"]:
        return "Cada paso debe tener una imagen para ser Finalizado."
    if not state["hasRisksControls"]:
        return "Cada paso debe tener al menos un riesgo y una medida de control."
    if not state["hasEval"]:
        return "La evaluación debe incluir preguntas completas con opciones A, B, C y D."
    return None


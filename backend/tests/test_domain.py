import json

from app.domain import completion, finalization_error


def test_finalization_rules():
    sop = {
        "steps": [{"image_path": "/files/x.png", "risk_codes": ["R1"], "control_codes": ["C1"]}],
        "evaluation": json.dumps([{
            "question_text": "¿Equipo detenido?", "correct": "a",
            "a": "Sí", "b": "No", "c": "No aplica", "d": "Verificar",
        }]),
    }
    assert completion(sop)["isReadyToFinalize"] is True
    assert finalization_error(sop) is None
    sop["steps"][0]["image_path"] = ""
    assert "imagen" in finalization_error(sop).lower()


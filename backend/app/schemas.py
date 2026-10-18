from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserBase(BaseModel):
    username: str
    full_name: str
    language: str = "es"
    permissions: list[str] = []
    is_active: bool = True

    @field_validator("language")
    @classmethod
    def valid_language(cls, value: str) -> str:
        if value not in {"es", "pt", "en"}:
            raise ValueError("Idioma no válido")
        return value

    @field_validator("permissions")
    @classmethod
    def valid_permissions(cls, value: list[str]) -> list[str]:
        allowed = {"sop:create", "sop:edit", "sop:delete", "sop:import", "user:manage"}
        if any(item not in allowed for item in value):
            raise ValueError("Permiso no válido")
        return list(dict.fromkeys(value))


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(UserBase):
    password: str | None = Field(default=None, min_length=8)


class UserOut(UserBase):
    id: int


class StepCreate(BaseModel):
    step_number: int = Field(ge=0)
    description: str = ""
    procedure_text: str = ""
    image_path: str = ""
    risk_codes: list[str] = []
    control_codes: list[str] = []


class StepOut(StepCreate):
    id: int


class SOPCreate(BaseModel):
    code: str
    revision: str = "Rev. 0"
    title: str
    area: str = ""
    machine: str = ""
    elaborator: str = ""
    chief_area: str = ""
    chief_masso: str = ""
    publication_date: str = ""
    last_update: str = ""
    follow_up_date: str = ""
    follow_up_start_date: str = ""
    follow_up_end_date: str = ""
    tools_text: str = ""
    flexibility_matrix: str = ""
    key_rule: str = ""
    risks_text: str = ""
    controls_text: str = ""
    epp_text: str = ""
    evaluation: str = "[]"
    status: str = "en proceso"
    steps_per_page: int = Field(default=3, ge=1, le=6)
    steps: list[StepCreate] = []

    @field_validator("code", "title")
    @classmethod
    def required_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Campo obligatorio")
        return value.strip()

    @field_validator("evaluation")
    @classmethod
    def valid_evaluation_json(cls, value: str) -> str:
        import json
        parsed = json.loads(value or "[]")
        if not isinstance(parsed, list):
            raise ValueError("La evaluación debe ser una lista JSON")
        return json.dumps(parsed, ensure_ascii=False)

    @field_validator("follow_up_date", "follow_up_start_date", "follow_up_end_date")
    @classmethod
    def valid_follow_up_date(cls, value: str) -> str:
        if value:
            from datetime import date
            date.fromisoformat(value)
        return value

    @model_validator(mode="after")
    def valid_follow_up_range(self) -> "SOPCreate":
        if self.follow_up_start_date and self.follow_up_end_date and self.follow_up_end_date < self.follow_up_start_date:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio")
        return self


class SOPUpdate(SOPCreate):
    pass


class SOPOut(SOPCreate):
    id: int
    steps: list[StepOut] = []


class AreaChiefCreate(BaseModel):
    area: str
    name: str


class AreaChiefOut(AreaChiefCreate):
    id: int


class SsoChiefCreate(BaseModel):
    name: str


class SsoChiefOut(SsoChiefCreate):
    id: int


class MachineCreate(BaseModel):
    area: str
    name: str

    @field_validator("area", "name")
    @classmethod
    def required_machine_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Campo obligatorio")
        return value.strip()


class MachineOut(MachineCreate):
    id: int


class ImportResult(BaseModel):
    filename: str
    ok: bool
    sop: SOPOut | None = None
    error: str | None = None


EvaluationItem = dict[str, Any]

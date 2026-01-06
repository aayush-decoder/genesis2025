"""
Pydantic schemas for request validation
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Literal


class SpeedControl(BaseModel):
    """Speed control request validation"""
    value: int = Field(ge=1, le=10, description="Speed multiplier between 1 and 10")


class SessionControl(BaseModel):
    """Session control request validation"""
    action: Literal["start", "pause", "resume", "stop"]


class WebSocketMessage(BaseModel):
    """WebSocket message validation"""
    type: str = Field(..., min_length=1, max_length=50)
    speed: Optional[int] = Field(None, ge=1, le=10)
    session_id: Optional[str] = Field(None, min_length=1, max_length=100)
    
    @validator('type')
    def validate_type(cls, v):
        allowed_types = {'set_speed', 'ping', 'pong', 'subscribe', 'unsubscribe'}
        if v not in allowed_types:
            raise ValueError(f'Message type must be one of {allowed_types}')
        return v


class SessionCreate(BaseModel):
    """Session creation request validation"""
    session_id: Optional[str] = Field(None, min_length=1, max_length=100)
    mode: Literal["replay", "live", "backtest"] = "replay"

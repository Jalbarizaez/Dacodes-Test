"""
Natural Language Query Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class NaturalLanguageQueryRequest(BaseModel):
    """Request for NL query"""
    query: str = Field(..., min_length=1, max_length=500)
    user_id: str
    context: Optional[Dict[str, Any]] = None


class NaturalLanguageQueryResponse(BaseModel):
    """Response with query results"""
    query: str
    intent: str
    sql_query: str
    results: List[Dict[str, Any]]
    natural_language_response: str
    confidence: float = Field(..., ge=0, le=1)
    execution_time_ms: int = Field(..., ge=0)
    model_version: str = "v1.0"


class QueryIntentRequest(BaseModel):
    """Request for intent parsing only"""
    query: str = Field(..., min_length=1, max_length=500)


class QueryIntentResponse(BaseModel):
    """Response with parsed intent"""
    query: str
    intent: str
    entities: Dict[str, Any]
    confidence: float = Field(..., ge=0, le=1)
    suggested_sql: str

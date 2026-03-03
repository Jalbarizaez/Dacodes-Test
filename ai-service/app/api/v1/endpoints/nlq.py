"""
Natural Language Query Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
import logging

from app.schemas.nlq import (
    NaturalLanguageQueryRequest,
    NaturalLanguageQueryResponse,
    QueryIntentRequest,
    QueryIntentResponse
)
from app.services.nlq_service import NLQService
from app.api.dependencies import get_nlq_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/query", response_model=NaturalLanguageQueryResponse)
async def process_query(
    request: NaturalLanguageQueryRequest,
    service: NLQService = Depends(get_nlq_service)
):
    """
    Process natural language query and return results
    
    - **query**: Natural language query string
    - **user_id**: User UUID
    - **context**: Optional context dictionary
    """
    logger.info(f"Processing NL query from user {request.user_id}")
    
    try:
        result = await service.process_query(request)
        return result
    except Exception as e:
        logger.error(f"NL query error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse", response_model=QueryIntentResponse)
async def parse_intent(
    request: QueryIntentRequest,
    service: NLQService = Depends(get_nlq_service)
):
    """
    Parse query intent without executing
    
    - **query**: Natural language query string
    """
    logger.info("Parsing query intent")
    
    try:
        result = await service.parse_intent(request)
        return result
    except Exception as e:
        logger.error(f"Intent parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

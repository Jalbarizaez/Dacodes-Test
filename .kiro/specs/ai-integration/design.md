# Design Document: AI Integration for DaCodes Inventory System

## Overview

Este documento describe la integración completa de inteligencia artificial en el DaCodes Inventory System. La solución implementa 8 funcionalidades de IA que transforman el sistema de gestión de inventario tradicional en una plataforma inteligente y predictiva. La arquitectura desacopla el backend transaccional (Node.js + TypeScript) del servicio de IA (Python + FastAPI), permitiendo escalabilidad independiente y especialización tecnológica.

El diseño sigue principios enterprise-ready: arquitectura de microservicios, comunicación REST entre servicios, base de datos compartida con PostgreSQL, caching con Redis, y una nueva aplicación móvil React Native para conteo visual de stock. Aunque el MVP puede iniciar con heurísticas simples, la arquitectura está preparada para modelos ML reales desde el inicio, facilitando la evolución gradual hacia IA avanzada.

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Frontend<br/>React + TypeScript]
        MOBILE[Mobile App<br/>React Native]
    end
    
    subgraph "API Gateway Layer"
        NGINX[Nginx<br/>Load Balancer + SSL]
    end
    
    subgraph "Application Layer"
        BACKEND[Backend API<br/>Node.js + Express + TypeScript]
        AI_SERVICE[AI Service<br/>Python + FastAPI]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>Shared Database)]
        REDIS[(Redis<br/>Cache + Queue)]
    end
    
    subgraph "Storage Layer"
        S3[Object Storage<br/>Images + Models]
    end
    
    WEB -->|HTTPS| NGINX
    MOBILE -->|HTTPS| NGINX
    NGINX -->|/api/v1/*| BACKEND
    NGINX -->|/ai/v1/*| AI_SERVICE
    BACKEND -->|REST API| AI_SERVICE
    BACKEND --> POSTGRES
    BACKEND --> REDIS
    AI_SERVICE --> POSTGRES
    AI_SERVICE --> REDIS
    AI_SERVICE --> S3
    MOBILE --> S3
```

### Component Architecture

```mermaid
graph LR
    subgraph "Backend API (Node.js)"
        PRODUCTS[Products Module]
        STOCK[Stock Module]
        MOVEMENTS[Movements Module]
        SUPPLIERS[Suppliers Module]
        AI_CLIENT[AI Client Service]
    end
    
    subgraph "AI Service (Python)"
        FORECAST[Demand Forecasting]
        REORDER[Smart Reorder]
        SCORING[Supplier Scoring]
        ANOMALY[Anomaly Detection]
        CATEGORIZATION[Product Categorization]
        VISUAL[Visual Counting]
        NLQ[Natural Language Queries]
        WASTE[Waste Prediction]
    end
    
    PRODUCTS -->|REST| AI_CLIENT
    STOCK -->|REST| AI_CLIENT
    MOVEMENTS -->|REST| AI_CLIENT
    SUPPLIERS -->|REST| AI_CLIENT
    AI_CLIENT -->|HTTP| FORECAST
    AI_CLIENT -->|HTTP| REORDER
    AI_CLIENT -->|HTTP| SCORING
    AI_CLIENT -->|HTTP| ANOMALY
    AI_CLIENT -->|HTTP| CATEGORIZATION
    AI_CLIENT -->|HTTP| VISUAL
    AI_CLIENT -->|HTTP| NLQ
    AI_CLIENT -->|HTTP| WASTE
```

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant AI Service
    participant Database
    participant Redis
    
    Frontend->>Backend: Request AI feature
    Backend->>Redis: Check cache
    alt Cache hit
        Redis-->>Backend: Cached result
        Backend-->>Frontend: Return result
    else Cache miss
        Backend->>AI Service: POST /ai/v1/predict
        AI Service->>Database: Query historical data
        Database-->>AI Service: Return data
        AI Service->>AI Service: Run ML model
        AI Service-->>Backend: Prediction result
        Backend->>Redis: Cache result
        Backend->>Database: Store prediction
        Backend-->>Frontend: Return result
    end
```

## Components and Interfaces

### 1. AI Service (Python + FastAPI)

**Purpose**: Microservicio independiente que proporciona todas las capacidades de IA/ML

**Core Interfaces**:

```python
# Main FastAPI application
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, date

app = FastAPI(title="DaCodes AI Service", version="1.0.0")

# ============================================================================
# DATA MODELS
# ============================================================================

class DemandForecastRequest(BaseModel):
    product_id: str
    forecast_horizon_days: int = 30
    include_seasonality: bool = True
    include_trends: bool = True

class DemandForecastResponse(BaseModel):
    product_id: str
    forecast_date: date
    forecasts: List[Dict[str, float]]  # [{date, predicted_demand, confidence_lower, confidence_upper}]
    seasonality_detected: bool
    trend_direction: str  # "increasing", "decreasing", "stable"
    model_accuracy: float

class SmartReorderRequest(BaseModel):
    product_id: str
    current_stock: int
    lead_time_days: int
    target_service_level: float = 0.95

class SmartReorderResponse(BaseModel):
    product_id: str
    recommended_min_stock: int
    recommended_max_stock: int
    reorder_point: int
    reorder_quantity: int
    safety_stock: int
    reasoning: str

class SupplierScoringRequest(BaseModel):
    supplier_id: str
    evaluation_period_days: int = 90

class SupplierScoringResponse(BaseModel):
    supplier_id: str
    overall_score: float  # 0-100
    on_time_delivery_rate: float
    defect_rate: float
    price_competitiveness: float
    responsiveness_score: float
    recommendation: str  # "excellent", "good", "acceptable", "review_needed"
    suggested_actions: List[str]

class AnomalyDetectionRequest(BaseModel):
    detection_type: str  # "movement", "stock_level", "transaction"
    time_window_days: int = 7
    product_ids: Optional[List[str]] = None
    location_ids: Optional[List[str]] = None

class AnomalyDetectionResponse(BaseModel):
    anomalies: List[Dict]  # [{type, severity, description, affected_entity, timestamp, confidence}]
    total_anomalies: int
    critical_count: int
    warning_count: int

class ProductCategorizationRequest(BaseModel):
    product_name: str
    product_description: Optional[str] = None
    image_url: Optional[str] = None
    use_vision: bool = False
    use_nlp: bool = True

class ProductCategorizationResponse(BaseModel):
    suggested_category_id: str
    category_name: str
    confidence: float
    suggested_attributes: Dict[str, str]
    reasoning: str

class VisualCountingRequest(BaseModel):
    image_url: str
    expected_product_id: Optional[str] = None
    location_id: str

class VisualCountingResponse(BaseModel):
    detected_count: int
    confidence: float
    bounding_boxes: List[Dict]  # [{x, y, width, height, confidence}]
    product_matches: List[Dict]  # [{product_id, confidence}]
    quality_score: float  # Image quality assessment

class NaturalLanguageQueryRequest(BaseModel):
    query: str
    user_id: str
    context: Optional[Dict] = None

class NaturalLanguageQueryResponse(BaseModel):
    query: str
    intent: str  # "stock_check", "expiration_query", "movement_history", etc.
    sql_query: str
    results: List[Dict]
    natural_language_response: str
    confidence: float

class WastePredictionRequest(BaseModel):
    prediction_horizon_days: int = 30
    product_ids: Optional[List[str]] = None
    min_risk_score: float = 0.5

class WastePredictionResponse(BaseModel):
    predictions: List[Dict]  # [{product_id, risk_score, reason, expiration_date, suggested_action}]
    total_at_risk_value: float
    total_at_risk_units: int
    recommended_actions: List[Dict]  # [{action_type, product_id, priority, details}]


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.post("/ai/v1/forecast/demand", response_model=DemandForecastResponse)
async def forecast_demand(request: DemandForecastRequest):
    """
    Predicts future demand for a product using historical sales data,
    seasonality patterns, trends, and external factors.
    """
    pass

@app.post("/ai/v1/reorder/calculate", response_model=SmartReorderResponse)
async def calculate_smart_reorder(request: SmartReorderRequest):
    """
    Calculates optimal reorder points and quantities based on demand forecast,
    lead time, variability, and target service level.
    """
    pass

@app.post("/ai/v1/suppliers/score", response_model=SupplierScoringResponse)
async def score_supplier(request: SupplierScoringRequest):
    """
    Evaluates supplier performance across multiple dimensions and provides
    actionable recommendations.
    """
    pass

@app.post("/ai/v1/anomalies/detect", response_model=AnomalyDetectionResponse)
async def detect_anomalies(request: AnomalyDetectionRequest):
    """
    Detects unusual patterns in stock movements, levels, or transactions
    that may indicate errors, theft, or operational issues.
    """
    pass

@app.post("/ai/v1/products/categorize", response_model=ProductCategorizationResponse)
async def categorize_product(request: ProductCategorizationRequest):
    """
    Automatically categorizes products using NLP and/or computer vision,
    suggesting category and attributes.
    """
    pass

@app.post("/ai/v1/visual/count", response_model=VisualCountingResponse)
async def count_visual_stock(request: VisualCountingRequest):
    """
    Counts items in shelf images using computer vision, reducing manual
    counting errors and time.
    """
    pass

@app.post("/ai/v1/nlq/query", response_model=NaturalLanguageQueryResponse)
async def process_natural_language_query(request: NaturalLanguageQueryRequest):
    """
    Processes natural language queries and converts them to SQL queries,
    returning results in human-readable format.
    """
    pass

@app.post("/ai/v1/waste/predict", response_model=WastePredictionResponse)
async def predict_waste(request: WastePredictionRequest):
    """
    Predicts products at risk of expiration or obsolescence and suggests
    proactive actions to minimize waste.
    """
    pass

@app.get("/ai/v1/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "ai-service", "version": "1.0.0"}

@app.get("/ai/v1/models/status")
async def models_status():
    """Returns status of all ML models"""
    return {
        "models": {
            "demand_forecasting": {"loaded": True, "version": "1.0", "last_trained": "2024-01-15"},
            "anomaly_detection": {"loaded": True, "version": "1.0", "last_trained": "2024-01-15"},
            "visual_counting": {"loaded": True, "version": "1.0", "last_trained": "2024-01-15"},
            "nlp_categorization": {"loaded": True, "version": "1.0", "last_trained": "2024-01-15"}
        }
    }
```

**Responsibilities**:
- Execute ML model inference
- Manage model lifecycle (loading, versioning, retraining)
- Process computer vision tasks
- Handle NLP tasks
- Cache predictions in Redis
- Log predictions to database
- Provide health and status endpoints

### 2. Backend AI Client Service (TypeScript)

**Purpose**: Servicio en el backend Node.js que actúa como cliente del AI Service

**Interface**:

```typescript
// backend/src/services/ai-client.service.ts

import axios, { AxiosInstance } from 'axios';
import { logger } from '../shared/utils/logger';
import { redis } from '../shared/database/redis';

interface AIServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

export class AIClientService {
  private client: AxiosInstance;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info(`AI Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('AI Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config, response } = error;
        
        // Retry logic
        if (!config._retry && config._retryCount < this.config.retries) {
          config._retryCount = (config._retryCount || 0) + 1;
          logger.warn(`Retrying AI Service request (${config._retryCount}/${this.config.retries})`);
          await this.delay(1000 * config._retryCount);
          return this.client(config);
        }

        logger.error('AI Service Error:', {
          status: response?.status,
          data: response?.data,
          url: config.url,
        });

        return Promise.reject(error);
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // DEMAND FORECASTING
  // ============================================================================

  async forecastDemand(params: {
    productId: string;
    forecastHorizonDays?: number;
    includeSeasonality?: boolean;
    includeTrends?: boolean;
  }): Promise<DemandForecastResponse> {
    const cacheKey = `forecast:${params.productId}:${params.forecastHorizonDays || 30}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`Forecast cache hit for product ${params.productId}`);
      return JSON.parse(cached);
    }

    // Call AI service
    const response = await this.client.post('/ai/v1/forecast/demand', {
      product_id: params.productId,
      forecast_horizon_days: params.forecastHorizonDays || 30,
      include_seasonality: params.includeSeasonality ?? true,
      include_trends: params.includeTrends ?? true,
    });

    // Cache result for 24 hours
    await redis.setex(cacheKey, 86400, JSON.stringify(response.data));

    return response.data;
  }

  // ============================================================================
  // SMART REORDER
  // ============================================================================

  async calculateSmartReorder(params: {
    productId: string;
    currentStock: number;
    leadTimeDays: number;
    targetServiceLevel?: number;
  }): Promise<SmartReorderResponse> {
    const response = await this.client.post('/ai/v1/reorder/calculate', {
      product_id: params.productId,
      current_stock: params.currentStock,
      lead_time_days: params.leadTimeDays,
      target_service_level: params.targetServiceLevel || 0.95,
    });

    return response.data;
  }

  // ============================================================================
  // SUPPLIER SCORING
  // ============================================================================

  async scoreSupplier(params: {
    supplierId: string;
    evaluationPeriodDays?: number;
  }): Promise<SupplierScoringResponse> {
    const cacheKey = `supplier_score:${params.supplierId}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const response = await this.client.post('/ai/v1/suppliers/score', {
      supplier_id: params.supplierId,
      evaluation_period_days: params.evaluationPeriodDays || 90,
    });

    // Cache for 7 days
    await redis.setex(cacheKey, 604800, JSON.stringify(response.data));

    return response.data;
  }

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  async detectAnomalies(params: {
    detectionType: 'movement' | 'stock_level' | 'transaction';
    timeWindowDays?: number;
    productIds?: string[];
    locationIds?: string[];
  }): Promise<AnomalyDetectionResponse> {
    const response = await this.client.post('/ai/v1/anomalies/detect', {
      detection_type: params.detectionType,
      time_window_days: params.timeWindowDays || 7,
      product_ids: params.productIds,
      location_ids: params.locationIds,
    });

    return response.data;
  }

  // ============================================================================
  // PRODUCT CATEGORIZATION
  // ============================================================================

  async categorizeProduct(params: {
    productName: string;
    productDescription?: string;
    imageUrl?: string;
    useVision?: boolean;
    useNlp?: boolean;
  }): Promise<ProductCategorizationResponse> {
    const response = await this.client.post('/ai/v1/products/categorize', {
      product_name: params.productName,
      product_description: params.productDescription,
      image_url: params.imageUrl,
      use_vision: params.useVision || false,
      use_nlp: params.useNlp ?? true,
    });

    return response.data;
  }

  // ============================================================================
  // VISUAL COUNTING
  // ============================================================================

  async countVisualStock(params: {
    imageUrl: string;
    expectedProductId?: string;
    locationId: string;
  }): Promise<VisualCountingResponse> {
    const response = await this.client.post('/ai/v1/visual/count', {
      image_url: params.imageUrl,
      expected_product_id: params.expectedProductId,
      location_id: params.locationId,
    });

    return response.data;
  }

  // ============================================================================
  // NATURAL LANGUAGE QUERIES
  // ============================================================================

  async processNaturalLanguageQuery(params: {
    query: string;
    userId: string;
    context?: Record<string, any>;
  }): Promise<NaturalLanguageQueryResponse> {
    const response = await this.client.post('/ai/v1/nlq/query', {
      query: params.query,
      user_id: params.userId,
      context: params.context,
    });

    return response.data;
  }

  // ============================================================================
  // WASTE PREDICTION
  // ============================================================================

  async predictWaste(params: {
    predictionHorizonDays?: number;
    productIds?: string[];
    minRiskScore?: number;
  }): Promise<WastePredictionResponse> {
    const cacheKey = `waste_prediction:${params.predictionHorizonDays || 30}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const response = await this.client.post('/ai/v1/waste/predict', {
      prediction_horizon_days: params.predictionHorizonDays || 30,
      product_ids: params.productIds,
      min_risk_score: params.minRiskScore || 0.5,
    });

    // Cache for 12 hours
    await redis.setex(cacheKey, 43200, JSON.stringify(response.data));

    return response.data;
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    const response = await this.client.get('/ai/v1/health');
    return response.data;
  }

  async getModelsStatus(): Promise<any> {
    const response = await this.client.get('/ai/v1/models/status');
    return response.data;
  }
}

// Singleton instance
export const aiClientService = new AIClientService({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
  retries: 3,
});
```

**Responsibilities**:
- Communicate with AI Service via REST
- Handle retries and timeouts
- Cache AI predictions
- Log AI service interactions
- Provide type-safe interface for backend modules


### 3. Backend API Controllers (TypeScript)

**Purpose**: Exponer endpoints REST para que el frontend consuma las funcionalidades de IA

**Interface**:

```typescript
// backend/src/modules/ai/ai.controller.ts

import { Request, Response } from 'express';
import { aiClientService } from '../../services/ai-client.service';
import { asyncHandler } from '../../shared/middleware/async-handler';
import { logger } from '../../shared/utils/logger';
import { prisma } from '../../shared/database/prisma';

export class AIController {
  // ============================================================================
  // DEMAND FORECASTING
  // ============================================================================

  getForecast = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { forecastHorizonDays, includeSeasonality, includeTrends } = req.query;

    const forecast = await aiClientService.forecastDemand({
      productId,
      forecastHorizonDays: forecastHorizonDays ? parseInt(forecastHorizonDays as string) : undefined,
      includeSeasonality: includeSeasonality === 'true',
      includeTrends: includeTrends === 'true',
    });

    // Store forecast in database
    await prisma.demandForecast.create({
      data: {
        productId,
        forecastDate: new Date(),
        forecastData: forecast as any,
        modelVersion: '1.0',
      },
    });

    res.json(forecast);
  });

  // ============================================================================
  // SMART REORDER
  // ============================================================================

  calculateReorder = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const { currentStock, leadTimeDays, targetServiceLevel } = req.body;

    const reorderCalc = await aiClientService.calculateSmartReorder({
      productId,
      currentStock,
      leadTimeDays,
      targetServiceLevel,
    });

    // Update product reorder rule
    await prisma.reorderRule.upsert({
      where: { productId },
      create: {
        productId,
        minimumQuantity: reorderCalc.recommended_min_stock,
        reorderQuantity: reorderCalc.reorder_quantity,
        isEnabled: true,
        calculatedBy: 'AI',
        calculationData: reorderCalc as any,
      },
      update: {
        minimumQuantity: reorderCalc.recommended_min_stock,
        reorderQuantity: reorderCalc.reorder_quantity,
        calculatedBy: 'AI',
        calculationData: reorderCalc as any,
        updatedAt: new Date(),
      },
    });

    res.json(reorderCalc);
  });

  // ============================================================================
  // SUPPLIER SCORING
  // ============================================================================

  getSupplierScore = asyncHandler(async (req: Request, res: Response) => {
    const { supplierId } = req.params;
    const { evaluationPeriodDays } = req.query;

    const score = await aiClientService.scoreSupplier({
      supplierId,
      evaluationPeriodDays: evaluationPeriodDays ? parseInt(evaluationPeriodDays as string) : undefined,
    });

    // Store score in database
    await prisma.supplierScore.create({
      data: {
        supplierId,
        scoreDate: new Date(),
        overallScore: score.overall_score,
        onTimeDeliveryRate: score.on_time_delivery_rate,
        defectRate: score.defect_rate,
        priceCompetitiveness: score.price_competitiveness,
        responsivenessScore: score.responsiveness_score,
        recommendation: score.recommendation,
        suggestedActions: score.suggested_actions,
      },
    });

    res.json(score);
  });

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  detectAnomalies = asyncHandler(async (req: Request, res: Response) => {
    const { detectionType, timeWindowDays, productIds, locationIds } = req.body;

    const anomalies = await aiClientService.detectAnomalies({
      detectionType,
      timeWindowDays,
      productIds,
      locationIds,
    });

    // Store critical anomalies in database
    for (const anomaly of anomalies.anomalies.filter(a => a.severity === 'critical')) {
      await prisma.anomalyAlert.create({
        data: {
          type: anomaly.type,
          severity: anomaly.severity,
          description: anomaly.description,
          affectedEntity: anomaly.affected_entity,
          detectedAt: new Date(anomaly.timestamp),
          confidence: anomaly.confidence,
          isResolved: false,
        },
      });
    }

    res.json(anomalies);
  });

  // ============================================================================
  // PRODUCT CATEGORIZATION
  // ============================================================================

  categorizeProduct = asyncHandler(async (req: Request, res: Response) => {
    const { productName, productDescription, imageUrl, useVision, useNlp } = req.body;

    const categorization = await aiClientService.categorizeProduct({
      productName,
      productDescription,
      imageUrl,
      useVision,
      useNlp,
    });

    res.json(categorization);
  });

  // ============================================================================
  // VISUAL COUNTING
  // ============================================================================

  countVisualStock = asyncHandler(async (req: Request, res: Response) => {
    const { imageUrl, expectedProductId, locationId } = req.body;

    const count = await aiClientService.countVisualStock({
      imageUrl,
      expectedProductId,
      locationId,
    });

    // Store count result
    await prisma.visualCount.create({
      data: {
        locationId,
        productId: expectedProductId,
        imageUrl,
        detectedCount: count.detected_count,
        confidence: count.confidence,
        qualityScore: count.quality_score,
        countDate: new Date(),
      },
    });

    res.json(count);
  });

  // ============================================================================
  // NATURAL LANGUAGE QUERIES
  // ============================================================================

  processNLQuery = asyncHandler(async (req: Request, res: Response) => {
    const { query, context } = req.body;
    const userId = req.user?.id; // From auth middleware

    const result = await aiClientService.processNaturalLanguageQuery({
      query,
      userId,
      context,
    });

    // Log query for analytics
    await prisma.nlQueryLog.create({
      data: {
        userId,
        query,
        intent: result.intent,
        sqlQuery: result.sql_query,
        confidence: result.confidence,
        executedAt: new Date(),
      },
    });

    res.json(result);
  });

  // ============================================================================
  // WASTE PREDICTION
  // ============================================================================

  predictWaste = asyncHandler(async (req: Request, res: Response) => {
    const { predictionHorizonDays, productIds, minRiskScore } = req.body;

    const prediction = await aiClientService.predictWaste({
      predictionHorizonDays,
      productIds,
      minRiskScore,
    });

    // Store high-risk predictions
    for (const pred of prediction.predictions.filter(p => p.risk_score > 0.7)) {
      await prisma.wasteAlert.create({
        data: {
          productId: pred.product_id,
          riskScore: pred.risk_score,
          reason: pred.reason,
          expirationDate: pred.expiration_date ? new Date(pred.expiration_date) : null,
          suggestedAction: pred.suggested_action,
          createdAt: new Date(),
          isResolved: false,
        },
      });
    }

    res.json(prediction);
  });

  // ============================================================================
  // HEALTH & STATUS
  // ============================================================================

  getAIServiceHealth = asyncHandler(async (req: Request, res: Response) => {
    const health = await aiClientService.healthCheck();
    res.json(health);
  });

  getModelsStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = await aiClientService.getModelsStatus();
    res.json(status);
  });
}

export const aiController = new AIController();
```

**Responsibilities**:
- Expose REST endpoints for frontend
- Validate request data
- Call AI Client Service
- Store AI results in database
- Handle errors and logging
- Emit real-time events via Socket.IO

### 4. Mobile App (React Native)

**Purpose**: Aplicación móvil para conteo visual de stock usando la cámara

**Core Components**:

```typescript
// mobile/src/screens/VisualCountingScreen.tsx

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { uploadImage, countVisualStock } from '../services/api';

interface VisualCountingScreenProps {
  navigation: any;
  route: any;
}

export const VisualCountingScreen: React.FC<VisualCountingScreenProps> = ({ navigation, route }) => {
  const { locationId, expectedProductId } = route.params;
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [counting, setCounting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<Camera>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      setCapturedImage(photo.uri);
    }
  };

  const processImage = async () => {
    if (!capturedImage) return;

    setCounting(true);
    try {
      // Upload image to S3
      const imageUrl = await uploadImage(capturedImage);

      // Call AI service
      const countResult = await countVisualStock({
        imageUrl,
        expectedProductId,
        locationId,
      });

      setResult(countResult);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error al procesar la imagen');
    } finally {
      setCounting(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setResult(null);
  };

  const confirmCount = async () => {
    // Update stock level with counted quantity
    // Navigate back with result
    navigation.goBack();
  };

  if (hasPermission === null) {
    return <View><Text>Solicitando permisos de cámara...</Text></View>;
  }

  if (hasPermission === false) {
    return <View><Text>Sin acceso a la cámara</Text></View>;
  }

  if (result) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Resultado del Conteo
        </Text>
        <Image source={{ uri: capturedImage! }} style={{ width: '100%', height: 300 }} />
        <Text style={{ fontSize: 18, marginTop: 20 }}>
          Cantidad detectada: {result.detected_count}
        </Text>
        <Text style={{ fontSize: 16, color: 'gray' }}>
          Confianza: {(result.confidence * 100).toFixed(1)}%
        </Text>
        <Text style={{ fontSize: 16, color: 'gray' }}>
          Calidad de imagen: {(result.quality_score * 100).toFixed(1)}%
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 30 }}>
          <TouchableOpacity onPress={retake} style={{ flex: 1, marginRight: 10 }}>
            <Text>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmCount} style={{ flex: 1, marginLeft: 10 }}>
            <Text>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Image source={{ uri: capturedImage }} style={{ width: '100%', height: 400 }} />
        {counting ? (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        ) : (
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <TouchableOpacity onPress={retake} style={{ flex: 1, marginRight: 10 }}>
              <Text>Retomar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={processImage} style={{ flex: 1, marginLeft: 10 }}>
              <Text>Procesar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera ref={cameraRef} style={{ flex: 1 }} type={CameraType.back}>
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: 20 }}>
          <TouchableOpacity onPress={takePicture}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: 'white' }} />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};
```

**Responsibilities**:
- Capture shelf images
- Upload images to S3
- Call visual counting API
- Display results with confidence scores
- Allow retakes and confirmations
- Update stock levels

## Data Models

### New Database Tables for AI Features

```prisma
// backend/prisma/schema.prisma - Add these models

// ============================================================================
// AI FEATURES
// ============================================================================

model DemandForecast {
  id            String   @id @default(uuid())
  productId     String   @map("product_id")
  forecastDate  DateTime @map("forecast_date")
  forecastData  Json     @map("forecast_data") // Store full forecast response
  modelVersion  String   @map("model_version")
  createdAt     DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([forecastDate])
  @@map("demand_forecasts")
}

model SupplierScore {
  id                    String   @id @default(uuid())
  supplierId            String   @map("supplier_id")
  scoreDate             DateTime @map("score_date")
  overallScore          Float    @map("overall_score")
  onTimeDeliveryRate    Float    @map("on_time_delivery_rate")
  defectRate            Float    @map("defect_rate")
  priceCompetitiveness  Float    @map("price_competitiveness")
  responsivenessScore   Float    @map("responsiveness_score")
  recommendation        String   // "excellent", "good", "acceptable", "review_needed"
  suggestedActions      Json     @map("suggested_actions")
  createdAt             DateTime @default(now()) @map("created_at")

  supplier Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  @@index([supplierId])
  @@index([scoreDate])
  @@map("supplier_scores")
}

model AnomalyAlert {
  id              String   @id @default(uuid())
  type            String   // "loss", "duplicate", "shrinkage", "unusual_movement"
  severity        String   // "critical", "warning", "info"
  description     String
  affectedEntity  String   @map("affected_entity") // JSON with entity details
  detectedAt      DateTime @map("detected_at")
  confidence      Float
  isResolved      Boolean  @default(false) @map("is_resolved")
  resolvedAt      DateTime? @map("resolved_at")
  resolvedBy      String?  @map("resolved_by")
  resolutionNotes String?  @map("resolution_notes")
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([type])
  @@index([severity])
  @@index([isResolved])
  @@index([detectedAt])
  @@map("anomaly_alerts")
}

model VisualCount {
  id            String   @id @default(uuid())
  locationId    String   @map("location_id")
  productId     String?  @map("product_id")
  imageUrl      String   @map("image_url")
  detectedCount Int      @map("detected_count")
  confidence    Float
  qualityScore  Float    @map("quality_score")
  countDate     DateTime @map("count_date")
  verifiedBy    String?  @map("verified_by")
  verifiedCount Int?     @map("verified_count")
  createdAt     DateTime @default(now()) @map("created_at")

  location Location @relation(fields: [locationId], references: [id], onDelete: Cascade)
  product  Product? @relation(fields: [productId], references: [id], onDelete: SetNull)

  @@index([locationId])
  @@index([productId])
  @@index([countDate])
  @@map("visual_counts")
}

model NLQueryLog {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  query       String
  intent      String
  sqlQuery    String   @map("sql_query") @db.Text
  confidence  Float
  executedAt  DateTime @map("executed_at")
  createdAt   DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([executedAt])
  @@map("nl_query_logs")
}

model WasteAlert {
  id              String    @id @default(uuid())
  productId       String    @map("product_id")
  riskScore       Float     @map("risk_score")
  reason          String
  expirationDate  DateTime? @map("expiration_date")
  suggestedAction String    @map("suggested_action")
  isResolved      Boolean   @default(false) @map("is_resolved")
  resolvedAt      DateTime? @map("resolved_at")
  actionTaken     String?   @map("action_taken")
  createdAt       DateTime  @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([riskScore])
  @@index([isResolved])
  @@index([createdAt])
  @@map("waste_alerts")
}

// Update existing models to add relations
model Product {
  // ... existing fields ...
  demandForecasts DemandForecast[]
  visualCounts    VisualCount[]
  wasteAlerts     WasteAlert[]
}

model Supplier {
  // ... existing fields ...
  scores SupplierScore[]
}

model User {
  // ... existing fields ...
  nlQueryLogs NLQueryLog[]
}

model Location {
  // ... existing fields ...
  visualCounts VisualCount[]
}

model ReorderRule {
  // ... existing fields ...
  calculatedBy     String? @map("calculated_by") // "manual" or "AI"
  calculationData  Json?   @map("calculation_data") // Store AI calculation details
}
```


## Algorithmic Pseudocode

### 1. Demand Forecasting Algorithm

```python
ALGORITHM forecastDemand(product_id, horizon_days, include_seasonality, include_trends)
INPUT: product_id (UUID), horizon_days (int), include_seasonality (bool), include_trends (bool)
OUTPUT: DemandForecastResponse with predictions

PRECONDITIONS:
  - product_id exists in database
  - horizon_days > 0 and horizon_days <= 365
  - At least 30 days of historical movement data available

POSTCONDITIONS:
  - Returns forecast for each day in horizon
  - Confidence intervals provided for each prediction
  - Seasonality and trend components identified if requested
  - Model accuracy metrics included

BEGIN
  # Step 1: Fetch historical data
  historical_data ← query_stock_movements(product_id, lookback_days=365)
  
  IF length(historical_data) < 30 THEN
    RETURN error("Insufficient historical data")
  END IF
  
  # Step 2: Preprocess data
  daily_demand ← aggregate_by_day(historical_data)
  daily_demand ← fill_missing_dates(daily_demand)
  daily_demand ← handle_outliers(daily_demand, method="iqr")
  
  # Step 3: Decompose time series (if seasonality requested)
  IF include_seasonality THEN
    decomposition ← seasonal_decompose(daily_demand, period=7)  # Weekly seasonality
    trend_component ← decomposition.trend
    seasonal_component ← decomposition.seasonal
    residual_component ← decomposition.resid
    seasonality_detected ← test_seasonality(seasonal_component)
  ELSE
    seasonality_detected ← FALSE
  END IF
  
  # Step 4: Detect trend (if trends requested)
  IF include_trends THEN
    trend_direction ← detect_trend(daily_demand)  # "increasing", "decreasing", "stable"
    trend_slope ← calculate_trend_slope(daily_demand)
  ELSE
    trend_direction ← "stable"
    trend_slope ← 0
  END IF
  
  # Step 5: Train forecasting model
  # MVP: Use exponential smoothing (Holt-Winters)
  # Production: Use ARIMA, Prophet, or LSTM
  
  IF seasonality_detected AND include_seasonality THEN
    model ← HoltWinters(
      data=daily_demand,
      seasonal_periods=7,
      trend="add" if include_trends else None,
      seasonal="add"
    )
  ELSE IF include_trends THEN
    model ← ExponentialSmoothing(
      data=daily_demand,
      trend="add"
    )
  ELSE
    model ← SimpleExponentialSmoothing(data=daily_demand)
  END IF
  
  model.fit()
  
  # Step 6: Generate forecast
  forecast_values ← model.forecast(steps=horizon_days)
  confidence_intervals ← model.forecast_interval(steps=horizon_days, alpha=0.05)
  
  # Step 7: Post-process predictions
  forecast_values ← MAXIMUM(forecast_values, 0)  # No negative demand
  forecast_values ← ROUND(forecast_values)  # Integer units
  
  # Step 8: Calculate model accuracy on validation set
  validation_size ← 30
  train_data ← daily_demand[:-validation_size]
  test_data ← daily_demand[-validation_size:]
  
  validation_model ← train_model(train_data)
  validation_predictions ← validation_model.forecast(validation_size)
  model_accuracy ← calculate_mape(test_data, validation_predictions)
  
  # Step 9: Build response
  forecasts ← []
  FOR i FROM 0 TO horizon_days - 1 DO
    forecast_date ← today() + i days
    forecasts.append({
      "date": forecast_date,
      "predicted_demand": forecast_values[i],
      "confidence_lower": confidence_intervals[i].lower,
      "confidence_upper": confidence_intervals[i].upper
    })
  END FOR
  
  RETURN DemandForecastResponse(
    product_id=product_id,
    forecast_date=today(),
    forecasts=forecasts,
    seasonality_detected=seasonality_detected,
    trend_direction=trend_direction,
    model_accuracy=model_accuracy
  )
END

# Helper functions

FUNCTION aggregate_by_day(movements)
  daily_totals ← {}
  FOR movement IN movements DO
    date ← movement.date.date()
    IF movement.type IN ["SHIPMENT", "TRANSFER_OUT"] THEN
      daily_totals[date] ← daily_totals.get(date, 0) + ABS(movement.quantity)
    END IF
  END FOR
  RETURN daily_totals
END FUNCTION

FUNCTION handle_outliers(data, method="iqr")
  IF method == "iqr" THEN
    Q1 ← percentile(data, 25)
    Q3 ← percentile(data, 75)
    IQR ← Q3 - Q1
    lower_bound ← Q1 - 1.5 * IQR
    upper_bound ← Q3 + 1.5 * IQR
    
    FOR i FROM 0 TO length(data) - 1 DO
      IF data[i] < lower_bound OR data[i] > upper_bound THEN
        data[i] ← median(data)  # Replace outlier with median
      END IF
    END FOR
  END IF
  RETURN data
END FUNCTION

FUNCTION detect_trend(data)
  # Use Mann-Kendall test for trend detection
  n ← length(data)
  s ← 0
  
  FOR i FROM 0 TO n - 2 DO
    FOR j FROM i + 1 TO n - 1 DO
      IF data[j] > data[i] THEN
        s ← s + 1
      ELSE IF data[j] < data[i] THEN
        s ← s - 1
      END IF
    END FOR
  END FOR
  
  IF s > 0 AND is_significant(s, n) THEN
    RETURN "increasing"
  ELSE IF s < 0 AND is_significant(s, n) THEN
    RETURN "decreasing"
  ELSE
    RETURN "stable"
  END IF
END FUNCTION
```

**Preconditions**:
- Product exists in database
- Sufficient historical data (minimum 30 days)
- Valid horizon_days parameter (1-365)

**Postconditions**:
- Forecast generated for each day in horizon
- Confidence intervals calculated
- Model accuracy metrics provided
- No negative demand predictions

**Loop Invariants**:
- All processed dates are sequential
- All forecast values are non-negative
- Confidence intervals are valid (lower < predicted < upper)

### 2. Smart Reorder Points Algorithm

```python
ALGORITHM calculateSmartReorder(product_id, current_stock, lead_time_days, target_service_level)
INPUT: product_id (UUID), current_stock (int), lead_time_days (int), target_service_level (float)
OUTPUT: SmartReorderResponse with reorder recommendations

PRECONDITIONS:
  - product_id exists in database
  - current_stock >= 0
  - lead_time_days > 0
  - 0 < target_service_level <= 1.0

POSTCONDITIONS:
  - recommended_min_stock >= safety_stock
  - reorder_point >= recommended_min_stock
  - recommended_max_stock > reorder_point
  - reorder_quantity > 0

BEGIN
  # Step 1: Get demand forecast for lead time period
  forecast ← forecastDemand(
    product_id=product_id,
    horizon_days=lead_time_days * 2,  # Forecast double the lead time
    include_seasonality=TRUE,
    include_trends=TRUE
  )
  
  # Step 2: Calculate average demand during lead time
  lead_time_demand ← 0
  FOR i FROM 0 TO lead_time_days - 1 DO
    lead_time_demand ← lead_time_demand + forecast.forecasts[i].predicted_demand
  END FOR
  average_daily_demand ← lead_time_demand / lead_time_days
  
  # Step 3: Calculate demand variability (standard deviation)
  historical_data ← query_stock_movements(product_id, lookback_days=90)
  daily_demand ← aggregate_by_day(historical_data)
  demand_std_dev ← standard_deviation(daily_demand.values())
  
  # Step 4: Calculate safety stock using service level
  # Z-score for target service level (e.g., 95% = 1.65, 99% = 2.33)
  z_score ← inverse_normal_cdf(target_service_level)
  
  safety_stock ← z_score * demand_std_dev * SQRT(lead_time_days)
  safety_stock ← CEILING(safety_stock)  # Round up for safety
  
  # Step 5: Calculate reorder point
  reorder_point ← lead_time_demand + safety_stock
  reorder_point ← CEILING(reorder_point)
  
  # Step 6: Calculate recommended min/max stock levels
  recommended_min_stock ← safety_stock
  
  # Max stock = reorder point + economic order quantity
  # EOQ = SQRT((2 * annual_demand * order_cost) / holding_cost)
  # Simplified: Use 2x reorder point as max
  recommended_max_stock ← reorder_point * 2
  
  # Step 7: Calculate reorder quantity
  # Order enough to reach max stock level
  reorder_quantity ← recommended_max_stock - recommended_min_stock
  
  # Step 8: Adjust for current stock situation
  IF current_stock < reorder_point THEN
    urgent ← TRUE
    immediate_order_quantity ← reorder_point - current_stock + reorder_quantity
  ELSE
    urgent ← FALSE
    immediate_order_quantity ← 0
  END IF
  
  # Step 9: Generate reasoning explanation
  reasoning ← build_reasoning_text(
    average_daily_demand,
    lead_time_days,
    safety_stock,
    target_service_level,
    demand_std_dev,
    urgent
  )
  
  RETURN SmartReorderResponse(
    product_id=product_id,
    recommended_min_stock=recommended_min_stock,
    recommended_max_stock=recommended_max_stock,
    reorder_point=reorder_point,
    reorder_quantity=reorder_quantity,
    safety_stock=safety_stock,
    reasoning=reasoning
  )
END

FUNCTION inverse_normal_cdf(probability)
  # Z-scores for common service levels
  service_level_map ← {
    0.90: 1.28,
    0.95: 1.65,
    0.97: 1.88,
    0.99: 2.33,
    0.995: 2.58
  }
  
  # Find closest service level
  closest ← find_closest_key(service_level_map, probability)
  RETURN service_level_map[closest]
END FUNCTION

FUNCTION build_reasoning_text(avg_demand, lead_time, safety_stock, service_level, std_dev, urgent)
  text ← "Cálculo basado en: "
  text ← text + "demanda promedio de " + avg_demand + " unidades/día, "
  text ← text + "tiempo de entrega de " + lead_time + " días, "
  text ← text + "variabilidad de demanda (σ=" + std_dev + "), "
  text ← text + "nivel de servicio objetivo de " + (service_level * 100) + "%. "
  text ← text + "Stock de seguridad calculado: " + safety_stock + " unidades. "
  
  IF urgent THEN
    text ← text + "ALERTA: Stock actual por debajo del punto de reorden. Ordenar inmediatamente."
  END IF
  
  RETURN text
END FUNCTION
```

**Preconditions**:
- Valid product with historical data
- Non-negative current stock
- Positive lead time
- Valid service level (0-1)

**Postconditions**:
- Safety stock calculated based on variability
- Reorder point covers lead time demand + safety stock
- Min/max levels are logical (min < reorder < max)
- Reorder quantity is positive

**Loop Invariants**:
- All calculated quantities are non-negative
- Service level constraints are maintained

### 3. Supplier Scoring Algorithm

```python
ALGORITHM scoreSupplier(supplier_id, evaluation_period_days)
INPUT: supplier_id (UUID), evaluation_period_days (int)
OUTPUT: SupplierScoringResponse with comprehensive score

PRECONDITIONS:
  - supplier_id exists in database
  - evaluation_period_days > 0
  - At least one purchase order exists for supplier

POSTCONDITIONS:
  - overall_score is between 0 and 100
  - All component scores are between 0 and 1
  - Recommendation is one of: "excellent", "good", "acceptable", "review_needed"
  - Suggested actions list is not empty

BEGIN
  # Step 1: Fetch supplier data
  purchase_orders ← query_purchase_orders(
    supplier_id=supplier_id,
    from_date=today() - evaluation_period_days,
    status=["RECEIVED", "PARTIALLY_RECEIVED"]
  )
  
  IF length(purchase_orders) == 0 THEN
    RETURN error("No completed orders in evaluation period")
  END IF
  
  # Step 2: Calculate on-time delivery rate
  on_time_count ← 0
  total_deliveries ← 0
  
  FOR order IN purchase_orders DO
    receptions ← query_receptions(purchase_order_id=order.id)
    FOR reception IN receptions DO
      total_deliveries ← total_deliveries + 1
      IF reception.received_date <= order.expected_delivery_date THEN
        on_time_count ← on_time_count + 1
      END IF
    END FOR
  END FOR
  
  on_time_delivery_rate ← on_time_count / total_deliveries
  
  # Step 3: Calculate defect rate
  total_items_received ← 0
  defective_items ← 0
  
  FOR order IN purchase_orders DO
    receptions ← query_receptions(purchase_order_id=order.id)
    FOR reception IN receptions DO
      FOR item IN reception.items DO
        total_items_received ← total_items_received + item.received_quantity
        
        # Check for damage movements within 7 days of reception
        damage_movements ← query_movements(
          product_id=item.product_id,
          type="DAMAGE",
          from_date=reception.received_date,
          to_date=reception.received_date + 7 days
        )
        
        FOR movement IN damage_movements DO
          defective_items ← defective_items + ABS(movement.quantity)
        END FOR
      END FOR
    END FOR
  END FOR
  
  defect_rate ← defective_items / total_items_received
  
  # Step 4: Calculate price competitiveness
  # Compare supplier prices to market average
  supplier_avg_price ← calculate_average_unit_price(purchase_orders)
  market_avg_price ← calculate_market_average_price(evaluation_period_days)
  
  IF market_avg_price > 0 THEN
    price_ratio ← supplier_avg_price / market_avg_price
    # Lower is better: ratio < 1 means cheaper than market
    price_competitiveness ← MAXIMUM(0, MINIMUM(1, 2 - price_ratio))
  ELSE
    price_competitiveness ← 0.5  # Neutral if no market data
  END IF
  
  # Step 5: Calculate responsiveness score
  # Based on communication logs, order confirmation time, etc.
  # Simplified: Use lead time consistency
  lead_times ← []
  FOR order IN purchase_orders DO
    actual_lead_time ← calculate_actual_lead_time(order)
    lead_times.append(actual_lead_time)
  END FOR
  
  lead_time_std_dev ← standard_deviation(lead_times)
  lead_time_avg ← mean(lead_times)
  
  # Lower variability = higher responsiveness
  coefficient_of_variation ← lead_time_std_dev / lead_time_avg
  responsiveness_score ← MAXIMUM(0, MINIMUM(1, 1 - coefficient_of_variation))
  
  # Step 6: Calculate overall score (weighted average)
  weights ← {
    "on_time_delivery": 0.35,
    "defect_rate": 0.25,
    "price_competitiveness": 0.25,
    "responsiveness": 0.15
  }
  
  overall_score ← (
    (on_time_delivery_rate * weights["on_time_delivery"]) +
    ((1 - defect_rate) * weights["defect_rate"]) +
    (price_competitiveness * weights["price_competitiveness"]) +
    (responsiveness_score * weights["responsiveness"])
  ) * 100
  
  # Step 7: Determine recommendation
  IF overall_score >= 85 THEN
    recommendation ← "excellent"
  ELSE IF overall_score >= 70 THEN
    recommendation ← "good"
  ELSE IF overall_score >= 55 THEN
    recommendation ← "acceptable"
  ELSE
    recommendation ← "review_needed"
  END IF
  
  # Step 8: Generate suggested actions
  suggested_actions ← []
  
  IF on_time_delivery_rate < 0.90 THEN
    suggested_actions.append("Discutir mejoras en tiempos de entrega")
  END IF
  
  IF defect_rate > 0.05 THEN
    suggested_actions.append("Implementar controles de calidad más estrictos")
  END IF
  
  IF price_competitiveness < 0.5 THEN
    suggested_actions.append("Negociar mejores precios o buscar alternativas")
  END IF
  
  IF responsiveness_score < 0.7 THEN
    suggested_actions.append("Mejorar comunicación y consistencia en entregas")
  END IF
  
  IF length(suggested_actions) == 0 THEN
    suggested_actions.append("Mantener relación actual, proveedor cumple expectativas")
  END IF
  
  RETURN SupplierScoringResponse(
    supplier_id=supplier_id,
    overall_score=overall_score,
    on_time_delivery_rate=on_time_delivery_rate,
    defect_rate=defect_rate,
    price_competitiveness=price_competitiveness,
    responsiveness_score=responsiveness_score,
    recommendation=recommendation,
    suggested_actions=suggested_actions
  )
END
```

**Preconditions**:
- Supplier exists with completed orders
- Evaluation period has sufficient data
- Purchase orders have reception records

**Postconditions**:
- Overall score is weighted average of components
- All scores are normalized (0-1 or 0-100)
- Recommendation matches score thresholds
- At least one suggested action provided

**Loop Invariants**:
- All counters remain non-negative
- Rates remain between 0 and 1
- Score calculations maintain valid ranges


### 4. Anomaly Detection Algorithm

```python
ALGORITHM detectAnomalies(detection_type, time_window_days, product_ids, location_ids)
INPUT: detection_type (str), time_window_days (int), product_ids (list), location_ids (list)
OUTPUT: AnomalyDetectionResponse with detected anomalies

PRECONDITIONS:
  - detection_type IN ["movement", "stock_level", "transaction"]
  - time_window_days > 0
  - At least 7 days of historical data available

POSTCONDITIONS:
  - All anomalies have severity level assigned
  - Anomalies are sorted by severity (critical first)
  - Confidence scores are between 0 and 1
  - Total counts match anomalies list length

BEGIN
  anomalies ← []
  
  # Step 1: Fetch relevant data based on detection type
  IF detection_type == "movement" THEN
    data ← query_stock_movements(
      from_date=today() - time_window_days,
      product_ids=product_ids,
      location_ids=location_ids
    )
    anomalies ← detect_movement_anomalies(data)
    
  ELSE IF detection_type == "stock_level" THEN
    data ← query_stock_levels(
      product_ids=product_ids,
      location_ids=location_ids
    )
    anomalies ← detect_stock_level_anomalies(data, time_window_days)
    
  ELSE IF detection_type == "transaction" THEN
    data ← query_transactions(
      from_date=today() - time_window_days,
      product_ids=product_ids
    )
    anomalies ← detect_transaction_anomalies(data)
  END IF
  
  # Step 2: Sort by severity and confidence
  anomalies ← sort(anomalies, key=lambda x: (severity_priority(x.severity), -x.confidence))
  
  # Step 3: Count by severity
  critical_count ← count(anomalies, severity="critical")
  warning_count ← count(anomalies, severity="warning")
  
  RETURN AnomalyDetectionResponse(
    anomalies=anomalies,
    total_anomalies=length(anomalies),
    critical_count=critical_count,
    warning_count=warning_count
  )
END

FUNCTION detect_movement_anomalies(movements)
  anomalies ← []
  
  # Group movements by product and location
  grouped ← group_by(movements, keys=["product_id", "location_id"])
  
  FOR group_key, group_movements IN grouped DO
    product_id, location_id ← group_key
    
    # Calculate statistics
    quantities ← [ABS(m.quantity) FOR m IN group_movements]
    mean_quantity ← mean(quantities)
    std_dev ← standard_deviation(quantities)
    
    # Detect outliers using Z-score method
    FOR movement IN group_movements DO
      z_score ← (ABS(movement.quantity) - mean_quantity) / std_dev
      
      IF z_score > 3 THEN  # 3 standard deviations
        severity ← "critical" IF z_score > 4 ELSE "warning"
        confidence ← MINIMUM(0.99, z_score / 5)
        
        anomalies.append({
          "type": "unusual_movement_size",
          "severity": severity,
          "description": "Movimiento inusualmente grande detectado",
          "affected_entity": {
            "movement_id": movement.id,
            "product_id": product_id,
            "location_id": location_id,
            "quantity": movement.quantity,
            "z_score": z_score
          },
          "timestamp": movement.date,
          "confidence": confidence
        })
      END IF
    END FOR
    
    # Detect duplicate movements (same product, location, quantity, within 1 hour)
    FOR i FROM 0 TO length(group_movements) - 2 DO
      FOR j FROM i + 1 TO length(group_movements) - 1 DO
        m1 ← group_movements[i]
        m2 ← group_movements[j]
        
        time_diff ← ABS(m1.date - m2.date).total_seconds() / 3600  # hours
        
        IF m1.quantity == m2.quantity AND time_diff < 1 THEN
          anomalies.append({
            "type": "duplicate_movement",
            "severity": "critical",
            "description": "Posible movimiento duplicado detectado",
            "affected_entity": {
              "movement_ids": [m1.id, m2.id],
              "product_id": product_id,
              "location_id": location_id,
              "quantity": m1.quantity
            },
            "timestamp": m2.date,
            "confidence": 0.95
          })
        END IF
      END FOR
    END FOR
  END FOR
  
  RETURN anomalies
END FUNCTION

FUNCTION detect_stock_level_anomalies(stock_levels, time_window_days)
  anomalies ← []
  
  FOR stock IN stock_levels DO
    # Detect negative stock (should never happen)
    IF stock.quantity_available < 0 THEN
      anomalies.append({
        "type": "negative_stock",
        "severity": "critical",
        "description": "Stock negativo detectado - error crítico",
        "affected_entity": {
          "product_id": stock.product_id,
          "location_id": stock.location_id,
          "quantity": stock.quantity_available
        },
        "timestamp": now(),
        "confidence": 1.0
      })
    END IF
    
    # Detect shrinkage (unexplained stock loss)
    historical_stock ← query_historical_stock(
      product_id=stock.product_id,
      location_id=stock.location_id,
      days_ago=time_window_days
    )
    
    IF historical_stock THEN
      expected_stock ← calculate_expected_stock(
        initial=historical_stock.quantity_total,
        movements=query_movements_between(historical_stock.date, now())
      )
      
      actual_stock ← stock.quantity_total
      discrepancy ← expected_stock - actual_stock
      
      IF discrepancy > 0 AND discrepancy > (expected_stock * 0.05) THEN  # >5% loss
        severity ← "critical" IF discrepancy > (expected_stock * 0.10) ELSE "warning"
        
        anomalies.append({
          "type": "shrinkage",
          "severity": severity,
          "description": "Pérdida de stock no explicada (shrinkage)",
          "affected_entity": {
            "product_id": stock.product_id,
            "location_id": stock.location_id,
            "expected_stock": expected_stock,
            "actual_stock": actual_stock,
            "discrepancy": discrepancy,
            "percentage": (discrepancy / expected_stock) * 100
          },
          "timestamp": now(),
          "confidence": 0.85
        })
      END IF
    END IF
  END FOR
  
  RETURN anomalies
END FUNCTION

FUNCTION detect_transaction_anomalies(transactions)
  anomalies ← []
  
  # Detect unusual transaction patterns
  # Group by hour of day
  hourly_counts ← group_count_by_hour(transactions)
  mean_hourly ← mean(hourly_counts.values())
  std_dev_hourly ← standard_deviation(hourly_counts.values())
  
  FOR hour, count IN hourly_counts DO
    z_score ← (count - mean_hourly) / std_dev_hourly
    
    IF z_score > 3 THEN
      anomalies.append({
        "type": "unusual_transaction_volume",
        "severity": "warning",
        "description": "Volumen inusual de transacciones en hora específica",
        "affected_entity": {
          "hour": hour,
          "transaction_count": count,
          "expected_count": mean_hourly,
          "z_score": z_score
        },
        "timestamp": now(),
        "confidence": 0.75
      })
    END IF
  END FOR
  
  RETURN anomalies
END FUNCTION

FUNCTION severity_priority(severity)
  IF severity == "critical" THEN
    RETURN 0
  ELSE IF severity == "warning" THEN
    RETURN 1
  ELSE
    RETURN 2
  END IF
END FUNCTION
```

**Preconditions**:
- Valid detection type specified
- Sufficient historical data available
- Time window is reasonable (> 0 days)

**Postconditions**:
- All anomalies have required fields
- Severity levels are consistent
- Confidence scores are valid (0-1)
- Anomalies are sorted by priority

**Loop Invariants**:
- All processed movements maintain data integrity
- Z-scores are calculated consistently
- Anomaly counts match list length

### 5. Product Categorization Algorithm (NLP)

```python
ALGORITHM categorizeProduct(product_name, product_description, image_url, use_vision, use_nlp)
INPUT: product_name (str), product_description (str), image_url (str), use_vision (bool), use_nlp (bool)
OUTPUT: ProductCategorizationResponse with category suggestion

PRECONDITIONS:
  - product_name is not empty
  - At least one of use_vision or use_nlp is TRUE
  - If use_vision is TRUE, image_url must be valid

POSTCONDITIONS:
  - suggested_category_id exists in database
  - confidence is between 0 and 1
  - suggested_attributes is a valid dictionary
  - reasoning explains the categorization

BEGIN
  nlp_confidence ← 0
  vision_confidence ← 0
  nlp_category ← None
  vision_category ← None
  
  # Step 1: NLP-based categorization
  IF use_nlp THEN
    # Combine name and description
    text ← product_name
    IF product_description THEN
      text ← text + " " + product_description
    END IF
    
    # Preprocess text
    text ← text.lower()
    text ← remove_special_characters(text)
    tokens ← tokenize(text)
    tokens ← remove_stopwords(tokens)
    
    # Extract features using TF-IDF or embeddings
    # MVP: Use keyword matching
    # Production: Use BERT embeddings + classifier
    
    categories ← query_all_categories()
    category_scores ← {}
    
    FOR category IN categories DO
      # Calculate similarity score
      category_keywords ← get_category_keywords(category.id)
      score ← calculate_keyword_overlap(tokens, category_keywords)
      category_scores[category.id] ← score
    END FOR
    
    # Get top category
    nlp_category ← max(category_scores, key=category_scores.get)
    nlp_confidence ← category_scores[nlp_category]
  END IF
  
  # Step 2: Vision-based categorization
  IF use_vision AND image_url THEN
    # Download image
    image ← download_image(image_url)
    
    # Preprocess image
    image ← resize(image, target_size=(224, 224))
    image ← normalize(image)
    
    # Run through CNN classifier
    # MVP: Use pre-trained ResNet50 + fine-tuned top layers
    # Production: Use EfficientNet or Vision Transformer
    
    model ← load_vision_model()
    predictions ← model.predict(image)
    
    # Map model output to categories
    vision_category ← map_prediction_to_category(predictions)
    vision_confidence ← max(predictions)
  END IF
  
  # Step 3: Combine results
  IF use_nlp AND use_vision THEN
    # Weighted average (NLP: 60%, Vision: 40%)
    IF nlp_category == vision_category THEN
      final_category ← nlp_category
      final_confidence ← (nlp_confidence * 0.6 + vision_confidence * 0.4)
      reasoning ← "NLP y visión coinciden en la categoría"
    ELSE
      # Choose higher confidence
      IF nlp_confidence > vision_confidence THEN
        final_category ← nlp_category
        final_confidence ← nlp_confidence
        reasoning ← "Categoría basada en análisis de texto (mayor confianza)"
      ELSE
        final_category ← vision_category
        final_confidence ← vision_confidence
        reasoning ← "Categoría basada en análisis de imagen (mayor confianza)"
      END IF
    END IF
  ELSE IF use_nlp THEN
    final_category ← nlp_category
    final_confidence ← nlp_confidence
    reasoning ← "Categoría basada en análisis de texto"
  ELSE
    final_category ← vision_category
    final_confidence ← vision_confidence
    reasoning ← "Categoría basada en análisis de imagen"
  END IF
  
  # Step 4: Extract suggested attributes
  suggested_attributes ← extract_attributes(product_name, product_description, tokens)
  
  # Step 5: Get category details
  category ← query_category(final_category)
  
  RETURN ProductCategorizationResponse(
    suggested_category_id=final_category,
    category_name=category.name,
    confidence=final_confidence,
    suggested_attributes=suggested_attributes,
    reasoning=reasoning
  )
END

FUNCTION extract_attributes(name, description, tokens)
  attributes ← {}
  
  # Extract color
  colors ← ["rojo", "azul", "verde", "negro", "blanco", "amarillo", "gris"]
  FOR color IN colors DO
    IF color IN tokens THEN
      attributes["color"] ← color
      BREAK
    END IF
  END FOR
  
  # Extract size
  sizes ← ["pequeño", "mediano", "grande", "xl", "xxl", "s", "m", "l"]
  FOR size IN sizes DO
    IF size IN tokens THEN
      attributes["tamaño"] ← size
      BREAK
    END IF
  END FOR
  
  # Extract material
  materials ← ["algodón", "plástico", "metal", "madera", "vidrio", "acero"]
  FOR material IN materials DO
    IF material IN tokens THEN
      attributes["material"] ← material
      BREAK
    END IF
  END FOR
  
  # Extract brand (usually capitalized words)
  IF description THEN
    words ← description.split()
    FOR word IN words DO
      IF word[0].isupper() AND length(word) > 2 THEN
        attributes["marca"] ← word
        BREAK
      END IF
    END FOR
  END IF
  
  RETURN attributes
END FUNCTION

FUNCTION calculate_keyword_overlap(tokens, category_keywords)
  overlap_count ← 0
  FOR token IN tokens DO
    IF token IN category_keywords THEN
      overlap_count ← overlap_count + 1
    END IF
  END FOR
  
  IF length(tokens) == 0 THEN
    RETURN 0
  END IF
  
  RETURN overlap_count / length(tokens)
END FUNCTION
```

**Preconditions**:
- Product name is provided
- At least one categorization method enabled
- Image URL is valid if vision is used

**Postconditions**:
- Category exists in database
- Confidence reflects method reliability
- Attributes are extracted when possible
- Reasoning explains decision

**Loop Invariants**:
- All category scores remain between 0 and 1
- Token processing maintains text integrity

### 6. Visual Stock Counting Algorithm (Computer Vision)

```python
ALGORITHM countVisualStock(image_url, expected_product_id, location_id)
INPUT: image_url (str), expected_product_id (str), location_id (str)
OUTPUT: VisualCountingResponse with count and detections

PRECONDITIONS:
  - image_url is valid and accessible
  - location_id exists in database
  - Image contains countable objects

POSTCONDITIONS:
  - detected_count >= 0
  - confidence is between 0 and 1
  - bounding_boxes list matches detected_count
  - quality_score reflects image usability

BEGIN
  # Step 1: Download and validate image
  image ← download_image(image_url)
  
  IF image is None THEN
    RETURN error("Failed to download image")
  END IF
  
  # Step 2: Assess image quality
  quality_score ← assess_image_quality(image)
  
  IF quality_score < 0.3 THEN
    RETURN VisualCountingResponse(
      detected_count=0,
      confidence=0,
      bounding_boxes=[],
      product_matches=[],
      quality_score=quality_score,
      error="Image quality too low for reliable counting"
    )
  END IF
  
  # Step 3: Preprocess image
  image_rgb ← convert_to_rgb(image)
  image_resized ← resize_maintain_aspect(image_rgb, max_size=1024)
  
  # Step 4: Run object detection model
  # MVP: Use YOLO v8 or Faster R-CNN
  # Production: Fine-tuned model on inventory items
  
  detector ← load_object_detection_model()
  detections ← detector.detect(image_resized)
  
  # Step 5: Filter and process detections
  bounding_boxes ← []
  product_matches ← []
  
  FOR detection IN detections DO
    # Filter by confidence threshold
    IF detection.confidence < 0.5 THEN
      CONTINUE
    END IF
    
    # Extract bounding box
    bbox ← {
      "x": detection.bbox.x,
      "y": detection.bbox.y,
      "width": detection.bbox.width,
      "height": detection.bbox.height,
      "confidence": detection.confidence
    }
    bounding_boxes.append(bbox)
    
    # If expected product specified, try to match
    IF expected_product_id THEN
      # Extract features from detected region
      roi ← extract_region(image_resized, detection.bbox)
      features ← extract_visual_features(roi)
      
      # Compare with expected product features
      product_features ← get_product_features(expected_product_id)
      similarity ← calculate_feature_similarity(features, product_features)
      
      IF similarity > 0.7 THEN
        product_matches.append({
          "product_id": expected_product_id,
          "confidence": similarity
        })
      END IF
    END IF
  END FOR
  
  # Step 6: Apply non-maximum suppression to remove duplicates
  bounding_boxes ← non_max_suppression(bounding_boxes, iou_threshold=0.5)
  
  detected_count ← length(bounding_boxes)
  
  # Step 7: Calculate overall confidence
  IF detected_count > 0 THEN
    confidences ← [bbox["confidence"] FOR bbox IN bounding_boxes]
    overall_confidence ← mean(confidences) * quality_score
  ELSE
    overall_confidence ← 0
  END IF
  
  RETURN VisualCountingResponse(
    detected_count=detected_count,
    confidence=overall_confidence,
    bounding_boxes=bounding_boxes,
    product_matches=product_matches,
    quality_score=quality_score
  )
END

FUNCTION assess_image_quality(image)
  # Check multiple quality factors
  
  # 1. Brightness
  brightness ← mean(image)
  brightness_score ← 1.0 IF 50 < brightness < 200 ELSE 0.5
  
  # 2. Blur detection (Laplacian variance)
  gray ← convert_to_grayscale(image)
  laplacian ← apply_laplacian(gray)
  blur_variance ← variance(laplacian)
  blur_score ← MINIMUM(1.0, blur_variance / 100)
  
  # 3. Resolution
  height, width ← image.shape[:2]
  min_dimension ← MINIMUM(height, width)
  resolution_score ← MINIMUM(1.0, min_dimension / 480)
  
  # 4. Contrast
  contrast ← standard_deviation(image)
  contrast_score ← MINIMUM(1.0, contrast / 50)
  
  # Weighted average
  quality_score ← (
    brightness_score * 0.25 +
    blur_score * 0.35 +
    resolution_score * 0.20 +
    contrast_score * 0.20
  )
  
  RETURN quality_score
END FUNCTION

FUNCTION non_max_suppression(boxes, iou_threshold)
  IF length(boxes) == 0 THEN
    RETURN []
  END IF
  
  # Sort by confidence (descending)
  boxes ← sort(boxes, key=lambda x: x["confidence"], reverse=TRUE)
  
  selected_boxes ← []
  
  WHILE length(boxes) > 0 DO
    # Take box with highest confidence
    current_box ← boxes[0]
    selected_boxes.append(current_box)
    boxes ← boxes[1:]
    
    # Remove overlapping boxes
    remaining_boxes ← []
    FOR box IN boxes DO
      iou ← calculate_iou(current_box, box)
      IF iou < iou_threshold THEN
        remaining_boxes.append(box)
      END IF
    END FOR
    
    boxes ← remaining_boxes
  END WHILE
  
  RETURN selected_boxes
END FUNCTION

FUNCTION calculate_iou(box1, box2)
  # Calculate Intersection over Union
  x1 ← MAXIMUM(box1["x"], box2["x"])
  y1 ← MAXIMUM(box1["y"], box2["y"])
  x2 ← MINIMUM(box1["x"] + box1["width"], box2["x"] + box2["width"])
  y2 ← MINIMUM(box1["y"] + box1["height"], box2["y"] + box2["height"])
  
  intersection_area ← MAXIMUM(0, x2 - x1) * MAXIMUM(0, y2 - y1)
  
  box1_area ← box1["width"] * box1["height"]
  box2_area ← box2["width"] * box2["height"]
  union_area ← box1_area + box2_area - intersection_area
  
  IF union_area == 0 THEN
    RETURN 0
  END IF
  
  RETURN intersection_area / union_area
END FUNCTION
```

**Preconditions**:
- Valid image URL provided
- Image is accessible and downloadable
- Location exists in database

**Postconditions**:
- Count is non-negative
- All bounding boxes have valid coordinates
- Confidence reflects detection reliability
- Quality score assesses image usability

**Loop Invariants**:
- All detections maintain confidence threshold
- Bounding boxes remain within image bounds
- NMS maintains highest confidence boxes


### 7. Natural Language Query Processing Algorithm

```python
ALGORITHM processNaturalLanguageQuery(query, user_id, context)
INPUT: query (str), user_id (str), context (dict)
OUTPUT: NaturalLanguageQueryResponse with SQL and results

PRECONDITIONS:
  - query is not empty
  - user_id exists in database
  - User has appropriate permissions

POSTCONDITIONS:
  - intent is correctly classified
  - sql_query is valid and safe (no SQL injection)
  - results match SQL execution
  - natural_language_response is human-readable

BEGIN
  # Step 1: Preprocess query
  query_lower ← query.lower().strip()
  
  # Step 2: Classify intent
  intent ← classify_intent(query_lower)
  
  # Step 3: Extract entities (products, locations, dates, quantities)
  entities ← extract_entities(query_lower, context)
  
  # Step 4: Generate SQL query based on intent and entities
  sql_query ← generate_sql(intent, entities)
  
  # Step 5: Validate SQL for safety
  IF NOT is_safe_sql(sql_query) THEN
    RETURN error("Query contains unsafe operations")
  END IF
  
  # Step 6: Execute SQL query
  results ← execute_query(sql_query)
  
  # Step 7: Generate natural language response
  nl_response ← generate_natural_language_response(intent, entities, results)
  
  # Step 8: Calculate confidence
  confidence ← calculate_confidence(intent, entities, results)
  
  RETURN NaturalLanguageQueryResponse(
    query=query,
    intent=intent,
    sql_query=sql_query,
    results=results,
    natural_language_response=nl_response,
    confidence=confidence
  )
END

FUNCTION classify_intent(query)
  # Intent patterns (MVP: rule-based, Production: BERT classifier)
  
  intent_patterns ← {
    "stock_check": ["cuánto", "cuánta", "cantidad", "stock", "inventario", "tengo", "hay"],
    "expiration_query": ["vence", "vencimiento", "expira", "expiración", "caducidad"],
    "movement_history": ["movimientos", "historial", "transacciones", "cambios"],
    "low_stock": ["bajo", "poco", "falta", "escaso", "mínimo"],
    "product_search": ["buscar", "encontrar", "producto", "sku"],
    "location_query": ["dónde", "ubicación", "almacén", "bodega"],
    "supplier_query": ["proveedor", "supplier", "quién provee"],
    "value_query": ["valor", "precio", "costo", "cuánto vale"]
  }
  
  # Count pattern matches
  intent_scores ← {}
  FOR intent, keywords IN intent_patterns DO
    score ← 0
    FOR keyword IN keywords DO
      IF keyword IN query THEN
        score ← score + 1
      END IF
    END FOR
    intent_scores[intent] ← score
  END FOR
  
  # Return intent with highest score
  best_intent ← max(intent_scores, key=intent_scores.get)
  
  IF intent_scores[best_intent] == 0 THEN
    RETURN "general_query"
  END IF
  
  RETURN best_intent
END FUNCTION

FUNCTION extract_entities(query, context)
  entities ← {
    "products": [],
    "locations": [],
    "dates": [],
    "quantities": [],
    "suppliers": []
  }
  
  # Extract product references
  # Look for SKUs (pattern: alphanumeric)
  sku_pattern ← r'\b[A-Z0-9]{3,10}\b'
  skus ← find_all_matches(query.upper(), sku_pattern)
  FOR sku IN skus DO
    product ← query_product_by_sku(sku)
    IF product THEN
      entities["products"].append(product.id)
    END IF
  END FOR
  
  # Look for product names
  products ← query_all_products()
  FOR product IN products DO
    IF product.name.lower() IN query THEN
      entities["products"].append(product.id)
    END IF
  END FOR
  
  # Extract location references
  locations ← query_all_locations()
  FOR location IN locations DO
    IF location.code.lower() IN query OR location.name.lower() IN query THEN
      entities["locations"].append(location.id)
    END IF
  END FOR
  
  # Extract date references
  date_patterns ← {
    "hoy": today(),
    "ayer": today() - 1 day,
    "mañana": today() + 1 day,
    "esta semana": (today() - 7 days, today()),
    "este mes": (start_of_month(), today()),
    "próximo mes": (start_of_next_month(), end_of_next_month())
  }
  
  FOR pattern, date_value IN date_patterns DO
    IF pattern IN query THEN
      entities["dates"].append(date_value)
    END IF
  END FOR
  
  # Extract quantities
  number_pattern ← r'\b\d+\b'
  numbers ← find_all_matches(query, number_pattern)
  FOR number IN numbers DO
    entities["quantities"].append(int(number))
  END FOR
  
  # Use context if provided
  IF context THEN
    IF "current_product_id" IN context THEN
      entities["products"].append(context["current_product_id"])
    END IF
    IF "current_location_id" IN context THEN
      entities["locations"].append(context["current_location_id"])
    END IF
  END IF
  
  RETURN entities
END FUNCTION

FUNCTION generate_sql(intent, entities)
  sql ← ""
  
  IF intent == "stock_check" THEN
    sql ← "SELECT p.name, p.sku, SUM(sl.quantity_available) as total_stock "
    sql ← sql + "FROM products p "
    sql ← sql + "JOIN stock_levels sl ON p.id = sl.product_id "
    
    IF length(entities["products"]) > 0 THEN
      product_ids ← "'" + "','".join(entities["products"]) + "'"
      sql ← sql + "WHERE p.id IN (" + product_ids + ") "
    END IF
    
    IF length(entities["locations"]) > 0 THEN
      location_ids ← "'" + "','".join(entities["locations"]) + "'"
      sql ← sql + "AND sl.location_id IN (" + location_ids + ") "
    END IF
    
    sql ← sql + "GROUP BY p.id, p.name, p.sku"
    
  ELSE IF intent == "expiration_query" THEN
    sql ← "SELECT p.name, l.lot_number, l.expiration_date, SUM(ls.quantity) as quantity "
    sql ← sql + "FROM products p "
    sql ← sql + "JOIN lots l ON p.id = l.product_id "
    sql ← sql + "JOIN lot_stocks ls ON l.id = ls.lot_id "
    sql ← sql + "WHERE l.expiration_date IS NOT NULL "
    
    IF length(entities["dates"]) > 0 THEN
      date ← entities["dates"][0]
      IF is_tuple(date) THEN  # Date range
        sql ← sql + "AND l.expiration_date BETWEEN '" + date[0] + "' AND '" + date[1] + "' "
      ELSE
        sql ← sql + "AND l.expiration_date <= '" + date + "' "
      END IF
    ELSE
      # Default: next 30 days
      sql ← sql + "AND l.expiration_date <= '" + (today() + 30 days) + "' "
    END IF
    
    sql ← sql + "GROUP BY p.id, p.name, l.lot_number, l.expiration_date "
    sql ← sql + "ORDER BY l.expiration_date ASC"
    
  ELSE IF intent == "movement_history" THEN
    sql ← "SELECT sm.date, sm.type, p.name, sm.quantity, l.code as location "
    sql ← sql + "FROM stock_movements sm "
    sql ← sql + "JOIN products p ON sm.product_id = p.id "
    sql ← sql + "JOIN locations l ON sm.location_id = l.id "
    
    conditions ← []
    
    IF length(entities["products"]) > 0 THEN
      product_ids ← "'" + "','".join(entities["products"]) + "'"
      conditions.append("sm.product_id IN (" + product_ids + ")")
    END IF
    
    IF length(entities["dates"]) > 0 THEN
      date ← entities["dates"][0]
      IF is_tuple(date) THEN
        conditions.append("sm.date BETWEEN '" + date[0] + "' AND '" + date[1] + "'")
      ELSE
        conditions.append("sm.date >= '" + date + "'")
      END IF
    ELSE
      # Default: last 30 days
      conditions.append("sm.date >= '" + (today() - 30 days) + "'")
    END IF
    
    IF length(conditions) > 0 THEN
      sql ← sql + "WHERE " + " AND ".join(conditions) + " "
    END IF
    
    sql ← sql + "ORDER BY sm.date DESC LIMIT 100"
    
  ELSE IF intent == "low_stock" THEN
    sql ← "SELECT p.name, p.sku, SUM(sl.quantity_available) as total_stock, "
    sql ← sql + "rr.minimum_quantity as min_stock "
    sql ← sql + "FROM products p "
    sql ← sql + "JOIN stock_levels sl ON p.id = sl.product_id "
    sql ← sql + "LEFT JOIN reorder_rules rr ON p.id = rr.product_id "
    sql ← sql + "GROUP BY p.id, p.name, p.sku, rr.minimum_quantity "
    sql ← sql + "HAVING SUM(sl.quantity_available) < COALESCE(rr.minimum_quantity, p.min_stock, 10) "
    sql ← sql + "ORDER BY total_stock ASC"
    
  ELSE
    # Generic query - return error
    RETURN error("Intent not supported: " + intent)
  END IF
  
  RETURN sql
END FUNCTION

FUNCTION is_safe_sql(sql)
  # Check for dangerous SQL operations
  dangerous_keywords ← ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE", "TRUNCATE", "EXEC"]
  
  sql_upper ← sql.upper()
  
  FOR keyword IN dangerous_keywords DO
    IF keyword IN sql_upper THEN
      RETURN FALSE
    END IF
  END FOR
  
  # Only allow SELECT statements
  IF NOT sql_upper.strip().startswith("SELECT") THEN
    RETURN FALSE
  END IF
  
  RETURN TRUE
END FUNCTION

FUNCTION generate_natural_language_response(intent, entities, results)
  IF length(results) == 0 THEN
    RETURN "No se encontraron resultados para tu consulta."
  END IF
  
  response ← ""
  
  IF intent == "stock_check" THEN
    IF length(results) == 1 THEN
      result ← results[0]
      response ← "El producto " + result["name"] + " (SKU: " + result["sku"] + ") "
      response ← response + "tiene " + result["total_stock"] + " unidades disponibles."
    ELSE
      response ← "Encontré " + length(results) + " productos:\n"
      FOR result IN results DO
        response ← response + "- " + result["name"] + ": " + result["total_stock"] + " unidades\n"
      END FOR
    END IF
    
  ELSE IF intent == "expiration_query" THEN
    response ← "Productos próximos a vencer:\n"
    FOR result IN results DO
      response ← response + "- " + result["name"] + " (Lote: " + result["lot_number"] + "): "
      response ← response + result["quantity"] + " unidades, vence el " + result["expiration_date"] + "\n"
    END FOR
    
  ELSE IF intent == "movement_history" THEN
    response ← "Últimos movimientos:\n"
    FOR result IN results[:10] DO  # Limit to 10
      response ← response + "- " + result["date"] + ": " + result["type"] + " de "
      response ← response + result["quantity"] + " unidades de " + result["name"]
      response ← response + " en " + result["location"] + "\n"
    END FOR
    
  ELSE IF intent == "low_stock" THEN
    response ← "Productos con stock bajo:\n"
    FOR result IN results DO
      response ← response + "- " + result["name"] + ": " + result["total_stock"]
      response ← response + " unidades (mínimo: " + result["min_stock"] + ")\n"
    END FOR
    
  ELSE
    response ← "Encontré " + length(results) + " resultados para tu consulta."
  END IF
  
  RETURN response
END FUNCTION

FUNCTION calculate_confidence(intent, entities, results)
  confidence ← 0.5  # Base confidence
  
  # Increase confidence if entities were found
  IF length(entities["products"]) > 0 THEN
    confidence ← confidence + 0.2
  END IF
  
  IF length(entities["locations"]) > 0 THEN
    confidence ← confidence + 0.1
  END IF
  
  # Increase confidence if results were found
  IF length(results) > 0 THEN
    confidence ← confidence + 0.2
  END IF
  
  # Cap at 1.0
  confidence ← MINIMUM(1.0, confidence)
  
  RETURN confidence
END FUNCTION
```

**Preconditions**:
- Query is non-empty string
- User has valid permissions
- Database is accessible

**Postconditions**:
- Intent is classified correctly
- SQL is safe (read-only)
- Results match query execution
- Response is human-readable

**Loop Invariants**:
- All entity extractions maintain data integrity
- SQL generation produces valid syntax
- Safety checks prevent malicious queries

### 8. Waste Prediction Algorithm

```python
ALGORITHM predictWaste(prediction_horizon_days, product_ids, min_risk_score)
INPUT: prediction_horizon_days (int), product_ids (list), min_risk_score (float)
OUTPUT: WastePredictionResponse with at-risk products

PRECONDITIONS:
  - prediction_horizon_days > 0 and <= 365
  - 0 <= min_risk_score <= 1
  - Products have expiration or movement data

POSTCONDITIONS:
  - All predictions have risk_score between 0 and 1
  - Predictions are sorted by risk_score (descending)
  - Suggested actions are appropriate for risk level
  - Total at-risk value and units are calculated correctly

BEGIN
  predictions ← []
  total_at_risk_value ← 0
  total_at_risk_units ← 0
  
  # Step 1: Get products to analyze
  IF product_ids THEN
    products ← query_products(ids=product_ids)
  ELSE
    products ← query_all_active_products()
  END IF
  
  # Step 2: Analyze each product for waste risk
  FOR product IN products DO
    risk_factors ← []
    risk_score ← 0
    reason ← ""
    suggested_action ← ""
    expiration_date ← None
    
    # Factor 1: Expiration risk
    lots ← query_lots(
      product_id=product.id,
      expiration_date_before=today() + prediction_horizon_days,
      is_expired=FALSE
    )
    
    IF length(lots) > 0 THEN
      # Calculate days until expiration
      nearest_expiration ← min([lot.expiration_date FOR lot IN lots])
      days_until_expiration ← (nearest_expiration - today()).days
      
      # Calculate expiration risk (higher as expiration approaches)
      expiration_risk ← 1.0 - (days_until_expiration / prediction_horizon_days)
      expiration_risk ← MAXIMUM(0, MINIMUM(1, expiration_risk))
      
      risk_factors.append(("expiration", expiration_risk, 0.4))  # 40% weight
      expiration_date ← nearest_expiration
      
      # Calculate quantity at risk
      at_risk_quantity ← sum([get_lot_quantity(lot.id) FOR lot IN lots])
    ELSE
      at_risk_quantity ← 0
    END IF
    
    # Factor 2: Low demand / obsolescence risk
    historical_demand ← query_stock_movements(
      product_id=product.id,
      type=["SHIPMENT", "TRANSFER_OUT"],
      from_date=today() - 90 days
    )
    
    IF length(historical_demand) > 0 THEN
      daily_demand ← aggregate_by_day(historical_demand)
      avg_daily_demand ← mean(daily_demand.values())
      
      # Get current stock
      current_stock ← get_total_stock(product.id)
      
      # Calculate days of inventory
      IF avg_daily_demand > 0 THEN
        days_of_inventory ← current_stock / avg_daily_demand
      ELSE
        days_of_inventory ← 999  # No demand = high obsolescence risk
      END IF
      
      # Obsolescence risk (high if inventory > 180 days)
      IF days_of_inventory > 180 THEN
        obsolescence_risk ← 0.9
      ELSE IF days_of_inventory > 90 THEN
        obsolescence_risk ← 0.6
      ELSE IF days_of_inventory > 60 THEN
        obsolescence_risk ← 0.3
      ELSE
        obsolescence_risk ← 0.1
      END IF
      
      risk_factors.append(("obsolescence", obsolescence_risk, 0.3))  # 30% weight
    END IF
    
    # Factor 3: Declining demand trend
    IF length(historical_demand) >= 30 THEN
      recent_demand ← aggregate_by_day(
        query_stock_movements(
          product_id=product.id,
          type=["SHIPMENT"],
          from_date=today() - 30 days
        )
      )
      
      older_demand ← aggregate_by_day(
        query_stock_movements(
          product_id=product.id,
          type=["SHIPMENT"],
          from_date=today() - 90 days,
          to_date=today() - 30 days
        )
      )
      
      recent_avg ← mean(recent_demand.values()) IF length(recent_demand) > 0 ELSE 0
      older_avg ← mean(older_demand.values()) IF length(older_demand) > 0 ELSE 0
      
      IF older_avg > 0 THEN
        demand_change ← (recent_avg - older_avg) / older_avg
        
        # Declining trend risk
        IF demand_change < -0.5 THEN  # 50% decline
          trend_risk ← 0.8
        ELSE IF demand_change < -0.25 THEN  # 25% decline
          trend_risk ← 0.5
        ELSE IF demand_change < 0 THEN
          trend_risk ← 0.2
        ELSE
          trend_risk ← 0
        END IF
        
        risk_factors.append(("declining_demand", trend_risk, 0.2))  # 20% weight
      END IF
    END IF
    
    # Factor 4: Damaged stock
    damaged_stock ← get_damaged_stock(product.id)
    IF damaged_stock > 0 THEN
      damage_ratio ← damaged_stock / (current_stock + damaged_stock)
      damage_risk ← damage_ratio
      risk_factors.append(("damage", damage_risk, 0.1))  # 10% weight
    END IF
    
    # Step 3: Calculate weighted risk score
    IF length(risk_factors) > 0 THEN
      weighted_sum ← 0
      total_weight ← 0
      
      FOR factor_name, factor_score, weight IN risk_factors DO
        weighted_sum ← weighted_sum + (factor_score * weight)
        total_weight ← total_weight + weight
      END FOR
      
      risk_score ← weighted_sum / total_weight IF total_weight > 0 ELSE 0
    END IF
    
    # Step 4: Skip if below minimum risk threshold
    IF risk_score < min_risk_score THEN
      CONTINUE
    END IF
    
    # Step 5: Generate reason and suggested action
    reason ← build_risk_reason(risk_factors)
    suggested_action ← determine_action(risk_score, risk_factors, at_risk_quantity)
    
    # Step 6: Calculate financial impact
    product_value ← get_product_unit_value(product.id)
    at_risk_value ← at_risk_quantity * product_value
    
    total_at_risk_units ← total_at_risk_units + at_risk_quantity
    total_at_risk_value ← total_at_risk_value + at_risk_value
    
    # Step 7: Add to predictions
    predictions.append({
      "product_id": product.id,
      "product_name": product.name,
      "risk_score": risk_score,
      "reason": reason,
      "expiration_date": expiration_date,
      "suggested_action": suggested_action,
      "at_risk_quantity": at_risk_quantity,
      "at_risk_value": at_risk_value
    })
  END FOR
  
  # Step 8: Sort by risk score (descending)
  predictions ← sort(predictions, key=lambda x: x["risk_score"], reverse=TRUE)
  
  # Step 9: Generate recommended actions
  recommended_actions ← generate_action_plan(predictions)
  
  RETURN WastePredictionResponse(
    predictions=predictions,
    total_at_risk_value=total_at_risk_value,
    total_at_risk_units=total_at_risk_units,
    recommended_actions=recommended_actions
  )
END

FUNCTION build_risk_reason(risk_factors)
  reasons ← []
  
  FOR factor_name, factor_score, weight IN risk_factors DO
    IF factor_score > 0.7 THEN
      IF factor_name == "expiration" THEN
        reasons.append("Próximo a vencer")
      ELSE IF factor_name == "obsolescence" THEN
        reasons.append("Exceso de inventario")
      ELSE IF factor_name == "declining_demand" THEN
        reasons.append("Demanda en declive")
      ELSE IF factor_name == "damage" THEN
        reasons.append("Stock dañado")
      END IF
    END IF
  END FOR
  
  IF length(reasons) == 0 THEN
    RETURN "Riesgo moderado de desperdicio"
  END IF
  
  RETURN ", ".join(reasons)
END FUNCTION

FUNCTION determine_action(risk_score, risk_factors, quantity)
  # Determine primary risk factor
  primary_factor ← max(risk_factors, key=lambda x: x[1])
  factor_name ← primary_factor[0]
  
  IF risk_score > 0.8 THEN
    priority ← "urgent"
  ELSE IF risk_score > 0.6 THEN
    priority ← "high"
  ELSE
    priority ← "medium"
  END IF
  
  IF factor_name == "expiration" THEN
    IF quantity > 100 THEN
      action ← "Promoción agresiva o donación inmediata"
    ELSE
      action ← "Promoción o descuento"
    END IF
  ELSE IF factor_name == "obsolescence" THEN
    action ← "Liquidación o devolución a proveedor"
  ELSE IF factor_name == "declining_demand" THEN
    action ← "Reducir órdenes futuras, promoción moderada"
  ELSE IF factor_name == "damage" THEN
    action ← "Evaluar para reparación o destrucción"
  ELSE
    action ← "Monitorear de cerca"
  END IF
  
  RETURN action
END FUNCTION

FUNCTION generate_action_plan(predictions)
  actions ← []
  
  # Group by action type
  urgent_items ← filter(predictions, lambda x: x["risk_score"] > 0.8)
  high_risk_items ← filter(predictions, lambda x: 0.6 < x["risk_score"] <= 0.8)
  
  IF length(urgent_items) > 0 THEN
    actions.append({
      "action_type": "urgent_promotion",
      "product_ids": [item["product_id"] FOR item IN urgent_items],
      "priority": "urgent",
      "details": "Implementar promociones inmediatas para " + length(urgent_items) + " productos"
    })
  END IF
  
  IF length(high_risk_items) > 0 THEN
    actions.append({
      "action_type": "planned_promotion",
      "product_ids": [item["product_id"] FOR item IN high_risk_items],
      "priority": "high",
      "details": "Planificar promociones para " + length(high_risk_items) + " productos"
    })
  END IF
  
  RETURN actions
END FUNCTION
```

**Preconditions**:
- Valid prediction horizon (1-365 days)
- Products have historical data
- Risk score threshold is valid (0-1)

**Postconditions**:
- All risk scores are between 0 and 1
- Predictions sorted by risk (highest first)
- Actions are appropriate for risk levels
- Financial impact calculated correctly

**Loop Invariants**:
- All risk factors maintain valid scores (0-1)
- Weighted calculations preserve score ranges
- Total at-risk values accumulate correctly

## Correctness Properties

### Universal Quantification Statements

```typescript
// Property 1: All demand forecasts must have non-negative predictions
∀ forecast ∈ DemandForecasts:
  ∀ day ∈ forecast.forecasts:
    day.predicted_demand >= 0

// Property 2: Reorder points must be logical
∀ reorder ∈ SmartReorderCalculations:
  reorder.safety_stock >= 0 ∧
  reorder.recommended_min_stock >= reorder.safety_stock ∧
  reorder.reorder_point >= reorder.recommended_min_stock ∧
  reorder.recommended_max_stock > reorder.reorder_point ∧
  reorder.reorder_quantity > 0

// Property 3: Supplier scores must be normalized
∀ score ∈ SupplierScores:
  0 <= score.overall_score <= 100 ∧
  0 <= score.on_time_delivery_rate <= 1 ∧
  0 <= score.defect_rate <= 1 ∧
  0 <= score.price_competitiveness <= 1 ∧
  0 <= score.responsiveness_score <= 1

// Property 4: Anomaly confidence must be valid
∀ anomaly ∈ AnomalyDetections:
  0 <= anomaly.confidence <= 1 ∧
  anomaly.severity ∈ {"critical", "warning", "info"}

// Property 5: Visual counting must have valid bounding boxes
∀ count ∈ VisualCounts:
  count.detected_count >= 0 ∧
  count.detected_count == length(count.bounding_boxes) ∧
  ∀ box ∈ count.bounding_boxes:
    box.x >= 0 ∧ box.y >= 0 ∧
    box.width > 0 ∧ box.height > 0 ∧
    0 <= box.confidence <= 1

// Property 6: NL queries must be safe
∀ query ∈ NaturalLanguageQueries:
  query.sql_query.startsWith("SELECT") ∧
  ¬contains(query.sql_query, ["DROP", "DELETE", "UPDATE", "INSERT"]) ∧
  0 <= query.confidence <= 1

// Property 7: Waste predictions must have valid risk scores
∀ prediction ∈ WastePredictions:
  ∀ item ∈ prediction.predictions:
    0 <= item.risk_score <= 1 ∧
    item.at_risk_quantity >= 0 ∧
    item.at_risk_value >= 0

// Property 8: AI service responses must be timely
∀ request ∈ AIServiceRequests:
  response_time(request) < 30_seconds ∨
  request.type ∈ {"visual_counting", "demand_forecasting"}

// Property 9: Cache consistency
∀ cached_result ∈ RedisCache:
  cached_result.ttl > 0 ∧
  cached_result.data.timestamp <= now()

// Property 10: Model versioning
∀ prediction ∈ AIPredictions:
  prediction.model_version IS NOT NULL ∧
  prediction.created_at IS NOT NULL
```


## Error Handling

### Error Scenarios and Responses

#### 1. AI Service Unavailable

**Condition**: AI Service is down or unreachable
**Response**: 
- Backend returns cached results if available
- If no cache, return graceful degradation response
- Log error and alert monitoring system
**Recovery**: 
- Automatic retry with exponential backoff (3 attempts)
- Circuit breaker pattern to prevent cascading failures
- Fallback to heuristic calculations for critical features

#### 2. Insufficient Historical Data

**Condition**: Product has < 30 days of movement data
**Response**:
- Return error with specific message
- Suggest minimum data requirements
- Offer alternative analysis methods
**Recovery**:
- Use category-level averages as proxy
- Provide confidence interval reflecting uncertainty

#### 3. Image Quality Too Low

**Condition**: Visual counting image has quality_score < 0.3
**Response**:
- Return error with quality assessment
- Provide specific feedback (too dark, blurry, low resolution)
- Suggest retaking photo
**Recovery**:
- User retakes photo with guidance
- System provides real-time quality feedback

#### 4. SQL Injection Attempt

**Condition**: Natural language query generates unsafe SQL
**Response**:
- Block query execution
- Log security event
- Return generic error (don't reveal security details)
**Recovery**:
- User rephrases query
- System provides query examples

#### 5. Model Inference Timeout

**Condition**: ML model takes > 30 seconds
**Response**:
- Cancel inference
- Return timeout error
- Log performance issue
**Recovery**:
- Retry with smaller batch size
- Use faster fallback model
- Queue for async processing

#### 6. Invalid Product/Location ID

**Condition**: Referenced entity doesn't exist
**Response**:
- Return 404 Not Found
- Provide specific error message
**Recovery**:
- Frontend validates IDs before submission
- Suggest similar valid entities

#### 7. Cache Corruption

**Condition**: Redis cache contains invalid data
**Response**:
- Invalidate corrupted cache entry
- Fetch fresh data from AI service
- Log cache error
**Recovery**:
- Automatic cache refresh
- Monitor cache hit/miss rates

#### 8. Database Connection Loss

**Condition**: PostgreSQL connection fails
**Response**:
- Return 503 Service Unavailable
- Retry connection with backoff
- Use connection pool failover
**Recovery**:
- Automatic reconnection
- Queue requests during outage
- Alert operations team

## Testing Strategy

### Unit Testing Approach

**Backend (TypeScript)**:
- Test AI Client Service methods with mocked HTTP responses
- Test controller validation logic
- Test error handling and retry logic
- Coverage target: 80%

**AI Service (Python)**:
- Test each algorithm function independently
- Mock database queries
- Test edge cases (empty data, outliers, invalid inputs)
- Coverage target: 85%

**Example Unit Test**:

```typescript
describe('AIClientService', () => {
  describe('forecastDemand', () => {
    it('should return cached forecast if available', async () => {
      const mockForecast = { product_id: '123', forecasts: [] };
      redis.get = jest.fn().mockResolvedValue(JSON.stringify(mockForecast));
      
      const result = await aiClientService.forecastDemand({ productId: '123' });
      
      expect(result).toEqual(mockForecast);
      expect(redis.get).toHaveBeenCalledWith('forecast:123:30');
    });

    it('should call AI service if cache miss', async () => {
      redis.get = jest.fn().mockResolvedValue(null);
      axios.post = jest.fn().mockResolvedValue({ data: { forecasts: [] } });
      
      await aiClientService.forecastDemand({ productId: '123' });
      
      expect(axios.post).toHaveBeenCalledWith('/ai/v1/forecast/demand', expect.any(Object));
    });

    it('should retry on failure', async () => {
      redis.get = jest.fn().mockResolvedValue(null);
      axios.post = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { forecasts: [] } });
      
      await aiClientService.forecastDemand({ productId: '123' });
      
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });
});
```

### Property-Based Testing Approach

**Property Test Library**: fast-check (TypeScript), Hypothesis (Python)

**Key Properties to Test**:

1. **Demand Forecasting**:
   - All predictions are non-negative
   - Confidence intervals are valid (lower < predicted < upper)
   - Forecast length matches horizon_days

2. **Smart Reorder**:
   - Reorder point >= min_stock
   - Max_stock > reorder_point
   - Safety stock >= 0

3. **Supplier Scoring**:
   - All scores are between 0 and 1
   - Overall score is weighted average of components
   - Recommendation matches score thresholds

4. **Anomaly Detection**:
   - All anomalies have valid severity levels
   - Confidence scores are between 0 and 1
   - Anomalies are sorted by severity

**Example Property Test**:

```python
from hypothesis import given, strategies as st
import pytest

@given(
    product_id=st.uuids(),
    current_stock=st.integers(min_value=0, max_value=10000),
    lead_time_days=st.integers(min_value=1, max_value=90),
    target_service_level=st.floats(min_value=0.5, max_value=0.99)
)
def test_smart_reorder_properties(product_id, current_stock, lead_time_days, target_service_level):
    """Property: Smart reorder calculations must maintain logical relationships"""
    result = calculate_smart_reorder(
        product_id=str(product_id),
        current_stock=current_stock,
        lead_time_days=lead_time_days,
        target_service_level=target_service_level
    )
    
    # Property 1: Safety stock is non-negative
    assert result.safety_stock >= 0
    
    # Property 2: Min stock >= safety stock
    assert result.recommended_min_stock >= result.safety_stock
    
    # Property 3: Reorder point >= min stock
    assert result.reorder_point >= result.recommended_min_stock
    
    # Property 4: Max stock > reorder point
    assert result.recommended_max_stock > result.reorder_point
    
    # Property 5: Reorder quantity is positive
    assert result.reorder_quantity > 0
```

### Integration Testing Approach

**End-to-End Flows**:

1. **Forecast → Reorder → Purchase Order**:
   - Generate demand forecast
   - Calculate smart reorder points
   - Create purchase order if below reorder point
   - Verify entire flow completes successfully

2. **Visual Counting → Stock Adjustment**:
   - Upload shelf image
   - Get count from AI service
   - Compare with system stock
   - Create adjustment movement if discrepancy

3. **Anomaly Detection → Alert → Resolution**:
   - Detect anomaly in movements
   - Create alert in database
   - Notify user via WebSocket
   - Mark as resolved

**Example Integration Test**:

```typescript
describe('AI Integration Flow', () => {
  it('should complete forecast to reorder flow', async () => {
    // 1. Create test product with historical data
    const product = await createTestProduct();
    await createHistoricalMovements(product.id, 90); // 90 days of data
    
    // 2. Generate forecast
    const forecast = await request(app)
      .get(`/api/v1/ai/forecast/${product.id}`)
      .expect(200);
    
    expect(forecast.body.forecasts).toHaveLength(30);
    
    // 3. Calculate reorder points
    const reorder = await request(app)
      .post(`/api/v1/ai/reorder/${product.id}`)
      .send({
        currentStock: 50,
        leadTimeDays: 7,
        targetServiceLevel: 0.95
      })
      .expect(200);
    
    expect(reorder.body.reorder_point).toBeGreaterThan(0);
    
    // 4. Verify reorder rule was updated
    const rule = await prisma.reorderRule.findUnique({
      where: { productId: product.id }
    });
    
    expect(rule).toBeDefined();
    expect(rule.minimumQuantity).toBe(reorder.body.recommended_min_stock);
  });
});
```

## Performance Considerations

### Response Time Targets

| Feature | Target Response Time | Max Acceptable |
|---------|---------------------|----------------|
| Demand Forecasting | < 2s | 5s |
| Smart Reorder | < 1s | 3s |
| Supplier Scoring | < 3s | 10s |
| Anomaly Detection | < 5s | 15s |
| Product Categorization (NLP) | < 1s | 3s |
| Product Categorization (Vision) | < 3s | 10s |
| Visual Counting | < 5s | 15s |
| Natural Language Query | < 2s | 5s |
| Waste Prediction | < 3s | 10s |

### Optimization Strategies

**1. Caching**:
- Redis cache for frequently accessed predictions
- TTL based on feature type:
  - Forecasts: 24 hours
  - Supplier scores: 7 days
  - Waste predictions: 12 hours
- Cache warming for popular products

**2. Database Optimization**:
- Indexed queries on product_id, date, location_id
- Materialized views for aggregated data
- Partitioning for large tables (movements, audit_logs)
- Connection pooling (min: 10, max: 50)

**3. Model Optimization**:
- Model quantization for faster inference
- Batch processing for multiple predictions
- GPU acceleration for computer vision tasks
- Model caching in memory (avoid disk I/O)

**4. Async Processing**:
- Queue long-running tasks (monthly forecast updates)
- Background jobs for model retraining
- Celery for task management
- Redis as message broker

**5. Load Balancing**:
- Multiple AI service instances
- Round-robin distribution
- Health check endpoints
- Auto-scaling based on CPU/memory

### Scalability Metrics

**Current Capacity (Single Instance)**:
- Forecasts: 100 requests/minute
- Visual Counting: 20 requests/minute
- NL Queries: 200 requests/minute

**Scaling Strategy**:
- Horizontal scaling: Add AI service instances
- Vertical scaling: Increase CPU/RAM for ML workloads
- Database read replicas for query-heavy operations
- CDN for static assets (mobile app images)

## Security Considerations

### Authentication & Authorization

**API Security**:
- JWT tokens for all API requests
- Role-based access control (RBAC)
- AI features require MANAGER or ADMIN role
- Rate limiting per user/IP

**AI Service Security**:
- Internal network only (not publicly accessible)
- API key authentication between services
- Request signing for integrity
- TLS encryption for all communication

### Data Privacy

**PII Protection**:
- No PII in AI training data
- Anonymize user data in logs
- GDPR compliance for EU users
- Data retention policies

**Model Security**:
- Model files stored in encrypted S3
- Access control for model downloads
- Version control for model artifacts
- Audit trail for model updates

### SQL Injection Prevention

**Natural Language Queries**:
- Whitelist of allowed SQL operations (SELECT only)
- Parameterized queries
- Query validation before execution
- Timeout limits (30 seconds)
- Result set size limits (1000 rows)

### Image Upload Security

**Visual Counting**:
- File type validation (JPEG, PNG only)
- File size limits (10 MB max)
- Virus scanning
- Signed URLs for S3 uploads
- Automatic expiration (24 hours)

## Dependencies

### Backend Dependencies (Node.js)

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "ioredis": "^5.3.0"
  }
}
```

### AI Service Dependencies (Python)

```json
{
  "dependencies": {
    "fastapi": "^0.109.0",
    "uvicorn": "^0.27.0",
    "pydantic": "^2.5.0",
    "scikit-learn": "^1.4.0",
    "pandas": "^2.1.0",
    "numpy": "^1.26.0",
    "statsmodels": "^0.14.0",
    "torch": "^2.1.0",
    "torchvision": "^0.16.0",
    "transformers": "^4.36.0",
    "opencv-python": "^4.9.0",
    "pillow": "^10.2.0",
    "spacy": "^3.7.0",
    "redis": "^5.0.0",
    "psycopg2-binary": "^2.9.0",
    "sqlalchemy": "^2.0.0",
    "celery": "^5.3.0"
  }
}
```

### Mobile App Dependencies (React Native)

```json
{
  "dependencies": {
    "react-native": "^0.73.0",
    "expo": "^50.0.0",
    "expo-camera": "^14.0.0",
    "expo-image-picker": "^14.7.0",
    "axios": "^1.6.0",
    "@react-navigation/native": "^6.1.0"
  }
}
```

### Infrastructure Dependencies

- **PostgreSQL**: 14+ (shared database)
- **Redis**: 7+ (cache and queue)
- **S3-compatible storage**: Images and models
- **Nginx**: Reverse proxy and load balancer
- **Docker**: Containerization
- **Kubernetes** (optional): Orchestration

## Deployment Strategy

### Development Environment

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: dacodes_inventory
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/dacodes_inventory
      REDIS_URL: redis://redis:6379
      AI_SERVICE_URL: http://ai-service:8000
    depends_on:
      - postgres
      - redis

  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://dev:dev@postgres:5432/dacodes_inventory
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./models:/app/models

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
```

### Production Deployment

**Architecture**:
```
Internet
    │
    ▼
[CloudFlare CDN] ← Frontend static files
    │
    ▼
[Load Balancer (Nginx)]
    │
    ├─→ [Backend API 1] ─┐
    ├─→ [Backend API 2] ─┼─→ [PostgreSQL Primary]
    └─→ [Backend API 3] ─┘        │
                                   ├─→ [Read Replica 1]
    ┌──────────────────────────────┘
    │
    ├─→ [AI Service 1] ─┐
    ├─→ [AI Service 2] ─┼─→ [Redis Cluster]
    └─→ [AI Service 3] ─┘
```

**Deployment Steps**:

1. **Database Migration**:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

2. **Build Docker Images**:
   ```bash
   docker build -t dacodes-backend:latest ./backend
   docker build -t dacodes-ai-service:latest ./ai-service
   docker build -t dacodes-frontend:latest ./frontend
   ```

3. **Deploy to Kubernetes**:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/ai-service-deployment.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

4. **Model Deployment**:
   ```bash
   # Upload trained models to S3
   aws s3 sync ./models s3://dacodes-ai-models/v1.0/
   
   # AI service downloads models on startup
   ```

5. **Monitoring Setup**:
   ```bash
   # Deploy Prometheus + Grafana
   kubectl apply -f k8s/monitoring/
   ```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy AI Integration

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Backend Tests
        run: cd backend && npm test
      - name: Run AI Service Tests
        run: cd ai-service && pytest
      - name: Run Integration Tests
        run: npm run test:integration

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker Images
        run: |
          docker build -t ${{ secrets.REGISTRY }}/backend:${{ github.sha }} ./backend
          docker build -t ${{ secrets.REGISTRY }}/ai-service:${{ github.sha }} ./ai-service
      - name: Push to Registry
        run: |
          docker push ${{ secrets.REGISTRY }}/backend:${{ github.sha }}
          docker push ${{ secrets.REGISTRY }}/ai-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/backend backend=${{ secrets.REGISTRY }}/backend:${{ github.sha }}
          kubectl set image deployment/ai-service ai-service=${{ secrets.REGISTRY }}/ai-service:${{ github.sha }}
          kubectl rollout status deployment/backend
          kubectl rollout status deployment/ai-service
```

### Model Training & Updates

**Training Pipeline**:

1. **Data Collection**:
   - Export historical data monthly
   - Anonymize and prepare training dataset
   - Split into train/validation/test sets

2. **Model Training**:
   - Train models on GPU instances
   - Hyperparameter tuning
   - Cross-validation
   - Performance evaluation

3. **Model Versioning**:
   - Tag models with version (v1.0, v1.1, etc.)
   - Store in S3 with metadata
   - Update model registry

4. **Deployment**:
   - A/B testing with new model
   - Gradual rollout (10% → 50% → 100%)
   - Monitor performance metrics
   - Rollback if degradation detected

5. **Monitoring**:
   - Track prediction accuracy
   - Monitor inference latency
   - Alert on anomalies
   - Retrain if accuracy drops

### Rollback Strategy

**Automated Rollback Triggers**:
- Error rate > 5%
- Response time > 2x baseline
- AI service health check fails
- Critical bug detected

**Rollback Process**:
```bash
# Rollback to previous version
kubectl rollout undo deployment/ai-service

# Verify rollback
kubectl rollout status deployment/ai-service

# Check logs
kubectl logs -f deployment/ai-service
```

---

## Summary

Este diseño técnico proporciona una arquitectura completa y escalable para integrar 8 funcionalidades de IA en el DaCodes Inventory System. La solución desacopla el backend transaccional (Node.js) del servicio de IA (Python), permitiendo especialización tecnológica y escalabilidad independiente.

**Características clave**:
- Arquitectura de microservicios con comunicación REST
- Base de datos compartida (PostgreSQL) con caching (Redis)
- Aplicación móvil React Native para conteo visual
- Algoritmos ML con especificaciones formales (precondiciones, postcondiciones, invariantes)
- Estrategia de testing completa (unit, property-based, integration)
- Deployment automatizado con CI/CD
- Monitoreo y observabilidad integrados
- Seguridad enterprise-ready

La arquitectura está lista para MVP con heurísticas simples, pero diseñada para evolucionar hacia modelos ML avanzados sin cambios estructurales.

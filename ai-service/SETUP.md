# Setup Guide - DaCodes AI Service

## 📦 Estructura Creada

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI application entry point
│   │
│   ├── core/                        # Core functionality
│   │   ├── __init__.py
│   │   ├── config.py               # Pydantic settings
│   │   ├── logging.py              # Logging configuration
│   │   └── exceptions.py           # Custom exceptions
│   │
│   ├── api/                         # API layer
│   │   ├── __init__.py
│   │   ├── dependencies.py         # FastAPI dependencies
│   │   └── v1/
│   │       ├── __init__.py         # API router
│   │       └── endpoints/          # Endpoint modules
│   │           ├── forecast.py
│   │           ├── reorder.py
│   │           ├── suppliers.py
│   │           ├── anomalies.py
│   │           ├── categorization.py
│   │           ├── visual.py
│   │           ├── nlq.py
│   │           ├── waste.py
│   │           └── health.py
│   │
│   ├── schemas/                     # Pydantic models (request/response)
│   │   ├── __init__.py
│   │   ├── forecast.py
│   │   ├── reorder.py
│   │   ├── suppliers.py
│   │   ├── anomalies.py
│   │   ├── categorization.py
│   │   ├── visual.py
│   │   ├── nlq.py
│   │   └── waste.py
│   │
│   └── services/                    # Business logic
│       ├── __init__.py
│       ├── forecast_service.py
│       ├── reorder_service.py
│       ├── supplier_service.py
│       ├── anomaly_service.py
│       ├── categorization_service.py
│       ├── visual_service.py
│       ├── nlq_service.py
│       └── waste_service.py
│
├── models/                          # ML model files
│   └── .gitkeep
│
├── tests/                           # Test files
│   └── test_forecast.py
│
├── .env.example                     # Environment variables template
├── .gitignore
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # Docker image
├── docker-compose.yml              # Local development
├── README.md                        # Documentation
└── SETUP.md                        # This file
```

## 🚀 Inicio Rápido

### Opción 1: Docker (Recomendado)

```bash
# 1. Copiar variables de entorno
cp .env.example .env

# 2. Iniciar servicios
docker-compose up --build

# 3. Acceder a la documentación
open http://localhost:8000/docs
```

### Opción 2: Local

```bash
# 1. Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Ejecutar servidor
uvicorn app.main:app --reload --port 8000

# 5. Acceder a la documentación
open http://localhost:8000/docs
```

## 🧪 Probar el Servicio

### Health Check

```bash
curl http://localhost:8000/health
```

### Demand Forecast

```bash
curl -X POST http://localhost:8000/ai/v1/forecast/demand \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "test-123",
    "forecast_horizon_days": 30,
    "include_seasonality": true,
    "include_trends": true
  }'
```

### Smart Reorder

```bash
curl -X POST http://localhost:8000/ai/v1/reorder/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "test-123",
    "current_stock": 50,
    "lead_time_days": 7,
    "target_service_level": 0.95
  }'
```

### Supplier Scoring

```bash
curl -X POST http://localhost:8000/ai/v1/suppliers/score \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": "supplier-123",
    "evaluation_period_days": 90
  }'
```

## 📊 Estado Actual

### ✅ Implementado

- [x] Estructura modular completa
- [x] FastAPI server con hot reload
- [x] 8 módulos de IA con endpoints
- [x] Contratos request/response (Pydantic)
- [x] Manejo de errores centralizado
- [x] Logging estructurado (JSON)
- [x] Health checks
- [x] Docker + docker-compose
- [x] Documentación automática (Swagger/ReDoc)
- [x] Tests básicos
- [x] Configuración con variables de entorno

### 🔄 Heurísticas Temporales

Actualmente los servicios usan heurísticas simples:

1. **Forecast**: Moving average + trend + seasonality
2. **Reorder**: Fórmula EOQ simplificada
3. **Supplier Scoring**: Weighted average de métricas
4. **Anomaly Detection**: Placeholder (retorna vacío)
5. **Categorization**: Placeholder (retorna categoría fija)
6. **Visual Counting**: Placeholder (retorna 0)
7. **NL Queries**: Placeholder (retorna query vacío)
8. **Waste Prediction**: Placeholder (retorna vacío)

### 🎯 Próximos Pasos para ML Real

#### 1. Demand Forecasting

```python
# Reemplazar en forecast_service.py
import joblib
from sklearn.ensemble import RandomForestRegressor

class ForecastService:
    def __init__(self):
        # Cargar modelo real
        self.model = joblib.load('models/forecasting/v1.0/model.pkl')
    
    async def forecast_demand(self, request):
        # Preparar features
        features = await self._prepare_features(request.product_id)
        
        # Predicción con modelo real
        prediction = self.model.predict(features)
        
        return self._format_response(prediction)
```

#### 2. Visual Counting

```python
# Agregar a requirements.txt
# torch==2.1.2
# torchvision==0.16.2
# opencv-python==4.9.0.80

# Implementar en visual_service.py
import torch
import cv2
from torchvision.models.detection import fasterrcnn_resnet50_fpn

class VisualService:
    def __init__(self):
        self.model = fasterrcnn_resnet50_fpn(pretrained=True)
        self.model.eval()
    
    async def count_items(self, request):
        # Descargar imagen
        image = await self._download_image(request.image_url)
        
        # Detectar objetos
        with torch.no_grad():
            predictions = self.model([image])
        
        # Procesar resultados
        return self._process_detections(predictions)
```

#### 3. NL Queries

```python
# Agregar a requirements.txt
# transformers==4.36.2
# spacy==3.7.2

# Implementar en nlq_service.py
from transformers import pipeline

class NLQService:
    def __init__(self):
        self.classifier = pipeline("text-classification", 
                                   model="bert-base-uncased")
        self.ner = pipeline("ner")
    
    async def process_query(self, request):
        # Clasificar intención
        intent = self.classifier(request.query)[0]
        
        # Extraer entidades
        entities = self.ner(request.query)
        
        # Generar SQL
        sql = self._generate_sql(intent, entities)
        
        return sql
```

## 🔧 Configuración de Producción

### 1. Variables de Entorno

```bash
# .env (producción)
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/dacodes
REDIS_URL=redis://prod-redis:6379/0
API_KEY=<strong-random-key>
S3_BUCKET=dacodes-ai-models-prod
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
LOG_LEVEL=INFO
LOG_FORMAT=json
```

### 2. Deployment

```bash
# Build production image
docker build -t dacodes-ai-service:1.0.0 .

# Tag for registry
docker tag dacodes-ai-service:1.0.0 registry.example.com/dacodes-ai-service:1.0.0

# Push to registry
docker push registry.example.com/dacodes-ai-service:1.0.0

# Deploy (ejemplo Kubernetes)
kubectl apply -f k8s/deployment.yaml
```

### 3. Monitoreo

Agregar:
- Prometheus metrics
- Grafana dashboards
- Alerting (PagerDuty, Slack)
- APM (DataDog, New Relic)

## 📚 Recursos

### Documentación API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

### Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f ai-service

# Logs de un servicio específico
docker-compose logs forecast_service
```

### Tests

```bash
# Ejecutar todos los tests
pytest

# Con coverage
pytest --cov=app tests/

# Tests específicos
pytest tests/test_forecast.py -v
```

## 🤝 Integración con Backend Node.js

El backend Node.js ya tiene el cliente preparado en:
`backend/src/services/ai-client.service.ts`

Ejemplo de uso:

```typescript
import { aiClientService } from './services/ai-client.service';

// Forecast
const forecast = await aiClientService.forecastDemand({
  productId: 'abc-123',
  forecastHorizonDays: 30
});

// Reorder
const reorder = await aiClientService.calculateSmartReorder({
  productId: 'abc-123',
  currentStock: 50,
  leadTimeDays: 7
});
```

## 🐛 Troubleshooting

### Puerto 8000 ocupado

```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "8001:8000"  # Usar 8001 en lugar de 8000
```

### Error de conexión a base de datos

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps

# Ver logs de base de datos
docker-compose logs db
```

### Modelos no cargan

```bash
# Verificar que el directorio models/ existe
ls -la models/

# Verificar permisos
chmod -R 755 models/
```

## 📞 Soporte

Para preguntas o problemas:
1. Revisar logs: `docker-compose logs ai-service`
2. Verificar health: `curl http://localhost:8000/health`
3. Revisar documentación: http://localhost:8000/docs
4. Contactar al equipo de desarrollo

---

**¡El servicio está listo para desarrollo! 🚀**

Siguiente paso: Integrar modelos ML reales según las necesidades del negocio.

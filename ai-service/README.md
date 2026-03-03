# DaCodes AI Service

Servicio de IA desacoplado para el sistema de inventario DaCodes. Proporciona 8 funcionalidades de IA/ML a través de una API REST.

## 🎯 Funcionalidades

1. **Demand Forecasting** - Predicción de demanda futura
2. **Smart Reorder** - Cálculo de puntos de reorden óptimos
3. **Supplier Scoring** - Evaluación de desempeño de proveedores
4. **Anomaly Detection** - Detección de anomalías en movimientos
5. **Product Categorization** - Categorización automática con NLP/Vision
6. **Visual Counting** - Conteo visual con computer vision
7. **Natural Language Queries** - Consultas en lenguaje natural
8. **Waste Prediction** - Predicción de desperdicio

## 🏗️ Arquitectura

```
ai-service/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── core/
│   │   ├── config.py          # Configuration
│   │   ├── logging.py         # Logging setup
│   │   └── exceptions.py      # Custom exceptions
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py    # API router
│   │   │   └── endpoints/     # Endpoint modules
│   │   └── dependencies.py    # FastAPI dependencies
│   ├── schemas/               # Pydantic models
│   │   ├── forecast.py
│   │   ├── reorder.py
│   │   ├── suppliers.py
│   │   ├── anomalies.py
│   │   ├── categorization.py
│   │   ├── visual.py
│   │   ├── nlq.py
│   │   └── waste.py
│   └── services/              # Business logic
│       ├── forecast_service.py
│       ├── reorder_service.py
│       ├── supplier_service.py
│       ├── anomaly_service.py
│       ├── categorization_service.py
│       ├── visual_service.py
│       ├── nlq_service.py
│       └── waste_service.py
├── models/                    # ML model files
├── tests/                     # Test files
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Desarrollo Local

1. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Ejecutar servidor:**
```bash
uvicorn app.main:app --reload --port 8000
```

4. **Acceder a la documentación:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Docker

```bash
# Construir y ejecutar
docker-compose up --build

# Solo ejecutar
docker-compose up

# Detener
docker-compose down
```

## 📡 API Endpoints

### Health & Status
- `GET /health` - Health check
- `GET /ai/v1/health` - Detailed health
- `GET /ai/v1/models/status` - ML models status
- `POST /ai/v1/models/reload` - Reload models

### Demand Forecasting
- `POST /ai/v1/forecast/demand` - Generate forecast
- `POST /ai/v1/forecast/batch` - Batch forecasting

### Smart Reorder
- `POST /ai/v1/reorder/calculate` - Calculate reorder points
- `POST /ai/v1/reorder/batch` - Batch calculation

### Supplier Scoring
- `POST /ai/v1/suppliers/score` - Score supplier
- `GET /ai/v1/suppliers/{id}/score` - Get score

### Anomaly Detection
- `POST /ai/v1/anomalies/detect` - Detect anomalies
- `GET /ai/v1/anomalies/recent` - Recent anomalies

### Product Categorization
- `POST /ai/v1/products/categorize` - Categorize product
- `POST /ai/v1/products/categorize-batch` - Batch categorization

### Visual Counting
- `POST /ai/v1/visual/count` - Count items in image
- `POST /ai/v1/visual/verify` - Verify count
- `POST /ai/v1/visual/quality` - Assess image quality

### Natural Language Queries
- `POST /ai/v1/nlq/query` - Process NL query
- `POST /ai/v1/nlq/parse` - Parse intent only

### Waste Prediction
- `POST /ai/v1/waste/predict` - Predict waste
- `GET /ai/v1/waste/at-risk` - Get at-risk products

## 🔧 Configuración

### Variables de Entorno

Ver `.env.example` para todas las variables disponibles.

Principales:
- `ENVIRONMENT` - development, staging, production
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `MODEL_PATH` - Path to ML models
- `LOG_LEVEL` - INFO, DEBUG, WARNING, ERROR

### Modelos ML

Los modelos se almacenan en:
- Local: `./models/`
- Producción: S3 bucket configurado en `S3_BUCKET`

Estructura:
```
models/
├── forecasting/
│   └── v1.0/
│       ├── model.pkl
│       └── metadata.json
├── anomaly_detection/
├── visual_counting/
└── nlp_categorization/
```

## 🧪 Testing

```bash
# Ejecutar tests
pytest

# Con coverage
pytest --cov=app tests/

# Tests específicos
pytest tests/test_forecast.py
```

## 📊 Monitoreo

### Logs

Logs en formato JSON para producción:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "Forecasting demand for product abc-123",
  "product_id": "abc-123"
}
```

### Métricas

- Request latency (p50, p95, p99)
- Error rate por endpoint
- Model inference time
- Cache hit rate

## 🔐 Seguridad

- API Key authentication en header `X-API-Key`
- Rate limiting (configurar en API Gateway)
- Input validation con Pydantic
- SQL injection prevention
- TLS encryption en producción

## 🚢 Deployment

### Producción

1. **Build Docker image:**
```bash
docker build -t dacodes-ai-service:latest .
```

2. **Push to registry:**
```bash
docker tag dacodes-ai-service:latest registry.example.com/dacodes-ai-service:latest
docker push registry.example.com/dacodes-ai-service:latest
```

3. **Deploy:**
```bash
# Kubernetes, ECS, o tu plataforma preferida
kubectl apply -f k8s/deployment.yaml
```

### Variables de Entorno Requeridas

Producción requiere:
- `DATABASE_URL`
- `REDIS_URL`
- `API_KEY`
- `S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## 📝 Integración de Modelos ML Reales

### Paso 1: Entrenar Modelo

```python
# train_model.py
import joblib
from sklearn.ensemble import RandomForestRegressor

# Train your model
model = RandomForestRegressor()
model.fit(X_train, y_train)

# Save model
joblib.dump(model, 'models/forecasting/v1.0/model.pkl')
```

### Paso 2: Actualizar Servicio

```python
# app/services/forecast_service.py
import joblib

class ForecastService:
    def __init__(self):
        self.model = joblib.load('models/forecasting/v1.0/model.pkl')
    
    async def forecast_demand(self, request):
        # Use real model
        features = self._prepare_features(request)
        prediction = self.model.predict(features)
        return prediction
```

### Paso 3: Actualizar Tests

```python
# tests/test_forecast.py
def test_forecast_accuracy():
    service = ForecastService()
    result = service.forecast_demand(test_data)
    assert result.model_accuracy > 0.8
```

## 🤝 Contribución

1. Fork el repositorio
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Add nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Propietario - DaCodes

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo.

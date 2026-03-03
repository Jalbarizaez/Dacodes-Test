# Ejemplos de Integración - AI Service

## 🔗 Integración con Backend Node.js

### 1. Configurar Cliente AI

```typescript
// backend/src/services/ai-client.service.ts
import axios from 'axios';

const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.AI_SERVICE_API_KEY
  }
});

export const aiService = {
  async forecastDemand(productId: string, days: number = 30) {
    const response = await aiClient.post('/ai/v1/forecast/demand', {
      product_id: productId,
      forecast_horizon_days: days,
      include_seasonality: true,
      include_trends: true
    });
    return response.data;
  },
  
  async calculateReorder(productId: string, currentStock: number, leadTime: number) {
    const response = await aiClient.post('/ai/v1/reorder/calculate', {
      product_id: productId,
      current_stock: currentStock,
      lead_time_days: leadTime,
      target_service_level: 0.95
    });
    return response.data;
  },
  
  async scoreSupplier(supplierId: string) {
    const response = await aiClient.post('/ai/v1/suppliers/score', {
      supplier_id: supplierId,
      evaluation_period_days: 90
    });
    return response.data;
  }
};
```

### 2. Usar en Controladores

```typescript
// backend/src/modules/products/product.controller.ts
import { aiService } from '../../services/ai-client.service';

export class ProductController {
  async getForecast(req: Request, res: Response) {
    const { productId } = req.params;
    
    try {
      const forecast = await aiService.forecastDemand(productId, 30);
      
      // Guardar en base de datos
      await prisma.demandForecast.create({
        data: {
          productId,
          forecastDate: new Date(),
          forecastData: forecast,
          modelVersion: forecast.model_version
        }
      });
      
      res.json(forecast);
    } catch (error) {
      res.status(500).json({ error: 'Forecast failed' });
    }
  }
}
```

## 📱 Integración con App Móvil

### React Native - Visual Counting

```typescript
// mobile/src/services/aiService.ts
import axios from 'axios';

const AI_SERVICE_URL = 'http://your-server:8000';

export const visualCountingService = {
  async countItems(imageUrl: string, locationId: string, productId?: string) {
    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/ai/v1/visual/count`,
        {
          image_url: imageUrl,
          location_id: locationId,
          expected_product_id: productId
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Visual counting error:', error);
      throw error;
    }
  },
  
  async assessImageQuality(imageUrl: string) {
    const response = await axios.post(
      `${AI_SERVICE_URL}/ai/v1/visual/quality`,
      { image_url: imageUrl }
    );
    
    return response.data;
  }
};

// mobile/src/screens/VisualCountingScreen.tsx
import { visualCountingService } from '../services/aiService';

export const VisualCountingScreen = () => {
  const [counting, setCounting] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleCapture = async (imageUri: string) => {
    setCounting(true);
    
    try {
      // 1. Upload image to S3
      const imageUrl = await uploadToS3(imageUri);
      
      // 2. Assess quality
      const quality = await visualCountingService.assessImageQuality(imageUrl);
      
      if (quality.quality_score < 0.3) {
        Alert.alert('Baja calidad', 'Por favor retoma la foto');
        return;
      }
      
      // 3. Count items
      const countResult = await visualCountingService.countItems(
        imageUrl,
        locationId,
        expectedProductId
      );
      
      setResult(countResult);
      
      // 4. Show results
      navigation.navigate('CountResult', { result: countResult });
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la imagen');
    } finally {
      setCounting(false);
    }
  };
  
  return (
    <View>
      <Camera onCapture={handleCapture} />
      {counting && <ActivityIndicator />}
    </View>
  );
};
```

## 🌐 Integración con Frontend Web

### React - Dashboard con Predicciones

```typescript
// frontend/src/hooks/useAIForecast.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useAIForecast = (productId: string) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        // Call through backend API (not directly to AI service)
        const response = await axios.get(
          `/api/v1/products/${productId}/forecast`
        );
        setForecast(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchForecast();
  }, [productId]);
  
  return { forecast, loading, error };
};

// frontend/src/components/ForecastChart.tsx
import { useAIForecast } from '../hooks/useAIForecast';
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const ForecastChart = ({ productId }) => {
  const { forecast, loading, error } = useAIForecast(productId);
  
  if (loading) return <Spinner />;
  if (error) return <Alert>Error: {error}</Alert>;
  
  const data = forecast.forecasts.map(f => ({
    date: f.date,
    predicted: f.predicted_demand,
    lower: f.confidence_lower,
    upper: f.confidence_upper
  }));
  
  return (
    <div>
      <h3>Predicción de Demanda - {forecast.trend_direction}</h3>
      <LineChart width={600} height={300} data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="predicted" stroke="#8884d8" />
        <Line type="monotone" dataKey="lower" stroke="#82ca9d" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="upper" stroke="#82ca9d" strokeDasharray="5 5" />
      </LineChart>
      {forecast.seasonality_detected && (
        <Badge>Estacionalidad detectada</Badge>
      )}
    </div>
  );
};
```

### Natural Language Search

```typescript
// frontend/src/components/NLSearch.tsx
import { useState } from 'react';
import axios from 'axios';

export const NLSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post('/api/v1/nlq/query', {
        query,
        user_id: currentUser.id
      });
      
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ej: ¿Cuántas unidades tengo del producto X?"
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
      
      {results && (
        <div>
          <p><strong>Interpretación:</strong> {results.intent}</p>
          <p><strong>Respuesta:</strong> {results.natural_language_response}</p>
          <p><strong>Confianza:</strong> {(results.confidence * 100).toFixed(0)}%</p>
          
          {results.results.length > 0 && (
            <table>
              <thead>
                <tr>
                  {Object.keys(results.results[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.results.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
```

## 🔄 Scheduled Jobs Integration

### Backend - Cron Jobs

```typescript
// backend/src/jobs/ai-forecast-update.job.ts
import Bull from 'bull';
import { aiService } from '../services/ai-client.service';
import { prisma } from '../config/database';

const forecastQueue = new Bull('forecast-updates', {
  redis: process.env.REDIS_URL
});

// Schedule monthly forecast update
forecastQueue.add('monthly-forecast', {}, {
  repeat: { cron: '0 2 1 * *' } // 1st day of month, 2 AM
});

forecastQueue.process('monthly-forecast', async (job) => {
  const products = await prisma.product.findMany({
    where: { isActive: true }
  });
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const product of products) {
    try {
      // Call AI service
      const forecast = await aiService.forecastDemand(product.id, 30);
      
      // Store in database
      await prisma.demandForecast.create({
        data: {
          productId: product.id,
          forecastDate: new Date(),
          forecastData: forecast,
          modelVersion: forecast.model_version
        }
      });
      
      successCount++;
    } catch (error) {
      console.error(`Forecast failed for ${product.id}:`, error);
      failureCount++;
    }
  }
  
  return {
    totalProducts: products.length,
    successCount,
    failureCount,
    completedAt: new Date()
  };
});
```

## 🧪 Testing Integration

### Backend Tests

```typescript
// backend/src/tests/ai-integration.test.ts
import { aiService } from '../services/ai-client.service';

describe('AI Service Integration', () => {
  it('should forecast demand', async () => {
    const forecast = await aiService.forecastDemand('test-product', 30);
    
    expect(forecast).toHaveProperty('product_id');
    expect(forecast).toHaveProperty('forecasts');
    expect(forecast.forecasts).toHaveLength(30);
    expect(forecast.model_version).toBeDefined();
  });
  
  it('should calculate reorder points', async () => {
    const reorder = await aiService.calculateReorder('test-product', 50, 7);
    
    expect(reorder).toHaveProperty('reorder_point');
    expect(reorder).toHaveProperty('safety_stock');
    expect(reorder.reorder_point).toBeGreaterThan(0);
  });
  
  it('should handle AI service errors gracefully', async () => {
    // Mock AI service failure
    jest.spyOn(aiService, 'forecastDemand').mockRejectedValue(
      new Error('AI service unavailable')
    );
    
    // Should use fallback
    const forecast = await productService.getForecastWithFallback('test-product');
    
    expect(forecast.is_fallback).toBe(true);
  });
});
```

## 📊 Monitoring Integration

### Prometheus Metrics

```python
# ai-service/app/middleware/metrics.py
from prometheus_client import Counter, Histogram
import time

# Metrics
request_count = Counter('ai_requests_total', 'Total AI requests', ['endpoint', 'status'])
request_duration = Histogram('ai_request_duration_seconds', 'Request duration', ['endpoint'])

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    endpoint = request.url.path
    status = response.status_code
    
    request_count.labels(endpoint=endpoint, status=status).inc()
    request_duration.labels(endpoint=endpoint).observe(duration)
    
    return response
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "AI Service Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(ai_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, ai_request_duration_seconds)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(ai_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

## 🔐 Security Best Practices

### API Key Authentication

```typescript
// backend/src/middleware/ai-auth.middleware.ts
export const aiAuthMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.AI_SERVICE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Apply to AI routes
app.use('/api/v1/ai', aiAuthMiddleware, aiRoutes);
```

### Rate Limiting

```typescript
// backend/src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many AI requests, please try again later'
});

app.use('/api/v1/ai', aiRateLimiter);
```

---

**Estos ejemplos muestran cómo integrar el AI Service en todos los componentes del sistema DaCodes Inventory.**

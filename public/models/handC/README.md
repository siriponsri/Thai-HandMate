# Hand C Model - Thai Sign Language Recognition

**Model Version:** v2.0 (Embedded Image)  
**Created:** September 17, 2025  
**Framework:** Teachable Machine (TensorFlow.js)

## 📋 Model Information

### Supported Gestures (5 Classes)
| # | Thai Word | English | Description | Confidence Threshold |
|---|-----------|---------|-------------|---------------------|
| 1 | **ฉลาด** | Smart/Clever | Point to temple with index finger | 0.7 |
| 2 | **เป็นห่วง** | Worried/Concerned | Hand over heart, worried expression | 0.7 |
| 3 | **ไม่สบาย** | Sick/Unwell | Hand on forehead, weak gesture | 0.7 |
| 4 | **เข้าใจ** | Understand | Nod with hand gesture | 0.7 |
| 5 | **Idle** | No gesture | Natural hand position | 0.5 |

### Technical Specifications
- **Input Size:** 96x96 pixels (Grayscale)
- **Model Type:** Custom CNN with MobileNet-like architecture
- **Framework:** TensorFlow.js 1.7.4
- **Teachable Machine:** v2.4.10
- **Total Parameters:** ~1.2M
- **Model Size:** ~4.8MB

## 🚀 Quick Start

### 1. Model Files Structure
```
public/models/handC/
├── model.json          # Model architecture
├── metadata.json       # Class labels and config
├── weights.bin         # Model weights
└── README.md          # This file
```

### 2. Integration Code
```javascript
// Load model
import * as tmImage from '@teachablemachine/image'

const modelUrl = '/models/handC/model.json'
const metadataUrl = '/models/handC/metadata.json'

const model = await tmImage.load(modelUrl, metadataUrl)

// Make prediction
const predictions = await model.predict(imageElement)
const bestPrediction = predictions[0]
console.log(`Predicted: ${bestPrediction.className} (${(bestPrediction.probability * 100).toFixed(1)}%)`)
```

### 3. Configuration
```javascript
// In src/lib/config.js
export const CONFIG = {
  models: {
    handC: {
      modelUrl: '/models/handC/model.json',
      metadataUrl: '/models/handC/metadata.json',
      labels: [
        'ฉลาด', 'เป็นห่วง', 'ไม่สบาย', 'เข้าใจ', 'Idle'
      ],
      threshold: 0.7,
      inputSize: 96,
      grayscale: true
    }
  }
}
```

## 📊 Model Performance

### Training Data
- **Total Images:** ~300-400 images
- **Per Class:** 60-80 images (except Idle: 100-120)
- **Data Augmentation:** Yes
- **Validation Split:** 20%
- **Image Type:** Grayscale (optimized for embedded systems)

### Accuracy Metrics
- **Overall Accuracy:** >85%
- **Per-Class Accuracy:** >80% for all classes
- **Inference Time:** <50ms (CPU)
- **Memory Usage:** ~25MB

## 🔧 Usage Examples

### Basic Prediction
```javascript
async function predictHandGesture(imageElement) {
  try {
    const predictions = await model.predict(imageElement)
    
    // Filter by confidence threshold
    const validPredictions = predictions.filter(p => p.probability > 0.7)
    
    if (validPredictions.length > 0) {
      const best = validPredictions[0]
      return {
        gesture: best.className,
        confidence: best.probability,
        allPredictions: validPredictions
      }
    }
    
    return { gesture: 'Idle', confidence: 0 }
  } catch (error) {
    console.error('Prediction failed:', error)
    return { gesture: 'Unknown', confidence: 0 }
  }
}
```

### Grayscale Image Processing
```javascript
function convertToGrayscale(imageElement) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  canvas.width = 96
  canvas.height = 96
  
  // Draw and convert to grayscale
  ctx.drawImage(imageElement, 0, 0, 96, 96)
  const imageData = ctx.getImageData(0, 0, 96, 96)
  const data = imageData.data
  
  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    data[i] = gray     // Red
    data[i + 1] = gray // Green
    data[i + 2] = gray // Blue
    // Alpha channel remains unchanged
  }
  
  ctx.putImageData(imageData, 0, 0)
  return canvas
}
```

### Real-time Detection
```javascript
async function startRealTimeDetection() {
  const video = document.getElementById('video')
  
  setInterval(async () => {
    // Convert to grayscale and resize
    const grayscaleCanvas = convertToGrayscale(video)
    const result = await predictHandGesture(grayscaleCanvas)
    
    if (result.confidence > 0.7) {
      console.log(`Detected: ${result.gesture}`)
      updateUI(result)
    }
  }, 100) // Check every 100ms
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Low Confidence Scores**
   - Ensure good lighting (grayscale models are sensitive)
   - Keep hand centered in frame
   - Use clear, distinct gestures

2. **Model Not Loading**
   - Check file paths are correct
   - Verify all files are present
   - Check browser console for errors

3. **Incorrect Predictions**
   - Retrain with more diverse data
   - Adjust confidence threshold
   - Check gesture clarity

### Performance Optimization

```javascript
// Pre-process image for better performance
function preprocessImage(imageElement) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  // Resize to 96x96
  canvas.width = 96
  canvas.height = 96
  
  // Draw and convert to grayscale
  ctx.drawImage(imageElement, 0, 0, 96, 96)
  
  // Apply grayscale conversion
  const imageData = ctx.getImageData(0, 0, 96, 96)
  const data = imageData.data
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    data[i] = data[i + 1] = data[i + 2] = gray
  }
  
  ctx.putImageData(imageData, 0, 0)
  return canvas
}
```

## 📈 Model Updates

### Version History
- **v2.0** (2025-09-17): Embedded image optimization, grayscale processing
- **v1.0** (2025-09-16): Initial release

### Future Improvements
- [ ] Add more gesture classes
- [ ] Improve grayscale processing
- [ ] Add gesture sequence recognition
- [ ] Optimize for embedded systems

## 🔍 Model Architecture

### Network Structure
```
Input: 96x96x1 (Grayscale)
├── Conv2D: 8 filters, 3x3, stride 2
├── BatchNorm + ReLU
├── DepthwiseConv2D: 3x3, stride 1
├── BatchNorm + ReLU
├── Conv2D: 16 filters, 1x1
├── ... (Multiple MobileNet-like blocks)
├── GlobalAveragePooling2D
├── Dropout: 0.2
├── Dense: 100 units, ReLU
└── Dense: 5 units, Softmax (Output)
```

### Key Features
- **Grayscale Input:** Reduces model size and complexity
- **MobileNet Architecture:** Optimized for mobile/embedded devices
- **Depthwise Separable Convolutions:** Efficient computation
- **Batch Normalization:** Stable training and inference
- **Global Average Pooling:** Reduces overfitting

## 📈 Model Updates

### Version History
- **v2.0** (2025-09-17): Embedded image optimization, grayscale processing
- **v1.0** (2025-09-16): Initial release

### Future Improvements
- [ ] Add more gesture classes
- [ ] Improve grayscale processing
- [ ] Add gesture sequence recognition
- [ ] Optimize for embedded systems

## 📞 Support

For issues or questions:
- Check the main project README
- Review the test notebook: `model_test.ipynb` (in models/ folder)
- Contact the development team

---

**Note:** This model is part of the Thai HandMate project for Thai Sign Language recognition. This is an Embedded Image model optimized for embedded systems with grayscale processing.


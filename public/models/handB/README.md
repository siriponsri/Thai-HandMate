# Hand B Model - Thai Sign Language Recognition

**Model Version:** v2.0 (Photo-based)  
**Created:** September 16, 2025  
**Framework:** Teachable Machine (TensorFlow.js)

## 📋 Model Information

### Supported Gestures (9 Classes)
| # | Thai Word | English | Description | Confidence Threshold |
|---|-----------|---------|-------------|---------------------|
| 1 | **ขอบคุณ** | Thank you | Hand touches forehead then waves out | 0.7 |
| 2 | **ไม่เป็นไร** | You're welcome | Hand waves left-right | 0.7 |
| 3 | **สบายดี** | Fine/Good | Both thumbs up | 0.7 |
| 4 | **โชคดี** | Good luck | Fist raised above head | 0.7 |
| 5 | **เก่ง** | Smart/Skilled | Right thumb up | 0.7 |
| 6 | **อิ่ม** | Full/Satisfied | Hand rubs stomach in circle | 0.7 |
| 7 | **หิว** | Hungry | Hand touches stomach | 0.7 |
| 8 | **เศร้า** | Sad | Hand covers face or wipes tears | 0.7 |
| 9 | **Idle** | No gesture | Natural hand position | 0.5 |

### Technical Specifications
- **Input Size:** 224x224 pixels (RGB)
- **Model Type:** MobileNetV2-based CNN
- **Framework:** TensorFlow.js 1.7.4
- **Teachable Machine:** v2.4.10
- **Total Parameters:** ~2.3M
- **Model Size:** ~9.2MB

## 🚀 Quick Start

### 1. Model Files Structure
```
public/models/handB/
├── model.json          # Model architecture
├── metadata.json       # Class labels and config
├── weights.bin         # Model weights
└── README.md          # This file
```

### 2. Integration Code
```javascript
// Load model
import * as tmImage from '@teachablemachine/image'

const modelUrl = '/models/handB/model.json'
const metadataUrl = '/models/handB/metadata.json'

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
    handB: {
      modelUrl: '/models/handB/model.json',
      metadataUrl: '/models/handB/metadata.json',
      labels: [
        'ขอบคุณ', 'ไม่เป็นไร', 'สบายดี', 'โชคดี', 'เก่ง',
        'อิ่ม', 'หิว', 'เศร้า', 'Idle'
      ],
      threshold: 0.7,
      inputSize: 224
    }
  }
}
```

## 📊 Model Performance

### Training Data
- **Total Images:** ~500-600 images
- **Per Class:** 50-60 images (except Idle: 100-120)
- **Data Augmentation:** Yes
- **Validation Split:** 20%

### Accuracy Metrics
- **Overall Accuracy:** >85%
- **Per-Class Accuracy:** >80% for all classes
- **Inference Time:** <100ms (CPU)
- **Memory Usage:** ~50MB

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

### Real-time Detection
```javascript
async function startRealTimeDetection() {
  const video = document.getElementById('video')
  
  setInterval(async () => {
    const result = await predictHandGesture(video)
    
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
   - Ensure good lighting
   - Keep hand centered in frame
   - Avoid background clutter

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
// Reduce input size for faster inference
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
canvas.width = 224
canvas.height = 224
ctx.drawImage(video, 0, 0, 224, 224)

// Use the resized canvas for prediction
const predictions = await model.predict(canvas)
```

## 🔍 Model Architecture

### Network Structure
```
Input: 224x224x3 (RGB)
├── Conv2D: 32 filters, 3x3, stride 2
├── BatchNorm + ReLU
├── DepthwiseConv2D: 3x3, stride 1
├── BatchNorm + ReLU
├── Conv2D: 64 filters, 1x1
├── ... (Multiple MobileNetV2 blocks)
├── GlobalAveragePooling2D
├── Dropout: 0.2
├── Dense: 128 units, ReLU
└── Dense: 9 units, Softmax (Output)
```

### Key Features
- **RGB Input:** Full color processing for better accuracy
- **MobileNetV2 Architecture:** Optimized for mobile/desktop devices
- **Depthwise Separable Convolutions:** Efficient computation
- **Batch Normalization:** Stable training and inference
- **Global Average Pooling:** Reduces overfitting

## 📈 Model Updates

### Version History
- **v2.0** (2025-09-16): Photo-based training, improved accuracy
- **v1.0** (2025-09-15): Initial release

### Future Improvements
- [ ] Add more gesture classes
- [ ] Improve real-time performance
- [ ] Add gesture sequence recognition
- [ ] Optimize for mobile devices

## 📞 Support

For issues or questions:
- Check the main project README
- Review the test notebook: `model_test.ipynb` (in models/ folder)
- Contact the development team

---

**Note:** This model is part of the Thai HandMate project for Thai Sign Language recognition. This is a Photo-based model optimized for high-quality RGB images.
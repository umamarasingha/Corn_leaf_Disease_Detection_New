# Model Setup Guide

## Current Status

Your trained model (`trained_model.h5`) has been copied to `backend/models/`. However, TensorFlow.js in Node.js cannot directly load `.h5` files - it needs TensorFlow.js format (model.json + weight files).

## What's Working

- Backend server is running on port 8000
- AI service is initialized and ready
- Mock predictions are working as fallback
- Disease information for "maize fall armyworm" has been added

## What Needs to Be Done

### ⚡ FASTEST METHOD: Web Conversion Tool (Recommended)

This is the fastest method - no installation required, works instantly!

1. **Go to the web converter:** https://www.tensorflow.org/js/tutorials/conversion
2. **Click "Upload Model"** and select your `trained_model.h5` file
3. **Click "Convert"** - this takes about 30 seconds
4. **Download the converted files** - you'll get:
   - `model.json`
   - `group1-shard1of1.bin` (or similar weight files)
5. **Place the files in `backend/models/`**:
   - Replace the existing `model.json`
   - Replace the existing `group1-shard1of1.bin`

That's it! Your model is now ready to use.

### Alternative Methods (Only if web tool doesn't work)

#### Method 2: Python Command Line (Requires tensorflowjs - SLOW)

```bash
cd backend
pip install tensorflowjs  # This takes ~1 hour to install
python -c "import tensorflowjs as tfjs; tfjs.converters.save_keras_model('trained_model.h5', 'models/')"
```

#### Method 3: Command Line Tool (Requires Node.js)

```bash
cd backend
npx @tensorflow/tfjs-converter --input_format keras trained_model.h5 models/
```

## After Conversion

Once you have the converted model files:

1. Replace the placeholder files in `backend/models/`:
   - Replace `model.json` with your converted model.json
   - Replace `group1-shard1of1.bin` with your weight files

2. Restart the backend server

3. The AI service will automatically load your model

## Testing

After conversion, test the model integration:

1. Start the backend: `npm run dev` (in backend directory)
2. Upload an image via the frontend
3. Check the backend console for: "AI model loaded successfully"
4. Verify predictions are using your trained model

## Troubleshooting

### Model Not Loading

If you see "Failed to load AI model, using fallback":

1. Check that `backend/models/model.json` exists
2. Check that weight files are present
3. Check backend console for specific error messages

### Conversion Errors

If conversion fails:

1. Make sure you have Python 3.8+
2. Install tensorflowjs: `pip install tensorflowjs`
3. Verify your .h5 file is not corrupted

## Current Fallback Behavior

Until the model is converted:
- The AI service will use mock predictions
- Disease detection will still work but with random results
- All other features (community, chatbot, etc.) work normally

## Disease Classes

Your trained model should predict these classes:
- maize fall armyworm
- Northern Leaf Blight
- Gray Leaf Spot
- Common Rust
- Healthy

Ensure your model outputs match these classes for proper integration.

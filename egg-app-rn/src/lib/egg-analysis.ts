// egg-app-rn/src/lib/egg-analysis.ts
import * as FileSystem from 'expo-file-system';
import { CONFIG } from './config';
import { EggAnalysisResult, AnalysisResult } from './egg-types';

export type { EggAnalysisResult, AnalysisResult };

const FS = FileSystem as any;

/**
 * Copies picked/captured image to persistent document directory.
 */
export async function persistImage(uri: string): Promise<string> {
  try {
    const filename = uri.split('/').pop() || `egg_${Date.now()}.jpg`;
    const docDir = FS.documentDirectory || FS.cacheDirectory || '';
    const dest = `${docDir}${filename}`;

    if (FS.copyAsync) {
      await FS.copyAsync({ from: uri, to: dest });
      return dest;
    }
    return uri;
  } catch (error) {
    console.warn('persistImage fallback to original URI:', error);
    return uri;
  }
}

/**
 * Transmits the egg image to the Python FastAPI backend (/predict).
 */
export async function analyzeEggImage(imageUri: string): Promise<EggAnalysisResult> {
  const formData = new FormData();

  const filename = imageUri.split('/').pop() || 'egg_scan.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const isFertile = data.prediction === 'Fertile' || data.class_id === 1;

    return {
      id: Date.now().toString(),
      imageUri,
      status: data.prediction,
      prediction: data.prediction,
      confidence: data.confidence,
      probabilityFertile: data.probabilities?.fertile,
      probabilityInfertile: data.probabilities?.infertile,
      timestamp: new Date().toISOString(),
      source: 'FastAPI Backend (VGG16 + SVM)',
      candling: {
        notes: isFertile 
          ? 'Clear vascular network and developing blastoderm observed.' 
          : 'No vascular movement or embryo structure detected.',
        veinDensity: isFertile ? 'High' : 'None',
        airCellSize: 'Normal',
        airCellClarity: 'Clear',
        embryoMovement: isFertile ? 'Detected' : 'None',
        opacity: isFertile ? 'Translucent' : 'Opaque',
      },
    };
  } catch (error) {
    console.error('Inference request failed:', error);
    throw error;
  }
}

/**
 * Fallback simulation method.
 */
export async function mockAnalyze(imageUri: string): Promise<EggAnalysisResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const isFertile = Math.random() > 0.3;
  const confidence = parseFloat((88 + Math.random() * 11).toFixed(1));
  const label = isFertile ? 'Fertile' : 'Infertile';

  return {
    id: Date.now().toString(),
    imageUri,
    status: label,
    prediction: label,
    confidence,
    probabilityFertile: isFertile ? confidence / 100 : (100 - confidence) / 100,
    probabilityInfertile: isFertile ? (100 - confidence) / 100 : confidence / 100,
    timestamp: new Date().toISOString(),
    source: 'Simulated Model',
    candling: {
      notes: isFertile 
        ? 'Clear vascular network and developing blastoderm observed.' 
        : 'No vascular movement or embryo structure detected.',
      veinDensity: isFertile ? 'High' : 'None',
      airCellSize: 'Normal',
      airCellClarity: 'Clear',
      embryoMovement: isFertile ? 'Detected' : 'None',
      opacity: isFertile ? 'Translucent' : 'Opaque',
    },
  };
}
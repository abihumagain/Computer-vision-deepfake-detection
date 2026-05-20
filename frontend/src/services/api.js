import axios from 'axios'

const BASE_URL = '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
})

/**
 * Run deepfake detection on a video file.
 * @param {File} videoFile
 * @param {string} modelName  'baseline' | 'improved' | 'resnet18'
 * @param {function} onUploadProgress  (progressEvent) => void
 */
export async function detectDeepfake(videoFile, modelName, onUploadProgress) {
  const formData = new FormData()
  formData.append('video', videoFile)
  formData.append('model_name', modelName)

  const response = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
  return response.data
}

/**
 * Fetch evaluation metrics for all models.
 */
export async function fetchMetrics() {
  const response = await api.get('/metrics')
  return response.data
}

/**
 * Health check.
 */
export async function healthCheck() {
  const response = await api.get('/health')
  return response.data
}

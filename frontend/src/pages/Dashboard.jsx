import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  LinearProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import ShieldIcon from '@mui/icons-material/Shield'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import CircleIcon from '@mui/icons-material/Circle'
import { useSnackbar } from 'notistack'

import VideoUploader from '../components/VideoUploader'
import ResultCard from '../components/ResultCard'
import MetricsPanel from '../components/MetricsPanel'
import FrameGallery from '../components/FrameGallery'
import ConfidenceChart from '../components/ConfidenceChart'
import { detectDeepfake, fetchMetrics, healthCheck } from '../services/api'

const MODELS = [
  { value: 'baseline', label: 'Baseline CNN', desc: '128×128 · Fast' },
  { value: 'improved', label: 'Improved CNN', desc: '128×128 · Better accuracy' },
  { value: 'resnet18', label: 'ResNet-18', desc: '224×224 · Best accuracy' },
]

const glassCard = {
  background: 'rgba(15,22,41,0.75)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(99,102,241,0.18)',
  borderRadius: 3,
  p: 3,
}

export default function Dashboard() {
  const { enqueueSnackbar } = useSnackbar()
  const [videoFile, setVideoFile] = useState(null)
  const [selectedModel, setSelectedModel] = useState('resnet18')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [inferenceProgress, setInferenceProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [backendStatus, setBackendStatus] = useState('unknown') // 'ok' | 'error' | 'unknown'

  // Load metrics & check health on mount
  useEffect(() => {
    healthCheck()
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('error'))

    fetchMetrics()
      .then((data) => setMetrics(data.models))
      .catch(() => enqueueSnackbar('Could not load model metrics', { variant: 'warning' }))
  }, [])

  const handleDetect = useCallback(async () => {
    if (!videoFile) {
      enqueueSnackbar('Please upload a video first.', { variant: 'warning' })
      return
    }
    setIsLoading(true)
    setResult(null)
    setUploadProgress(0)
    setInferenceProgress(0)

    // Fake inference progress ticker
    const ticker = setInterval(() => {
      setInferenceProgress((p) => Math.min(p + Math.random() * 8, 90))
    }, 400)

    try {
      const data = await detectDeepfake(videoFile, selectedModel, (evt) => {
        if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100))
      })
      setInferenceProgress(100)
      setResult(data)
      enqueueSnackbar(
        `Detection complete — ${data.prediction} (${(data.confidence * 100).toFixed(1)}% confidence)`,
        { variant: data.prediction === 'FAKE' ? 'error' : 'success' }
      )
    } catch (err) {
      const msg =
        err?.response?.data?.detail || err.message || 'Detection failed. Is the backend running?'
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      clearInterval(ticker)
      setIsLoading(false)
      setUploadProgress(null)
    }
  }, [videoFile, selectedModel, enqueueSnackbar])

  const handleReset = () => {
    setVideoFile(null)
    setResult(null)
    setUploadProgress(null)
    setInferenceProgress(0)
  }

  const handleDownloadReport = () => {
    if (!result) return
    const report = {
      generated_at: new Date().toISOString(),
      file_name: videoFile?.name,
      model_used: result.model_used,
      prediction: result.prediction,
      confidence: result.confidence,
      avg_fake_probability: result.avg_fake_probability,
      frames_analyzed: result.frames_analyzed,
      processing_time_seconds: result.processing_time,
      frame_results: result.frame_results,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deepfake_report_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    enqueueSnackbar('Report downloaded.', { variant: 'info' })
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0e1a 0%,#0f1629 50%,#0a1628 100%)' }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid rgba(99,102,241,0.15)',
          background: 'rgba(10,14,26,0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ShieldIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, letterSpacing: 0.5 }}>
              DeepShield
            </Typography>
            <Typography variant="caption" color="text.secondary">
              AI-Powered Deepfake Detection
            </Typography>
          </Box>

          {/* Backend status indicator */}
          <Tooltip title={`Backend: ${backendStatus}`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <CircleIcon
                sx={{
                  fontSize: 10,
                  color: backendStatus === 'ok' ? '#10b981' : backendStatus === 'error' ? '#ef4444' : '#f59e0b',
                  animation: backendStatus === 'ok' ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%,100%': { opacity: 1 },
                    '50%': { opacity: 0.4 },
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {backendStatus}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Reset">
            <IconButton size="small" onClick={handleReset} sx={{ color: 'text.secondary' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        {/* Inference progress banner */}
        {isLoading && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                Running inference…
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {Math.round(inferenceProgress)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={inferenceProgress}
              sx={{ borderRadius: 1, height: 4 }}
            />
          </Box>
        )}

        <Grid container spacing={3}>
          {/* ── LEFT COLUMN ── */}
          <Grid item xs={12} md={5}>
            <Paper sx={glassCard}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Upload Video
              </Typography>
              <VideoUploader
                file={videoFile}
                onFileSelect={setVideoFile}
                uploadProgress={uploadProgress}
                disabled={isLoading}
              />

              <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.06)' }} />

              <FormControl fullWidth size="small" disabled={isLoading}>
                <InputLabel>Detection Model</InputLabel>
                <Select
                  value={selectedModel}
                  label="Detection Model"
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {MODELS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{m.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{m.desc}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={handleDetect}
                disabled={!videoFile || isLoading}
                sx={{
                  mt: 2.5,
                  py: 1.5,
                  background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg,#818cf8,#6366f1)',
                    boxShadow: '0 6px 24px rgba(99,102,241,0.5)',
                  },
                  '&:disabled': { opacity: 0.5 },
                }}
              >
                {isLoading ? 'Analyzing…' : 'Detect Deepfake'}
              </Button>
            </Paper>
          </Grid>

          {/* ── RIGHT COLUMN ── */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ ...glassCard, position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Detection Result
                </Typography>
                {result && (
                  <Tooltip title="Download JSON report">
                    <IconButton size="small" onClick={handleDownloadReport} sx={{ color: 'primary.main' }}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <ResultCard result={result} />

              {result?.frame_results?.length > 0 && (
                <>
                  <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.06)' }} />
                  <ConfidenceChart frameResults={result.frame_results} />
                </>
              )}
            </Paper>
          </Grid>

          {/* ── FRAME GALLERY ── */}
          {result?.frame_previews?.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={glassCard}>
                <FrameGallery frames={result.frame_previews} />
              </Paper>
            </Grid>
          )}

          {/* ── METRICS PANEL ── */}
          <Grid item xs={12}>
            <Paper sx={glassCard}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Model Evaluation Metrics
              </Typography>
              <MetricsPanel metrics={metrics} />
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 4, pb: 2 }}>
          DeepShield — For research and educational purposes only
        </Typography>
      </Box>
    </Box>
  )
}

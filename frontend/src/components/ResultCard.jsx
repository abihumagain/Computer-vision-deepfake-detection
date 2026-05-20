import React from 'react'
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Divider,
  Tooltip,
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import MemoryIcon from '@mui/icons-material/Memory'
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary'

function ConfidenceBar({ value, isFake }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Confidence
        </Typography>
        <Typography variant="caption" fontWeight={700} color={isFake ? 'error.main' : 'success.main'}>
          {(value * 100).toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value * 100}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: 'rgba(255,255,255,0.08)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 5,
            background: isFake
              ? 'linear-gradient(90deg,#ef4444,#dc2626)'
              : 'linear-gradient(90deg,#10b981,#059669)',
          },
        }}
      />
    </Box>
  )
}

function StatRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  )
}

export default function ResultCard({ result }) {
  if (!result) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          opacity: 0.4,
          py: 6,
        }}
      >
        <MemoryIcon sx={{ fontSize: 56, color: 'primary.main' }} />
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Upload a video and run detection
          <br />
          to see results here
        </Typography>
      </Box>
    )
  }

  const isFake = result.prediction === 'FAKE'
  const modelLabels = { baseline: 'Baseline CNN', improved: 'Improved CNN', resnet18: 'ResNet-18' }

  return (
    <Box>
      {/* Main verdict */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          py: 3,
          borderRadius: 3,
          mb: 3,
          background: isFake
            ? 'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(220,38,38,0.05))'
            : 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.05))',
          border: `1px solid ${isFake ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
        }}
      >
        {isFake ? (
          <WarningAmberIcon sx={{ fontSize: 52, color: 'error.main', mb: 1 }} />
        ) : (
          <CheckCircleOutlineIcon sx={{ fontSize: 52, color: 'success.main', mb: 1 }} />
        )}
        <Chip
          label={result.prediction}
          color={isFake ? 'error' : 'success'}
          sx={{
            fontSize: '1.1rem',
            fontWeight: 800,
            height: 36,
            px: 1,
            letterSpacing: 2,
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          {isFake ? 'Synthetic / Manipulated content detected' : 'Authentic content — no manipulation detected'}
        </Typography>
      </Box>

      <ConfidenceBar value={result.confidence} isFake={isFake} />

      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

      <StatRow
        icon={<MemoryIcon fontSize="small" />}
        label="Model"
        value={modelLabels[result.model_used] || result.model_used}
      />
      <StatRow
        icon={<AccessTimeIcon fontSize="small" />}
        label="Processing time"
        value={`${result.processing_time}s`}
      />
      <StatRow
        icon={<PhotoLibraryIcon fontSize="small" />}
        label="Frames analyzed"
        value={result.frames_analyzed}
      />

      {/* Per-frame breakdown */}
      {result.frame_results && result.frame_results.length > 0 && (
        <>
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Frame-level predictions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {result.frame_results.map((fr) => (
              <Tooltip
                key={fr.frame_index}
                title={`Frame ${fr.frame_index + 1}: ${(fr.fake_probability * 100).toFixed(1)}% fake`}
                arrow
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    background:
                      fr.prediction === 'FAKE'
                        ? `rgba(239,68,68,${0.3 + fr.fake_probability * 0.7})`
                        : `rgba(16,185,129,${0.3 + (1 - fr.fake_probability) * 0.7})`,
                    border: `1px solid ${fr.prediction === 'FAKE' ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'default',
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 700 }}>
                    {fr.frame_index + 1}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </>
      )}
    </Box>
  )
}

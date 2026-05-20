import React from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const MODEL_COLORS = {
  baseline: '#6366f1',
  improved: '#06b6d4',
  resnet18: '#10b981',
}

const METRIC_COLORS = {
  accuracy: '#6366f1',
  precision: '#f59e0b',
  recall: '#06b6d4',
  f1: '#10b981',
}

function MetricBadge({ value }) {
  const pct = (value * 100).toFixed(1)
  const color = value >= 0.9 ? 'success' : value >= 0.8 ? 'warning' : 'error'
  return (
    <Chip
      label={`${pct}%`}
      color={color}
      size="small"
      sx={{ fontWeight: 700, minWidth: 64 }}
    />
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <Box
      sx={{
        background: 'rgba(10,14,26,0.95)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 2,
        p: 1.5,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      {payload.map((p) => (
        <Typography key={p.name} variant="body2" sx={{ color: p.fill }}>
          {p.name}: <strong>{(p.value * 100).toFixed(1)}%</strong>
        </Typography>
      ))}
    </Box>
  )
}

export default function MetricsPanel({ metrics }) {
  if (!metrics) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, opacity: 0.4 }}>
        <Typography variant="body2" color="text.secondary">
          Loading metrics…
        </Typography>
      </Box>
    )
  }

  const modelKeys = Object.keys(metrics)
  const modelLabels = { baseline: 'Baseline CNN', improved: 'Improved CNN', resnet18: 'ResNet-18' }

  // Build chart data grouped by metric
  const chartData = ['accuracy', 'precision', 'recall', 'f1'].map((metric) => ({
    metric: metric.charAt(0).toUpperCase() + metric.slice(1),
    ...Object.fromEntries(modelKeys.map((k) => [modelLabels[k] || k, metrics[k][metric]])),
  }))

  return (
    <Box>
      {/* Bar chart */}
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Model Comparison Chart
      </Typography>
      <Box sx={{ height: 300, mb: 4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis
              domain={[0.75, 1]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
            />
            {modelKeys.map((k) => (
              <Bar
                key={k}
                dataKey={modelLabels[k] || k}
                fill={MODEL_COLORS[k]}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Table */}
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Detailed Metrics Table
      </Typography>
      <TableContainer sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ background: 'rgba(99,102,241,0.08)' }}>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Model</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#6366f1' }}>Accuracy</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#f59e0b' }}>Precision</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#06b6d4' }}>Recall</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#10b981' }}>F1 Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modelKeys.map((k) => {
              const m = metrics[k]
              return (
                <TableRow
                  key={k}
                  sx={{
                    '&:last-child td': { border: 0 },
                    '&:hover': { background: 'rgba(99,102,241,0.04)' },
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: MODEL_COLORS[k],
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {modelLabels[k] || k}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center"><MetricBadge value={m.accuracy} /></TableCell>
                  <TableCell align="center"><MetricBadge value={m.precision} /></TableCell>
                  <TableCell align="center"><MetricBadge value={m.recall} /></TableCell>
                  <TableCell align="center"><MetricBadge value={m.f1} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

import React from 'react'
import { Box, Typography } from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <Box
      sx={{
        background: 'rgba(10,14,26,0.95)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 2,
        p: 1.5,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        Frame {label}
      </Typography>
      <Typography variant="body2" sx={{ color: v >= 0.5 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
        {(v * 100).toFixed(1)}% fake
      </Typography>
    </Box>
  )
}

export default function ConfidenceChart({ frameResults = [] }) {
  if (!frameResults || frameResults.length === 0) return null

  const data = frameResults.map((fr) => ({
    frame: fr.frame_index + 1,
    fakeProbability: fr.fake_probability,
  }))

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Confidence Distribution — per frame fake probability
      </Typography>
      <Box sx={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="frame" tick={{ fill: '#94a3b8', fontSize: 10 }} label={{ value: 'Frame', position: 'insideBottom', fill: '#64748b', fontSize: 10, dy: 10 }} />
            <YAxis domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0.5} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" label={{ value: '50%', fill: '#64748b', fontSize: 10, position: 'insideTopRight' }} />
            <Bar dataKey="fakeProbability" radius={[3, 3, 0, 0]} maxBarSize={24}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.fakeProbability >= 0.5 ? '#ef4444' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

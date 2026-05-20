import React from 'react'
import { Box, Typography, ImageList, ImageListItem } from '@mui/material'
import BrokenImageIcon from '@mui/icons-material/BrokenImage'

export default function FrameGallery({ frames = [] }) {
  if (!frames || frames.length === 0) return null

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Extracted Frame Previews ({frames.length} shown)
      </Typography>
      <ImageList cols={4} gap={6} sx={{ m: 0 }}>
        {frames.map((b64, idx) => (
          <ImageListItem key={idx}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: 1.5,
                overflow: 'hidden',
                border: '1px solid rgba(99,102,241,0.2)',
                aspectRatio: '16/9',
                background: '#0f1629',
              }}
            >
              {b64 ? (
                <img
                  src={`data:image/jpeg;base64,${b64}`}
                  alt={`Frame ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <BrokenImageIcon sx={{ color: 'text.disabled' }} />
                </Box>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent,rgba(0,0,0,0.7))',
                  px: 0.75,
                  py: 0.25,
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)' }}>
                  #{idx + 1}
                </Typography>
              </Box>
            </Box>
          </ImageListItem>
        ))}
      </ImageList>
    </Box>
  )
}

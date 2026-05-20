import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Box, Typography, LinearProgress } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import VideoFileIcon from '@mui/icons-material/VideoFile'

const ACCEPTED_TYPES = {
  'video/mp4': ['.mp4'],
  'video/avi': ['.avi'],
  'video/quicktime': ['.mov'],
  'video/x-matroska': ['.mkv'],
  'video/webm': ['.webm'],
}

export default function VideoUploader({ file, onFileSelect, uploadProgress, disabled }) {
  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) return
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024,
    disabled,
  })

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'rgba(99,102,241,0.35)',
          borderRadius: 3,
          p: 4,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.25s ease',
          background: isDragActive
            ? 'rgba(99,102,241,0.08)'
            : 'rgba(15,22,41,0.6)',
          '&:hover': {
            borderColor: disabled ? undefined : 'primary.main',
            background: disabled ? undefined : 'rgba(99,102,241,0.05)',
          },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1.5 }} />
        {isDragActive ? (
          <Typography variant="body1" color="primary.main" fontWeight={600}>
            Drop the video here…
          </Typography>
        ) : (
          <>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              Drag & drop a video file
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to browse — MP4, AVI, MOV, MKV, WebM (max 200 MB)
            </Typography>
          </>
        )}
      </Box>

      {file && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <VideoFileIcon sx={{ color: 'primary.main' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatSize(file.size)}
            </Typography>
          </Box>
        </Box>
      )}

      {uploadProgress !== null && uploadProgress < 100 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Uploading… {uploadProgress}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ borderRadius: 1, height: 6 }}
          />
        </Box>
      )}
    </Box>
  )
}

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Paper,
  Alert,
  Snackbar,
  Chip,
  Stack,
  Link,
} from '@mui/material'
import { Config, DEFAULT_CONFIG } from '../types'
import { getConfig, saveConfig, clearClosedTabs } from '../utils/storage'

export function App() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [newPattern, setNewPattern] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    const storedConfig = await getConfig()
    setConfig(storedConfig)
    setLoading(false)
  }

  async function handleSave() {
    await saveConfig(config)
    setSaved(true)
  }

  function handleAddPattern() {
    if (newPattern.trim() && !config.excludePatterns.includes(newPattern.trim())) {
      setConfig({
        ...config,
        excludePatterns: [...config.excludePatterns, newPattern.trim()],
      })
      setNewPattern('')
    }
  }

  function handleRemovePattern(pattern: string) {
    setConfig({
      ...config,
      excludePatterns: config.excludePatterns.filter(p => p !== pattern),
    })
  }

  async function handleClearHistory() {
    if (confirm('Are you sure you want to clear all tab history?')) {
      await clearClosedTabs()
      alert('History cleared!')
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tab History Manager Settings
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          General
        </Typography>

        <TextField
          fullWidth
          label="Max History Items"
          type="number"
          value={config.maxItems}
          onChange={(e) => setConfig({ ...config, maxItems: parseInt(e.target.value) || 100 })}
          helperText="Maximum number of closed tabs to keep in history"
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={config.showNotifications}
              onChange={(e) => setConfig({ ...config, showNotifications: e.target.checked })}
            />
          }
          label="Show notifications when tabs are closed"
        />
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Excluded URL Patterns
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          URLs starting with these patterns will not be recorded
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
          Common patterns: chrome://, chrome-extension://, about:, edge://, brave://
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
          {config.excludePatterns.map((pattern) => (
            <Chip
              key={pattern}
              label={pattern}
              onDelete={() => handleRemovePattern(pattern)}
              size="small"
            />
          ))}
        </Stack>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="e.g., https://private.com"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPattern()}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" onClick={handleAddPattern}>
            Add
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom color="error">
          Danger Zone
        </Typography>
        <Button variant="outlined" color="error" onClick={handleClearHistory}>
          Clear All History
        </Button>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          About
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>License:</strong> MPL-2.0
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          <strong>Repository:</strong>{' '}
          <Link href="https://github.com/tingly-dev/tingly-undo-tabs" target="_blank" rel="noopener">
            github.com/tingly-dev/tingly-undo-tabs
          </Link>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Report Issues:</strong>{' '}
          <Link href="https://github.com/tingly-dev/tingly-undo-tabs/issues" target="_blank" rel="noopener">
            GitHub Issues
          </Link>
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Settings
        </Button>
      </Box>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSaved(false)}>
          Settings saved!
        </Alert>
      </Snackbar>
    </Box>
  )
}

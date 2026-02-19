import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  List,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Pagination,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { ClosedTab } from '../types'
import { getClosedTabs, removeClosedTab, clearClosedTabs } from '../utils/storage'
import { searchTabs } from '../utils/helpers'
import { SearchBar } from '../components/SearchBar'
import { TabListItem } from '../components/TabListItem'

const ITEMS_PER_PAGE = 10

export function App() {
  const [tabs, setTabs] = useState<ClosedTab[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadTabs()
  }, [])

  async function loadTabs() {
    setLoading(true)
    const storedTabs = await getClosedTabs()
    setTabs(storedTabs)
    setLoading(false)
  }

  async function handleReopen(tab: ClosedTab) {
    await chrome.tabs.create({ url: tab.url })
    await handleDelete(tab.id)
    window.close()
  }

  async function handleDelete(id: string) {
    const updated = await removeClosedTab(id)
    setTabs(updated)
  }

  async function handleClearAll() {
    await clearClosedTabs()
    setTabs([])
    setClearDialogOpen(false)
  }

  const filteredTabs = useMemo(() => {
    return searchTabs(tabs, search)
  }, [tabs, search])

  const totalPages = Math.ceil(filteredTabs.length / ITEMS_PER_PAGE)

  const paginatedTabs = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredTabs.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTabs, page])

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1)
  }, [search])

  function openOptions() {
    chrome.runtime.openOptionsPage()
    window.close()
  }

  return (
    <Box sx={{ width: 380, maxHeight: 500, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 1.5, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            Closed Tabs
          </Typography>
          <Tooltip title="Settings">
            <IconButton size="small" onClick={openOptions}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear All">
            <IconButton size="small" onClick={() => setClearDialogOpen(true)} disabled={tabs.length === 0}>
              <DeleteSweepIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <SearchBar value={search} onChange={setSearch} />
      </Box>

      {/* Tab List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredTabs.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {search ? 'No matching tabs found' : 'No closed tabs yet'}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {paginatedTabs.map((tab) => (
              <TabListItem
                key={tab.id}
                tab={tab}
                onReopen={handleReopen}
                onDelete={handleDelete}
              />
            ))}
          </List>
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            size="small"
            siblingCount={1}
            boundaryCount={1}
          />
        </Box>
      )}

      {/* Footer */}
      {tabs.length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {tabs.length} tab{tabs.length !== 1 ? 's' : ''} in history
          </Typography>
        </Box>
      )}

      {/* Clear Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>Clear All History?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete all {tabs.length} closed tab{tabs.length !== 1 ? 's' : ''} from history.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleClearAll} color="error" variant="contained">
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

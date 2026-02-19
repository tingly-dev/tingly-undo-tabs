import { Search as SearchIcon } from '@mui/icons-material'
import { InputAdornment, TextField } from '@mui/material'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <TextField
      fullWidth
      size="small"
      placeholder="Search tabs..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
      sx={{ mb: 1 }}
    />
  )
}

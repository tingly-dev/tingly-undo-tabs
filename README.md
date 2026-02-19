# Tingly Undo Tabs

A Chrome extension to record and reopen closed tabs.

## Features

- Automatically records closed tabs
- Search through closed tab history
- Reopen tabs with one click
- Exclude specific URLs from recording
- Configurable history size

## Installation

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Build: `pnpm build`
4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Usage

### View and Reopen Closed Tabs
- Click the extension icon to see your closed tab history
- Click any tab to reopen it
- Use the search bar to filter tabs

### Settings
- Click the gear icon to open settings
- Configure max history items
- Add URL patterns to exclude from recording

## Development

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
```

## License

[MPL-2.0](LICENSE)

# Spec: Tab History Manager - Chrome Extension

**Date:** 2026-02-19
**Type:** New Feature
**Status:** Draft

## 1. Overview

### User Intent
Create a Chrome extension that records closed tabs and allows users to reopen them in the order they were closed. The extension should support configuration options (like max item limit) and provide search functionality to find previously closed tabs.

### Key Features
1. **Tab Close Recording** - Automatically record tabs when they are closed
2. **Reopen Closed Tabs** - Restore tabs from history, maintaining close order (LIFO - Last In First Out)
3. **Configuration** - Allow users to configure settings like max history limit
4. **Search** - Search through closed tab history by title or URL
5. **Popup UI** - Clean, accessible popup interface for viewing and managing history

## 2. Technical Design

### 2.1 Tech Stack
- **Build Tool**: Vite with CRXJS plugin (for Chrome extension HMR)
- **Framework**: React 18+
- **Language**: TypeScript
- **UI Library**: MUI (Material-UI) v5/v6
- **State**: React Context + useState/useReducer

### 2.2 Extension Architecture

```
tingly-undo-tabs/
├── public/
│   └── icons/             # Extension icons (16, 48, 128)
├── src/
│   ├── background/        # Service worker
│   │   └── index.ts       # Tab event listeners
│   ├── popup/             # Popup UI
│   │   ├── App.tsx        # Main popup component
│   │   ├── main.tsx       # Entry point
│   │   └── components/    # Popup-specific components
│   ├── options/           # Options page
│   │   ├── App.tsx        # Options main component
│   │   └── main.tsx       # Entry point
│   ├── components/        # Shared components
│   │   ├── TabListItem.tsx
│   │   ├── SearchBar.tsx
│   │   └── ...
│   ├── hooks/             # Custom hooks
│   │   ├── useClosedTabs.ts
│   │   └── useConfig.ts
│   ├── store/             # State management
│   │   ├── TabContext.tsx
│   │   └── ConfigContext.tsx
│   ├── utils/             # Utilities
│   │   ├── storage.ts     # Chrome storage wrapper
│   │   └── helpers.ts     # Helper functions
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   └── theme/             # MUI theme config
│       └── theme.ts
├── manifest.json          # Extension manifest (MV3)
├── vite.config.ts         # Vite config with CRXJS
├── tsconfig.json          # TypeScript config
└── package.json
```

### 2.3 Data Models

#### ClosedTab
```typescript
interface ClosedTab {
  id: string;           // Unique identifier (timestamp-based)
  url: string;          // Tab URL
  title: string;        // Page title
  favIconUrl?: string;  // Favicon URL
  closedAt: number;     // Timestamp when closed
  windowId?: number;    // Original window ID (for context)
}
```

#### Config
```typescript
interface Config {
  maxItems: number;        // Max tabs to keep in history (default: 100)
  showNotifications: boolean; // Show notification on tab close (default: false)
  excludePatterns: string[]; // URL patterns to exclude (e.g., chrome://, about:)
}
```

### 2.4 Storage Strategy
- Use `chrome.storage.local` for persisting closed tabs and config
- Storage key: `closedTabs` (array of ClosedTab)
- Storage key: `config` (Config object)
- Implement LRU-like cleanup when max limit is reached

### 2.5 Chrome APIs Used
- `chrome.tabs` - Listen for tab removal events
- `chrome.storage` - Persist data
- `chrome.sessions` - (Optional) Integrate with Chrome's built-in session restore
- `chrome.notifications` - (Optional) Notify on actions

## 3. Core Features

### 3.1 Tab Close Recording
- Listen to `chrome.tabs.onRemoved` event
- Capture tab info (URL, title, favicon) before removal
- Store in history with timestamp
- Enforce max limit by removing oldest entries

### 3.2 Popup UI
- List of closed tabs (most recent first)
- Click to reopen tab
- Search/filter functionality
- Clear history button
- Quick access to settings

### 3.3 Search Functionality
- Real-time search as user types
- Search by title and URL (case-insensitive)
- Highlight matching results

### 3.4 Options Page
- Max history items setting (slider or input)
- Exclude patterns (new tab, chrome://, etc.)
- Clear all history button
- Export/Import history (optional)

## 4. UI/UX Design (MUI Components)

### Key MUI Components to Use
- `Box`, `Stack` - Layout
- `List`, `ListItem`, `ListItemButton`, `ListItemAvatar`, `ListItemText` - Tab list
- `Avatar` - Favicon display
- `TextField` - Search input with `InputAdornment`
- `IconButton` - Action buttons (settings, clear, reopen)
- `Typography` - Text styling
- `Divider` - Section separators
- `Tooltip` - Hover hints
- `Snackbar` - Notifications
- `Dialog` - Confirmations (clear history)
- `Slider` or `TextField` (type=number) - Config inputs
- `Chip` - Tags/labels

### Popup Layout
```
+---------------------------+
| [Search...]         [⚙️]  |
+---------------------------+
| 🔍 Recent Closed Tabs     |
+---------------------------+
| 🌐 Page Title             |
|    https://example.com    |
|    Closed 2 mins ago      |
+---------------------------+
| 🌐 Another Page           |
|    https://foo.com        |
|    Closed 5 mins ago      |
+---------------------------+
| [Clear All History]       |
+---------------------------+
```

### Design Principles
- Minimal, clean interface
- Quick keyboard navigation
- Responsive to theme (light/dark)
- Clear visual hierarchy

## 6. Implementation Phases

### Phase 1: Project Setup & Core
- [ ] Initialize Vite + React + TypeScript project
- [ ] Configure CRXJS for Chrome extension
- [ ] Setup MUI with theme (dark/light mode support)
- [ ] Extension manifest (MV3)
- [ ] Background service worker with tab close listener
- [ ] Basic popup UI with tab list
- [ ] Storage utilities for closed tabs
- [ ] Reopen tab functionality

### Phase 2: Enhanced Features
- [ ] Search functionality with debounce
- [ ] Options/settings page
- [ ] Max history limit configuration
- [ ] URL pattern exclusion
- [ ] Tab context and config context

### Phase 3: Polish
- [ ] Dark mode toggle (follow system)
- [ ] Keyboard shortcuts
- [ ] Better error handling
- [ ] Empty state UI
- [ ] Loading states
- [ ] Visual polish and MUI animations

## 7. Technical Notes

### Manifest V3 Considerations
- Use service worker instead of background page
- Storage API available in service worker
- No persistent background page needed

### Performance
- Limit search to loaded history items
- Debounce search input
- Lazy load favicons if needed

### Edge Cases
- Handle chrome:// and about: URLs
- Handle incognito tabs (don't record)
- Handle tab groups (optional feature)
- Handle session restore conflicts

import { ClosedTab } from '../types'
import { formatRelativeTime } from '../utils/helpers'

interface TabListItemProps {
  tab: ClosedTab
  onReopen: (tab: ClosedTab) => void
  onDelete: (id: string) => void
}

export function TabListItem({ tab, onReopen, onDelete }: TabListItemProps) {
  return (
    <div
      onClick={() => onReopen(tab)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        height: 60,
        boxSizing: 'border-box',
        cursor: 'pointer',
        borderBottom: '1px solid #eee',
      }}
    >
      {tab.favIconUrl ? (
        <img
          src={tab.favIconUrl}
          alt=""
          style={{ width: 16, height: 16, marginRight: 8, borderRadius: 2 }}
        />
      ) : (
        <div
          style={{
            width: 16,
            height: 16,
            marginRight: 8,
            borderRadius: 2,
            backgroundColor: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="15" />
            <line x1="15" y1="9" x2="9" y2="15" />
          </svg>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tab.title}
        </div>
        <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tab.url}
        </div>
        <div style={{ fontSize: 11, color: '#999' }}>
          {formatRelativeTime(tab.closedAt)}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(tab.id)
        }}
        style={{
          padding: '4px 8px',
          fontSize: 12,
          border: 'none',
          background: '#ff4444',
          color: 'white',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        Delete
      </button>
    </div>
  )
}

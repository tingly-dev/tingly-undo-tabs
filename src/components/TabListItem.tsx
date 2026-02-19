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
      {tab.favIconUrl && (
        <img
          src={tab.favIconUrl}
          alt=""
          style={{ width: 16, height: 16, marginRight: 8, borderRadius: 2 }}
        />
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

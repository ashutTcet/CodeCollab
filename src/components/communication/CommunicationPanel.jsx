import ChatPanel from './ChatPanel';
import VideoCallPanel from './VideoCallPanel';
import ParticipantList from './ParticipantList';

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'call', label: 'Call' },
  { id: 'participants', label: 'Participants' },
];

export default function CommunicationPanel({
  activeTab,
  onTabChange,
  chatProps,
  callProps,
  participantProps,
}) {
  return (
    <aside className="bg-white border border-slate-200 rounded-lg flex flex-col min-h-0">
      <div className="border-b border-slate-200 px-3 py-2 flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors ${
              activeTab === tab.id
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-transparent text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'chat' && <ChatPanel {...chatProps} />}
        {activeTab === 'call' && <VideoCallPanel {...callProps} />}
        {activeTab === 'participants' && <ParticipantList {...participantProps} />}
      </div>
    </aside>
  );
}

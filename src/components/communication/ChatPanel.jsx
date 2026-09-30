import { useEffect, useMemo, useRef } from 'react';

function formatTimestamp(input) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatPanel({
  messages,
  loading,
  loadError,
  error,
  currentUserId,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  sending,
  typingUsers,
  connected,
}) {
  const listRef = useRef(null);

  const typingLabel = useMemo(() => {
    if (!typingUsers || typingUsers.length === 0) {
      return '';
    }

    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing...`;
    }

    if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    }

    return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
  }, [typingUsers]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }

    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    const shouldAutoScroll = distanceFromBottom < 120;

    if (shouldAutoScroll) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, typingLabel]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 bg-white">
        {loading ? (
          <p className="text-sm text-slate-600">Loading chat history...</p>
        ) : loadError ? (
          <p className="text-sm text-rose-600">{loadError}</p>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <div>
              <p className="text-sm font-medium text-slate-800">No messages yet</p>
              <p className="text-xs text-slate-500 mt-1">Start the conversation for this classroom.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender?.id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-md border px-3 py-2 ${
                    isMine
                      ? 'bg-brand-600 text-white border-brand-700'
                      : 'bg-slate-50 text-slate-900 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`font-semibold ${isMine ? 'text-blue-100' : 'text-slate-700'}`}>
                      {isMine ? 'You' : msg.sender?.name || 'Unknown'}
                    </span>
                    <span className={isMine ? 'text-blue-100/80' : 'text-slate-500'}>
                      {formatTimestamp(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap break-words">{msg.message}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-200 px-3 py-2 bg-slate-50">
        {typingLabel && <p className="text-[11px] text-slate-500 mb-1.5">{typingLabel}</p>}

        {error && <p className="text-xs text-rose-600 mb-1.5">{error}</p>}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={messageInput}
            onChange={(event) => onMessageInputChange(event.target.value)}
            placeholder={connected ? 'Message the classroom...' : 'Reconnect to send messages...'}
            rows={2}
            className="flex-1 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200"
            disabled={!connected || sending}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSendMessage();
              }
            }}
          />
          <button
            type="submit"
            className="btn-primary min-w-[74px] justify-center"
            disabled={!connected || sending || !messageInput.trim()}
          >
            {sending ? 'Sending' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

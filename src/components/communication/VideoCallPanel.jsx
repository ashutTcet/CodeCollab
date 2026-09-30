import { useEffect, useMemo, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoTrack,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

function CallRoomView({ onParticipantIdsChange, onLeaveCall }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const [deviceError, setDeviceError] = useState('');

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const allIdentities = useMemo(() => {
    const ids = [localParticipant?.identity, ...participants.map((p) => p.identity)].filter(Boolean);
    return Array.from(new Set(ids));
  }, [localParticipant?.identity, participants]);

  useEffect(() => {
    onParticipantIdsChange(allIdentities);
    return () => onParticipantIdsChange([]);
  }, [allIdentities, onParticipantIdsChange]);

  const toggleMicrophone = async () => {
    try {
      setDeviceError('');
      await localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled);
    } catch (_error) {
      setDeviceError('Microphone permission denied or unavailable.');
    }
  };

  const toggleCamera = async () => {
    try {
      setDeviceError('');
      await localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
    } catch (_error) {
      setDeviceError('Camera permission denied or unavailable.');
    }
  };

  const toggleScreenShare = async () => {
    try {
      setDeviceError('');
      await localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled);
    } catch (_error) {
      setDeviceError('Screen sharing was blocked or not supported by this browser.');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <RoomAudioRenderer />

      <div className="border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-2 bg-slate-50">
        <p className="text-xs font-semibold text-slate-700">Connection: {String(connectionState).toLowerCase()}</p>
        <p className="text-xs text-slate-600">In call: {allIdentities.length}</p>
      </div>

      {deviceError && <p className="px-3 py-2 text-xs text-rose-600 border-b border-rose-100 bg-rose-50">{deviceError}</p>}

      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {tracks.length === 0 ? (
          <div className="h-full flex items-center justify-center border border-slate-200 rounded-md bg-slate-50">
            <p className="text-sm text-slate-600">No active camera or screen-share tracks yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tracks.map((trackRef) => (
              <div key={trackRef.participant.identity + trackRef.source} className="rounded-md border border-slate-200 overflow-hidden bg-slate-900">
                <VideoTrack trackRef={trackRef} />
                <div className="px-2.5 py-1.5 bg-slate-950 text-slate-100 text-xs flex items-center justify-between">
                  <span className="truncate">{trackRef.participant.name || trackRef.participant.identity}</span>
                  <span className="uppercase text-[10px] text-slate-400">{trackRef.source === Track.Source.ScreenShare ? 'Screen' : 'Camera'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-3 py-2 bg-slate-50 flex flex-wrap items-center gap-2">
        <button type="button" onClick={toggleMicrophone} className="btn-secondary">
          {localParticipant.isMicrophoneEnabled ? 'Mute Mic' : 'Unmute Mic'}
        </button>
        <button type="button" onClick={toggleCamera} className="btn-secondary">
          {localParticipant.isCameraEnabled ? 'Stop Camera' : 'Start Camera'}
        </button>
        <button type="button" onClick={toggleScreenShare} className="btn-secondary">
          {localParticipant.isScreenShareEnabled ? 'Stop Share' : 'Share Screen'}
        </button>
        <button type="button" onClick={onLeaveCall} className="btn-primary">
          Leave Call
        </button>
      </div>
    </div>
  );
}

export default function VideoCallPanel({
  isInCall,
  isJoining,
  callMode,
  onCallModeChange,
  onJoinCall,
  onLeaveCall,
  token,
  serverUrl,
  onParticipantIdsChange,
  callError,
}) {
  if (!isInCall) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6">
        <h3 className="text-base font-semibold text-slate-900">Classroom Call</h3>
        <p className="text-sm text-slate-600 mt-1 max-w-sm">
          Join the classroom room to talk with everyone. Audio-only and video both use the same classroom call.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCallModeChange('audio')}
            className={`btn-secondary ${callMode === 'audio' ? 'border-brand-400 text-brand-700 bg-brand-50' : ''}`}
          >
            Audio Only
          </button>
          <button
            type="button"
            onClick={() => onCallModeChange('video')}
            className={`btn-secondary ${callMode === 'video' ? 'border-brand-400 text-brand-700 bg-brand-50' : ''}`}
          >
            Audio + Video
          </button>
        </div>

        <button type="button" className="btn-primary mt-4" onClick={onJoinCall} disabled={isJoining}>
          {isJoining ? 'Joining...' : 'Join Call'}
        </button>

        {callError && <p className="text-xs text-rose-600 mt-3">{callError}</p>}
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={isInCall}
      audio
      video={callMode === 'video'}
      className="h-full"
      onDisconnected={() => onParticipantIdsChange([])}
      onError={() => onParticipantIdsChange([])}
    >
      <CallRoomView onParticipantIdsChange={onParticipantIdsChange} onLeaveCall={onLeaveCall} />
    </LiveKitRoom>
  );
}

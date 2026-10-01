import { useEffect, useMemo, useRef, useState } from 'react';
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

function getInitials(name = '') {
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function CallRoomView({ onParticipantIdsChange, onLeaveCall }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const [deviceError, setDeviceError] = useState('');
  const containerRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 340, height: 500 });

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

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerDimensions({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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

  const trackCount = tracks.length;
  const { width: containerWidth, height: containerHeight } = containerDimensions;

  const getGridConfig = () => {
    // 1 PARTICIPANT:
    // One large landscape video, centered vertically and horizontally
    if (trackCount === 1) {
      return {
        wrapperClass: "w-full my-auto flex justify-center items-center",
        gridClass: "w-full max-w-full flex justify-center",
        aspectRatioClass: "aspect-video max-h-full max-w-full",
        getItemClass: () => "w-full max-w-full",
      };
    }

    // 2 PARTICIPANTS:
    // Narrow/tall sidebar -> 1 column x 2 rows
    // Wide sidebar or short height -> 2 columns x 1 row
    if (trackCount === 2) {
      const useTwoColumns =
        containerWidth >= 460 || (containerWidth >= 360 && containerHeight < 400);

      if (useTwoColumns) {
        return {
          wrapperClass: "w-full my-auto",
          gridClass: "grid grid-cols-2 gap-2 sm:gap-2.5 w-full",
          aspectRatioClass: containerWidth >= 480 ? "aspect-video" : "aspect-[4/3]",
          getItemClass: () => "w-full min-h-0",
        };
      }

      // 1 column x 2 rows (stacked vertically)
      return {
        wrapperClass: "w-full my-auto",
        gridClass: "grid grid-cols-1 gap-2 sm:gap-2.5 w-full max-w-md mx-auto",
        aspectRatioClass: "aspect-video",
        getItemClass: () => "w-full min-h-0",
      };
    }

    // 3 PARTICIPANTS:
    // Tall & narrow sidebar -> 1 column x 3 rows (large, readable tiles)
    // Wider sidebar or shorter container -> 2 columns (2 tiles top, 1 centered bottom)
    if (trackCount === 3) {
      const useOneColumn = containerWidth < 380 && containerHeight >= 500;

      if (useOneColumn) {
        return {
          wrapperClass: "w-full my-auto",
          gridClass: "grid grid-cols-1 gap-2 sm:gap-2.5 w-full max-w-md mx-auto",
          aspectRatioClass: "aspect-video",
          getItemClass: () => "w-full min-h-0",
        };
      }

      return {
        wrapperClass: "w-full my-auto",
        gridClass: "grid grid-cols-2 gap-2 sm:gap-2.5 w-full",
        aspectRatioClass: containerWidth >= 460 ? "aspect-video" : "aspect-[4/3]",
        getItemClass: (index) => {
          if (index === 2) {
            return "col-span-2 w-full max-w-[calc(50%-0.25rem)] mx-auto min-h-0";
          }
          return "w-full min-h-0";
        },
      };
    }

    // 4 PARTICIPANTS:
    // Prefer 2x2 when sidebar width supports it (>= 300px or height < 560px)
    // In very narrow & tall sidebar (< 300px && height >= 560px): 1x4 stack
    if (trackCount === 4) {
      const useOneColumn = containerWidth < 300 && containerHeight >= 560;

      if (useOneColumn) {
        return {
          wrapperClass: "w-full my-auto",
          gridClass: "grid grid-cols-1 gap-2 sm:gap-2.5 w-full max-w-md mx-auto",
          aspectRatioClass: "aspect-video",
          getItemClass: () => "w-full min-h-0",
        };
      }

      return {
        wrapperClass: "w-full my-auto",
        gridClass: "grid grid-cols-2 gap-2 sm:gap-2.5 w-full",
        aspectRatioClass: containerWidth >= 460 ? "aspect-video" : "aspect-[4/3]",
        getItemClass: () => "w-full min-h-0",
      };
    }

    // 5+ PARTICIPANTS:
    // Dynamically choose columns based on available width:
    // 3 columns when wide (>= 480px), 2 columns when narrower
    const cols = containerWidth >= 480 ? 3 : 2;
    const estRowHeight = (containerWidth / cols) * 0.75 + 32;
    const estRows = Math.ceil(trackCount / cols);
    const estTotalHeight = estRows * estRowHeight;
    const fitsWithoutScroll = estTotalHeight <= containerHeight;

    return {
      wrapperClass: `w-full ${fitsWithoutScroll ? "my-auto" : ""}`,
      gridClass: `grid ${cols === 3 ? "grid-cols-3" : "grid-cols-2"} gap-2 sm:gap-2.5 w-full`,
      aspectRatioClass: containerWidth >= 520 ? "aspect-video" : "aspect-[4/3]",
      getItemClass: () => "w-full min-h-0",
    };
  };

  const gridConfig = getGridConfig();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <RoomAudioRenderer />

      <div className="border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 shrink-0">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Connection: {String(connectionState).toLowerCase()}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">In call: {allIdentities.length}</p>
      </div>

      {deviceError && (
        <p className="px-3 py-2 text-xs text-rose-600 dark:text-rose-400 border-b border-rose-100 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 shrink-0">
          {deviceError}
        </p>
      )}

      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 flex flex-col">
        {tracks.length === 0 ? (
          <div className="h-full flex items-center justify-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900/50">
            <p className="text-sm text-slate-600 dark:text-slate-400">No active camera or screen-share tracks yet.</p>
          </div>
        ) : (
          <div className={gridConfig.wrapperClass}>
            <div className={gridConfig.gridClass}>
              {tracks.map((trackRef, index) => {
                const isCameraOff =
                  trackRef.source === Track.Source.Camera && !trackRef.participant?.isCameraEnabled;

                return (
                  <div
                    key={trackRef.participant.identity + trackRef.source}
                    className={`${gridConfig.getItemClass(
                      index
                    )} ${gridConfig.aspectRatioClass} rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 flex flex-col shadow-xs relative transition-all duration-150`}
                  >
                    <div className="relative flex-1 min-h-0 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
                      {isCameraOff ? (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs sm:text-sm select-none shadow-inner">
                          {getInitials(trackRef.participant.name || trackRef.participant.identity)}
                        </div>
                      ) : (
                        <VideoTrack
                          trackRef={trackRef}
                          className={`w-full h-full ${
                            trackRef.source === Track.Source.ScreenShare
                              ? "object-contain bg-black"
                              : "object-cover"
                          }`}
                        />
                      )}
                    </div>

                    <div className="px-2.5 py-1 bg-slate-950/95 text-slate-100 text-[11px] sm:text-xs flex items-center justify-between shrink-0 border-t border-slate-800/80">
                      <span className="truncate font-medium">
                        {trackRef.participant.name || trackRef.participant.identity}
                      </span>
                      <span className="uppercase text-[9px] sm:text-[10px] text-slate-400 font-mono tracking-wider ml-1.5 shrink-0">
                        {trackRef.source === Track.Source.ScreenShare ? "Screen" : "Camera"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 px-3 py-2 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center gap-2 shrink-0">
        <button type="button" onClick={toggleMicrophone} className="btn-secondary text-xs px-2.5 py-1.5">
          {localParticipant.isMicrophoneEnabled ? 'Mute Mic' : 'Unmute Mic'}
        </button>
        <button type="button" onClick={toggleCamera} className="btn-secondary text-xs px-2.5 py-1.5">
          {localParticipant.isCameraEnabled ? 'Stop Camera' : 'Start Camera'}
        </button>
        <button type="button" onClick={toggleScreenShare} className="btn-secondary text-xs px-2.5 py-1.5">
          {localParticipant.isScreenShareEnabled ? 'Stop Share' : 'Share Screen'}
        </button>
        <button type="button" onClick={onLeaveCall} className="btn-primary text-xs px-3 py-1.5">
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
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Classroom Call</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-sm">
          Join the classroom room to talk with everyone. Audio-only and video both use the same classroom call.
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCallModeChange('audio')}
            className={`btn-secondary ${
              callMode === 'audio'
                ? 'border-brand-400 text-brand-700 bg-brand-50 dark:border-brand-500/50 dark:text-brand-300 dark:bg-brand-950/40'
                : ''
            }`}
          >
            Audio Only
          </button>
          <button
            type="button"
            onClick={() => onCallModeChange('video')}
            className={`btn-secondary ${
              callMode === 'video'
                ? 'border-brand-400 text-brand-700 bg-brand-50 dark:border-brand-500/50 dark:text-brand-300 dark:bg-brand-950/40'
                : ''
            }`}
          >
            Audio + Video
          </button>
        </div>

        <button type="button" className="btn-primary mt-4" onClick={onJoinCall} disabled={isJoining}>
          {isJoining ? 'Joining...' : 'Join Call'}
        </button>

        {callError && <p className="text-xs text-rose-600 dark:text-rose-400 mt-3">{callError}</p>}
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

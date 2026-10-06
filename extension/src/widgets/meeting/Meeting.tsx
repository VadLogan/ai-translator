import { usePrefersDark } from '../../components/color-scheme';
import { useMeeting } from './hooks/useMeeting';
import { MeetingPanel } from './MeetingPanel';
import { toView } from './view';

export function Meeting({ onClose }: { onClose: () => void }) {
  const dark = usePrefersDark();
  const { state, dispatch, ...transcript } = useMeeting();
  return (
    <MeetingPanel
      view={toView(state)}
      dark={dark}
      callbacks={{
        ...transcript,
        onTogglePause: () => dispatch({ type: 'toggle-pause' }),
        onMinimize: () => dispatch({ type: 'minimize' }),
        onEnd: () => (state.status === 'ended' ? onClose() : dispatch({ type: 'end' })),
        onRenameStart: (id) => dispatch({ type: 'rename-start', id }),
        onRename: (id, name) => dispatch({ type: 'rename', id, name }),
      }}
    />
  );
}

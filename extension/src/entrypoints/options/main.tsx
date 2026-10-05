import { createRoot } from 'react-dom/client';
import { followColorScheme } from '../../components/color-scheme';
import { SettingsApp } from '../../popups/settings/SettingsApp';
import '../../components/theme.css';

followColorScheme();

createRoot(document.getElementById('root')!).render(<SettingsApp />);

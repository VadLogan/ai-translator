import { createRoot } from 'react-dom/client';
import { followColorScheme } from '../../components/color-scheme';
import { ToolbarPopup } from '../../popups/toolbar/ToolbarPopup';
import '../../components/theme.css';

followColorScheme();

createRoot(document.getElementById('root')!).render(<ToolbarPopup />);

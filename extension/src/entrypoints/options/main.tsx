import { createRoot } from 'react-dom/client';
import { followColorScheme } from '../../components/color-scheme';
import { OptionsApp } from '../../popups/options/OptionsApp';
import '../../components/theme.css';

followColorScheme();

createRoot(document.getElementById('root')!).render(<OptionsApp />);

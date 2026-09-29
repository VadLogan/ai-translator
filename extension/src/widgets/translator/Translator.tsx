import { usePrefersDark } from '../../components/color-scheme';
import { useTranslatorFlow, type FlowOptions } from './hooks/useTranslatorFlow';
import { TranslatorWidget } from './TranslatorWidget';
import { toView } from './view';

/** The container: the flow decides, toView maps, TranslatorWidget renders. */
export function Translator(options: FlowOptions) {
  const { state, viewActions, callbacks } = useTranslatorFlow(options);
  const dark = usePrefersDark();
  if (!state.selection) return null;
  return <TranslatorWidget view={toView(state, viewActions)} anchor={state.anchor} dark={dark} callbacks={callbacks} />;
}

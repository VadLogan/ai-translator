import { usePrefersDark } from '../../components/color-scheme';
import { useExceptions } from '../../settings/useExceptions';
import { useTranslatorFlow, type FlowOptions } from './hooks/useTranslatorFlow';
import { TranslatorWidget } from './TranslatorWidget';
import { toView } from './view';

/** The container: the flow decides, toView maps, TranslatorWidget renders. */
export function Translator(options: FlowOptions) {
  const { state, viewActions, callbacks, marks } = useTranslatorFlow(options);
  const dark = usePrefersDark();
  const exceptions = useExceptions();
  if (!state.selection) return null;
  return <TranslatorWidget view={toView(state, viewActions, exceptions)} anchor={state.anchor} dark={dark} callbacks={callbacks} marks={marks} />;
}

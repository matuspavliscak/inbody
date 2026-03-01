import { useState, useRef, useCallback, useId } from 'react';
import { useT } from '../lib/i18n';
import type { TranslationKey } from '../lib/translations';

const glossaryKeys: Record<string, TranslationKey> = {
  SMM: 'glossary.SMM',
  BMI: 'glossary.BMI',
  PBF: 'glossary.PBF',
  BFM: 'glossary.BFM',
  FFM: 'glossary.FFM',
  TBW: 'glossary.TBW',
  SMI: 'glossary.SMI',
  BMR: 'glossary.BMR',
  WHR: 'glossary.WHR',
  VFL: 'glossary.VFL',
  InBody: 'glossary.InBody',
};

export function Tip({ term, children }: { term: string; children?: React.ReactNode }) {
  const { t } = useT();
  const glossaryKey = glossaryKeys[term];
  const description = glossaryKey ? t(glossaryKey) : undefined;
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const tooltipId = useId();

  const open = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShow(true);
  }, []);

  const close = useCallback(() => {
    timeoutRef.current = setTimeout(() => setShow(false), 150);
  }, []);

  const toggle = useCallback(() => {
    setShow((prev) => !prev);
  }, []);

  if (!description) return <>{children ?? term}</>;

  return (
    <span className="relative inline-block">
      <span
        tabIndex={0}
        role="button"
        aria-describedby={show ? tooltipId : undefined}
        className="underline decoration-dotted decoration-gray-300 cursor-help"
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onClick={toggle}
      >
        {children ?? term}
      </span>
      {show && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg z-50 pointer-events-none"
        >
          {description}
        </span>
      )}
    </span>
  );
}

import { useState, useRef, useCallback, useId } from 'react';

const glossary: Record<string, string> = {
  SMM: 'Skeletal Muscle Mass — the total weight of muscles attached to bones',
  BMI: 'Body Mass Index — weight (kg) divided by height squared (m²)',
  PBF: 'Percent Body Fat — body fat mass as a percentage of total weight',
  BFM: 'Body Fat Mass — total weight of fat tissue in the body',
  FFM: 'Fat-Free Mass — total weight minus body fat mass',
  TBW: 'Total Body Water — total amount of water in the body',
  SMI: 'Skeletal Muscle Index — skeletal muscle mass divided by height squared',
  BMR: 'Basal Metabolic Rate — calories burned at rest per day',
  WHR: 'Waist-Hip Ratio — waist circumference divided by hip circumference',
  VFL: 'Visceral Fat Level — estimated fat around internal organs (1–20 scale)',
  InBody: 'InBody Score — overall body composition score (0–100)',
};

export function Tip({ term, children }: { term: string; children?: React.ReactNode }) {
  const description = glossary[term];
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

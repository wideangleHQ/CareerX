'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const AccordionContext = React.createContext<{
  value?: string | string[];
  onValueChange?: (value: string) => void;
  type?: 'single' | 'multiple';
}>({});

export const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: 'single' | 'multiple';
    defaultValue?: string | string[];
    value?: string | string[];
    onValueChange?: (value: any) => void;
  }
>(({ type = 'single', defaultValue, value, onValueChange, className, children, ...props }, ref) => {
  const [localValue, setLocalValue] = React.useState<string | string[]>(
    defaultValue || (type === 'multiple' ? [] : '')
  );

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : localValue;

  const handleValueChange = React.useCallback(
    (itemValue: string) => {
      if (type === 'single') {
        const newValue = currentValue === itemValue ? '' : itemValue;
        if (!isControlled) setLocalValue(newValue);
        onValueChange?.(newValue);
      } else {
        const currentArr = Array.isArray(currentValue) ? currentValue : [];
        const newValue = currentArr.includes(itemValue)
          ? currentArr.filter((v) => v !== itemValue)
          : [...currentArr, itemValue];
        if (!isControlled) setLocalValue(newValue);
        onValueChange?.(newValue);
      }
    },
    [type, currentValue, isControlled, onValueChange]
  );

  return (
    <AccordionContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, type }}>
      <div ref={ref} className={cn('space-y-3', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
});
Accordion.displayName = 'Accordion';

const AccordionItemContext = React.createContext<{
  value: string;
  isOpen: boolean;
}>({ value: '', isOpen: false });

export const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ value, className, children, ...props }, ref) => {
  const { value: groupValue, type } = React.useContext(AccordionContext);
  const isOpen = React.useMemo(() => {
    if (type === 'single') {
      return groupValue === value;
    }
    return Array.isArray(groupValue) && groupValue.includes(value);
  }, [groupValue, type, value]);

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div
        ref={ref}
        className={cn('border border-neutral-200 bg-white rounded-xl overflow-hidden transition-all duration-200 hover:border-neutral-300 shadow-xs', className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
});
AccordionItem.displayName = 'AccordionItem';

export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { onValueChange } = React.useContext(AccordionContext);
  const { value, isOpen } = React.useContext(AccordionItemContext);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onValueChange?.(value)}
      className={cn(
        'flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-neutral-900 transition-all hover:bg-neutral-50/50 cursor-pointer outline-none focus-visible:bg-neutral-50',
        className
      )}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          'h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ease-in-out',
          isOpen && 'rotate-180 text-primary'
        )}
      />
    </button>
  );
});
AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isOpen } = React.useContext(AccordionItemContext);

  return (
    <div
      ref={ref}
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
        isOpen ? 'grid-rows-[1fr] opacity-100 border-t border-neutral-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none',
        className
      )}
      {...props}
    >
      <div className="overflow-hidden">
        <div className="p-5 text-sm leading-relaxed text-neutral-600 bg-neutral-50/20">
          {children}
        </div>
      </div>
    </div>
  );
});
AccordionContent.displayName = 'AccordionContent';

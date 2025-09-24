import React from 'react';

function collectSelectItems(children, items = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === SelectItem) {
      items.push({ value: child.props.value, label: child.props.children });
    } else if (child.props?.children) {
      collectSelectItems(child.props.children, items);
    }
  });
  return items;
}

export function Select({ children, value, onValueChange, className = '' }) {
  const items = collectSelectItems(children);
  let triggerClassName = '';

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SelectTrigger) {
      triggerClassName = child.props?.className || '';
    }
  });

  const handleChange = (event) => {
    onValueChange?.(event.target.value);
  };

  const baseClassName = 'w-full rounded-md border border-slate-700/50 bg-slate-800/50 text-slate-100 px-3 py-2 appearance-none';
  const combinedClassName = [baseClassName, triggerClassName, className].filter(Boolean).join(' ');

  return (
    <select value={value} onChange={handleChange} className={combinedClassName}>
      {items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

export function SelectTrigger() {
  return null;
}

export function SelectContent({ children }) {
  return <>{children}</>;
}

export function SelectItem({ children, value }) {
  return <option value={value}>{children}</option>;
}

export function SelectValue() {
  return null;
}

export default Select;

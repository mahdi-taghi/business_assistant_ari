import React from 'react';

function collectSelectItems(children, items = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type;
    const isOptionElement = typeof type === 'string' && type.toLowerCase() === 'option';
    const isSelectItem = type === SelectItem;

    if (isOptionElement || isSelectItem) {
      const { value, children: label, ...rest } = child.props || {};
      if (value === undefined) return;
      items.push({ value, label, props: rest });
    } else if (child.props?.children) {
      collectSelectItems(child.props.children, items);
    }
  });
  return items;
}

export function Select({ children, value, onValueChange, className = '', multiple = false, ...rest }) {
  const items = collectSelectItems(children);
  let triggerClassName = '';

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SelectTrigger) {
      triggerClassName = child.props?.className || '';
    }
  });

  const { onChange, ...otherProps } = rest;

  const handleChange = (event) => {
    if (multiple) {
      const selectedValues = Array.from(event.target.selectedOptions).map((option) => option.value);
      onValueChange?.(selectedValues);
    } else {
      onValueChange?.(event.target.value);
    }
    onChange?.(event);
  };

  const baseClassName = 'w-full rounded-md border border-slate-700/50 bg-slate-800/50 text-slate-100 px-3 py-2 appearance-none';
  const combinedClassName = [baseClassName, triggerClassName, className].filter(Boolean).join(' ');

  const normalizedValue = multiple
    ? Array.isArray(value) ? value : []
    : value ?? '';

  return (
    <select
      className={combinedClassName}
      value={normalizedValue}
      onChange={handleChange}
      multiple={multiple}
      {...otherProps}
    >
      {items.length > 0
        ? items.map(({ value: optionValue, label, props }) => {
            const { className: optionClassName = '', disabled, ...optionRest } = props || {};
            return (
              <option
                key={optionValue}
                value={optionValue}
                className={optionClassName}
                disabled={disabled}
                {...optionRest}
              >
                {label}
              </option>
            );
          })
        : children}
    </select>
  );
}

export function SelectTrigger() {
  return null;
}

export function SelectContent({ children }) {
  return <>{children}</>;
}

export function SelectItem({ children, value, ...props }) {
  return <option value={value} {...props}>{children}</option>;
}

export function SelectValue() {
  return null;
}

export default Select;

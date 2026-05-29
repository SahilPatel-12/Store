import React from 'react';

interface InlineEditProps {
  value: string;
  onChange: (val: string) => void;
  type?: 'text' | 'textarea' | 'number';
  placeholder?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  className?: string;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder = 'Click to edit...',
  style,
  inputStyle,
  className
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempValue, setTempValue] = React.useState(value);

  React.useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(tempValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      setIsEditing(false);
      onChange(tempValue);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value);
    }
  };

  if (isEditing) {
    if (type === 'textarea') {
      return (
        <textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '6px 10px',
            border: '1.5px solid var(--primary-lime, #84cc16)',
            borderRadius: '4px',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 'inherit',
            color: 'var(--text-dark, #1f2937)',
            outline: 'none',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 3px rgba(132, 204, 22, 0.2)',
            ...inputStyle
          }}
        />
      );
    }
    return (
      <input
        type={type}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
        style={{
          width: '100%',
          padding: '4px 8px',
          border: '1.5px solid var(--primary-lime, #84cc16)',
          borderRadius: '4px',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          color: 'var(--text-dark, #1f2937)',
          outline: 'none',
          backgroundColor: '#ffffff',
          boxShadow: '0 0 0 3px rgba(132, 204, 22, 0.2)',
          ...inputStyle
        }}
      />
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Click to edit inline"
      style={{
        cursor: 'pointer',
        borderBottom: '1px dashed #f97316', /* orange dash */
        transition: 'all 0.15s',
        display: 'inline-block',
        minWidth: value ? 'auto' : '80px',
        ...style
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.08)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      className={className}
    >
      {value || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
};

import React from 'react';
import { Image } from 'lucide-react';

interface ImagePlaceholderProps {
  label: string;
  height?: string;
  width?: string;
  style?: React.CSSProperties;
}

export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  label,
  height = '100%',
  width = '100%',
  style,
}) => {
  return (
    <div
      className="image-placeholder"
      style={{
        height,
        width,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '16px',
        textAlign: 'center',
        ...style,
      }}
    >
      <Image size={24} style={{ opacity: 0.4 }} />
      <span style={{ fontSize: '0.72rem', opacity: 0.6, fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
};

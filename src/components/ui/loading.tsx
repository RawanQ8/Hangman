import React from 'react';

import { ActivityIndicator, View } from './index';

type LoadingProps = {
  color?: string;
  size?: 'small' | 'large';
};

/**
 * Centered loading indicator with a light gray backdrop.
 */
export const LoadingOverlay = ({
  color = '#1f2937',
  size = 'large',
}: LoadingProps) => {
  return (
    <View
      pointerEvents="auto"
      className="absolute inset-0 z-50 items-center justify-center bg-gray-100/20"
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

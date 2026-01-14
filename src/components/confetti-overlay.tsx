import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

type ConfettiOverlayProps = {
  visible: boolean;
  count?: number;
  onDone?: () => void;
};

const DEFAULT_COUNT = 200;
const DEFAULT_EXPLOSION_SPEED = 350;
const DEFAULT_FALL_SPEED = 3000;

const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({
  visible,
  count = DEFAULT_COUNT,
  onDone,
}) => {
  const cannonRef = useRef<ConfettiCannon | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return undefined;

    timeoutRef.current = setTimeout(() => {
      cannonRef.current?.start?.();
    }, 0);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" className="absolute inset-0 z-50">
      <ConfettiCannon
        ref={cannonRef}
        count={count}
        origin={{ x: -10, y: 0 }}
        autoStart={false}
        fadeOut
        explosionSpeed={DEFAULT_EXPLOSION_SPEED}
        fallSpeed={DEFAULT_FALL_SPEED}
        onAnimationEnd={onDone}
      />
    </View>
  );
};

export default ConfettiOverlay;

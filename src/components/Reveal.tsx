import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

/**
 * Fades and slides its children in on mount. Used for content that appears
 * conditionally (e.g. an expanding panel) so the reveal feels intentional
 * rather than a hard cut. Opacity + translateY only, so it runs on the native
 * driver and works on react-native-web.
 */
export function Reveal({
  children,
  style,
  duration = 220,
  offset = -8,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
  offset?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [anim, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [offset, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

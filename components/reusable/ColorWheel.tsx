import { useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Path } from 'react-native-svg';

const PADDING = 12;
const SIZE = 220 + PADDING * 2;
const CENTER = SIZE / 2;
const OUTER_R = (SIZE - PADDING * 2) / 2;
const HUE_STEPS = 48;
const SAT_RINGS = 8;

interface ColorWheelProps {
  r: number;
  g: number;
  b: number;
  onColorChange: (r: number, g: number, b: number) => void;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rr = 0,
    gg = 0,
    bb = 0;
  if (h < 60) {
    rr = c;
    gg = x;
  } else if (h < 120) {
    rr = x;
    gg = c;
  } else if (h < 180) {
    gg = c;
    bb = x;
  } else if (h < 240) {
    gg = x;
    bb = c;
  } else if (h < 300) {
    rr = x;
    bb = c;
  } else {
    rr = c;
    bb = x;
  }
  return [
    Math.round((rr + m) * 255),
    Math.round((gg + m) * 255),
    Math.round((bb + m) * 255),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255,
    gn = g / 255,
    bn = b / 255;
  const max = Math.max(rn, gn, bn),
    min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return [h, s, l];
}

function polar(angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

function arcSegmentPath(
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const p1 = polar(startAngle, outerR);
  const p2 = polar(endAngle, outerR);
  const p3 = polar(endAngle, innerR);
  const p4 = polar(startAngle, innerR);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

export default function ColorWheel({
  r,
  g,
  b,
  onColorChange,
}: ColorWheelProps) {
  const segments = useMemo(() => {
    const result: { path: string; color: string }[] = [];
    const hueStep = 360 / HUE_STEPS;
    const ringWidth = OUTER_R / SAT_RINGS;

    for (let hi = 0; hi < HUE_STEPS; hi++) {
      const hue = hi * hueStep;
      const nextHue = hue + hueStep + 0.5; // slight overlap
      for (let si = 0; si < SAT_RINGS; si++) {
        const innerR = si * ringWidth;
        const outerR = (si + 1) * ringWidth;
        const sat = (si + 1) / SAT_RINGS;
        const [cr, cg, cb] = hslToRgb(hue, sat, 0.5);
        result.push({
          path: arcSegmentPath(innerR, outerR, hue, nextHue),
          color: `rgb(${cr},${cg},${cb})`,
        });
      }
    }
    return result;
  }, []);

  const [h, s] = rgbToHsl(r, g, b);
  const indicatorDist = s * OUTER_R;
  const indicator = polar(h, indicatorDist);

  const handleTouch = (x: number, y: number) => {
    const dx = x - CENTER;
    const dy = y - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    const sat = Math.min(dist / OUTER_R, 1);
    const [nr, ng, nb] = hslToRgb(angle, sat, 0.5);
    onColorChange(nr, ng, nb);
  };

  const gesture = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => handleTouch(e.x, e.y))
    .onUpdate((e) => handleTouch(e.x, e.y));

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => handleTouch(e.x, e.y));

  const composed = Gesture.Race(tap, gesture);

  return (
    <View className='items-center mb-4'>
      <GestureDetector gesture={composed}>
        <View>
          <Svg width={SIZE} height={SIZE}>
            {segments.map((seg, i) => (
              <Path key={i} d={seg.path} fill={seg.color} />
            ))}
            {/* White center dot */}
            <Circle cx={CENTER} cy={CENTER} r={4} fill='white' opacity={0.3} />
            {/* Indicator */}
            <Circle
              cx={indicator.x}
              cy={indicator.y}
              r={10}
              fill='none'
              stroke='white'
              strokeWidth={3}
            />
            <Circle
              cx={indicator.x}
              cy={indicator.y}
              r={10}
              fill='none'
              stroke='black'
              strokeWidth={1}
            />
          </Svg>
        </View>
      </GestureDetector>
    </View>
  );
}

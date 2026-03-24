import { Image, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';

const PADDING = 12;
const WHEEL_PX = 200;
const SIZE = WHEEL_PX + PADDING * 2;
const CENTER = SIZE / 2;
const OUTER_R = WHEEL_PX / 2;

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

function generateWheelBmp(size: number): string {
  const center = size / 2;
  const rowSize = Math.ceil((size * 3) / 4) * 4;
  const dataSize = rowSize * size;
  const fileSize = 54 + dataSize;

  const buf = new Uint8Array(fileSize);
  const view = new DataView(buf.buffer);

  buf[0] = 0x42;
  buf[1] = 0x4d;
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, size, true);
  view.setInt32(22, size, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, dataSize, true);

  for (let y = 0; y < size; y++) {
    const row = size - 1 - y;
    for (let x = 0; x < size; x++) {
      const dx = x - center + 0.5;
      const dy = y - center + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offset = 54 + row * rowSize + x * 3;

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      const sat = Math.min(dist / center, 1);
      const [cr, cg, cb] = hslToRgb(angle, sat, 0.5);
      buf[offset] = cb;
      buf[offset + 1] = cg;
      buf[offset + 2] = cr;
    }
  }

  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  for (let i = 0; i < buf.length; i += 3) {
    const b0 = buf[i];
    const b1 = i + 1 < buf.length ? buf[i + 1] : 0;
    const b2 = i + 2 < buf.length ? buf[i + 2] : 0;
    base64 += chars[b0 >> 2];
    base64 += chars[((b0 & 3) << 4) | (b1 >> 4)];
    base64 += i + 1 < buf.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    base64 += i + 2 < buf.length ? chars[b2 & 63] : '=';
  }

  return `data:image/bmp;base64,${base64}`;
}

let cachedWheelUri: string | null = null;

function getWheelUri(): string {
  if (!cachedWheelUri) {
    cachedWheelUri = generateWheelBmp(WHEEL_PX);
  }
  return cachedWheelUri;
}

function polar(angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export default function ColorWheel({
  r,
  g,
  b,
  onColorChange,
}: ColorWheelProps) {
  const wheelUri = getWheelUri();

  const [h, s] = rgbToHsl(r, g, b);
  const indicatorDist = s * OUTER_R;
  const indicator = polar(h, indicatorDist);

  const handleTouch = (x: number, y: number) => {
    const dx = x - CENTER;
    const dy = y - CENTER;

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;

    const dist = Math.sqrt(dx * dx + dy * dy);
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
        <View style={{ width: SIZE, height: SIZE }}>
          <Image
            source={{ uri: wheelUri }}
            style={{
              width: WHEEL_PX,
              height: WHEEL_PX,
              borderRadius: WHEEL_PX / 2,
              position: 'absolute',
              left: PADDING,
              top: PADDING,
            }}
          />
          <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
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

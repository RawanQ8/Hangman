/* eslint-disable max-lines-per-function */
import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

export const Cover = (props: SvgProps) => (
  <Svg viewBox="0 0 831 730" {...props}>
    {/* Background */}
    <Rect x="0" y="0" width="831" height="730" fill="#FFFFFF" />

    {/* Title */}
    <G>
      <SvgText
        x="415.5"
        y="120"
        fontSize="72"
        fontWeight="800"
        textAnchor="middle"
        fill="#3C3A36"
      >
        HANGMAN
      </SvgText>
      <SvgText
        x="415.5"
        y="128"
        fontSize="72"
        fontWeight="800"
        textAnchor="middle"
        fill="#B9B2A8"
        opacity="0.35"
      >
        HANGMAN
      </SvgText>
    </G>

    {/* Gallows */}
    <G transform="translate(103.875 91.25) scale(0.75)">
      {/* Base */}
      <Rect
        x="150"
        y="670"
        width="530"
        height="70"
        rx="18"
        fill="#D3C2AE"
        stroke="#8A7968"
        strokeWidth="4"
      />
      <Rect
        x="150"
        y="670"
        width="530"
        height="18"
        rx="18"
        fill="#E0D2C4"
        opacity="0.8"
      />

      {/* Post */}
      <Rect
        x="210"
        y="210"
        width="84"
        height="460"
        rx="14"
        fill="#D1BDA8"
        stroke="#8A7968"
        strokeWidth="4"
      />

      {/* Beam */}
      <Rect
        x="252"
        y="210"
        width="300"
        height="70"
        rx="14"
        fill="#D1BDA8"
        stroke="#8A7968"
        strokeWidth="4"
      />

      {/* Rope */}
      <Line
        x1="520"
        y1="280"
        x2="520"
        y2="360"
        stroke="#7C6F62"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <Line
        x1="520"
        y1="290"
        x2="520"
        y2="370"
        stroke="#B7ACA1"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Character (alive / neutral) */}
      <G transform={'translate(515 350) scale(0.85) translate(-515 -350)'}>
        {/* Head */}
        <Circle
          cx="520"
          cy="410"
          r="44"
          fill="#EFE6DA"
          stroke="#7B6E62"
          strokeWidth="4"
        />
        {/* Eyes */}
        <Circle cx="505" cy="402" r="4.5" fill="#3D3A36" opacity="0.9" />
        <Circle cx="535" cy="402" r="4.5" fill="#3D3A36" opacity="0.9" />
        {/* Mouth (slight frown) */}
        <Path
          d="M505 426 C512 420, 528 420, 535 426"
          fill="none"
          stroke="#3D3A36"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.75"
        />
        {/* Body */}
        <Path
          d="M490 456
             C478 490, 478 540, 492 568
             C505 595, 535 595, 548 568
             C562 540, 562 490, 550 456
             C530 444, 510 444, 490 456 Z"
          fill="#F6EFE6"
          stroke="#7B6E62"
          strokeWidth="4"
        />
        {/* Arms */}
        <Path
          d="M486 500 C458 520, 458 546, 485 560"
          fill="none"
          stroke="#7B6E62"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Path
          d="M554 500 C582 520, 582 546, 555 560"
          fill="none"
          stroke="#7B6E62"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Legs */}
        <Path
          d="M510 598 C500 632, 500 660, 506 688"
          fill="none"
          stroke="#7B6E62"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <Path
          d="M530 598 C540 632, 540 660, 534 688"
          fill="none"
          stroke="#7B6E62"
          strokeWidth="7"
          strokeLinecap="round"
        />
      </G>
    </G>

    {/* Word tray */}
    <G>
      <Rect
        x="120"
        y="665"
        width="591"
        height="120"
        rx="20"
        fill="#D3C2AE"
        stroke="#8A7968"
        strokeWidth="4"
      />
      {[
        { x: 150, label: '_' },
        { x: 230, label: 'A' },
        { x: 310, label: 'N' },
        { x: 390, label: '_' },
        { x: 470, label: 'M' },
        { x: 550, label: 'A' },
        { x: 630, label: 'N' },
      ].map((t, i) => (
        <G key={i}>
          <Rect
            x={t.x}
            y="688"
            width="62"
            height="62"
            rx="14"
            fill="#FBF7F1"
            stroke="#9A8A78"
            strokeWidth="3"
          />
          <SvgText
            x={t.x + 31}
            y="733"
            fontSize="34"
            fontWeight="800"
            textAnchor="middle"
            fill="#3C3A36"
            opacity={t.label === '_' ? 0.55 : 0.95}
          >
            {t.label}
          </SvgText>
        </G>
      ))}
    </G>

    {/* Subtle tagline */}
    <SvgText
      x="415.5"
      y="812"
      fontSize="20"
      fontWeight="600"
      textAnchor="middle"
      fill="#6E675F"
      opacity="0.8"
    >
      Guess the word • Play with friends
    </SvgText>
  </Svg>
);

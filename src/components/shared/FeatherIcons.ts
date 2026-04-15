import * as React from 'react';
import * as Feather from 'react-feather';

type FeatherCompatProps = {
  color?: string;
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
};

type IconComponent = React.ComponentType<FeatherCompatProps>;

function asIcon(name: keyof typeof Feather): IconComponent {
  return Feather[name] as unknown as IconComponent;
}

export const Activity = asIcon('Activity');
export const ArrowDown = asIcon('ArrowDown');
export const ArrowDownCircle = asIcon('ArrowDownCircle');
export const ArrowUp = asIcon('ArrowUp');
export const ChevronDown = asIcon('ChevronDown');
export const ChevronUp = asIcon('ChevronUp');
export const Cpu = asIcon('Cpu');
export const Database = asIcon('Database');
export const Download = asIcon('Download');
export const DownloadCloud = asIcon('DownloadCloud');
export const Eye = asIcon('Eye');
export const EyeOff = asIcon('EyeOff');
export const FileText = asIcon('FileText');
export const GitHub = asIcon('GitHub');
export const Globe = asIcon('Globe');
export const Hash = asIcon('Hash');
export const Info = asIcon('Info');
export const Link = asIcon('Link');
export const LogOut = asIcon('LogOut');
export const Menu = asIcon('Menu');
export const Monitor = asIcon('Monitor');
export const Pause = asIcon('Pause');
export const Play = asIcon('Play');
export const RefreshCcw = asIcon('RefreshCcw');
export const RefreshCw = asIcon('RefreshCw');
export const RotateCw = asIcon('RotateCw');
export const Settings = asIcon('Settings');
export const Shield = asIcon('Shield');
export const Sliders = asIcon('Sliders');
export const Tag = asIcon('Tag');
export const Tool = asIcon('Tool');
export const Trash2 = asIcon('Trash2');
export const Upload = asIcon('Upload');
export const X = asIcon('X');
export const XCircle = asIcon('XCircle');
export const Zap = asIcon('Zap');

import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * 统一图标组件
 * 内置线性 SVG（Phosphor 风格），按 name 引用
 */
@Component({
  selector: 'app-icon',
  template: `<span class="app-icon" [innerHTML]="safeHtml" [style.width.px]="size" [style.height.px]="size" [style.display]="'inline-block'"></span>`,
})
export class IconComponent {
  @Input() size = 16;
  @Input() name = '';

  constructor(private sanitizer: DomSanitizer) {}

  get safeHtml(): SafeHtml {
    const inner = ICONS[this.name] || '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.size}" height="${this.size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}

const ICONS: Record<string, string> = {
  'cube': '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/>',
  'layers': '<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  'globe': '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  'map': '<path d="M3 6h18M3 12h18M3 18h18"/>',
  'terrain': '<path d="m3 16 4-4 4 4 5-5 5 5"/><path d="M3 21h18"/>',
  'building': '<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/>',
  'bim': '<path d="M12 2v20M2 12h20"/><rect x="3" y="3" width="18" height="18" rx="1"/>',
  'pointcloud': '<circle cx="5" cy="5" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="19" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/>',
  'plane': '<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>',
  'drone': '<path d="M12 2 4 7v10l8 5 8-5V7z"/><circle cx="12" cy="12" r="2"/>',
  'activity': '<path d="M3 12h4l3-9 4 18 3-9h4"/>',
  'no-fly': '<path d="M3 6h18v12H3z"/><path d="M3 10h18M3 14h18"/>',
  'limit': '<path d="M12 22s-8-4.5-8-12a8 8 0 0 1 16 0c0 7.5-8 12-8 12Z"/><circle cx="12" cy="10" r="3"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>',
  'poi': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/>',
  'weather': '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'close': '<path d="M18 6 6 18M6 6l12 12"/>',
  'filter': '<path d="M3 6h18M7 12h10M10 18h4"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'play': '<path d="M8 5v14l11-7z"/>',
  'pause': '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-up': '<path d="m18 15-6-6-6 6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'arrow-right': '<path d="M5 12h14M12 5l7 7-7 7"/>',
  'arrow-up': '<path d="M12 19V5M5 12l7-7 7 7"/>',
  'arrow-down': '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  'pan': '<path d="M5 9V5a2 2 0 0 1 4 0v6M9 7v8M3 11l2-2 2 2M14 7h6M17 4v6M14 17l3 3 3-3M17 14v6"/>',
  'zoom': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3M8 11h6M11 8v6"/>',
  'rotate': '<path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.6L21 8"/><path d="M21 3v5h-5"/>',
  'ruler': '<path d="M21.3 8.7 8.7 21.3a1 1 0 0 1-1.4 0L2.7 16.7a1 1 0 0 1 0-1.4L15.3 2.7a1 1 0 0 1 1.4 0l4.6 4.6a1 1 0 0 1 0 1.4Z"/><path d="m7.5 10.5 2 2M10.5 7.5 12.5 9.5M13.5 4.5 15.5 6.5M4.5 13.5 6.5 15.5"/>',
  'area': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/>',
  'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  'camera': '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  'fullscreen': '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  'navigation': '<path d="M3 11l19-9-9 19-2-8-8-2z"/>',
  'compass': '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  'battery': '<rect x="2" y="7" width="18" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/>',
  'signal': '<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8"/>',
  'satellite': '<path d="M13 7 9 3 5 7l4 4M17 11l4 4-4 4-4-4M7.5 12.5 11 16M12 22v-3"/>',
  'warning': '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  'alert-triangle': '<path d="M12 2 1 21h22z"/><path d="M12 9v5M12 18v.01"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'x-circle': '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  'pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/>',
  'edit': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  'chart': '<path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 5-5"/>',
  'bolt': '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  'refresh': '<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
  'history': '<path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>',
  'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  'home': '<path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  'charging-station': '<path d="M19 4h-2a2 2 0 0 0-2 2v14h6V6a2 2 0 0 0-2-2zM5 20V6a2 2 0 0 1 2-2h2v16M7 12h2M14 2v20M7 7h2"/>',
  'nest': '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5"/>',
  'cloud': '<path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.8A7 7 0 1 0 4 16.92"/>',
};

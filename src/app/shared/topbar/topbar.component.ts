import { Component, Input, Output, EventEmitter } from '@angular/core';

interface NavTab {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-topbar',
  template: `
    <header class="topbar">
      <div class="brand">
        <div class="logo">
          <app-icon name="cube" [size]="16"></app-icon>
        </div>
        <div>
          HighLower <span class="sub">低空管理平台</span>
        </div>
      </div>
      <nav class="nav-tabs">
        <a *ngFor="let tab of tabs" [class.active]="tab.path === active" (click)="select(tab.path)">
          <app-icon [name]="tab.icon" [size]="15"></app-icon>
          {{ tab.label }}
        </a>
      </nav>
      <div class="spacer"></div>
      <div class="search">
        <app-icon name="search" [size]="14"></app-icon>
        <input [placeholder]="searchPlaceholder" />
        <kbd>Ctrl K</kbd>
      </div>
      <div class="stat-chip success" style="margin-left:12px">
        <span class="dot"></span><span class="num">{{ onlineCount }}</span><span>在线</span>
      </div>
      <div class="stat-chip danger" style="margin-left:8px">
        <span class="dot"></span><span class="num">{{ alertCount }}</span><span>告警</span>
      </div>
      <div class="user">SH</div>
    </header>
  `,
})
export class TopBarComponent {
  @Input() active = '';
  @Input() searchPlaceholder = '搜索地点 / 坐标 / 实体ID';
  @Input() onlineCount = 0;
  @Input() alertCount = 0;
  @Output() navigate = new EventEmitter<string>();

  tabs: NavTab[] = [
    { label: '三维场景', icon: 'globe', path: '/scene' },
    { label: '航迹管理', icon: 'activity', path: '/trajectory' },
    { label: '基础设施', icon: 'building', path: '/infrastructure' },
  ];

  select(path: string) {
    this.navigate.emit(path);
  }
}

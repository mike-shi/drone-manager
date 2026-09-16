import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * 浮动面板组件
 * 标题 + 折叠 + 关闭，玻璃态背景
 */
@Component({
  selector: 'app-floating-panel',
  template: `
    <section class="panel" [class.collapsed]="collapsed" [style.width.px]="width" [style.left.px]="left" [style.right.px]="right" [style.top.px]="top" [style.bottom.px]="bottom" [style.maxHeight.px]="maxHeight">
      <div class="panel-head">
        <app-icon [name]="icon" [size]="16" *ngIf="icon"></app-icon>
        <span class="title">{{ title }}</span>
        <span class="badge" *ngIf="badge">{{ badge }}</span>
        <button class="btn-icon" (click)="collapsed = !collapsed" *ngIf="collapsible">
          <app-icon [name]="collapsed ? 'chevron-down' : 'chevron-up'" [size]="14"></app-icon>
        </button>
        <button class="btn-icon" (click)="close.emit()" *ngIf="closable">
          <app-icon name="close" [size]="14"></app-icon>
        </button>
      </div>
      <div class="panel-body" *ngIf="!collapsed">
        <ng-content></ng-content>
      </div>
    </section>
  `,
  host: { '[class.app-floating-panel]': 'true' },
})
export class FloatingPanelComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() badge = '';
  @Input() width = 320;
  @Input() left: number | null = null;
  @Input() right: number | null = null;
  @Input() top: number | null = null;
  @Input() bottom: number | null = null;
  @Input() maxHeight: number | null = null;
  @Input() collapsible = true;
  @Input() closable = false;
  @Input() collapsed = false;
  @Output() close = new EventEmitter<void>();
}

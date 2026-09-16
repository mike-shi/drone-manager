import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Status } from '../../core/models/models';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge-status {{ status }}" [class.dot-only]="dotOnly">
    <span class="dot"></span>
    <ng-content></ng-content>
  </span>`,
})
export class StatusBadgeComponent {
  @Input() status: Status = 'success';
  @Input() dotOnly = false;
}

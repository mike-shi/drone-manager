import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon/icon.component';
import { TopBarComponent } from './topbar/topbar.component';
import { StatusBadgeComponent } from './status-badge/status-badge.component';
import { FloatingPanelComponent } from './floating-panel/floating-panel.component';

@NgModule({
  declarations: [IconComponent, TopBarComponent, StatusBadgeComponent, FloatingPanelComponent],
  imports: [CommonModule],
  exports: [IconComponent, TopBarComponent, StatusBadgeComponent, FloatingPanelComponent],
})
export class SharedModule {}

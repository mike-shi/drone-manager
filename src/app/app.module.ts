import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { SceneComponent } from './modules/scene/scene.component';
import { TrajectoryComponent } from './modules/trajectory/trajectory.component';
import { InfrastructureComponent } from './modules/infrastructure/infrastructure.component';

@NgModule({
  declarations: [AppComponent, SceneComponent, TrajectoryComponent, InfrastructureComponent],
  imports: [BrowserModule, AppRoutingModule, SharedModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

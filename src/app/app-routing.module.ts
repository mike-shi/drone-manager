import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SceneComponent } from './modules/scene/scene.component';
import { TrajectoryComponent } from './modules/trajectory/trajectory.component';
import { InfrastructureComponent } from './modules/infrastructure/infrastructure.component';

const routes: Routes = [
  { path: '', redirectTo: 'scene', pathMatch: 'full' },
  { path: 'scene', component: SceneComponent },
  { path: 'trajectory', component: TrajectoryComponent },
  { path: 'infrastructure', component: InfrastructureComponent },
  { path: '**', redirectTo: 'scene' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

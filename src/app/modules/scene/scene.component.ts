import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CesiumService } from '../../core/services/cesium.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Layer, LayerCategory, LatLngAlt } from '../../core/models/models';

declare const Cesium: any;

interface LayerGroup {
  category: LayerCategory;
  title: string;
  layers: Layer[];
}

@Component({
  selector: 'app-scene',
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss'],
})
export class SceneComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewerContainer', { static: true }) viewerContainer!: ElementRef<HTMLDivElement>;

  layers: Layer[] = [];
  layerGroups: LayerGroup[] = [];
  selectedPreset = 'top';
  heading = 0;
  pitch = -45;
  viewHeight = 2400;
  coord: LatLngAlt | null = null;
  activeTool = 'pan';

  private subs: Subscription[] = [];

  constructor(
    private cesium: CesiumService,
    private mock: MockDataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.mock.startRealtime();
    this.subs.push(
      this.mock.getLayers().subscribe((layers) => {
        this.layers = layers;
        this.layerGroups = this.groupLayers(layers);
      }),
    );
  }

  ngAfterViewInit(): void {
    this.cesium.init({
      container: this.viewerContainer.nativeElement,
      onReady: (viewer) => {
        // 飞到深圳南山
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(113.9408, 22.5266, 3000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
        });
        // 添加示例 POI
        this.cesium.addPoi('vp07', { lng: 113.9408, lat: 22.5266, alt: 86 }, 'VP-007');
        this.cesium.addPoi('vp03', { lng: 113.9108, lat: 22.5366, alt: 78 }, 'VP-003', '#FF8A1E');
        this.cesium.addPoi('vp05', { lng: 114.0508, lat: 22.5366, alt: 65 }, 'VP-005', '#22C55E');
        // 添加示例禁飞区
        this.cesium.addRestrictedZone(
          'R03',
          { lng: 114.0000, lat: 22.5500, alt: 0 },
          1.5,
          'RESTRICTED-03',
        );
      },
      onCameraChange: (h, p, height) => {
        this.heading = Math.round(h);
        this.pitch = Math.round(p);
        this.viewHeight = height;
      },
      onMouseMove: (coord) => {
        this.coord = coord;
      },
    });
    this.cesium.fitToView();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.cesium.destroy();
  }

  private groupLayers(layers: Layer[]): LayerGroup[] {
    const titles: Record<LayerCategory, string> = {
      basemap: '基础底图',
      model: '三维模型',
      airspace: '空域 & 标注',
      realtime: '实时数据',
    };
    const order: LayerCategory[] = ['basemap', 'model', 'airspace', 'realtime'];
    return order.map((cat) => ({
      category: cat,
      title: titles[cat],
      layers: layers.filter((l) => l.category === cat),
    }));
  }

  get enabledCount(): number {
    return this.layers.filter((l) => l.enabled).length;
  }

  get compassRotation(): number {
    return this.heading;
  }

  get altitudeKm(): string {
    if (this.viewHeight < 1000) return `${Math.round(this.viewHeight)} m`;
    return `${(this.viewHeight / 1000).toFixed(1)} km`;
  }

  get altPercent(): number {
    const min = 50;
    const max = 100000;
    const v = Math.min(max, Math.max(min, this.viewHeight));
    return ((Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min))) * 100;
  }

  toggleLayer(id: string, event: Event) {
    event.stopPropagation();
    this.mock.toggleLayer(id);
  }

  onOpacityChange(layer: Layer, event: Event) {
    const input = event.target as HTMLInputElement;
    this.mock.setLayerOpacity(layer.id, +input.value);
  }

  selectPreset(preset: string) {
    this.selectedPreset = preset;
    this.cesium.setViewPreset(preset as any);
  }

  setTool(tool: string) {
    this.activeTool = tool;
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }
}

import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CesiumService } from '../../core/services/cesium.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Drone, Alert, TrackPoint, Status } from '../../core/models/models';

declare const Cesium: any;

@Component({
  selector: 'app-trajectory',
  templateUrl: './trajectory.component.html',
  styleUrls: ['./trajectory.component.scss'],
})
export class TrajectoryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewerContainer', { static: true }) viewerContainer!: ElementRef<HTMLDivElement>;

  drones: Drone[] = [];
  alerts: Alert[] = [];
  tracks: Record<string, TrackPoint[]> = {};
  selectedDroneId: string | null = 'DJI-M300';
  filter = 'all';
  now = Date.now();
  private nowTimer: ReturnType<typeof setInterval> | null = null;

  private subs: Subscription[] = [];
  private droneIds: string[] = [];

  constructor(
    private cesium: CesiumService,
    private mock: MockDataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.mock.startRealtime();
    this.nowTimer = setInterval(() => (this.now = Date.now()), 1000);
    this.subs.push(
      this.mock.getDrones().subscribe((drones) => {
        this.drones = drones;
        this.droneIds = drones.map((d) => d.id);
        // 更新实体
        drones.forEach((d) => {
          if (d.status !== 'offline') {
            this.cesium.upsertDrone(d);
          }
        });
      }),
      this.mock.getTracks().subscribe((tracks) => {
        this.tracks = tracks;
        // 更新航迹
        Object.keys(tracks).forEach((id) => {
          this.cesium.upsertTrack(id, tracks[id], id === this.selectedDroneId);
        });
      }),
      this.mock.getAlerts().subscribe((alerts) => {
        this.alerts = alerts;
      }),
    );
  }

  ngAfterViewInit(): void {
    this.cesium.init({
      container: this.viewerContainer.nativeElement,
      onReady: (viewer) => {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(113.9408, 22.5266, 2500),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
        });
        // 补绘：ngOnInit 订阅触发时 Viewer 尚未就绪，此处重放一次
        this.drones.forEach((d) => {
          if (d.status !== 'offline') this.cesium.upsertDrone(d);
        });
        Object.keys(this.tracks).forEach((id) => {
          this.cesium.upsertTrack(id, this.tracks[id], id === this.selectedDroneId);
        });
        // 添加禁飞区
        this.cesium.addRestrictedZone(
          'R03',
          { lng: 114.0, lat: 22.55, alt: 0 },
          1.5,
          'RESTRICTED-03',
        );
        // 跟随选中无人机
        if (this.selectedDroneId) {
          setTimeout(() => this.cesium.trackEntity(`drone-${this.selectedDroneId}`), 800);
        }
      },
      onEntityClick: (entity) => {
        if (entity._droneId) {
          this.selectedDroneId = entity._droneId;
          this.cesium.trackEntity(`drone-${entity._droneId}`);
        }
      },
    });
    this.cesium.fitToView();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.nowTimer) clearInterval(this.nowTimer);
    this.cesium.destroy();
  }

  get selectedDrone(): Drone | null {
    return this.drones.find((d) => d.id === this.selectedDroneId) || null;
  }

  get filteredDrones(): Drone[] {
    if (this.filter === 'all') return this.drones;
    if (this.filter === 'online') return this.drones.filter((d) => d.status === 'success' || d.status === 'info');
    if (this.filter === 'alert') return this.drones.filter((d) => d.status === 'danger' || d.status === 'warning');
    if (this.filter === 'offline') return this.drones.filter((d) => d.status === 'offline');
    return this.drones;
  }

  get flyingDrones(): Drone[] {
    return this.drones.filter((d) => d.position.alt > 0);
  }

  get standbyDrones(): Drone[] {
    return this.drones.filter((d) => d.position.alt === 0 && d.status !== 'offline');
  }

  get onlineCount(): number {
    return this.drones.filter((d) => d.status !== 'offline').length;
  }

  get alertCount(): number {
    return this.drones.filter((d) => d.status === 'danger' || d.status === 'warning').length;
  }

  get lowBatteryCount(): number {
    return this.drones.filter((d) => d.battery > 0 && d.battery < 40).length;
  }

  get activeAlerts(): Alert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  get topAlert(): Alert | null {
    return this.activeAlerts[0] || null;
  }

  getSelectedTrackPoints(): TrackPoint[] {
    return this.selectedDroneId ? this.tracks[this.selectedDroneId] || [] : [];
  }

  statusLabel(s: Status): string {
    const m: Record<Status, string> = {
      success: '飞行',
      warning: '预警',
      danger: '偏航',
      info: '待命',
      offline: '离线',
    };
    return m[s] || s;
  }

  selectDrone(id: string) {
    this.selectedDroneId = id;
    this.cesium.trackEntity(`drone-${id}`);
  }

  setFilter(f: string) {
    this.filter = f;
  }

  followDrone() {
    if (this.selectedDroneId) this.cesium.trackEntity(`drone-${this.selectedDroneId}`);
  }

  returnHome() {
    this.cesium.stopTracking();
  }

  ackAlert(id: string, event: Event) {
    event.stopPropagation();
    this.mock.acknowledgeAlert(id);
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  // ===== 辅助方法 =====
  private statusColor(s: Status): string {
    const m: Record<Status, string> = {
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      offline: '#5A6478',
    };
    return m[s] || '#FFFFFF';
  }

  avatarStyle(s: Status): { [k: string]: string } {
    const c = this.statusColor(s);
    return { background: `${c}1f` };
  }

  heroIconStyle(s: Status): { [k: string]: string } {
    const c = this.statusColor(s);
    return {
      background: `${c}1f`,
      'border-color': `${c}4d`,
      color: c,
    };
  }

  dotStyle(s: Status): { [k: string]: string } {
    return { background: this.statusColor(s) };
  }

  alertDotStyle(level: Status): { [k: string]: string } {
    const c = this.statusColor(level);
    return {
      background: c,
      'box-shadow': `0 0 6px ${c}`,
    };
  }

  batteryRemaining(d: Drone): string {
    if (d.battery <= 0) return '—';
    const minutes = Math.round((d.battery / 100) * 25);
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  }

  signalLevel(signal: number): number {
    if (signal === 0) return 0;
    if (signal > -65) return 5;
    if (signal > -75) return 4;
    if (signal > -82) return 3;
    if (signal > -88) return 2;
    return 1;
  }

  trackDistance(points: TrackPoint[]): string {
    if (points.length < 2) return '0.0';
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1].position;
      const b = points[i].position;
      const dx = (b.lng - a.lng) * 111320 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
      const dy = (b.lat - a.lat) * 110540;
      dist += Math.sqrt(dx * dx + dy * dy);
    }
    return (dist / 1000).toFixed(2);
  }

  trackDuration(points: TrackPoint[]): string {
    if (points.length < 2) return '00:00';
    const sec = Math.floor((points[points.length - 1].time - points[0].time) / 1000);
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }
}

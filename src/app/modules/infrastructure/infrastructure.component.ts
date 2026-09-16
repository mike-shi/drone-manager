import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CesiumService } from '../../core/services/cesium.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Facility, FacilityType, Status, Slot } from '../../core/models/models';

declare const Cesium: any;

interface TypeFilter {
  type: FacilityType;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-infrastructure',
  templateUrl: './infrastructure.component.html',
  styleUrls: ['./infrastructure.component.scss'],
})
export class InfrastructureComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewerContainer', { static: true }) viewerContainer!: ElementRef<HTMLDivElement>;

  facilities: Facility[] = [];
  selectedType: FacilityType | 'all' = 'vertiport';
  selectedId: string | null = 'VP-007';

  private subs: Subscription[] = [];

  typeFilters: TypeFilter[] = [
    { type: 'vertiport', name: '起降场', icon: 'building' },
    { type: 'charging', name: '充电桩', icon: 'bolt' },
    { type: 'nest', name: '机巢', icon: 'nest' },
    { type: 'maintenance', name: '维护站', icon: 'settings' },
    { type: 'weather', name: '气象站', icon: 'weather' },
    { type: 'communication', name: '通信基站', icon: 'satellite' },
  ];

  constructor(
    private cesium: CesiumService,
    private mock: MockDataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.mock.getFacilities().subscribe((facs) => {
        this.facilities = facs;
        // 更新实体
        facs.forEach((f) => this.cesium.upsertFacility(f, f.id === this.selectedId));
      }),
    );
  }

  ngAfterViewInit(): void {
    this.cesium.init({
      container: this.viewerContainer.nativeElement,
      onReady: (viewer) => {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(113.9408, 22.5266, 5000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-50),
            roll: 0,
          },
        });
        // 补绘：ngOnInit 订阅触发时 Viewer 尚未就绪，此处重放一次
        this.facilities.forEach((f) =>
          this.cesium.upsertFacility(f, f.id === this.selectedId),
        );
        // 聚焦选中设施
        setTimeout(() => {
          if (this.selectedId) this.cesium.zoomToEntity(`fac-${this.selectedId}`, 1500);
        }, 500);
      },
      onEntityClick: (entity) => {
        if (entity._facilityId) {
          this.selectedId = entity._facilityId;
          this.cesium.zoomToEntity(`fac-${entity._facilityId}`, 1200);
        }
      },
    });
    this.cesium.fitToView();
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.cesium.destroy();
  }

  get filteredFacilities(): Facility[] {
    if (this.selectedType === 'all') return this.facilities;
    if (this.selectedType === 'vertiport') return this.facilities.filter((f) => f.type === 'vertiport');
    return this.facilities.filter((f) => f.type === this.selectedType);
  }

  get vertiports(): Facility[] {
    return this.facilities.filter((f) => f.type === 'vertiport');
  }

  get chargers(): Facility[] {
    return this.facilities.filter((f) => f.type === 'charging');
  }

  get facilityByType(): Record<FacilityType, number> {
    const map: Record<FacilityType, number> = {
      vertiport: 0,
      charging: 0,
      nest: 0,
      maintenance: 0,
      weather: 0,
      communication: 0,
    };
    this.facilities.forEach((f) => (map[f.type] = (map[f.type] || 0) + 1));
    return map;
  }

  get okCount(): number {
    return this.facilities.filter((f) => f.status === 'success').length;
  }
  get busyCount(): number {
    return this.facilities.filter((f) => f.status === 'warning').length;
  }
  get faultCount(): number {
    return this.facilities.filter((f) => f.status === 'danger').length;
  }

  get selectedFacility(): Facility | null {
    return this.facilities.find((f) => f.id === this.selectedId) || null;
  }

  statusLabel(s: Status): string {
    const m: Record<Status, string> = {
      success: '正常',
      warning: '繁忙',
      danger: '故障',
      info: '信息',
      offline: '离线',
    };
    return m[s] || s;
  }

  selectType(t: FacilityType) {
    this.selectedType = t;
  }

  selectFacility(id: string) {
    this.selectedId = id;
    this.cesium.zoomToEntity(`fac-${id}`, 1200);
  }

  locateFacility() {
    if (this.selectedId) this.cesium.zoomToEntity(`fac-${this.selectedId}`, 800);
  }

  navigate(path: string) {
    this.router.navigate([path]);
  }

  // ===== 设施图标颜色 =====
  facilityIconStyle(type: FacilityType, status: Status): { [k: string]: string } {
    const typeColors: Record<FacilityType, string> = {
      vertiport: '#FF8A1E',
      charging: '#22C55E',
      nest: '#3B82F6',
      maintenance: '#8A95A8',
      weather: '#8A95A8',
      communication: '#8A95A8',
    };
    const statusColors: Record<Status, string> = {
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      offline: '#5A6478',
    };
    const c = status === 'danger' ? statusColors[status] : typeColors[type];
    return { background: `${c}1f`, color: c };
  }

  // ===== 容量环 =====
  getCapacityPercent(f: Facility): number {
    if (!f.slots) return 0;
    const occupied = f.slots.filter((s) => s.status === 'occupied').length;
    return (occupied / f.slots.length) * 100;
  }

  getCapacityStroke(f: Facility): number {
    const r = 32;
    const circ = 2 * Math.PI * r;
    return circ - (this.getCapacityPercent(f) / 100) * circ;
  }

  getOccupiedCount(f: Facility): number {
    return f.slots?.filter((s) => s.status === 'occupied').length || 0;
  }

  getIdleCount(f: Facility): number {
    return f.slots?.filter((s) => s.status === 'idle').length || 0;
  }

  getMaintCount(f: Facility): number {
    return f.slots?.filter((s) => s.status === 'maint').length || 0;
  }

  slotClass(s: Slot): string {
    return s.status;
  }
}

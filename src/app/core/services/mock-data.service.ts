import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { Drone, TrackSegment, Alert, Layer, Facility, TrackPoint, LatLngAlt } from '../models/models';

/**
 * Mock 数据服务
 * 模拟后端 API + 实时数据流
 * 后续可平滑替换为真实 HTTP 请求
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {
  private shenzhen: LatLngAlt = { lng: 113.9408, lat: 22.5266, alt: 86.4 };

  // ===== 无人机 =====
  private drones: Drone[] = this.initDrones();
  private drones$ = new BehaviorSubject<Drone[]>(this.drones);

  // ===== 航迹 =====
  private tracks: Record<string, TrackPoint[]> = {};
  private tracks$ = new BehaviorSubject<Record<string, TrackPoint[]>>({});

  // ===== 告警 =====
  private alerts: Alert[] = this.initAlerts();
  private alerts$ = new BehaviorSubject<Alert[]>(this.alerts);

  // ===== 图层 =====
  private layers: Layer[] = this.initLayers();
  private layers$ = new BehaviorSubject<Layer[]>(this.layers);

  // ===== 设施 =====
  private facilities: Facility[] = this.initFacilities();
  private facilities$ = new BehaviorSubject<Facility[]>(this.facilities);

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initTracks();
  }

  // ==================== 无人机 ====================
  getDrones(): Observable<Drone[]> {
    return this.drones$.asObservable();
  }

  getDrone(id: string): Drone | undefined {
    return this.drones.find((d) => d.id === id);
  }

  /** 启动实时模拟（每秒更新位置与遥测） */
  startRealtime() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 1000);
  }

  stopRealtime() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    const now = Date.now();
    this.drones = this.drones.map((d) => {
      if (d.status === 'offline') return d;
      // 推进位置
      const dt = 1;
      const dist = d.velocity * dt;
      const rad = (d.heading * Math.PI) / 180;
      const dLng = (dist * Math.sin(rad)) / 111320 * (1 / Math.cos((d.position.lat * Math.PI) / 180));
      const dLat = (dist * Math.cos(rad)) / 110540;
      const newPos: LatLngAlt = {
        lng: d.position.lng + dLng,
        lat: d.position.lat + dLat,
        alt: Math.max(20, d.position.alt + d.climbRate * dt),
      };
      // 小幅扰动航向与速度
      const newHeading = (d.heading + (Math.random() - 0.5) * 4 + 360) % 360;
      const newSpeed = Math.max(0, d.velocity + (Math.random() - 0.5) * 0.8);
      // 电量缓慢下降
      const newBattery = Math.max(0, d.battery - 0.05);
      // 追加航迹
      const tp: TrackPoint = {
        time: now,
        position: newPos,
        heading: newHeading,
        speed: newSpeed,
      };
      this.tracks[d.id] = this.tracks[d.id] || [];
      this.tracks[d.id].push(tp);
      if (this.tracks[d.id].length > 300) this.tracks[d.id].shift();

      return {
        ...d,
        position: newPos,
        heading: newHeading,
        velocity: newSpeed,
        battery: newBattery,
        lastUpdate: now,
      };
    });
    this.drones$.next(this.drones);
    this.tracks$.next({ ...this.tracks });
  }

  private initDrones(): Drone[] {
    const now = Date.now();
    return [
      {
        id: 'DJI-M300',
        name: 'DJI-M300',
        sn: '4F8A2C',
        type: 'multirotor',
        status: 'success',
        position: { lng: 113.9408, lat: 22.5266, alt: 182 },
        velocity: 14.2,
        heading: 47,
        climbRate: 0.8,
        battery: 78,
        signal: -72,
        gnssSatellites: 14,
        temperature: 24,
        windSpeed: 7.2,
        homeVertiportId: 'VP-007',
        lastUpdate: now,
      },
      {
        id: 'EVTOL-X1',
        name: 'eVTOL-X1',
        sn: '7B3D91',
        type: 'vtol',
        status: 'success',
        position: { lng: 113.9208, lat: 22.5366, alt: 320 },
        velocity: 22.5,
        heading: 215,
        climbRate: 0,
        battery: 65,
        signal: -78,
        gnssSatellites: 12,
        temperature: 23,
        windSpeed: 6.5,
        homeVertiportId: 'VP-003',
        lastUpdate: now,
      },
      {
        id: 'MAVIC-3E',
        name: 'MAVIC-3E',
        sn: '2A9F4D',
        type: 'multirotor',
        status: 'success',
        position: { lng: 113.9608, lat: 22.5166, alt: 96 },
        velocity: 8.1,
        heading: 92,
        climbRate: 0.2,
        battery: 91,
        signal: -80,
        gnssSatellites: 11,
        temperature: 25,
        windSpeed: 5.8,
        homeVertiportId: 'VP-005',
        lastUpdate: now,
      },
      {
        id: 'PHANTOM-7',
        name: 'PHANTOM-7',
        sn: '5C1E8A',
        type: 'multirotor',
        status: 'danger',
        position: { lng: 113.9508, lat: 22.5466, alt: 144 },
        velocity: 11.8,
        heading: 285,
        climbRate: -0.5,
        battery: 42,
        signal: -84,
        gnssSatellites: 9,
        temperature: 26,
        windSpeed: 8.4,
        homeVertiportId: 'VP-009',
        lastUpdate: now,
      },
      {
        id: 'DJI-M350',
        name: 'DJI-M350',
        sn: '6D2B7C',
        type: 'multirotor',
        status: 'info',
        position: { lng: 113.9408, lat: 22.5266, alt: 0 },
        velocity: 0,
        heading: 0,
        climbRate: 0,
        battery: 100,
        signal: 0,
        gnssSatellites: 0,
        temperature: 24,
        windSpeed: 0,
        homeVertiportId: 'VP-007',
        lastUpdate: now,
      },
      {
        id: 'INSPIRE-3',
        name: 'INSPIRE-3',
        sn: '8E4A1B',
        type: 'multirotor',
        status: 'warning',
        position: { lng: 113.9350, lat: 22.5280, alt: 0 },
        velocity: 0,
        heading: 0,
        climbRate: 0,
        battery: 34,
        signal: 0,
        gnssSatellites: 0,
        temperature: 24,
        windSpeed: 0,
        homeVertiportId: 'VP-003',
        lastUpdate: now,
      },
      {
        id: 'MAVIC-3T',
        name: 'MAVIC-3T',
        sn: '3F7C9D',
        type: 'multirotor',
        status: 'offline',
        position: { lng: 113.9300, lat: 22.5200, alt: 0 },
        velocity: 0,
        heading: 0,
        climbRate: 0,
        battery: 0,
        signal: 0,
        gnssSatellites: 0,
        temperature: 0,
        windSpeed: 0,
        homeVertiportId: 'VP-011',
        lastUpdate: now - 3600000,
      },
    ];
  }

  private initTracks() {
    const now = Date.now();
    this.drones.forEach((d) => {
      this.tracks[d.id] = [];
      // 生成历史 5 分钟航迹
      for (let i = 60; i >= 0; i--) {
        const t = now - i * 1000;
        const rad = (d.heading * Math.PI) / 180;
        const back = i * d.velocity;
        const dLng = (back * Math.sin(rad)) / 111320 / Math.cos((d.position.lat * Math.PI) / 180);
        const dLat = (back * Math.cos(rad)) / 110540;
        this.tracks[d.id].push({
          time: t,
          position: {
            lng: d.position.lng - dLng,
            lat: d.position.lat - dLat,
            alt: Math.max(20, d.position.alt - i * 0.3),
          },
          heading: d.heading,
          speed: d.velocity,
        });
      }
    });
    this.tracks$.next({ ...this.tracks });
  }

  getTracks(): Observable<Record<string, TrackPoint[]>> {
    return this.tracks$.asObservable();
  }

  getTrack(droneId: string): TrackPoint[] {
    return this.tracks[droneId] || [];
  }

  // ==================== 告警 ====================
  getAlerts(): Observable<Alert[]> {
    return this.alerts$.asObservable();
  }

  acknowledgeAlert(id: string) {
    this.alerts = this.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
    this.alerts$.next(this.alerts);
  }

  private initAlerts(): Alert[] {
    const now = Date.now();
    return [
      {
        id: 'A1',
        level: 'danger',
        droneId: 'PHANTOM-7',
        droneName: 'PHANTOM-7',
        facilityId: null,
        facilityName: null,
        message: 'PHANTOM-7 偏航 48m · 接近禁飞区边界',
        detail: '距禁飞区 RESTRICTED-03 边界 320m，航迹偏差持续 12 秒',
        time: now - 12000,
        acknowledged: false,
      },
      {
        id: 'A2',
        level: 'warning',
        droneId: 'INSPIRE-3',
        droneName: 'INSPIRE-3',
        facilityId: null,
        facilityName: null,
        message: 'INSPIRE-3 电量低 34% · 建议返航',
        detail: '当前电量低于安全阈值（40%），剩余续航约 6 分钟',
        time: now - 60000,
        acknowledged: false,
      },
      {
        id: 'A3',
        level: 'info',
        droneId: 'MAVIC-3E',
        droneName: 'MAVIC-3E',
        facilityId: null,
        facilityName: null,
        message: 'MAVIC-3E 信号弱 -84 dBm',
        detail: '4G 链路信号强度下降，可能影响实时图传',
        time: now - 240000,
        acknowledged: true,
      },
      {
        id: 'A4',
        level: 'danger',
        droneId: 'MAVIC-3T',
        droneName: 'MAVIC-3T',
        facilityId: null,
        facilityName: null,
        message: 'MAVIC-3T 链路中断',
        detail: '失联超过 60 分钟，最后位置：113.9300, 22.5200',
        time: now - 3600000,
        acknowledged: true,
      },
    ];
  }

  // ==================== 图层 ====================
  getLayers(): Observable<Layer[]> {
    return this.layers$.asObservable();
  }

  toggleLayer(id: string) {
    this.layers = this.layers.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l));
    this.layers$.next(this.layers);
  }

  setLayerOpacity(id: string, opacity: number) {
    this.layers = this.layers.map((l) => (l.id === id ? { ...l, opacity } : l));
    this.layers$.next(this.layers);
  }

  private initLayers(): Layer[] {
    return [
      { id: 'satellite', category: 'basemap', name: '卫星影像', meta: 'Cesium ion · 18级', enabled: true, opacity: 85, icon: 'satellite' },
      { id: 'terrain', category: 'basemap', name: '地形 (DEM)', meta: 'SRTM 30m', enabled: true, opacity: 100, icon: 'terrain' },
      { id: 'vector', category: 'basemap', name: '矢量地图', meta: 'OSM · 道路/建筑', enabled: false, opacity: 100, icon: 'map' },
      { id: 'photogrammetry', category: 'model', name: '倾斜摄影', meta: '深圳南山 · 3D Tiles', enabled: true, opacity: 100, icon: 'building' },
      { id: 'bim', category: 'model', name: 'BIM 模型', meta: '起降场结构 · LOD2', enabled: true, opacity: 100, icon: 'bim' },
      { id: 'manualmodel', category: 'model', name: '人工建模', meta: '城市建筑白模', enabled: false, opacity: 100, icon: 'cube' },
      { id: 'pointcloud', category: 'model', name: '点云数据', meta: '电力塔 · LAS', enabled: false, opacity: 100, icon: 'pointcloud' },
      { id: 'no-fly', category: 'airspace', name: '禁飞区', meta: '民航局 · 7 区域', enabled: true, opacity: 100, icon: 'no-fly' },
      { id: 'limit-height', category: 'airspace', name: '限高区', meta: '120m / 300m', enabled: true, opacity: 100, icon: 'limit' },
      { id: 'temp-control', category: 'airspace', name: '临时管制', meta: '2 进行中', enabled: false, opacity: 100, icon: 'clock' },
      { id: 'poi', category: 'airspace', name: '兴趣点 POI', meta: '用户标注 · 56', enabled: true, opacity: 100, icon: 'poi' },
      { id: 'adsb', category: 'realtime', name: 'ADS-B 航迹', meta: '1Hz · 7 目标', enabled: true, opacity: 100, icon: 'plane' },
      { id: 'weather', category: 'realtime', name: '气象数据', meta: '风场 · 5min', enabled: false, opacity: 100, icon: 'weather' },
    ];
  }

  // ==================== 设施 ====================
  getFacilities(): Observable<Facility[]> {
    return this.facilities$.asObservable();
  }

  getFacility(id: string): Facility | undefined {
    return this.facilities.find((f) => f.id === id);
  }

  getFacilitiesByType(type: Facility['type']): Facility[] {
    return this.facilities.filter((f) => f.type === type);
  }

  private initFacilities(): Facility[] {
    return [
      {
        id: 'VP-007',
        name: '南山中心起降场',
        type: 'vertiport',
        status: 'warning',
        position: { lng: 113.9408, lat: 22.5266, alt: 86.4 },
        slots: this.makeSlots(12, 8, 1, 1),
        coverageRadius: 1.2,
        maxThroughput: 12,
        operationHours: '06:00 - 23:00',
        owner: '南山通航',
        todayCount: 142,
        utilization: 67,
        hourlyCounts: [3, 2, 1, 4, 8, 12, 18, 22, 28, 14, 16, 14],
      },
      {
        id: 'VP-003',
        name: '前海枢纽起降场',
        type: 'vertiport',
        status: 'success',
        position: { lng: 113.9108, lat: 22.5366, alt: 78.2 },
        slots: this.makeSlots(8, 3, 0, 0),
        coverageRadius: 1.0,
        maxThroughput: 8,
        operationHours: '06:00 - 23:00',
        owner: '前海通航',
        todayCount: 86,
        utilization: 38,
        hourlyCounts: [2, 1, 1, 2, 5, 9, 13, 16, 12, 10, 8, 7],
      },
      {
        id: 'VP-012',
        name: '宝安西乡起降场',
        type: 'vertiport',
        status: 'danger',
        position: { lng: 113.8708, lat: 22.5666, alt: 42.0 },
        slots: this.makeSlots(6, 0, 0, 6),
        coverageRadius: 0.8,
        maxThroughput: 6,
        operationHours: '06:00 - 23:00',
        owner: '宝安通航',
        todayCount: 0,
        utilization: 0,
        hourlyCounts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        id: 'VP-005',
        name: '福田 CBD 起降场',
        type: 'vertiport',
        status: 'success',
        position: { lng: 114.0508, lat: 22.5366, alt: 65.8 },
        slots: this.makeSlots(10, 2, 0, 0),
        coverageRadius: 1.5,
        maxThroughput: 10,
        operationHours: '06:00 - 23:00',
        owner: '福田通航',
        todayCount: 54,
        utilization: 20,
        hourlyCounts: [1, 1, 2, 3, 6, 9, 12, 8, 6, 4, 2, 1],
      },
      {
        id: 'VP-009',
        name: '龙华民治起降场',
        type: 'vertiport',
        status: 'success',
        position: { lng: 114.0208, lat: 22.6466, alt: 92.0 },
        slots: this.makeSlots(6, 4, 0, 0),
        coverageRadius: 0.8,
        maxThroughput: 6,
        operationHours: '06:00 - 23:00',
        owner: '龙华通航',
        todayCount: 72,
        utilization: 67,
        hourlyCounts: [2, 1, 1, 2, 5, 8, 11, 14, 10, 8, 6, 4],
      },
      {
        id: 'VP-011',
        name: '龙岗中心起降场',
        type: 'vertiport',
        status: 'success',
        position: { lng: 114.2408, lat: 22.7266, alt: 55.0 },
        slots: this.makeSlots(8, 1, 0, 0),
        coverageRadius: 1.0,
        maxThroughput: 8,
        operationHours: '06:00 - 23:00',
        owner: '龙岗通航',
        todayCount: 38,
        utilization: 13,
        hourlyCounts: [1, 0, 1, 1, 3, 5, 8, 7, 5, 4, 2, 1],
      },
      // 充电桩
      {
        id: 'CS-21',
        name: '科技园充电桩群 A',
        type: 'charging',
        status: 'success',
        position: { lng: 113.9508, lat: 22.5366, alt: 80 },
        power: 60,
        availableSlots: 12,
        totalSlots: 16,
        queueLength: 0,
        todayCount: 48,
        utilization: 25,
      },
      {
        id: 'CS-19',
        name: '科技园充电桩群 B',
        type: 'charging',
        status: 'warning',
        position: { lng: 113.9458, lat: 22.5400, alt: 80 },
        power: 60,
        availableSlots: 2,
        totalSlots: 8,
        queueLength: 2,
        todayCount: 36,
        utilization: 75,
      },
      // 机巢
      {
        id: 'NEST-05',
        name: '南山机巢 05',
        type: 'nest',
        status: 'success',
        position: { lng: 113.9608, lat: 22.5200, alt: 70 },
        todayCount: 18,
        utilization: 45,
      },
      {
        id: 'NEST-08',
        name: '前海机巢 08',
        type: 'nest',
        status: 'success',
        position: { lng: 113.9008, lat: 22.5500, alt: 75 },
        todayCount: 22,
        utilization: 52,
      },
      // 气象站
      {
        id: 'WS-03',
        name: '南山气象站 03',
        type: 'weather',
        status: 'success',
        position: { lng: 113.9708, lat: 22.5100, alt: 100 },
        todayCount: 0,
        utilization: 0,
      },
      // 维护站
      {
        id: 'MS-01',
        name: '南山维护中心',
        type: 'maintenance',
        status: 'success',
        position: { lng: 113.9308, lat: 22.5166, alt: 60 },
        todayCount: 4,
        utilization: 30,
      },
    ];
  }

  private makeSlots(total: number, occupied: number, maint: number, fault: number): any[] {
    const slots: any[] = [];
    for (let i = 1; i <= total; i++) {
      let status: any = 'idle';
      if (i <= occupied) status = 'occupied';
      else if (i <= occupied + maint) status = 'maint';
      else if (i <= occupied + maint + fault) status = 'fault';
      slots.push({ id: i, status });
    }
    return slots;
  }
}

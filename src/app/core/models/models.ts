/**
 * 状态枚举 — 贯穿无人机、设施、告警
 */
export type Status = 'success' | 'warning' | 'danger' | 'info' | 'offline';

/**
 * 经纬度高程
 */
export interface LatLngAlt {
  lng: number;
  lat: number;
  alt: number;
}

/**
 * 无人机/飞行器类型
 */
export type DroneType = 'multirotor' | 'fixedwing' | 'vtol' | 'helicopter';

/**
 * 无人机实体
 */
export interface Drone {
  id: string;
  name: string;
  sn: string;
  type: DroneType;
  status: Status;
  position: LatLngAlt;
  velocity: number; // m/s
  heading: number; // 度
  climbRate: number; // m/s
  battery: number; // 百分比 0-100
  signal: number; // dBm
  gnssSatellites: number;
  temperature: number;
  windSpeed: number;
  homeVertiportId: string | null;
  lastUpdate: number;
}

/**
 * 航迹点
 */
export interface TrackPoint {
  time: number;
  position: LatLngAlt;
  heading: number;
  speed: number;
}

/**
 * 航迹段
 */
export interface TrackSegment {
  id: string;
  droneId: string;
  type: 'realtime' | 'planned' | 'history';
  points: TrackPoint[];
  startTime: number;
  endTime: number | null;
  distance: number; // km
}

/**
 * 告警
 */
export interface Alert {
  id: string;
  level: Status;
  droneId: string | null;
  droneName: string | null;
  facilityId: string | null;
  facilityName: string | null;
  message: string;
  detail: string;
  time: number;
  acknowledged: boolean;
}

/**
 * 图层
 */
export type LayerCategory = 'basemap' | 'model' | 'airspace' | 'realtime';

export interface Layer {
  id: string;
  category: LayerCategory;
  name: string;
  meta: string;
  enabled: boolean;
  opacity: number; // 0-100
  icon: string;
}

/**
 * 设施类型
 */
export type FacilityType = 'vertiport' | 'charging' | 'nest' | 'maintenance' | 'weather' | 'communication';

/**
 * 泊位状态
 */
export type SlotStatus = 'idle' | 'occupied' | 'maint' | 'fault';

export interface Slot {
  id: number;
  status: SlotStatus;
  droneId?: string;
}

/**
 * 基础设施
 */
export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  status: Status;
  position: LatLngAlt;
  // 起降场特有
  slots?: Slot[];
  coverageRadius?: number; // km
  maxThroughput?: number; // 架/小时
  operationHours?: string;
  owner?: string;
  // 充电桩特有
  power?: number; // kW
  availableSlots?: number;
  totalSlots?: number;
  queueLength?: number;
  // 统计
  todayCount?: number;
  utilization?: number; // 百分比
  // 24h 起降架次
  hourlyCounts?: number[];
}

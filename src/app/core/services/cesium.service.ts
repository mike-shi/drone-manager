import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Drone, Facility, LatLngAlt, TrackPoint } from '../models/models';

declare const Cesium: any;

export interface CesiumInitOptions {
  container: HTMLElement;
  onReady?: (viewer: any) => void;
  onClockTick?: (time: any) => void;
  onEntityClick?: (entity: any) => void;
  onCameraChange?: (heading: number, pitch: number, height: number) => void;
  onMouseMove?: (coord: LatLngAlt | null) => void;
}

/**
 * Cesium 服务封装
 * 统一管理 Viewer 生命周期、实体绘制、视角控制
 * 所有 Cesium 调用通过 NgZone.runOutsideAngular 避免不必要的变更检测
 */
@Injectable({ providedIn: 'root' })
export class CesiumService {
  private viewer: any = null;
  private handlers: any = {};
  private removeClockListener: (() => void) | null = null;
  private removeCameraListener: (() => void) | null = null;
  private removeMouseMove: (() => void) | null = null;
  private removeLeftClick: (() => void) | null = null;

  constructor(private zone: NgZone) {}

  /** 初始化 Viewer */
  init(opts: CesiumInitOptions): void {
    if (this.viewer) return;

    this.zone.runOutsideAngular(() => {
      // 配置 Cesium ion token
      Cesium.Ion.defaultAccessToken = environment.cesium.ionAccessToken;

      // 设置基础静态资源路径（与 angular.json assets 输出一致）
      Cesium.buildModuleUrl.setBaseUrl('./assets/cesium/');

      this.viewer = new Cesium.Viewer(opts.container, {
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        animation: false,
        timeline: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
        shadows: false,
        shouldAnimate: true,
        // 不加载默认影像，使用 globe.baseColor 作为纯色背景
        baseLayer: false,
        // 使用椭球地形（无 DEM），让 baseColor 平整显示
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        // 关键：使用设备真实像素比，避免高 DPI 屏 label 模糊
        useBrowserRecommendedResolution: false,
      });

      // 提升整体渲染分辨率（1.5x），label/billboard 纹理更锐利
      this.viewer.resolutionScale = 1.5;

      const scene = this.viewer.scene;
      // 地形底色 — 深海蓝，与平台深色主题一致
      scene.globe.baseColor = Cesium.Color.fromCssColorString('#0d1830');
      scene.globe.enableLighting = false; // 关闭光照，避免 baseColor 出现明暗面
      scene.globe.depthTestAgainstTerrain = true;
      scene.fog.enabled = false;
      // 自定义天空盒 — 使用 Cesium 内置 Tycho2 星图
      const skyBoxPath = './assets/cesium/Assets/Textures/SkyBox/tycho2t3_80_';
      scene.skyBox = new Cesium.SkyBox({
        sources: {
          positiveX: skyBoxPath + 'px.jpg',
          negativeX: skyBoxPath + 'nx.jpg',
          positiveY: skyBoxPath + 'py.jpg',
          negativeY: skyBoxPath + 'ny.jpg',
          positiveZ: skyBoxPath + 'pz.jpg',
          negativeZ: skyBoxPath + 'nz.jpg',
        },
      });
      scene.skyBox.show = true;
      // 大气层保留以增强地球边缘辉光，关闭太阳/月亮避免抢眼
      scene.skyAtmosphere.show = true;
      scene.skyAtmosphere.hueShift = 0;
      scene.skyAtmosphere.saturationShift = 0;
      scene.skyAtmosphere.brightnessShift = -0.2; // 略压暗大气
      scene.sun.show = false;
      scene.moon.show = false;
      scene.backgroundColor = Cesium.Color.fromCssColorString('#050810');
      scene.highDynamicRange = true;
      // 开启请求渲染模式以提升性能
      scene.requestRenderMode = false; // 实时航迹场景需要持续渲染
      scene.maximumRenderTimeChange = Infinity;

      // 时钟回调
      if (opts.onClockTick) {
        const cb = () => opts.onClockTick!(this.viewer.clock.currentTime);
        this.viewer.clock.onTick.addEventListener(cb);
        this.removeClockListener = () => this.viewer.clock.onTick.removeEventListener(cb);
      }

      // 相机变化回调
      if (opts.onCameraChange) {
        const cb = () => {
          const h = Cesium.Math.toDegrees(this.viewer.camera.heading);
          const p = Cesium.Math.toDegrees(this.viewer.camera.pitch);
          const height = this.viewer.camera.positionCartographic.height;
          opts.onCameraChange!(h, p, height);
        };
        this.viewer.camera.changed.addEventListener(cb);
        this.removeCameraListener = () =>
          this.viewer.camera.changed.removeEventListener(cb);
      }

      // 鼠标移动 — 拾取坐标
      if (opts.onMouseMove) {
        const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        handler.setInputAction((e: any) => {
          const cart = this.viewer.camera.pickEllipsoid(
            e.endPosition,
            scene.globe.ellipsoid,
          );
          if (cart) {
            const c = cart.toString ? null : Cesium.Cartographic.fromCartesian(cart);
            if (c) {
              opts.onMouseMove!({
                lng: Cesium.Math.toDegrees(c.longitude),
                lat: Cesium.Math.toDegrees(c.latitude),
                alt: c.height,
              });
              return;
            }
          }
          opts.onMouseMove!(null);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.removeMouseMove = () => handler.destroy();
      }

      // 左键点击实体
      if (opts.onEntityClick) {
        const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        handler.setInputAction((e: any) => {
          const picked = scene.pick(e.position);
          if (Cesium.defined(picked) && picked.id && picked.id.id) {
            opts.onEntityClick!(picked.id);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.removeLeftClick = () => handler.destroy();
      }

      if (opts.onReady) opts.onReady(this.viewer);
    });
  }

  /** 销毁 Viewer */
  destroy(): void {
    this.removeClockListener?.();
    this.removeCameraListener?.();
    this.removeMouseMove?.();
    this.removeLeftClick?.();
    this.removeClockListener = null;
    this.removeCameraListener = null;
    this.removeMouseMove = null;
    this.removeLeftClick = null;
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    this.handlers = {};
  }

  getViewer(): any {
    return this.viewer;
  }

  /** 飞到指定坐标 */
  flyTo(lng: number, lat: number, alt = 1000, opts: any = {}) {
    if (!this.viewer) return;
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, alt),
      orientation: {
        heading: Cesium.Math.toRadians(opts.heading ?? 0),
        pitch: Cesium.Math.toRadians(opts.pitch ?? -45),
        roll: 0,
      },
      duration: opts.duration ?? 1.5,
    });
  }

  /** 设置视角预设 */
  setViewPreset(preset: 'top' | 'eye' | 'roam' | 'north', center?: LatLngAlt) {
    if (!this.viewer) return;
    const c = center || { lng: 113.9408, lat: 22.5266, alt: 86.4 };
    const presets: Record<string, any> = {
      top: { heading: 0, pitch: -90, height: 3000 },
      eye: { heading: 0, pitch: -10, height: 200 },
      roam: { heading: 0, pitch: -20, height: 500 },
      north: { heading: 0, pitch: -45, height: 1500 },
    };
    const p = presets[preset];
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(c.lng, c.lat, p.height),
      orientation: {
        heading: Cesium.Math.toRadians(p.heading),
        pitch: Cesium.Math.toRadians(p.pitch),
        roll: 0,
      },
    });
    this.viewer.camera.zoomOut(10);
  }

  // ==================== 无人机实体 ====================
  private droneEntities: Record<string, any> = {};

  /** 添加/更新无人机实体 */
  upsertDrone(drone: Drone) {
    if (!this.viewer) return;
    const position = Cesium.Cartesian3.fromDegrees(
      drone.position.lng,
      drone.position.lat,
      drone.position.alt,
    );
    const colorMap: Record<string, any> = {
      success: Cesium.Color.fromCssColorString('#22C55E'),
      warning: Cesium.Color.fromCssColorString('#F59E0B'),
      danger: Cesium.Color.fromCssColorString('#EF4444'),
      info: Cesium.Color.fromCssColorString('#3B82F6'),
      offline: Cesium.Color.fromCssColorString('#5A6478'),
    };
    const color = colorMap[drone.status] || Cesium.Color.WHITE;

    if (this.droneEntities[drone.id]) {
      // CallbackProperty 自动读取 _currentPos / _currentHpr，无需直接赋值
    } else {
      const entity = this.viewer.entities.add({
        id: `drone-${drone.id}`,
        name: drone.name,
        position: new Cesium.CallbackProperty(() => {
          const e = this.droneEntities[drone.id];
          return e && e._currentPos;
        }, false),
        orientation: new Cesium.CallbackProperty(() => {
          const e = this.droneEntities[drone.id];
          return e && e._currentHpr;
        }, false),
        billboard: {
          image: this.buildDroneSvg(drone.status, drone.type),
          width: 32,
          height: 32,
          heightReference: Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${drone.name}\n${drone.position.alt.toFixed(0)}m`,
          font: '600 16px Fira Code',
          scale: 0.7,
          fillColor: color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(20, -8),
          showBackground: true,
          backgroundColor: new Cesium.Color(0.07, 0.1, 0.16, 0.9),
          backgroundPadding: new Cesium.Cartesian2(8, 5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          subpixelGlyphPreciseRendering: true,
        },
      });
      entity._droneId = drone.id;
      entity._currentPos = position;
      entity._currentHpr = Cesium.Transforms.headingPitchRollQuaternion(
        position,
        new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(drone.heading), 0, 0),
      );
      this.droneEntities[drone.id] = entity;
    }
    this.droneEntities[drone.id]._currentPos = position;
    this.droneEntities[drone.id]._currentHpr = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(drone.heading), 0, 0),
    );
  }

  removeDrone(id: string) {
    if (this.droneEntities[id]) {
      this.viewer.entities.remove(this.droneEntities[id]);
      delete this.droneEntities[id];
    }
  }

  /** 生成无人机 SVG 图标 data URL */
  private buildDroneSvg(status: string, type: string): string {
    const colors: Record<string, string> = {
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      offline: '#5A6478',
    };
    const c = colors[status] || '#FFFFFF';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${c}" fill-opacity="0.2" stroke="${c}" stroke-width="1.5"/>
      <path d="M10 10 L22 10 L20 22 L12 22 Z" fill="${c}" stroke="#0a0f1c" stroke-width="1"/>
      <circle cx="16" cy="16" r="2" fill="#0a0f1c"/>
    </svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  // ==================== 航迹 ====================
  private trackEntities: Record<string, any> = {};

  /** 更新航迹线 */
  upsertTrack(droneId: string, points: TrackPoint[], selected = false) {
    if (!this.viewer || points.length < 2) return;
    const colorMap: Record<string, any> = {
      DJI_M300: '#22D3EE',
      EVTOL: '#FF8A1E',
      MAVIC: '#22C55E',
      PHANTOM: '#EF4444',
    };
    let color = '#22D3EE';
    if (droneId.startsWith('EVTOL')) color = '#FF8A1E';
    else if (droneId.startsWith('MAVIC')) color = '#22C55E';
    else if (droneId.startsWith('PHANTOM')) color = '#EF4444';

    const cesiumColor = Cesium.Color.fromCssColorString(color);
    const positions = points.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.position.lng, p.position.lat, p.position.alt),
    );

    if (this.trackEntities[droneId]) {
      this.trackEntities[droneId]._currentPositions = positions;
      this.trackEntities[droneId].polyline.width = selected ? 3 : 2;
      this.trackEntities[droneId].show = true;
    } else {
      const entity = this.viewer.entities.add({
        id: `track-${droneId}`,
        name: `Track ${droneId}`,
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            const e = this.trackEntities[droneId];
            return e && e._currentPositions;
          }, false),
          width: selected ? 3 : 2,
          material: new Cesium.PolylineGlowMaterialProperty({
            color: cesiumColor,
            glowPower: 0.2,
            taperPower: 0.5,
          }),
          clampToGround: false,
        },
      });
      entity._currentPositions = positions;
      this.trackEntities[droneId] = entity;
    }
  }

  hideTrack(droneId: string) {
    if (this.trackEntities[droneId]) this.trackEntities[droneId].show = false;
  }

  clearTracks() {
    Object.keys(this.trackEntities).forEach((id) => {
      this.viewer.entities.remove(this.trackEntities[id]);
      delete this.trackEntities[id];
    });
  }

  // ==================== 设施实体 ====================
  private facilityEntities: Record<string, any> = {};

  upsertFacility(fac: Facility, selected = false) {
    if (!this.viewer) return;
    const position = Cesium.Cartesian3.fromDegrees(
      fac.position.lng,
      fac.position.lat,
      fac.position.alt,
    );
    const colorMap: Record<string, any> = {
      success: Cesium.Color.fromCssColorString('#22C55E'),
      warning: Cesium.Color.fromCssColorString('#F59E0B'),
      danger: Cesium.Color.fromCssColorString('#EF4444'),
      info: Cesium.Color.fromCssColorString('#3B82F6'),
      offline: Cesium.Color.fromCssColorString('#5A6478'),
    };
    const color = colorMap[fac.status] || Cesium.Color.WHITE;

    if (this.facilityEntities[fac.id]) {
      this.facilityEntities[fac.id]._selected = selected;
      return;
    }

    const isVertiport = fac.type === 'vertiport';
    const entity = this.viewer.entities.add({
      id: `fac-${fac.id}`,
      name: fac.name,
      position: position,
      billboard: {
        image: this.buildFacilitySvg(fac.type, fac.status),
        width: isVertiport ? 36 : 24,
        height: isVertiport ? 36 : 24,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: fac.id,
        font: '600 16px Fira Code',
        scale: 0.7,
        fillColor: color,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -22),
        showBackground: true,
        backgroundColor: new Cesium.Color(0.07, 0.1, 0.16, 0.9),
        backgroundPadding: new Cesium.Cartesian2(8, 5),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        subpixelGlyphPreciseRendering: true,
      },
    });
    entity._facilityId = fac.id;
    entity._selected = selected;
    this.facilityEntities[fac.id] = entity;

    // 起降场：绘制覆盖圆
    if (fac.coverageRadius) {
      this.viewer.entities.add({
        id: `coverage-${fac.id}`,
        name: `Coverage ${fac.id}`,
        position: position,
        ellipse: {
          semiMajorAxis: fac.coverageRadius * 1000,
          semiMinorAxis: fac.coverageRadius * 1000,
          material: new Cesium.ColorMaterialProperty(
            color.withAlpha(0.05),
          ),
          outline: true,
          outlineColor: color.withAlpha(0.4),
          outlineWidth: 1,
          height: 0,
        },
      });
    }
  }

  removeFacility(id: string) {
    if (this.facilityEntities[id]) {
      this.viewer.entities.remove(this.facilityEntities[id]);
      delete this.facilityEntities[id];
    }
    const cov = this.viewer.entities.getById(`coverage-${id}`);
    if (cov) this.viewer.entities.remove(cov);
  }

  /** 高亮选中设施 */
  highlightFacility(id: string | null) {
    Object.keys(this.facilityEntities).forEach((k) => {
      this.facilityEntities[k]._selected = k === id;
    });
  }

  private buildFacilitySvg(type: string, status: string): string {
    const colors: Record<string, string> = {
      success: '#22C55E',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
      offline: '#5A6478',
    };
    const c = colors[status] || '#FFFFFF';
    const typeColors: Record<string, string> = {
      vertiport: '#FF8A1E',
      charging: '#22C55E',
      nest: '#3B82F6',
      maintenance: '#8A95A8',
      weather: '#8A95A8',
      communication: '#8A95A8',
    };
    const tc = typeColors[type] || c;
    let icon = '';
    if (type === 'vertiport') {
      icon = `<rect x="6" y="6" width="20" height="20" rx="3" fill="${tc}33" stroke="${tc}" stroke-width="2"/>
              <path d="M11 16 L21 16 M16 11 L16 21" stroke="${tc}" stroke-width="2"/>`;
    } else if (type === 'charging') {
      icon = `<circle cx="16" cy="16" r="10" fill="${tc}33" stroke="${tc}" stroke-width="1.5"/>
              <path d="M14 11 L14 21 M16 13 L16 19 M18 11 L18 21 M20 13 L20 19" stroke="${tc}" stroke-width="1.2"/>`;
    } else if (type === 'nest') {
      icon = `<polygon points="6,8 26,8 28,24 4,24" fill="${tc}33" stroke="${tc}" stroke-width="1.5"/>
              <path d="M16 8 L16 24" stroke="${tc}" stroke-width="1"/>`;
    } else {
      icon = `<circle cx="16" cy="16" r="8" fill="${tc}33" stroke="${tc}" stroke-width="1.5"/>`;
    }
    // 故障闪烁环
    const ring = status === 'danger'
      ? `<circle cx="16" cy="16" r="13" fill="none" stroke="${c}" stroke-width="1" opacity="0.5"><animate attributeName="r" values="11;15;11" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0.6" dur="1.2s" repeatCount="indefinite"/></circle>`
      : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 32 32">${ring}${icon}</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  // ==================== 禁飞区 ====================
  private airspaceEntities: string[] = [];

  addRestrictedZone(id: string, center: LatLngAlt, radiusKm: number, name: string) {
    if (!this.viewer) return;
    const position = Cesium.Cartesian3.fromDegrees(center.lng, center.lat, 0);
    this.viewer.entities.add({
      id: `zone-${id}`,
      name: name,
      position: position,
      ellipse: {
        semiMajorAxis: radiusKm * 1000,
        semiMinorAxis: radiusKm * 1000,
        material: new Cesium.ColorMaterialProperty(
          Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.08),
        ),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.5),
        outlineWidth: 1,
        height: 0,
      },
      label: {
        text: name,
        font: '600 16px Fira Code',
        scale: 0.7,
        fillColor: Cesium.Color.fromCssColorString('#EF4444').withAlpha(0.7),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        subpixelGlyphPreciseRendering: true,
      },
    });
    this.airspaceEntities.push(`zone-${id}`);
  }

  clearAirspaces() {
    this.airspaceEntities.forEach((id) => {
      const e = this.viewer.entities.getById(id);
      if (e) this.viewer.entities.remove(e);
    });
    this.airspaceEntities = [];
  }

  // ==================== POI 标注 ====================
  addPoi(id: string, position: LatLngAlt, label: string, color = '#22D3EE') {
    if (!this.viewer) return;
    this.viewer.entities.add({
      id: `poi-${id}`,
      name: label,
      position: Cesium.Cartesian3.fromDegrees(position.lng, position.lat, position.alt),
      billboard: {
        image: this.buildPoiSvg(color),
        width: 20,
        height: 20,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: label,
        font: '600 16px Fira Sans',
        scale: 0.7,
        fillColor: Cesium.Color.fromCssColorString(color),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        subpixelGlyphPreciseRendering: true,
      },
    });
  }

  private buildPoiSvg(color: string): string {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
      <path d="M10 2 C6 2 3 5 3 9 C3 14 10 18 10 18 C10 18 17 14 17 9 C17 5 14 2 10 2 Z" fill="${color}33" stroke="${color}" stroke-width="1.5"/>
      <circle cx="10" cy="9" r="2.5" fill="${color}"/>
    </svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  /** 跟随实体 */
  trackEntity(entityId: string, duration = 0) {
    if (!this.viewer) return;
    const entity = this.viewer.entities.getById(entityId);
    if (entity) {
      this.viewer.trackedEntity = entity;
    }
  }

  stopTracking() {
    if (this.viewer) this.viewer.trackedEntity = undefined;
  }

  /** 聚焦实体 */
  zoomToEntity(entityId: string, range = 800) {
    if (!this.viewer) return;
    const entity = this.viewer.entities.getById(entityId);
    if (entity) {
      this.viewer.zoomTo(entity, new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(-45),
        range,
      ));
    }
  }


  fitToPointsWithRadius(
    points: { lng: number; lat: number; radiusKm: number }[],
    padding = 1.2,
    pitchDeg = -50,
  ) {
    if (!this.viewer || points.length === 0) return;

    // 1. 计算所有点（含半径）的经纬度包围盒
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    points.forEach((p) => {
      // 半径转经纬度偏移（近似）
      const dLat = p.radiusKm / 111.0;
      const dLng = p.radiusKm / (111.0 * Math.cos((p.lat * Math.PI) / 180));
      minLng = Math.min(minLng, p.lng - dLng);
      maxLng = Math.max(maxLng, p.lng + dLng);
      minLat = Math.min(minLat, p.lat - dLat);
      maxLat = Math.max(maxLat, p.lat + dLat);
    });

    // 2. 中心点
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    // 3. 包围盒尺寸（米）
    const widthM = (maxLng - minLng) * 111320 * Math.cos((centerLat * Math.PI) / 180);
    const heightM = (maxLat - minLat) * 110540;
    const maxDim = Math.max(widthM, heightM);

    // 4. 根据俯角估算视角高度
    // 透视投影下，要看到地面 maxDim 范围，高度 ≈ maxDim / (2 * tan(fov/2)) / sin(|pitch|)
    // Cesium 默认 fov ≈ 60°，简化估算：高度 = maxDim * padding / sin(俯角)
    const pitchRad = Math.abs((pitchDeg * Math.PI) / 180);
    const heightMeters = (maxDim / 2 / Math.tan((60 * Math.PI) / 180 / 2)) / Math.sin(pitchRad) * padding;

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, heightMeters),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(pitchDeg),
        roll: 0,
      },
      duration: 1.2,
    });
  }

  /**
   * 自适应视图 — 将相机飞行到指定实体集合的包围盒内
   * @param entityIds 实体 ID 列表，为空时适配所有实体
   * @param opts 飞行参数（航向、俯仰、偏移、时长）
   */
  fitToView(
    entityIds: string[] = [],
    opts: { heading?: number; pitch?: number; offset?: number; duration?: number } = {},
  ): void {
    if (!this.viewer) return;

    const heading = opts.heading ?? 0;
    const pitch = opts.pitch ?? -45;
    const offset = opts.offset ?? 0;
    const duration = opts.duration ?? 1.5;

    let targets: any[];
    if (entityIds.length > 0) {
      targets = entityIds
        .map((id) => this.viewer.entities.getById(id))
        .filter(Boolean);
    } else {
      targets = this.viewer.entities.values;
    }

    if (targets.length === 0) return;

    this.viewer.flyTo(targets, {
      duration,
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(heading),
        Cesium.Math.toRadians(pitch),
        offset,
      ),
    });
  }
}

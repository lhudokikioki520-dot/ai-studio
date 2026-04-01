import { Resource, Task, Project, WorkOrder, ExceptionEvent, ScheduleResponse, Item, Routing, WorkCenter, BOM } from '../types/aps';
import { addDays, subDays, format } from 'date-fns';

const today = new Date();

// --- 1. 基础建模 (机、环) ---
export const mockWorkCenters: WorkCenter[] = [
  { id: 'WC-01', code: 'WC-CNC', name: '数控加工中心', department: '机加车间' },
  { id: 'WC-02', code: 'WC-ASSY', name: '总装中心', department: '装配车间' }
];

export const mockResources: Resource[] = [
  { id: 'R1', workCenterId: 'WC-01', code: 'CNC-001', name: 'CNC加工中心-01', type: 'MACHINE', capacity: 1, calendarId: 'CAL-01' },
  { id: 'R2', workCenterId: 'WC-01', code: 'CNC-002', name: 'CNC加工中心-02', type: 'MACHINE', capacity: 1, calendarId: 'CAL-01', isFaulty: true },
  { id: 'R3', workCenterId: 'WC-02', code: 'ASSY-001', name: '总装线-A', type: 'MACHINE', capacity: 1, calendarId: 'CAL-01' },
  { id: 'R4', workCenterId: 'WC-02', code: 'TEST-001', name: '测试台-01', type: 'MACHINE', capacity: 1, calendarId: 'CAL-01' },
];

// --- 2. 产品与工艺 (料、法) ---
export const mockItems: Item[] = [
  { id: 'ITEM-01', code: 'FG-ROBOT', name: '焊接机械臂', type: 'FINISHED_GOODS', leadTimeDays: 15 },
  { id: 'ITEM-02', code: 'SF-BASE', name: '底座组件', type: 'SEMI_FINISHED', leadTimeDays: 5 },
  { id: 'ITEM-03', code: 'SF-CTRL', name: '控制柜', type: 'SEMI_FINISHED', leadTimeDays: 7 },
  { id: 'RAW-01', code: 'RM-STEEL', name: '高强度钢材', type: 'RAW_MATERIAL', leadTimeDays: 10 },
  { id: 'RAW-02', code: 'RM-SCREW', name: 'M8螺丝', type: 'RAW_MATERIAL', leadTimeDays: 2 },
  { id: 'RAW-03', code: 'RM-PLC', name: '西门子PLC', type: 'RAW_MATERIAL', leadTimeDays: 30 },
  { id: 'RAW-04', code: 'RM-CABLE', name: '工业线缆', type: 'RAW_MATERIAL', leadTimeDays: 5 },
];

export const mockRoutings: Routing[] = [
  {
    id: 'RT-01', itemId: 'ITEM-02', name: '底座标准加工工艺',
    operations: [
      { id: 'OP-01', sequence: 10, name: '粗加工', workCenterId: 'WC-01', standardSetupTime: 30, standardRunTime: 15, requiredResources: [{ type: 'MACHINE', quantity: 1 }] },
      { id: 'OP-02', sequence: 20, name: '精加工', workCenterId: 'WC-01', standardSetupTime: 60, standardRunTime: 20, requiredResources: [{ type: 'MACHINE', quantity: 1 }] }
    ]
  },
  {
    id: 'RT-02', itemId: 'ITEM-01', name: '机械臂总装工艺',
    operations: [
      { id: 'OP-03', sequence: 10, name: '总装', workCenterId: 'WC-02', standardSetupTime: 120, standardRunTime: 300, requiredResources: [{ type: 'MACHINE', quantity: 1 }, { type: 'WORKER', quantity: 2 }] },
      { id: 'OP-04', sequence: 20, name: '测试', workCenterId: 'WC-02', standardSetupTime: 15, standardRunTime: 60, requiredResources: [{ type: 'MACHINE', quantity: 1 }] }
    ]
  }
];

export const mockBOMs: BOM[] = [
  {
    id: 'BOM-01',
    parentItemId: 'ITEM-01', // 焊接机械臂
    components: [
      { itemId: 'ITEM-02', quantity: 1 }, // 底座组件
      { itemId: 'ITEM-03', quantity: 1 }, // 控制柜
    ]
  },
  {
    id: 'BOM-02',
    parentItemId: 'ITEM-02', // 底座组件
    components: [
      { itemId: 'RAW-01', quantity: 50 }, // 钢材
      { itemId: 'RAW-02', quantity: 20 }, // 螺丝
    ]
  },
  {
    id: 'BOM-03',
    parentItemId: 'ITEM-03', // 控制柜
    components: [
      { itemId: 'RAW-03', quantity: 1 }, // PLC
      { itemId: 'RAW-04', quantity: 10 }, // 线缆
    ]
  }
];

// --- 3. 需求与订单 ---
export const mockProjects: Project[] = [
  { id: 'P1001', name: '新能源电池产线A项目', dueDate: format(addDays(today, 15), 'yyyy-MM-dd'), priority: 1 },
];

export const mockWorkOrders: WorkOrder[] = [
  { id: 'WO-1001-A', projectId: 'P1001', itemId: 'ITEM-02', routingId: 'RT-01', quantity: 50, dueDate: format(addDays(today, 5), 'yyyy-MM-dd'), status: 'RELEASED' },
  { id: 'WO-1001-B', projectId: 'P1001', itemId: 'ITEM-03', routingId: 'RT-02', quantity: 10, dueDate: format(addDays(today, 10), 'yyyy-MM-dd'), status: 'RELEASED' },
];

// --- 4. 执行与排程 ---
export const mockTasks: Task[] = [
  { id: 'T1', workOrderId: 'WO-1001-A', operationId: 'OP-01', resourceIds: ['R1'], startTime: format(subDays(today, 1), 'yyyy-MM-dd 08:00'), endTime: format(today, 'yyyy-MM-dd 12:00'), status: 'IN_PROGRESS', materialReady: true, actualSetupTime: 30 },
  { id: 'T2', workOrderId: 'WO-1001-A', operationId: 'OP-02', resourceIds: ['R2'], startTime: format(today, 'yyyy-MM-dd 13:00'), endTime: format(addDays(today, 1), 'yyyy-MM-dd 18:00'), status: 'FROZEN', materialReady: true, actualSetupTime: 60 },
  { id: 'T3', workOrderId: 'WO-1001-B', operationId: 'OP-03', resourceIds: ['R3'], startTime: format(addDays(today, 2), 'yyyy-MM-dd 08:00'), endTime: format(addDays(today, 4), 'yyyy-MM-dd 18:00'), status: 'PENDING', materialReady: false, actualSetupTime: 120 },
  { id: 'T4', workOrderId: 'WO-1001-B', operationId: 'OP-04', resourceIds: ['R4'], startTime: format(addDays(today, 5), 'yyyy-MM-dd 08:00'), endTime: format(addDays(today, 6), 'yyyy-MM-dd 12:00'), status: 'PENDING', materialReady: true, actualSetupTime: 15 },
];

export const mockExceptions: ExceptionEvent[] = [
  {
    id: 'EX-001',
    type: 'EQUIPMENT_BREAKDOWN',
    resourceId: 'R2',
    level: 'L2',
    description: 'CNC加工中心-02 主轴异响，预计维修需 24 小时。影响 WO-1001-A 精加工任务。',
    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    resolved: false,
  }
];

export const mockRescheduleResponse: ScheduleResponse = {
  planId: 'PLAN-DYN-001',
  version: 'v1.0.1-dyn',
  mode: 'DYNAMIC_RESCHEDULE',
  createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
  tasks: [],
  kpis: { onTimeDeliveryRate: 0.9, resourceUtilization: 0.85, totalSetupTime: 300, disruptionScore: 50 },
  alternatives: [
    {
      planId: 'ALT-A',
      name: '方案A：最小扰动 (保护执行)',
      description: '将受影响的 T2 任务顺延 24 小时，不改变其他工单顺序。',
      kpis: { onTimeDeliveryRate: 0.85, resourceUtilization: 0.82, totalSetupTime: 300, disruptionScore: 10 },
      tasks: [
        ...mockTasks.filter(t => t.id !== 'T2'),
        { ...mockTasks.find(t => t.id === 'T2')!, startTime: format(addDays(today, 1), 'yyyy-MM-dd 13:00'), endTime: format(addDays(today, 2), 'yyyy-MM-dd 18:00'), status: 'PENDING' }
      ]
    },
    {
      planId: 'ALT-B',
      name: '方案B：保交期 (全局重优)',
      description: '将 T2 任务转移至 R1 (需中断 R1 当前低优任务)，确保 P1001 项目不延期。',
      kpis: { onTimeDeliveryRate: 0.98, resourceUtilization: 0.88, totalSetupTime: 450, disruptionScore: 85 },
      tasks: [
        ...mockTasks.filter(t => t.id !== 'T2' && t.id !== 'T1'),
        { ...mockTasks.find(t => t.id === 'T1')!, endTime: format(today, 'yyyy-MM-dd 10:00'), status: 'COMPLETED' },
        { ...mockTasks.find(t => t.id === 'T2')!, resourceIds: ['R1'], startTime: format(today, 'yyyy-MM-dd 11:00'), endTime: format(addDays(today, 1), 'yyyy-MM-dd 16:00'), status: 'PENDING' }
      ]
    }
  ]
};


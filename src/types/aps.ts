/**
 * APS 领域模型与求解器协议 (Domain Model & Solver I/O)
 * 基于 DDD 与“人机料法环”(4M1E) 统一工厂建模重构
 */

// ==========================================
// 1. 工厂基础建模 (人、机、环 - Man, Machine, Environment)
// ==========================================

export type ResourceType = 'MACHINE' | 'WORKER' | 'SPACE' | 'TOOL';

/** 工作中心 (WorkCenter) - 资源的逻辑集合 */
export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  department: string;
}

/** 资源 (Resource) - 统一抽象人、机、环、法(模具) */
export interface Resource {
  id: string;
  workCenterId: string;
  code: string;
  name: string;
  type: ResourceType;
  capacity: number;       // 并发容量
  calendarId: string;     // 绑定的工作日历
  isFaulty?: boolean;     // 运行时状态
}

/** 工作日历 (Calendar) - 定义可用时间窗 */
export interface Calendar {
  id: string;
  name: string;
  shifts: {
    startTime: string; // e.g., "08:00"
    endTime: string;   // e.g., "17:00"
  }[];
}

// ==========================================
// 2. 产品与工艺建模 (料、法 - Material, Method)
// ==========================================

export type ItemType = 'FINISHED_GOODS' | 'SEMI_FINISHED' | 'RAW_MATERIAL';

/** 物料/产品主数据 (Item Master) - 【料】 */
export interface Item {
  id: string;
  code: string;
  name: string;
  type: ItemType;
  leadTimeDays: number; // 采购或生产提前期
}

/** 物料清单 (BOM) - 【料】的结构 */
export interface BOM {
  id: string;
  parentItemId: string;
  components: {
    itemId: string;
    quantity: number;
  }[];
}

/** 工艺路线 (Routing) - 【法】 */
export interface Routing {
  id: string;
  itemId: string; // 关联的产品
  name: string;
  operations: Operation[];
}

/** 标准工序 (Operation) - 【法】的步骤，连接人机料 */
export interface Operation {
  id: string;
  sequence: number;       // 工序顺序 (如 10, 20, 30)
  name: string;
  workCenterId: string;   // 要求的加工中心
  standardSetupTime: number; // 标准准备时间(分钟)
  standardRunTime: number;   // 标准单件加工时间(分钟)
  requiredResources: {
    type: ResourceType;
    quantity: number;
  }[]; // 例如：需要 1台机器 + 1个工人
}

// ==========================================
// 3. 需求与订单建模 (Demand & Order)
// ==========================================

/** 项目 (Project) - 顶层交付目标 */
export interface Project {
  id: string;
  name: string;
  dueDate: string;
  priority: number;
}

/** 生产工单 (WorkOrder) - 制造执行指令 */
export interface WorkOrder {
  id: string;
  projectId: string;
  itemId: string;      // 关联的产品/物料
  routingId: string;   // 关联的工艺路线
  quantity: number;
  dueDate: string;
  status: 'RELEASED' | 'STARTED' | 'COMPLETED';
}

// ==========================================
// 4. 执行与排程建模 (Execution & Schedule)
// ==========================================

export type TaskStatus = 'PENDING' | 'LOCKED' | 'FROZEN' | 'IN_PROGRESS' | 'COMPLETED';

/** 工序任务 (Task) - 排程的最小原子单元，是 4M1E 的交汇点 */
export interface Task {
  id: string;
  workOrderId: string;
  operationId: string;   // 关联的标准工序【法】
  resourceIds: string[]; // 实际分配的资源集合【人、机、环】
  startTime: string;
  endTime: string;
  status: TaskStatus;
  
  // 动态约束状态
  materialReady: boolean; // 【料】是否齐套
  actualSetupTime: number; // 实际计算的切换时间
}

export type ExceptionLevel = 'L1' | 'L2' | 'L3';

/** 异常事件 (Exception Event) */
export interface ExceptionEvent {
  id: string;
  type: 'EQUIPMENT_BREAKDOWN' | 'MATERIAL_SHORTAGE' | 'RUSH_ORDER' | 'DELAY';
  resourceId?: string;
  workOrderId?: string;
  level: ExceptionLevel;
  description: string;
  timestamp: string;
  resolved: boolean;
}

// ==========================================
// 5. 求解器输入输出协议 (Solver I/O Protocol)
// ==========================================

export type ScheduleMode = 'PROJECT_PRE_SCHEDULE' | 'WEEKLY_FULL' | 'DYNAMIC_RESCHEDULE';

export interface ObjectiveWeights {
  delivery: number;
  utilization: number;
  stability: number;
  cost: number;
}

export interface PlanKPI {
  onTimeDeliveryRate: number;
  resourceUtilization: number;
  totalSetupTime: number;
  disruptionScore?: number;
}

export interface ScheduleResponse {
  planId: string;
  version: string;
  mode: ScheduleMode;
  tasks: Task[];
  kpis: PlanKPI;
  alternatives?: {
    planId: string;
    name: string;
    description: string;
    tasks: Task[];
    kpis: PlanKPI;
  }[];
  createdAt: string;
}


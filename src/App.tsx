import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Server, Activity, Factory, Package, Wrench, 
  Cpu, Network, Terminal, Database, Zap, GitMerge, 
  BarChart, Crosshair, Hexagon, Layers, Play, Settings, Settings2, AlertTriangle, CalendarDays,
  ChevronRight, Search, Filter, Clock
} from 'lucide-react';
import { cn } from './lib/utils';
import { mockResources, mockTasks, mockExceptions, mockRescheduleResponse, mockItems, mockRoutings, mockWorkCenters, mockBOMs } from './data/mock';
import { ScheduleMode, ExceptionEvent, Item } from './types/aps';

// --- Helper Components ---

function BOMNode({ itemId, quantity, level = 0 }: { key?: string, itemId: string, quantity: number, level?: number }) {
  const item = mockItems.find(i => i.id === itemId);
  const bom = mockBOMs.find(b => b.parentItemId === itemId);
  
  if (!item) return null;

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between text-[11px] bg-zinc-50 p-1.5 border border-zinc-200 rounded-sm hover:bg-zinc-100 transition-colors">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
          <span className="font-mono text-zinc-600 font-bold">{item.code}</span>
          <span className="text-zinc-800">{item.name}</span>
        </div>
        <span className="font-mono font-bold text-emerald-600">x{quantity}</span>
      </div>
      {bom && (
        <div className="pl-3 border-l border-zinc-200 ml-1.5 mt-1 space-y-1">
          {bom.components.map(comp => (
            <BOMNode key={comp.itemId} itemId={comp.itemId} quantity={comp.quantity} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function BOMTreeView({ item }: { item: Item }) {
  const bom = mockBOMs.find(b => b.parentItemId === item.id);
  
  if (!bom) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-zinc-400">
        该物料没有下级 BOM 组件
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="font-bold text-[11px] text-zinc-800 mb-2 flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-blue-600" />
        {item.code} ({item.name})
      </div>
      <div className="pl-2 border-l border-zinc-200 ml-1.5">
        {bom.components.map(comp => (
          <BOMNode key={comp.itemId} itemId={comp.itemId} quantity={comp.quantity} />
        ))}
      </div>
    </div>
  );
}

function RoutingAndResourceView({ item }: { item: Item }) {
  const routing = mockRoutings.find(r => r.itemId === item.id);
  
  if (!routing) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-zinc-400">
        该物料没有配置工艺路线
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="font-bold text-[12px] text-zinc-800 flex items-center gap-1.5 border-b border-zinc-200 pb-2">
        <GitMerge className="w-4 h-4 text-purple-600" />
        {routing.name} <span className="text-zinc-400 font-normal font-mono">({routing.id})</span>
      </div>
      <div className="space-y-0 pl-1 mt-1">
        {routing.operations.map((op, idx) => {
          const workCenter = mockWorkCenters.find(wc => wc.id === op.workCenterId);
          // Find all resources that belong to this work center
          const availableResources = mockResources.filter(res => res.workCenterId === op.workCenterId);
          
          return (
            <div key={op.id} className="relative pl-6 border-l-2 border-purple-200 last:border-l-transparent pb-4 last:pb-0">
              <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-purple-500 border-2 border-white box-content" />
              <div className="bg-zinc-50 border border-zinc-200 p-2.5 rounded-sm text-[11px] hover:bg-zinc-100 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-zinc-800 flex items-center gap-1.5 text-[12px]">
                    <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono leading-none">OP{op.sequence}</span>
                    {op.name}
                  </span>
                  <span className="text-zinc-500 flex items-center gap-1 bg-white border border-zinc-200 px-2 py-0.5 rounded-sm font-medium">
                    <Factory className="w-3.5 h-3.5 text-blue-500" />
                    {workCenter?.name || op.workCenterId}
                  </span>
                </div>
                
                <div className="flex gap-4 text-[10px] text-zinc-500 bg-white p-2 rounded-sm border border-zinc-100 mb-2">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500"/> 准备时间: <span className="font-mono text-zinc-700">{op.standardSetupTime}m</span></span>
                  <span className="flex items-center gap-1"><Play className="w-3.5 h-3.5 text-emerald-500"/> 运行时间: <span className="font-mono text-zinc-700">{op.standardRunTime}m</span></span>
                  <span className="flex items-center gap-1"><Wrench className="w-3.5 h-3.5 text-blue-500"/> 资源需求: <span className="font-mono text-zinc-700">{op.requiredResources.map(r => `${r.type === 'MACHINE' ? '机' : '人'}x${r.quantity}`).join(', ')}</span></span>
                </div>

                {/* Machine/Resource Details for this Operation */}
                {availableResources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zinc-200 border-dashed">
                    <div className="text-[10px] text-zinc-400 mb-1.5 flex items-center gap-1">
                      <Settings2 className="w-3 h-3" /> 可用设备资源 (Machines)
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {availableResources.map(res => (
                        <div key={res.id} className="bg-white border border-zinc-200 p-1.5 rounded-sm flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-700 text-[10px]">[{res.code}] {res.name}</span>
                            <span className="text-zinc-400 text-[9px] font-mono">产能: {res.capacity}U/H</span>
                          </div>
                          <span className={cn("text-[8px] px-1 py-0.5 rounded-sm border", res.isFaulty ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")}>
                            {res.isFaulty ? '维护期' : '启用'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, className, rightContent }: any) {
  return (
    <div className={cn("bg-white border border-zinc-200 flex flex-col overflow-hidden shadow-sm", className)}>
      <div className="bg-zinc-50 px-3 py-2 border-b border-zinc-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Hexagon className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[12px] font-bold text-zinc-800">{title}</span>
          {subtitle && <span className="text-[10px] font-mono text-zinc-400 ml-1">{subtitle}</span>}
        </div>
        {rightContent && <div className="text-[11px]">{rightContent}</div>}
      </div>
      <div className="flex-1 overflow-auto p-2 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

// --- Views ---

function FactoryModelView() {
  const [modelTab, setModelTab] = useState('4m1e');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemFilter, setItemFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = mockItems.filter(item => {
    const matchesFilter = itemFilter === 'ALL' || item.type === itemFilter;
    const matchesSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-zinc-100 text-zinc-800 p-1.5 gap-1.5">
      {/* Top Navigation for Modeling */}
      <div className="bg-white border border-zinc-200 p-1.5 flex gap-1 shadow-sm rounded-sm shrink-0">
        <button 
          onClick={() => setModelTab('4m1e')}
          className={cn("px-4 py-1.5 text-[12px] font-bold rounded-sm transition-all", modelTab === '4m1e' ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" : "text-zinc-600 hover:bg-zinc-50 border border-transparent")}
        >
          4M1E 工厂物理建模 (人机料法环)
        </button>
        <button 
          onClick={() => setModelTab('ddd')}
          className={cn("px-4 py-1.5 text-[12px] font-bold rounded-sm transition-all", modelTab === 'ddd' ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" : "text-zinc-600 hover:bg-zinc-50 border border-transparent")}
        >
          DDD 业务领域模型 (订单/任务)
        </button>
      </div>

      {modelTab === '4m1e' ? (
        <>
          {/* Main Content: Master Data, BOM/Routing, Machine */}
          <div className="flex-1 grid grid-cols-12 gap-1.5 min-h-0">
            <Panel title="主数据 (Master Data)" subtitle="MATERIAL_MASTER" className="col-span-4" rightContent={<span className="text-blue-600 font-bold">总节点数: {filteredItems.length}</span>}>
              <div className="flex flex-col h-full">
                {/* Filter & Search Bar */}
                <div className="flex flex-col gap-2 mb-3 shrink-0">
                  <div className="flex items-center gap-1.5 bg-zinc-50 p-1 rounded-sm border border-zinc-200">
                    <button onClick={() => setItemFilter('ALL')} className={cn("flex-1 text-[10px] py-1 rounded-sm font-medium transition-colors", itemFilter === 'ALL' ? "bg-white shadow-sm text-zinc-800 border border-zinc-200" : "text-zinc-500 hover:text-zinc-700")}>全部</button>
                    <button onClick={() => setItemFilter('FINISHED_GOODS')} className={cn("flex-1 text-[10px] py-1 rounded-sm font-medium transition-colors", itemFilter === 'FINISHED_GOODS' ? "bg-white shadow-sm text-zinc-800 border border-zinc-200" : "text-zinc-500 hover:text-zinc-700")}>成品</button>
                    <button onClick={() => setItemFilter('SEMI_FINISHED')} className={cn("flex-1 text-[10px] py-1 rounded-sm font-medium transition-colors", itemFilter === 'SEMI_FINISHED' ? "bg-white shadow-sm text-zinc-800 border border-zinc-200" : "text-zinc-500 hover:text-zinc-700")}>半成品</button>
                    <button onClick={() => setItemFilter('RAW_MATERIAL')} className={cn("flex-1 text-[10px] py-1 rounded-sm font-medium transition-colors", itemFilter === 'RAW_MATERIAL' ? "bg-white shadow-sm text-zinc-800 border border-zinc-200" : "text-zinc-500 hover:text-zinc-700")}>原材料</button>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                      type="text" 
                      placeholder="搜索物料编码或名称..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2 py-1.5 text-[11px] border border-zinc-200 rounded-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                      <tr className="text-zinc-500 border-b border-zinc-200">
                        <th className="pb-1.5 font-medium">物料编码</th>
                        <th className="pb-1.5 font-medium">类型</th>
                        <th className="pb-1.5 font-medium">提前期</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[10px]">
                      {filteredItems.length > 0 ? filteredItems.map((item, i) => (
                        <tr 
                          key={item.id} 
                          onClick={() => setSelectedItem(item)}
                          className={cn(
                            "border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors",
                            selectedItem?.id === item.id && "bg-blue-50"
                          )}
                        >
                          <td className="py-2 text-blue-700 font-bold text-[11px]">{item.code}</td>
                          <td className="py-2 text-emerald-700">{item.type === 'FINISHED_GOODS' ? '成品' : item.type === 'SEMI_FINISHED' ? '半成品' : '原材料'}</td>
                          <td className="py-2 font-medium">{item.leadTimeDays}d</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-zinc-400 font-sans">没有找到匹配的物料</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>

            <div className="col-span-8 flex flex-col gap-1.5 min-h-0">
              <Panel title="料 (Material) - BOM 结构" subtitle="BOM_STRUCTURE" className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                {selectedItem ? (
                  <BOMTreeView item={selectedItem} />
                ) : (
                  <div className="flex items-center justify-center h-full text-[11px] text-zinc-400">
                    请在左侧选择物料查看 BOM
                  </div>
                )}
              </Panel>
              
              <Panel title="法 & 机 (Method & Machine) - 工艺路线与资源分配" subtitle="ROUTING_AND_RESOURCES" className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                {selectedItem ? (
                  <RoutingAndResourceView item={selectedItem} />
                ) : (
                  <div className="flex items-center justify-center h-full text-[11px] text-zinc-400">
                    请在左侧选择物料查看工艺与资源分配
                  </div>
                )}
              </Panel>
            </div>
      </div>
        </>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-1.5 min-h-0">
          <Panel title="Project (项目/订单)" subtitle="DOMAIN_PROJECT" className="col-span-1">
            <div className="space-y-2 p-2">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-sm">
                <div className="font-bold text-blue-800 text-[12px] mb-1">PRJ-2024-001</div>
                <div className="text-[10px] text-blue-600">新能源汽车电池包产线</div>
                <div className="mt-2 text-[10px] text-zinc-500 flex justify-between">
                  <span>交期: 2024-12-31</span>
                  <span className="text-emerald-600 font-bold">进行中</span>
                </div>
              </div>
            </div>
          </Panel>
          <Panel title="WorkOrder (工单)" subtitle="DOMAIN_WORKORDER" className="col-span-1">
            <div className="space-y-2 p-2">
              {mockTasks.slice(0, 3).map(task => (
                <div key={task.workOrderId} className="bg-white border border-zinc-200 p-2 rounded-sm shadow-sm">
                  <div className="font-bold text-zinc-800 text-[11px] mb-1">{task.workOrderId}</div>
                  <div className="text-[10px] text-zinc-500">需求数量: 1000 PCS</div>
                  <div className="mt-1 text-[9px] text-zinc-400">关联项目: PRJ-2024-001</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Task & Resource (任务与资源)" subtitle="DOMAIN_TASK_RESOURCE" className="col-span-1">
            <div className="space-y-2 p-2">
              {mockTasks.slice(0, 4).map(task => (
                <div key={task.id} className="bg-zinc-50 border border-zinc-200 p-2 rounded-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-zinc-700 text-[11px]">{task.operationId}</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded">{task.status}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1">
                    <Wrench className="w-3 h-3" /> 分配资源: {task.resourceIds.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function ConsoleView() {
  const [running, setRunning] = useState<ScheduleMode | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleRun = (mode: ScheduleMode) => {
    setRunning(mode);
    setLogs(prev => [...prev, `[${new Date().toISOString()}] 初始化排产引擎 模式=${mode}`]);
    
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const newLogs = [];
      if (step === 1) newLogs.push(`[系统] 加载 4M1E 工厂拓扑数据... 成功 (${Math.floor(Math.random()*100)}ms)`);
      if (step === 2) newLogs.push(`[优化] 构建约束矩阵: ${Math.floor(Math.random()*1000 + 500)} 个变量, ${Math.floor(Math.random()*5000 + 2000)} 个约束条件.`);
      if (step === 3) newLogs.push(`[优化] 运行启发式预求解算法...`);
      if (step === 4) newLogs.push(`[优化] 分支定界 (Branch & Bound) 深度: ${Math.floor(Math.random()*20 + 10)}... 差距(Gap): ${(Math.random()*5).toFixed(2)}%`);
      if (step === 5) {
        newLogs.push(`[系统] 找到最优解。目标函数值: ${(Math.random()*10000).toFixed(4)}`);
        setRunning(null);
        clearInterval(interval);
      }
      setLogs(prev => [...prev, ...newLogs]);
    }, 600);
  };

  const modeNames: Record<string, string> = {
    'PROJECT_PRE_SCHEDULE': '项目预排产 (中长期)',
    'WEEKLY_FULL': '周度全量排产 (短期)',
    'DYNAMIC_RESCHEDULE': '动态插单重排 (实时)'
  };

  return (
    <div className="h-full flex flex-col bg-zinc-100 text-zinc-800 p-1.5 gap-1.5">
      <div className="flex-1 grid grid-cols-12 gap-1.5 min-h-0">
        <Panel title="排产算法参数配置" subtitle="SOLVER_PARAMETERS" className="col-span-8">
          <div className="grid grid-cols-2 gap-3">
            {['PROJECT_PRE_SCHEDULE', 'WEEKLY_FULL', 'DYNAMIC_RESCHEDULE'].map((mode) => (
              <div key={mode} className="border border-zinc-200 bg-zinc-50 p-3 hover:border-zinc-300 transition-colors shadow-sm rounded-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[12px] text-blue-700 font-bold">{modeNames[mode]}</span>
                  <span className="text-[9px] font-mono text-zinc-500">ID: 0x{Math.random().toString(16).substr(2, 4)}</span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-[11px]"><span className="text-zinc-600">交期达成权重 (W_DELIVERY)</span><span className="text-emerald-700 font-bold font-mono">0.85</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-zinc-600">资源利用率权重 (W_UTILIZATION)</span><span className="text-emerald-700 font-bold font-mono">0.40</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-zinc-600">计划稳定性权重 (W_STABILITY)</span><span className="text-emerald-700 font-bold font-mono">0.95</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-zinc-600">最大迭代次数 (MAX_ITERATIONS)</span><span className="text-amber-700 font-bold font-mono">10000</span></div>
                </div>
                <button 
                  onClick={() => handleRun(mode as ScheduleMode)}
                  disabled={running !== null}
                  className={cn(
                    "w-full py-2 text-[11px] font-bold border flex items-center justify-center gap-2 transition-all rounded-sm",
                    running === mode 
                      ? "bg-blue-50 border-blue-300 text-blue-700 shadow-inner" 
                      : "bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-400 shadow-sm"
                  )}
                >
                  {running === mode ? (
                    <><Zap className="w-3.5 h-3.5 animate-pulse" /> 正在计算...</>
                  ) : (
                    <><Play className="w-3.5 h-3.5" /> 启动排产</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="全局排产约束" subtitle="GLOBAL_CONSTRAINTS" className="col-span-4">
          <div className="space-y-3 text-[11px]">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-700">允许产能超载</span>
              <span className="text-red-600 font-bold text-[10px] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">否 (FALSE)</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-700">严格遵守工艺顺序</span>
              <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">是 (TRUE)</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-700">强制物料齐套检查</span>
              <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">是 (TRUE)</span>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="text-zinc-700">核心优化目标</span>
              <span className="text-blue-600 font-bold text-[10px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">最短完工时间 (MAKESPAN)</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="求解器运行日志" subtitle="SOLVER_TERMINAL_OUTPUT" className="h-1/3">
        <div className="font-mono text-[11px] space-y-1.5 bg-zinc-50 p-3 h-full border border-zinc-200 overflow-y-auto shadow-inner rounded-sm">
          {logs.map((log, i) => (
            <div key={i} className={cn(
              log.includes('错误') || log.includes('ERR') ? 'text-red-600' : 
              log.includes('优化') || log.includes('OPT') ? 'text-blue-700' : 
              log.includes('最优解') ? 'text-emerald-700 font-bold' : 'text-zinc-700'
            )}>
              {log}
            </div>
          ))}
          {running && (
            <div className="text-zinc-400 animate-pulse">_</div>
          )}
          {logs.length === 0 && !running && (
            <div className="text-zinc-400 italic">等待排产任务启动...</div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function GanttView() {
  return (
    <div className="h-full flex flex-col bg-zinc-100 text-zinc-800 p-1.5 gap-1.5">
      <Panel title="资源负荷甘特图" subtitle="RESOURCE_GANTT_MATRIX" className="flex-1" rightContent={<span className="text-amber-600 font-bold">时间精度: 1小时</span>}>
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="flex border-b border-zinc-300 bg-zinc-100 sticky top-0 z-20 shadow-sm">
            <div className="w-48 p-2 text-[11px] font-bold text-zinc-700 border-r border-zinc-300 flex-shrink-0 bg-zinc-100 flex items-center">
              设备/资源编号
            </div>
            <div className="flex-1 flex relative">
              <div className="absolute left-0 top-0 bottom-0 w-[30%] bg-zinc-200/50 border-r border-dashed border-zinc-400 z-0 flex items-center justify-center">
                <span className="text-[11px] text-zinc-500 font-bold">排产冻结期 (FROZEN)</span>
              </div>
              <div className="flex-1 grid grid-cols-4 divide-x divide-zinc-300 text-[10px] text-zinc-600 font-mono z-10">
                <div className="p-1.5 pl-2 font-bold">当前 (T+00h)</div>
                <div className="p-1.5 pl-2 font-bold">明天 (T+24h)</div>
                <div className="p-1.5 pl-2 font-bold">后天 (T+48h)</div>
                <div className="p-1.5 pl-2 font-bold">大后天 (T+72h)</div>
              </div>
            </div>
          </div>

          {/* Gantt Rows */}
          <div className="divide-y divide-zinc-200">
            {mockResources.map(res => (
              <div key={res.id} className="flex group hover:bg-zinc-50 transition-colors relative bg-white">
                <div className="w-48 p-2 border-r border-zinc-200 flex-shrink-0 flex items-center gap-2 z-10 bg-white group-hover:bg-zinc-50">
                  <div className={cn("w-2 h-2 rounded-full", res.isFaulty ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
                  <div className="text-[11px] font-bold text-zinc-700 truncate" title={res.name}>{res.name} <span className="text-zinc-400 font-mono font-normal">({res.id})</span></div>
                </div>
                <div className="flex-1 relative h-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE5LjUgMEwxOS41IDIwTTAgMTkuNUwyMCAxOS41IiBzdHJva2U9IiNlNWU1ZTUiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==')]">
                  {mockTasks.filter(t => t.resourceIds.includes(res.id)).map(task => {
                    const isFrozen = task.status === 'FROZEN' || task.status === 'IN_PROGRESS';
                    const left = task.id === 'T1' ? '2%' : task.id === 'T2' ? '18%' : task.id === 'T3' ? '52%' : '78%';
                    const width = task.id === 'T1' ? '12%' : task.id === 'T2' ? '28%' : task.id === 'T3' ? '22%' : '18%';
                    
                    return (
                      <div 
                        key={task.id}
                        className={cn(
                          "absolute top-1.5 bottom-1.5 border-l-4 flex flex-col justify-center px-1.5 overflow-hidden shadow-sm rounded-r-sm cursor-pointer hover:brightness-95 transition-all",
                          isFrozen ? "bg-zinc-100 border-zinc-400 text-zinc-700" : "bg-blue-50 border-blue-500 text-blue-800",
                          task.status === 'IN_PROGRESS' && "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500"
                        )}
                        style={{ left, width }}
                      >
                        <div className="text-[10px] font-bold truncate">{task.workOrderId}</div>
                        <div className="text-[9px] truncate opacity-80">{task.operationId}</div>
                        {!task.materialReady && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-sm" title="物料短缺 (MAT_SHORTAGE)" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function ExceptionView() {
  const [selectedEvent, setSelectedEvent] = useState<ExceptionEvent | null>(mockExceptions[0]);

  return (
    <div className="h-full flex flex-col bg-zinc-100 text-zinc-800 p-1.5 gap-1.5">
      <div className="flex-1 grid grid-cols-12 gap-1.5 min-h-0">
        <Panel title="生产异常事件队列" subtitle="EXCEPTION_EVENT_QUEUE" className="col-span-4">
          <div className="space-y-1.5">
            {mockExceptions.map(event => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={cn(
                  "w-full text-left p-2.5 border transition-all shadow-sm rounded-sm",
                  selectedEvent?.id === event.id 
                    ? "bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400" 
                    : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                )}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className={cn(
                    "px-1.5 py-0.5 font-bold rounded-sm text-white text-[10px]",
                    event.level === 'L1' ? "bg-zinc-500" : event.level === 'L2' ? "bg-amber-500" : "bg-red-500"
                  )}>
                    [{event.level}] {event.id}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{event.timestamp.split(' ')[1]}</span>
                </div>
                <div className="truncate font-bold text-[12px] text-zinc-800">{event.type}</div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="重排策略推荐" subtitle="RESOLUTION_ALTERNATIVES" className="col-span-8">
          {selectedEvent ? (
            <div className="h-full flex flex-col">
              <div className="bg-white border border-zinc-200 p-3 mb-3 shadow-sm rounded-sm">
                <div className="text-red-600 font-bold mb-1.5 text-[12px] flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> 检测到异常: {selectedEvent.type}
                </div>
                <div className="text-zinc-600 mb-3 text-[11px]">{selectedEvent.description}</div>
                <div className="flex gap-6 text-[11px] text-zinc-500 bg-zinc-50 p-2 rounded-sm border border-zinc-100">
                  <span>受影响资源: <span className="text-zinc-800 font-bold font-mono">{selectedEvent.resourceId || '无'}</span></span>
                  <span>受影响工单: <span className="text-zinc-800 font-bold font-mono">{selectedEvent.workOrderId || '无'}</span></span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {mockRescheduleResponse.alternatives?.map((alt, idx) => (
                  <div key={alt.planId} className="bg-white border border-zinc-200 p-3.5 relative overflow-hidden group hover:border-zinc-300 transition-colors shadow-sm rounded-sm">
                    {idx === 0 && <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 border-b border-l border-emerald-200 rounded-bl-sm">系统最优推荐</div>}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-[13px] font-bold text-zinc-900">{alt.name}</div>
                        <div className="text-[11px] text-zinc-500 mt-1">{alt.description}</div>
                      </div>
                      <button className="px-4 py-1.5 bg-white text-blue-700 text-[11px] font-bold border border-blue-200 rounded-sm hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm flex items-center gap-1">
                        <GitMerge className="w-3.5 h-3.5" /> 应用此方案
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-zinc-100">
                      <div>
                        <div className="text-[10px] text-zinc-500 mb-1">订单准交率</div>
                        <div className={cn("text-[14px] font-bold font-mono", alt.kpis.onTimeDeliveryRate < 0.9 ? "text-amber-600" : "text-emerald-600")}>
                          {(alt.kpis.onTimeDeliveryRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 mb-1">资源利用率</div>
                        <div className="text-[14px] font-bold font-mono text-blue-600">
                          {(alt.kpis.resourceUtilization * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 mb-1">计划扰动指数</div>
                        <div className={cn("text-[14px] font-bold font-mono", alt.kpis.disruptionScore! > 50 ? "text-red-600" : "text-emerald-600")}>
                          {alt.kpis.disruptionScore?.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-zinc-500 mb-1">换型惩罚时间</div>
                        <div className="text-[14px] font-bold font-mono text-zinc-800">
                          {alt.kpis.totalSetupTime} 分钟
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[12px] text-zinc-400">
              请在左侧选择一个异常事件查看处理方案...
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('factory');

  const navItems = [
    { id: 'factory', icon: Network, label: '工厂建模 (4M1E)' },
    { id: 'console', icon: Terminal, label: '排产控制台' },
    { id: 'gantt', icon: BarChart, label: '甘特图排程' },
    { id: 'exceptions', icon: AlertTriangle, label: '异常处理中心' },
  ];

  return (
    <div className="flex h-screen w-full bg-zinc-100 text-zinc-900 font-sans overflow-hidden selection:bg-blue-200">
      {/* Expanded Sidebar with Text Labels */}
      <div className="w-48 bg-white border-r border-zinc-200 flex flex-col py-4 z-50 shadow-sm">
        <div className="px-4 mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded flex items-center justify-center shadow-sm flex-shrink-0">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-zinc-800 leading-tight">APS 智能排产</span>
            <span className="text-[9px] text-zinc-500 font-mono">v3.0.4 Enterprise</span>
          </div>
        </div>
        
        <nav className="flex-1 flex flex-col gap-1.5 px-3 w-full">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full px-3 py-2.5 rounded-md flex items-center gap-3 transition-all relative text-left",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-700 font-bold border border-blue-100 shadow-sm" 
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 border border-transparent"
              )}
            >
              <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-blue-600" : "text-zinc-500")} />
              <span className="text-[12px]">{item.label}</span>
              {activeTab === item.id && (
                <ChevronRight className="w-3.5 h-3.5 absolute right-2 opacity-50" />
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 mt-auto">
          <button className="w-full px-3 py-2 rounded-md flex items-center gap-3 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors text-left">
            <Settings className="w-4 h-4" />
            <span className="text-[12px]">系统设置</span>
          </button>
        </div>
      </div>
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Telemetry Bar */}
        <header className="h-10 bg-white border-b border-zinc-200 flex items-center justify-between px-5 text-[11px] text-zinc-600 select-none shadow-sm z-10">
          <div className="flex items-center gap-6">
            <span className="text-blue-700 font-bold tracking-wide">APS 核心求解引擎</span>
            <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-emerald-600" /> 数据库同步: 正常</span>
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-zinc-500" /> 求解器状态: 空闲</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[10px]">
            <span>MEM: 4.2GB / 16.0GB</span>
            <span>LATENCY: 12ms</span>
            <span className="text-zinc-800 font-bold">{new Date().toISOString().replace('T', ' ').substr(0, 19)} UTC</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNlNWU1ZTUiLz48L3N2Zz4=')]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 p-1.5"
            >
              {activeTab === 'factory' && <FactoryModelView />}
              {activeTab === 'console' && <ConsoleView />}
              {activeTab === 'gantt' && <GanttView />}
              {activeTab === 'exceptions' && <ExceptionView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}


import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  ChartNoAxesColumn,
} from "lucide-react";

import type { Task } from "@/types/task";

type StatsCardsProps = {
  tasks: Task[];
};

export default function StatsCards({ tasks }: StatsCardsProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;
  const pendingTasks = totalTasks - completedTasks;

  const completionRate =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  const stats = [
    {
      label: "งานทั้งหมด",
      value: totalTasks,
      icon: ClipboardList,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "เสร็จแล้ว",
      value: completedTasks,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "ยังไม่เสร็จ",
      value: pendingTasks,
      icon: Clock3,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "ความสำเร็จ",
      value: `${completionRate}%`,
      icon: ChartNoAxesColumn,
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {stat.label}
              </p>

              <div className={`rounded-xl p-3 ${stat.color}`}>
                <Icon size={21} />
              </div>
            </div>

            <p className="mt-4 text-3xl font-bold text-gray-800">
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

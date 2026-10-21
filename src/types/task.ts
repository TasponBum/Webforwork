
export type Task = {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  createdAt: string;
};

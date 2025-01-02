import { Form } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { militaryToNormalTime } from '~/functions/militaryToNormalTime';
import { getTaskEndTime } from '~/functions/getTaskEndTime';

interface Task {
  id: number;
  title: string;
  startTime: string;
  duration: number;
}

interface ListViewProps {
  tasks: Task[];
}

export function ListView({ tasks }: ListViewProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">List View</h2>
      <div className="flex flex-col gap-3">
        {tasks.map(task => (
          <div
            key={task.id}
            className="flex items-center justify-between p-4 bg-secondary rounded-lg shadow-sm hover:shadow transition-shadow"
          >
            <div className="flex flex-col">
              <span className="font-medium">{task.title}</span>
              <span className="text-sm text-muted-foreground">
                {militaryToNormalTime(task.startTime)} -{' '}
                {militaryToNormalTime(getTaskEndTime(task.startTime, task.duration))}
              </span>
              <span className="text-xs text-muted-foreground">{task.duration} min</span>
            </div>
            <Form method="post">
              <input type="hidden" name="action" value="delete" />
              <input type="hidden" name="todoId" value={task.id} />
              <Button variant="destructive" size="sm" type="submit">
                Delete
              </Button>
            </Form>
          </div>
        ))}
      </div>
    </section>
  );
}

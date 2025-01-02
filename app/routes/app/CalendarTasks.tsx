import { Form, useFetcher } from '@remix-run/react';
import { useState } from 'react';
import { ResizableBox } from 'react-resizable';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { Rnd } from 'react-rnd';
// Functions
import { getTaskEndTime } from '~/functions/getTaskEndTime';
import { militaryToNormalTime } from '~/functions/militaryToNormalTime';

interface Task {
  id: number;
  title: string;
  startTime: string;
  duration: number;
}

interface TimeSlot {
  hour: string;
  display: string;
  subdivisions: {
    time: string;
    display: string;
  }[];
}

interface TasksProps {
  timeSlots: TimeSlot[];
  tasks: Task[];
}

// Array of background colors with good contrast
const TASK_COLORS = [
  'bg-blue-500/20 hover:bg-blue-500/30',
  'bg-green-500/20 hover:bg-green-500/30',
  'bg-purple-500/20 hover:bg-purple-500/30',
  'bg-orange-500/20 hover:bg-orange-500/30',
  'bg-pink-500/20 hover:bg-pink-500/30',
  'bg-teal-500/20 hover:bg-teal-500/30',
  'bg-indigo-500/20 hover:bg-indigo-500/30',
  'bg-red-500/20 hover:bg-red-500/30',
];

export function Tasks({ timeSlots, tasks }: TasksProps) {
  const getTaskColor = (taskId: number) => {
    return TASK_COLORS[taskId % TASK_COLORS.length];
  };

  const getTasksStartingInSubdivision = (time: string) => {
    return tasks.filter(task => task.startTime === time);
  };

  const [tempDurations, setTempDurations] = useState<Record<number, number>>({});
  const fetcher = useFetcher();

  const calculateTaskHeight = (duration: number) => {
    // Each 15-min block is 20px high (reduced from 40px), calculate how many blocks the task spans
    return Math.ceil(duration / 15) * 20;
  };

  const [taskHeights, setTaskHeights] = useState<Record<number, number>>({});

  const handleResize = (taskId: number, height: number) => {
    const snappedHeight = Math.round(height / 20) * 20;
    setTaskHeights(prev => ({
      ...prev,
      [taskId]: snappedHeight,
    }));
  };

  const handleResizeStop = (
    taskId: number,
    _e: MouseEvent | TouchEvent,
    { size }: { size: { height: number } }
  ) => {
    // Convert height to duration (20px = 15min)
    const snappedHeight = Math.round(size.height / 20) * 20;
    const duration = Math.round((snappedHeight / 20) * 15);

    fetcher.submit(
      {
        taskId: taskId.toString(),
        duration: duration.toString(),
        action: 'updateDuration',
      },
      { method: 'post' }
    );

    setTempDurations(prev => ({
      ...prev,
      [taskId]: duration,
    }));
  };

  return (
    <>
      {timeSlots.map((slot, slotIndex) => (
        <div
          key={slot.hour}
          className="absolute left-0 right-0"
          style={{ top: `${slotIndex * 80}px` }}
        >
          {slot.subdivisions.map((sub, subIndex) => (
            <div key={sub.time} className="relative" style={{ top: `${subIndex * 20}px` }}>
              {getTasksStartingInSubdivision(sub.time).map(task => {
                const duration = tempDurations[task.id] ?? task.duration;
                const height = taskHeights[task.id] ?? calculateTaskHeight(duration);

                return (
                  <div key={task.id} className="absolute left-2 right-2 ">
                    <Rnd
                      default={{
                        x: 0,
                        y: slotIndex,
                        width: 400,
                        height: height,
                      }}
                      minHeight={20}
                      maxHeight={300}
                      dragGrid={[20, 20]}
                      resizeGrid={[20, 20]}
                      bounds="parent"
                      onDragStop={(e, d) => {
                        // Add comment before console.log
                        // Log drag stop position
                        console.log('drag stop', d);
                        // TODO: Update task position in state/DB
                      }}
                      onResize={(e, direction, ref, delta, position) => {
                        handleResize(task.id, parseInt(ref.style.height));
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        // Add comment before console.log
                        // Log resize stop dimensions
                        console.log('resize stop', ref.style.height);
                        handleResizeStop(task.id, e, {
                          size: { height: parseInt(ref.style.height) },
                        });
                      }}
                    >
                      <div
                        className={cn(
                          'transition-colors rounded-md overflow-hidden shadow-sm p-2',
                          getTaskColor(task.id)
                        )}
                        style={{ width: '400px', height: height + 'px' }}
                      >
                        <div className="line-clamp-2 font-medium">{task.title}</div>
                        <div className="text-xs opacity-70">
                          {militaryToNormalTime(task.startTime)} -{' '}
                          {militaryToNormalTime(getTaskEndTime(task.startTime, duration))}
                        </div>
                        <div className="text-xs opacity-70">{duration} minutes</div>
                      </div>
                    </Rnd>
                    <ResizableBox
                      width={400}
                      height={height}
                      axis="y"
                      resizeHandles={['s']}
                      minConstraints={[200, 20]}
                      maxConstraints={[200, 300]}
                      onResize={(e, data) => handleResize(task.id, e, data)}
                      onResizeStop={(e, data) => handleResizeStop(task.id, e, data)}
                      draggableOpts={{ grid: [20, 20] }}
                    >
                      <div
                        className={cn(
                          'transition-colors rounded-md overflow-hidden shadow-sm p-2',
                          getTaskColor(task.id)
                        )}
                        style={{ width: '400px', height: height + 'px' }}
                      >
                        <div className="line-clamp-2 font-medium">{task.title}</div>
                        <div className="text-xs opacity-70">
                          {militaryToNormalTime(task.startTime)} -{' '}
                          {militaryToNormalTime(getTaskEndTime(task.startTime, duration))}
                        </div>
                        <div className="text-xs opacity-70">{duration} minutes</div>
                      </div>
                    </ResizableBox>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

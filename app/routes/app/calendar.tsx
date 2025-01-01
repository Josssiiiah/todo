import { ScrollArea } from '~/components/ui/scroll-area';
import { cn } from '~/lib/utils';
import { Resizable, ResizeCallbackData, ResizableBox } from 'react-resizable';
import { useCallback, useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import 'react-resizable/css/styles.css';
import { Button } from '~/components/ui/button';
import { useToast } from '~/components/ui/use-toast';

// Helper function to convert military time to 12-hour format
function militaryToNormalTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

// Helper function to calculate end time
function getEndTime(startTime: string, durationMinutes: number) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

interface Task {
  id: number;
  title: string;
  startTime: string; // in HH:mm format
  duration: number; // in minutes
}

interface CalendarProps {
  tasks: Task[];
}

interface ActionResponse {
  status: 'success' | 'error';
  message: string;
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

export function Calendar({ tasks }: CalendarProps) {
  const fetcher = useFetcher();
  const [tempDurations, setTempDurations] = useState<Record<number, number>>({});
  const [taskHeights, setTaskHeights] = useState<Record<number, number>>({});
  const exportFetcher = useFetcher<ActionResponse>();
  const { toast } = useToast();

  // Get the current hour
  const currentHour = new Date().getHours();

  // Calculate number of slots needed (from current hour to midnight)
  const hoursUntilMidnight = 24 - currentHour;

  // Generate time slots from current hour until midnight
  const timeSlots = Array.from({ length: hoursUntilMidnight }, (_, index) => {
    const hour = currentHour + index;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const military = `${hour.toString().padStart(2, '0')}`;

    return {
      hour: military,
      display: `${displayHour}${period}`,
      subdivisions: [0, 15, 30, 45].map(minutes => ({
        time: `${military}:${minutes.toString().padStart(2, '0')}`,
        display: minutes === 0 ? `${displayHour}${period}` : `${minutes}`,
      })),
    };
  });

  const getTaskColor = (taskId: number) => {
    return TASK_COLORS[taskId % TASK_COLORS.length];
  };

  const getTasksStartingInSubdivision = (time: string) => {
    return tasks.filter(task => task.startTime === time);
  };

  const calculateTaskSpan = (duration: number) => {
    // Each 15-min block is 40px high, calculate how many blocks the task spans
    return Math.ceil(duration / 15) * 40;
  };

  const handleResize = (taskId: number, _e: any, { size }: { size: { height: number } }) => {
    // Snap to 15-minute intervals (40px per 15 minutes)
    const snappedHeight = Math.round(size.height / 40) * 40;
    setTaskHeights(prev => ({
      ...prev,
      [taskId]: snappedHeight,
    }));
  };

  const handleResizeStop = (taskId: number, _e: any, { size }: { size: { height: number } }) => {
    // Convert height to duration (40px = 15min)
    const snappedHeight = Math.round(size.height / 40) * 40;
    const duration = Math.round((snappedHeight / 40) * 15);

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

  const handleExport = () => {
    exportFetcher.submit(
      {
        action: 'exportToCalendar',
        tasks: JSON.stringify(tasks),
      },
      { method: 'post' }
    );
  };

  const handleClearCalendar = () => {
    exportFetcher.submit(
      {
        action: 'clearCalendar',
        date: new Date().toISOString().split('T')[0], // Send today's date
      },
      { method: 'post' }
    );
  };

  // Handle export response
  useEffect(() => {
    if (exportFetcher.data) {
      if (exportFetcher.data.status === 'success') {
        toast({
          title: 'Success',
          description: exportFetcher.data.message,
        });
      } else if (exportFetcher.data.status === 'error') {
        toast({
          title: 'Error',
          description: exportFetcher.data.message,
          variant: 'destructive',
        });
      }
    }
  }, [exportFetcher.data, toast]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Today's Schedule</h2>
        <div className="flex space-x-2">
          <Button
            onClick={handleExport}
            disabled={exportFetcher.state === 'submitting' || tasks.length === 0}
          >
            {exportFetcher.state === 'submitting' ? 'Exporting...' : 'Export to Google Calendar'}
          </Button>
          <Button
            onClick={handleClearCalendar}
            disabled={exportFetcher.state === 'submitting'}
            variant="destructive"
          >
            Clear Google Calendar
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[750px] w-full rounded-md border">
        <div className="flex">
          {/* Time columns */}
          <div className="flex flex-shrink-0">
            {/* Time labels column */}
            <div className="w-16 flex-shrink-0">
              {timeSlots.flatMap(slot =>
                slot.subdivisions.map((sub, subIndex) => (
                  <div
                    key={sub.time}
                    className={cn(
                      'h-10 px-2 text-sm text-muted-foreground flex items-center justify-end',
                      // Only show time at the first subdivision (XX:00)
                      subIndex === 0 ? 'font-medium' : 'opacity-0'
                    )}
                    style={{ transform: subIndex === 0 ? 'translateY(-50%)' : 'none' }}
                  >
                    {subIndex === 0 ? slot.display : ''}
                  </div>
                ))
              )}
            </div>

            {/* Separator column */}
            <div className="w-4 flex-shrink-0 border-r bg-muted/50">
              {timeSlots.flatMap(slot =>
                slot.subdivisions.map(sub => (
                  <div key={sub.time} className="h-10 border-b border-border/50" />
                ))
              )}
            </div>
          </div>

          {/* Tasks column */}
          <div className="flex-grow relative">
            {/* Render all grid lines first */}
            {timeSlots.flatMap(slot =>
              slot.subdivisions.map(sub => (
                <div
                  key={sub.time}
                  className="h-10 border-b border-border/50 border-white pointer-events-none"
                />
              ))
            )}

            {/* Render tasks on top of grid lines */}
            {timeSlots.map((slot, slotIndex) => (
              <div
                key={slot.hour}
                className="absolute left-0 right-0"
                style={{ top: `${slotIndex * 160}px` }}
              >
                {slot.subdivisions.map((sub, subIndex) => (
                  <div key={sub.time} className="relative" style={{ top: `${subIndex * 40}px` }}>
                    {getTasksStartingInSubdivision(sub.time).map(task => {
                      const duration = tempDurations[task.id] ?? task.duration;
                      const height = taskHeights[task.id] ?? calculateTaskSpan(duration);

                      return (
                        <div key={task.id} className="absolute left-2 right-2 ">
                          <ResizableBox
                            width={400}
                            height={height}
                            axis="y"
                            resizeHandles={['s']}
                            minConstraints={[200, 40]}
                            maxConstraints={[200, 600]}
                            onResize={(e, data) => handleResize(task.id, e, data)}
                            onResizeStop={(e, data) => handleResizeStop(task.id, e, data)}
                            draggableOpts={{ grid: [40, 40] }}
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
                                {militaryToNormalTime(getEndTime(task.startTime, duration))}
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
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

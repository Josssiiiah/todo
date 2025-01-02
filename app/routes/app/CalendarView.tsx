import { ScrollArea } from '~/components/ui/scroll-area';
import { cn } from '~/lib/utils';
import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import 'react-resizable/css/styles.css';
import { Button } from '~/components/ui/button';
import { useToast } from '~/components/ui/use-toast';

// Components
import { Tasks } from './CalendarTasks';

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

export function CalendarView({ tasks }: CalendarProps) {
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
                      'h-5 px-2 text-sm text-muted-foreground flex items-center justify-end',
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
                slot.subdivisions.map((sub, subIndex) => (
                  <div
                    key={sub.time}
                    className={cn(
                      'h-5',
                      // Only show border at XX:45 because they're off
                      subIndex === 3 ? 'border-b border-border/50' : ''
                    )}
                  />
                ))
              )}
            </div>
          </div>

          {/* Tasks column */}
          <div className="flex-grow relative">
            {/* Render all grid lines first */}
            {/* {timeSlots.flatMap(slot =>
              slot.subdivisions.map(sub => (
                <div
                  key={sub.time}
                  className="h-10 border-b border-border/50 border-white pointer-events-none"
                />
              ))
            )} */}

            {/* Render tasks */}
            <Tasks timeSlots={timeSlots} tasks={tasks} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

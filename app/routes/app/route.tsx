import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import {
  useLoaderData,
  Form,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import { drizzle } from "drizzle-orm/d1";
import { resources, Users, session } from "app/drizzle/schema.server";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { Toaster } from "~/components/ui/toaster";
import { useEffect, useRef } from "react";
import { Textarea } from "~/components/ui/textarea";
import { eq } from "drizzle-orm";
import { initializeLucia } from "auth";
import Instructor from "@instructor-ai/instructor";
import OpenAI from "openai";
import { z } from "zod";
import { Calendar } from "~/routes/app/calendar";
import { Resizable } from "react-resizable";
import { ResizableBox } from "react-resizable";

interface GoogleCalendarEvent {
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

interface GoogleCalendarError {
  error?: {
    message: string;
  };
}

// Define the schema for todo items
const TodoListSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string(),
      startTime: z.string(), // HH:mm format
      duration: z.number(), // in minutes
    })
  ),
});

////////////////////////////////////////////////////////////
// Loader
////////////////////////////////////////////////////////////
export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = drizzle(context.cloudflare.env.DB);
  const todos = await db.select().from(resources).orderBy(resources.timeStamp);

  return {
    todos,
  };
}

interface Task {
  id: number;
  title: string;
  startTime: string;
  duration: number;
}

interface JsonResource {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  duration: number;
  timeStamp: string;
}

function mapResourceToTask(resource: JsonResource): Task {
  return {
    id: resource.id,
    title: resource.title,
    startTime: resource.startTime ?? "09:00",
    duration: resource.duration ?? 30,
  };
}

export default function Index() {
  const { todos } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { toast } = useToast();
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);

  const mappedTasks = todos.map(mapResourceToTask);

  const isAdding =
    navigation.state === "submitting" &&
    navigation.formData?.get("action") === "add";

  // Calculate time remaining in the day
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();
  const hoursUntilMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
  const minutesUntilMidnight = Math.floor(
    (msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60)
  );

  useEffect(() => {
    if (actionData?.status === "success") {
      if (formRef.current) {
        formRef.current.reset();
      }
      toast({
        title: "Success",
        description: actionData.message,
        variant: "default",
      });
    } else if (actionData?.status === "error") {
      toast({
        title: "Error",
        description: actionData.message,
        variant: "destructive",
      });
    }
  }, [actionData, toast]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <div>
        <h1 className="text-8xl font-bold">Todo AI</h1>
        <p className="text-3xl text-muted-foreground">
          You have{" "}
          <span className="font-bold text-blue-400">{hoursUntilMidnight}</span>{" "}
          hours and{" "}
          <span className="font-bold text-blue-400">
            {minutesUntilMidnight.toString().padStart(2, "0")}
          </span>{" "}
          minutes left until midnight!
        </p>
      </div>

      {/* Calendar View */}
      <Calendar tasks={mappedTasks} />

      {/* Todo List */}
      <div className="space-y-2">
        {mappedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between p-3 bg-secondary rounded-lg"
          >
            <div className="flex flex-col">
              <span>{task.title}</span>
              <span className="text-sm text-muted-foreground">
                {task.startTime} ({task.duration} min)
              </span>
            </div>
            <Form method="post" className="inline">
              <input type="hidden" name="action" value="delete" />
              <input type="hidden" name="todoId" value={task.id} />
              <Button variant="destructive" size="sm" type="submit">
                Delete
              </Button>
            </Form>
          </div>
        ))}
      </div>

      {/* Add Todo Form */}
      <Form ref={formRef} method="post" className="space-y-4">
        <input type="hidden" name="action" value="add" />
        <div className="flex flex-col gap-2">
          <Textarea
            name="title"
            placeholder="Enter tasks in natural language (include when you want to do it and how long it will take)"
            required
            disabled={isAdding}
            className="min-h-[100px]"
          />
          <Button type="submit" disabled={isAdding} className="self-end">
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </div>
      </Form>
      <Toaster />
    </div>
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = drizzle(context.cloudflare.env.DB);
  const formData = await request.formData();
  const action = formData.get("action");

  const { env }: any = context.cloudflare;

  const oai = new OpenAI({
    apiKey: env.OPENAI_API_KEY ?? undefined,
    organization: env.OPENAI_ORGANIZATION ?? undefined,
  });

  const client = Instructor({
    client: oai,
    mode: "FUNCTIONS",
  });

  try {
    if (action === "add") {
      const inputText = formData.get("title") as string;
      if (!inputText) throw new Error("Input is required");

      // Get the next hour from current time
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const startHour = currentMinutes > 0 ? currentHour + 0.25 : currentHour;

      // Calculate number of slots needed (from start hour to midnight)
      const hoursUntilMidnight = 24 - startHour;

      // Format startHour for GPT
      const formattedStartHour = startHour.toString().padStart(2, "0") + ":00";

      // Use Instructor to extract todo items
      const response = await client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a task scheduling system. Break down the user's input into specific, actionable tasks. For each task, specify a start time (in HH:mm format) and duration (in minutes). Important scheduling rules:
              1. Only assign times starting from ${formattedStartHour} and within the next ${hoursUntilMidnight} hours
              2. All times must end in :00, :15, :30, or :45 (15-minute intervals)
              3. Tasks must not overlap in time
              4. If no specific time is mentioned, distribute tasks reasonably within the allowed time window`,
          },
          {
            role: "user",
            content: inputText,
          },
        ],
        model: "gpt-4o-mini",
        response_model: { schema: TodoListSchema, name: "ExtractTasks" },
      });

      // Insert each task into the database
      for (const task of response.tasks) {
        await db.insert(resources).values({
          title: task.title,
          description: "",
          startTime: task.startTime,
          duration: task.duration,
          timeStamp: new Date(),
        });
      }

      return {
        status: "success",
        message: "Tasks added successfully",
      };
    }

    if (action === "delete") {
      const todoId = Number(formData.get("todoId"));
      if (!todoId) throw new Error("Todo ID is required");

      await db.delete(resources).where(eq(resources.id, todoId));

      return {
        status: "success",
        message: "Todo deleted successfully",
      };
    }

    if (action === "updateDuration") {
      const taskId = Number(formData.get("taskId"));
      const duration = Number(formData.get("duration"));

      if (!taskId) throw new Error("Task ID is required");
      if (!duration) throw new Error("Duration is required");

      await db
        .update(resources)
        .set({ duration })
        .where(eq(resources.id, taskId));

      return {
        status: "success",
        message: "Duration updated successfully",
      };
    }

    if (action === "exportToCalendar") {
      const tasks = JSON.parse(formData.get("tasks") as string) as Task[];

      // Get the current user's session using Lucia
      const lucia = initializeLucia(context.cloudflare.env.DB);
      const sessionId = request.headers
        .get("Cookie")
        ?.match(/auth_session=([^;]+)/)?.[1];

      if (!sessionId) {
        return {
          status: "error",
          message: "Not authenticated",
        };
      }

      const { session: luciaSession, user } = await lucia.validateSession(
        sessionId
      );
      if (!luciaSession || !user) {
        return {
          status: "error",
          message: "Not authenticated",
        };
      }

      // Get access token from session table
      const sessionData = await db
        .select()
        .from(session)
        .where(eq(session.id, luciaSession.id))
        .execute()
        .then((rows) => rows[0]);

      if (!sessionData?.accessToken) {
        return {
          status: "error",
          message:
            "No Google access token found. Please connect your Google Calendar.",
        };
      }

      // Check if token is expired
      if (
        sessionData.tokenExpiry &&
        new Date(sessionData.tokenExpiry) < new Date()
      ) {
        return {
          status: "error",
          message:
            "Token expired. Please re-authenticate with Google Calendar.",
        };
      }

      try {
        // Create calendar events
        const today = new Date().toISOString().split("T")[0];
        const events = tasks.map((task: any) => ({
          summary: task.title,
          colorId: Math.floor(Math.random() * 11 + 1).toString(), // Random color from 1-11
          start: {
            dateTime: `${today}T${task.startTime}:00`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: new Date(
              new Date(`${today}T${task.startTime}:00`).getTime() +
                task.duration * 60000
            ).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }));

        // Use Google Calendar API to create events
        const results = await Promise.all(
          events.map((event: GoogleCalendarEvent) =>
            fetch(
              "https://www.googleapis.com/calendar/v3/calendars/primary/events",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${sessionData.accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(event),
              }
            )
          )
        );

        // Check for any failures
        const failedRequests = results.filter((r) => !r.ok);
        if (failedRequests.length > 0) {
          const errors = await Promise.all(
            failedRequests.map(async (r) => {
              const error = (await r.json()) as GoogleCalendarError;
              return error.error?.message || "Failed to create calendar event";
            })
          );
          throw new Error(`Failed to create some events: ${errors.join(", ")}`);
        }

        return {
          status: "success",
          message: "Events exported to Google Calendar",
        };
      } catch (error) {
        console.error("Error exporting to calendar:", error);
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Failed to export events",
        };
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

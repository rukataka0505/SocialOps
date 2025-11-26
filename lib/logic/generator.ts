import { addDays, format, isBefore, isEqual } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Database } from "@/types/database.types";

type Routine = Database["public"]["Tables"]["routines"]["Row"];
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];

const JST_TIMEZONE = "Asia/Tokyo";

const DAY_MAP: { [key: number]: string } = {
    0: "Sun",
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
};

export function generateTasksForRoutine(
    routine: Routine,
    rangeStart: Date,
    rangeEnd: Date,
    userId: string
): TaskInsert[] {
    const tasks: TaskInsert[] = [];
    const frequency = routine.frequency as { days: string[]; time: string };

    if (!frequency || !frequency.days || !Array.isArray(frequency.days)) {
        return [];
    }

    let currentDate = rangeStart;

    // Ensure we iterate up to and including rangeEnd
    while (isBefore(currentDate, rangeEnd) || isEqual(currentDate, rangeEnd)) {
        // Convert to JST to check the day of the week
        const jstDate = toZonedTime(currentDate, JST_TIMEZONE);
        const dayIndex = jstDate.getDay();
        const dayString = DAY_MAP[dayIndex];

        if (frequency.days.includes(dayString)) {
            // Format due_date as YYYY-MM-DD in JST
            const dueDate = format(jstDate, "yyyy-MM-dd");

            tasks.push({
                team_id: routine.team_id,
                client_id: routine.client_id,
                routine_id: routine.id,
                title: routine.title,
                status: "pending",
                due_date: dueDate,
                assigned_to: routine.default_assignee_id || null,
                created_by: userId,
                source_type: 'routine',
            });
        }

        currentDate = addDays(currentDate, 1);
    }

    return tasks;
}

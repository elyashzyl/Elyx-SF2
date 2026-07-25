<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\AttendanceEntry;
use App\Models\MonthlyRecord;
use App\Models\MonthlyEntry;
use App\Models\Student;
use App\Models\TeacherSchedule;
use App\Models\Setting;
use App\Models\CalendarEvent;
use App\Models\QuarterlyEvent;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    // === Views ===
    public function index()
    {
        return Inertia::render('Teacher/Attendance/Dashboard', [
            'gradeLevels' => GradeLevel::where('is_active', true)->orderBy('display_order')->get(['id', 'name']),
            'allSections' => Section::where('is_active', true)->with('gradeLevel:id')->get(['id', 'name', 'grade_level_id']),
        ]);
    }

    // === Daily Attendance ===
    public function getDaily(Request $request)
    {
        $record = AttendanceRecord::where('date', $request->date)
            ->where('grade', $request->grade)
            ->where('section', $request->section)
            ->with('entries')
            ->first();
        return response()->json($record);
    }

    public function allDaily()
    {
        return response()->json(AttendanceRecord::orderBy('date', 'desc')->get());
    }

    public function storeDaily(Request $request)
    {
        $data = $request->validate([
            'date' => 'required|string',
            'grade' => 'required|string',
            'section' => 'required|string',
            'adviser' => 'nullable|string',
            'entries' => 'nullable|array',
            'created_by' => 'nullable|string',
            'created_by_name' => 'nullable|string',
        ]);

        $existing = AttendanceRecord::where('date', $data['date'])
            ->where('grade', $data['grade'])
            ->where('section', $data['section'])
            ->first();

        if ($existing) {
            AttendanceEntry::where('record_id', $existing->id)->delete();
            $existing->update(['adviser' => $data['adviser'] ?? '']);
            $record = $existing;
        } else {
            $record = AttendanceRecord::create([
                'id' => Str::uuid()->toString(),
                'date' => $data['date'],
                'grade' => $data['grade'],
                'section' => $data['section'],
                'adviser' => $data['adviser'] ?? '',
                'created_by' => Auth::id() ?? '',
                'created_by_name' => $data['created_by_name'] ?? Auth::user()?->name ?? '',
            ]);
        }

        foreach ($data['entries'] ?? [] as $entry) {
            AttendanceEntry::create([
                'record_id' => $record->id,
                'student_id' => $entry['studentId'] ?? '',
                'name' => $entry['name'] ?? '',
                'am1' => $entry['periods']['am1'] ?? '',
                'am2' => $entry['periods']['am2'] ?? '',
                'am3' => $entry['periods']['am3'] ?? '',
                'am4' => $entry['periods']['am4'] ?? '',
                'am5' => $entry['periods']['am5'] ?? '',
                'am6' => $entry['periods']['am6'] ?? '',
                'pm1' => $entry['periods']['pm1'] ?? '',
                'pm2' => $entry['periods']['pm2'] ?? '',
                'pm3' => $entry['periods']['pm3'] ?? '',
                'pm4' => $entry['periods']['pm4'] ?? '',
                'reason' => $entry['reason'] ?? '',
                'excused' => $entry['excused'] ?? false,
                'unexcused' => $entry['unexcused'] ?? false,
            ]);
        }

        return response()->json(['id' => $record->id, 'success' => true, 'record' => $record]);
    }

    public function updateDaily(Request $request, $recordId)
    {
        AttendanceRecord::findOrFail($recordId)->update($request->only(['date', 'grade', 'section', 'adviser']));
        return response()->json(['success' => true]);
    }

    public function updateDailyEntry(Request $request, $recordId)
    {
        $entry = AttendanceEntry::where('record_id', $recordId)
            ->where('student_id', $request->studentId)
            ->firstOrFail();

        $field = $request->field;
        $value = $request->value;

        if (str_starts_with($field, 'periods.')) {
            $entry->update([substr($field, 8) => $value]);
        } elseif (in_array($field, ['reason', 'excused', 'unexcused'])) {
            $entry->update([$field => $value]);
        }

        return response()->json(['success' => true]);
    }

    public function destroyDaily($recordId)
    {
        AttendanceEntry::where('record_id', $recordId)->delete();
        AttendanceRecord::findOrFail($recordId)->delete();
        return response()->json(['success' => true]);
    }

    // === Monthly Records ===
    public function getMonthly(Request $request)
    {
        $record = MonthlyRecord::where('month', $request->month)
            ->where('year', $request->year)
            ->where('grade', $request->grade)
            ->where('section', $request->section)
            ->with('entries')
            ->first();
        return response()->json($record);
    }

    public function storeMonthly(Request $request)
    {
        $data = $request->validate([
            'month' => 'required|integer',
            'year' => 'required|integer',
            'grade' => 'required|string',
            'section' => 'required|string',
            'adviser' => 'nullable|string',
            'entries' => 'nullable|array',
            'created_by' => 'nullable|string',
            'created_by_name' => 'nullable|string',
        ]);

        $existing = MonthlyRecord::where('month', $data['month'])
            ->where('year', $data['year'])
            ->where('grade', $data['grade'])
            ->where('section', $data['section'])
            ->first();

        if ($existing) {
            MonthlyEntry::where('record_id', $existing->id)->delete();
            $existing->update(['adviser' => $data['adviser'] ?? '']);
            $record = $existing;
        } else {
            $record = MonthlyRecord::create([
                'id' => Str::uuid()->toString(),
                'month' => $data['month'],
                'year' => $data['year'],
                'grade' => $data['grade'],
                'section' => $data['section'],
                'adviser' => $data['adviser'] ?? '',
                'created_by' => Auth::id() ?? '',
                'created_by_name' => Auth::user()?->name ?? '',
            ]);
        }

        foreach ($data['entries'] ?? [] as $entry) {
            MonthlyEntry::create([
                'record_id' => $record->id,
                'student_id' => $entry['studentId'] ?? '',
                'student_name' => $entry['name'] ?? '',
                'days' => $entry['days'] ?? [],
                'present' => $entry['present'] ?? 0,
                'absent' => $entry['absent'] ?? 0,
                'remarks' => $entry['remarks'] ?? '',
                'late_enrollee' => $entry['late_enrollee'] ?? false,
            ]);
        }

        return response()->json(['id' => $record->id, 'success' => true, 'record' => $record]);
    }

    public function updateMonthlyEntry(Request $request, $recordId)
    {
        $record = MonthlyRecord::findOrFail($recordId);
        $entry = MonthlyEntry::where('record_id', $recordId)
            ->where('student_id', $request->studentId)
            ->firstOrFail();

        $days = $entry->days ?? [];
        $day = (string) $request->day;
        $status = $request->status;

        if ($status) {
            $days[$day] = $status;
        } else {
            unset($days[$day]);
        }

        $dim = (int) date('t', mktime(0, 0, 0, $record->month, 1, $record->year));
        $excluded = $record->excluded_dates ?? [];
        $total = 0;
        for ($d = 1; $d <= $dim; $d++) {
            $dow = date('w', mktime(0, 0, 0, $record->month, $d, $record->year));
            if ($dow == 0 || $dow == 6) continue;
            if (in_array($d, $excluded)) continue;
            $total++;
        }

        $enrollDay = null;
        foreach ($days as $d => $s) {
            if ($s === 'E') {
                $dn = (int) $d;
                if ($enrollDay === null || $dn < $enrollDay) $enrollDay = $dn;
            }
        }

        $absent = 0;
        foreach ($days as $d => $s) {
            $dn = (int) $d;
            if (in_array($dn, $excluded)) continue;
            $dow = date('w', mktime(0, 0, 0, $record->month, $dn, $record->year));
            if ($dow == 0 || $dow == 6) continue;
            if ($enrollDay !== null && $dn < $enrollDay) { $absent++; continue; }
            if ($s === 'A') $absent++;
            elseif ($s === '◢' || $s === 'H') $absent += 0.5;
        }
        $present = $total - $absent;

        $entry->update(['days' => $days, 'present' => $present, 'absent' => $absent]);
        return response()->json(['success' => true, 'present' => $present, 'absent' => $absent]);
    }

    public function updateMonthlyRemarks(Request $request, $recordId)
    {
        MonthlyEntry::where('record_id', $recordId)
            ->where('student_id', $request->studentId)
            ->update(['remarks' => $request->remarks]);
        return response()->json(['success' => true]);
    }

    public function updateMonthlySummary(Request $request, $recordId)
    {
        MonthlyRecord::findOrFail($recordId)->update([
            'summary_data' => $request->summary_data ?? [],
            'adviser' => $request->adviser ?? MonthlyRecord::find($recordId)?->adviser,
            'school_head' => $request->schoolHead,
        ]);
        return response()->json(['success' => true]);
    }

    public function updateMonthlyExcludedDates(Request $request, $recordId)
    {
        MonthlyRecord::findOrFail($recordId)->update(['excluded_dates' => $request->excluded_dates ?? []]);
        return response()->json(['success' => true]);
    }

    public function destroyMonthly($recordId)
    {
        MonthlyEntry::where('record_id', $recordId)->delete();
        MonthlyRecord::findOrFail($recordId)->delete();
        return response()->json(['success' => true]);
    }

    public function exportMonthly($recordId)
    {
        $record = MonthlyRecord::with('entries')->findOrFail($recordId);
        $entries = $record->entries;
        $dim = (int) date('t', mktime(0, 0, 0, $record->month, 1, $record->year));
        $days = [];
        for ($d = 1; $d <= $dim; $d++) {
            $dow = date('w', mktime(0, 0, 0, $record->month, $d, $record->year));
            if ($dow == 0 || $dow == 6) continue;
            if (in_array($d, $record->excluded_dates ?? [])) continue;
            $days[] = $d;
        }
        $showTardy = $entries->contains(fn ($e) => ($e->tardy ?? 0) > 0);

        $pdf = Pdf::loadView('pdf.monthly-attendance', [
            'record' => $record,
            'entries' => $entries,
            'days' => $days,
            'showTardy' => $showTardy,
        ]);
        $monthName = \Carbon\Carbon::create()->month($record->month)->format('F_Y');
        return $pdf->download("Monthly_Attendance_{$record->grade}_{$record->section}_{$monthName}.pdf");
    }

    // === Students (from EduPulse Users with role=student) ===
    public function getStudents(Request $request)
    {
        $query = User::where('role', 'student');
        if ($request->grade_level_id) $query->where('grade_level_id', $request->grade_level_id);
        elseif ($request->grade) $query->whereHas('gradeLevel', fn ($q) => $q->where('name', 'LIKE', "%{$request->grade}%"));
        if ($request->section_id) $query->where('section_id', $request->section_id);
        elseif ($request->section) $query->whereHas('section', fn ($q) => $q->where('name', $request->section));
        return response()->json($query->with('gradeLevel', 'section')->orderBy('name')->get(['id', 'name', 'gender', 'grade_level_id', 'section_id']));
    }

    // === Schedule ===
    public function getSchedule($teacherId)
    {
        return response()->json(TeacherSchedule::where('teacher_id', $teacherId)->orderBy('day_of_week')->orderBy('period')->get());
    }

    public function storeSchedule(Request $request, $teacherId)
    {
        $s = TeacherSchedule::create(['teacher_id' => $teacherId] + $request->only(['day_of_week', 'period', 'start_time', 'end_time', 'subject', 'grade', 'section']));
        return response()->json(['success' => true, 'id' => $s->id]);
    }

    public function updateSchedule(Request $request, $teacherId)
    {
        TeacherSchedule::where('teacher_id', $teacherId)->delete();
        foreach ($request->schedules ?? [] as $s) {
            TeacherSchedule::create(['teacher_id' => $teacherId, 'day_of_week' => $s['day_of_week'], 'period' => $s['period']]);
        }
        return response()->json(['success' => true]);
    }

    public function updateScheduleEntry(Request $request, $teacherId, $entryId)
    {
        TeacherSchedule::where('id', $entryId)->where('teacher_id', $teacherId)->update($request->only(['day_of_week', 'period', 'start_time', 'end_time', 'subject', 'grade', 'section']));
        return response()->json(['success' => true]);
    }

    public function destroyScheduleEntry($teacherId, $entryId)
    {
        TeacherSchedule::where('id', $entryId)->where('teacher_id', $teacherId)->delete();
        return response()->json(['success' => true]);
    }

    public function destroyScheduleAll($teacherId)
    {
        TeacherSchedule::where('teacher_id', $teacherId)->delete();
        return response()->json(['success' => true]);
    }

    // === Settings ===
    public function getSettings()
    {
        return response()->json(Setting::all()->pluck('value', 'key'));
    }

    public function storeSettings(Request $request)
    {
        foreach ($request->settings ?? [] as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => (string) $value]);
        }
        return response()->json(['success' => true]);
    }

    // === Calendar Events ===
    public function getCalendarEvents()
    {
        return response()->json(CalendarEvent::orderBy('event_date')->get());
    }

    public function storeCalendarEvent(Request $request)
    {
        CalendarEvent::create($request->validate(['title' => 'required|string', 'type' => 'required|string', 'event_date' => 'required|string', 'color' => 'nullable|string']));
        return response()->json(['success' => true]);
    }

    public function updateCalendarEvent(Request $request, $id)
    {
        CalendarEvent::findOrFail($id)->update($request->only(['title', 'type', 'event_date', 'color']));
        return response()->json(['success' => true]);
    }

    public function destroyCalendarEvent($id)
    {
        CalendarEvent::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    // === Quarterly Events ===
    public function getQuarterlyEvents()
    {
        return response()->json(QuarterlyEvent::orderBy('id')->get());
    }

    public function storeQuarterlyEvent(Request $request)
    {
        QuarterlyEvent::create($request->validate([
            'event_name' => 'required|string',
            'first_grading' => 'nullable|string',
            'second_grading' => 'nullable|string',
            'third_grading' => 'nullable|string',
            'fourth_grading' => 'nullable|string',
        ]));
        return response()->json(['success' => true]);
    }

    public function updateQuarterlyEvent(Request $request, $id)
    {
        QuarterlyEvent::findOrFail($id)->update($request->only(['event_name', 'first_grading', 'second_grading', 'third_grading', 'fourth_grading']));
        return response()->json(['success' => true]);
    }

    public function destroyQuarterlyEvent($id)
    {
        QuarterlyEvent::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}

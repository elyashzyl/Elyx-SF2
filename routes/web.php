<?php

use App\Http\Controllers\ExamController;
use App\Http\Controllers\GradeLevelController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PracticalController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\SeatworkController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\MessengerController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();
        if ($user->isSuperadmin()) {
            return redirect()->route('teacher.dashboard');
        }
        return redirect($user->isTeacher() ? route('teacher.dashboard') : route('student.dashboard'));
    }

    return inertia('Welcome');
})->name('home');

Route::middleware(['auth', 'verified', 'role.teacher'])->prefix('teacher')->name('teacher.')->group(function () {
    Route::get('/dashboard', [TeacherController::class, 'dashboard'])->name('dashboard');
    Route::get('/students', [TeacherController::class, 'students'])->name('students');
    Route::get('/students/{user}/scores', [TeacherController::class, 'studentScores'])->name('students.scores');
    Route::put('/students/{user}', [TeacherController::class, 'studentUpdate'])->name('students.update');
    Route::delete('/students/{user}/remove', [TeacherController::class, 'studentRemove'])->name('students.remove');
    Route::post('/students/{user}/add-xp', [TeacherController::class, 'addXp'])->name('students.addXp');
    Route::get('/teachers', [TeacherController::class, 'teachers'])->name('teachers.index');
    Route::get('/teachers/{user}', [TeacherController::class, 'teacherShow'])->name('teachers.show');
    Route::put('/teachers/{user}', [TeacherController::class, 'teacherUpdate'])->name('teachers.update');
    Route::get('/results', [TeacherController::class, 'results'])->name('results');
    Route::delete('/results/attempt', [TeacherController::class, 'destroyAttempt'])->name('results.destroy-attempt');
    Route::get('/leaderboard', [TeacherController::class, 'leaderboard'])->name('leaderboard');

    Route::get('/quizzes', [QuizController::class, 'index'])->name('quizzes.index');
    Route::get('/quizzes/create', [QuizController::class, 'create'])->name('quizzes.create');
    Route::post('/quizzes', [QuizController::class, 'store'])->name('quizzes.store');
    Route::get('/quizzes/{quiz}', [QuizController::class, 'show'])->name('quizzes.show');
    Route::get('/quizzes/{quiz}/edit', [QuizController::class, 'edit'])->name('quizzes.edit');
    Route::put('/quizzes/{quiz}', [QuizController::class, 'update'])->name('quizzes.update');
    Route::patch('/quizzes/{quiz}/publish', [QuizController::class, 'publish'])->name('quizzes.publish');
    Route::patch('/quizzes/{quiz}/reopen', [QuizController::class, 'reopen'])->name('quizzes.reopen');
    Route::patch('/quizzes/{quiz}/close-now', [QuizController::class, 'closeNow'])->name('quizzes.close-now');
    Route::get('/quizzes/{quiz}/recheck/{attempt}', [QuizController::class, 'recheck'])->name('quizzes.recheck');
    Route::put('/quizzes/{quiz}/recheck/{attempt}', [QuizController::class, 'recheckUpdate'])->name('quizzes.recheck-update');
    Route::put('/quizzes/{quiz}/auto-recheck/{attempt}', [QuizController::class, 'autoRecheck'])->name('quizzes.auto-recheck');
    Route::patch('/quizzes/{quiz}/reassign', [QuizController::class, 'reassign'])->name('quizzes.reassign');
    Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy'])->name('quizzes.destroy');

    Route::get('/practicals', [PracticalController::class, 'index'])->name('practicals.index');
    Route::post('/practicals', [PracticalController::class, 'store'])->name('practicals.store');
    Route::get('/practicals/{practical}/grade/{attempt}', [PracticalController::class, 'grade'])->name('practicals.grade');
    Route::put('/practicals/{practical}/grade/{attempt}', [PracticalController::class, 'gradeUpdate'])->name('practicals.grade-update');
    Route::get('/practicals/{practical}/recheck/{attempt}', [PracticalController::class, 'recheck'])->name('practicals.recheck');
    Route::put('/practicals/{practical}/recheck/{attempt}', [PracticalController::class, 'recheckUpdate'])->name('practicals.recheck-update');
    Route::get('/practicals/{practical}/edit', [PracticalController::class, 'edit'])->name('practicals.edit');
    Route::put('/practicals/{practical}', [PracticalController::class, 'update'])->name('practicals.update');
    Route::get('/practicals/{practical}', [PracticalController::class, 'show'])->name('practicals.show');
    Route::patch('/practicals/{practical}/publish', [PracticalController::class, 'publish'])->name('practicals.publish');
    Route::patch('/practicals/{practical}/reopen', [PracticalController::class, 'reopen'])->name('practicals.reopen');
    Route::patch('/practicals/{practical}/close-now', [PracticalController::class, 'closeNow'])->name('practicals.close-now');
    Route::patch('/practicals/{practical}/close-attempt/{attempt}', [PracticalController::class, 'closeAttempt'])->name('practicals.close-attempt');
    Route::patch('/practicals/{practical}/reassign', [PracticalController::class, 'reassign'])->name('practicals.reassign');
    Route::delete('/practicals/{practical}', [PracticalController::class, 'destroy'])->name('practicals.destroy');
    Route::delete('/practicals/{practical}/attempt/{attempt}', [PracticalController::class, 'destroyAttempt'])->name('practicals.destroy-attempt');

    Route::get('/exams', [ExamController::class, 'index'])->name('exams.index');
    Route::post('/exams', [ExamController::class, 'store'])->name('exams.store');
    Route::get('/exams/{exam}', [ExamController::class, 'show'])->name('exams.show');
    Route::patch('/exams/{exam}/publish', [ExamController::class, 'publish'])->name('exams.publish');
    Route::patch('/exams/{exam}/reopen', [ExamController::class, 'reopen'])->name('exams.reopen');
    Route::patch('/exams/{exam}/close-now', [ExamController::class, 'closeNow'])->name('exams.close-now');
    Route::patch('/exams/{exam}/reassign', [ExamController::class, 'reassign'])->name('exams.reassign');
    Route::delete('/exams/{exam}', [ExamController::class, 'destroy'])->name('exams.destroy');
    Route::get('/exams/{exam}/attempts', [ExamController::class, 'attempts'])->name('exams.attempts');
    Route::post('/exams/attempts/{attempt}/grade', [ExamController::class, 'grade'])->name('exams.grade');

    Route::get('/seatworks', [SeatworkController::class, 'index'])->name('seatworks.index');
    Route::post('/seatworks', [SeatworkController::class, 'store'])->name('seatworks.store');
    Route::get('/seatworks/{seatwork}/edit', [SeatworkController::class, 'edit'])->name('seatworks.edit');
    Route::put('/seatworks/{seatwork}', [SeatworkController::class, 'update'])->name('seatworks.update');
    Route::get('/seatworks/{seatwork}', [SeatworkController::class, 'show'])->name('seatworks.show');
    Route::get('/seatworks/{seatwork}/recheck/{attempt}', [SeatworkController::class, 'recheck'])->name('seatworks.recheck');
    Route::put('/seatworks/{seatwork}/recheck/{attempt}', [SeatworkController::class, 'recheckUpdate'])->name('seatworks.recheck-update');
    Route::put('/seatworks/{seatwork}/auto-recheck/{attempt}', [SeatworkController::class, 'autoRecheck'])->name('seatworks.auto-recheck');
    Route::patch('/seatworks/{seatwork}/publish', [SeatworkController::class, 'publish'])->name('seatworks.publish');
    Route::patch('/seatworks/{seatwork}/reopen', [SeatworkController::class, 'reopen'])->name('seatworks.reopen');
    Route::patch('/seatworks/{seatwork}/close-now', [SeatworkController::class, 'closeNow'])->name('seatworks.close-now');
    Route::patch('/seatworks/{seatwork}/reassign', [SeatworkController::class, 'reassign'])->name('seatworks.reassign');
    Route::delete('/seatworks/{seatwork}', [SeatworkController::class, 'destroy'])->name('seatworks.destroy');

    Route::get('/grade-levels', [GradeLevelController::class, 'index'])->name('grade-levels.index');
    Route::get('/grade-levels/create', [GradeLevelController::class, 'create'])->name('grade-levels.create');
    Route::post('/grade-levels', [GradeLevelController::class, 'store'])->name('grade-levels.store');
    Route::get('/grade-levels/{gradeLevel}/edit', [GradeLevelController::class, 'edit'])->name('grade-levels.edit');
    Route::patch('/grade-levels/{gradeLevel}', [GradeLevelController::class, 'update'])->name('grade-levels.update');
    Route::delete('/grade-levels/{gradeLevel}', [GradeLevelController::class, 'destroy'])->name('grade-levels.destroy');

    Route::post('/grade-levels/{gradeLevel}/sections', [GradeLevelController::class, 'storeSection'])->name('grade-levels.sections.store');
    Route::delete('/grade-levels/{gradeLevel}/sections/{section}', [GradeLevelController::class, 'destroySection'])->name('grade-levels.sections.destroy');

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/impersonate', [UserController::class, 'impersonate'])->name('users.impersonate');

    Route::get('/profile', function () {
        return \Inertia\Inertia::render('Teacher/Profile', [
            'gradeLevels' => \App\Models\GradeLevel::orderBy('name')->get(['id', 'name']),
            'sections' => \App\Models\Section::orderBy('name')->get(['id', 'name', 'grade_level_id']),
        ]);
    })->name('profile');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read', [NotificationController::class, 'read'])->name('notifications.read');

    Route::get('/messenger', [MessengerController::class, 'index'])->name('messenger');
    Route::get('/messenger/unread-count', [MessengerController::class, 'unreadCount'])->name('messenger.unread');
    Route::get('/messenger/{conversation}', [MessengerController::class, 'show'])->name('messenger.show');
    Route::post('/messenger/start', [MessengerController::class, 'store'])->name('messenger.start');
    Route::post('/messenger/{conversation}/send', [MessengerController::class, 'sendMessage'])->name('messenger.send');
    Route::get('/messenger/{conversation}/poll', [MessengerController::class, 'poll'])->name('messenger.poll');
    Route::delete('/messenger/{conversation}', [MessengerController::class, 'archive'])->name('messenger.archive');

    // Attendance Module
    Route::get('/attendance', [\App\Http\Controllers\AttendanceController::class, 'index'])->name('attendance.index');
    Route::get('/api/attendance', [\App\Http\Controllers\AttendanceController::class, 'getDaily'])->name('attendance.get');
    Route::get('/api/attendance/all', [\App\Http\Controllers\AttendanceController::class, 'allDaily'])->name('attendance.all');
    Route::post('/api/attendance', [\App\Http\Controllers\AttendanceController::class, 'storeDaily'])->name('attendance.store');
    Route::put('/api/attendance/{recordId}', [\App\Http\Controllers\AttendanceController::class, 'updateDaily'])->name('attendance.update');
    Route::put('/api/attendance/{recordId}/entry', [\App\Http\Controllers\AttendanceController::class, 'updateDailyEntry'])->name('attendance.entry-update');
    Route::delete('/api/attendance/{recordId}', [\App\Http\Controllers\AttendanceController::class, 'destroyDaily'])->name('attendance.destroy');

    Route::get('/api/monthly', [\App\Http\Controllers\AttendanceController::class, 'getMonthly'])->name('attendance.monthly');
    Route::post('/api/monthly', [\App\Http\Controllers\AttendanceController::class, 'storeMonthly'])->name('attendance.monthly-store');
    Route::put('/api/monthly/{recordId}/entry', [\App\Http\Controllers\AttendanceController::class, 'updateMonthlyEntry'])->name('attendance.monthly-entry');
    Route::put('/api/monthly/{recordId}/remarks', [\App\Http\Controllers\AttendanceController::class, 'updateMonthlyRemarks'])->name('attendance.monthly-remarks');
    Route::put('/api/monthly/{recordId}/summary', [\App\Http\Controllers\AttendanceController::class, 'updateMonthlySummary'])->name('attendance.monthly-summary');
    Route::put('/api/monthly/{recordId}/excluded-dates', [\App\Http\Controllers\AttendanceController::class, 'updateMonthlyExcludedDates'])->name('attendance.monthly-excluded');
    Route::delete('/api/monthly/{recordId}', [\App\Http\Controllers\AttendanceController::class, 'destroyMonthly'])->name('attendance.monthly-destroy');
    Route::get('/api/monthly/{recordId}/export', [\App\Http\Controllers\AttendanceController::class, 'exportMonthly'])->name('attendance.monthly-export');

    Route::get('/api/students', [\App\Http\Controllers\AttendanceController::class, 'getStudents'])->name('attendance.students');

    Route::get('/api/schedule/{teacherId}', [\App\Http\Controllers\AttendanceController::class, 'getSchedule'])->name('attendance.schedule');
    Route::post('/api/schedule/{teacherId}', [\App\Http\Controllers\AttendanceController::class, 'storeSchedule'])->name('attendance.schedule-store');
    Route::put('/api/schedule/{teacherId}', [\App\Http\Controllers\AttendanceController::class, 'updateSchedule'])->name('attendance.schedule-update');
    Route::put('/api/schedule/{teacherId}/{entryId}', [\App\Http\Controllers\AttendanceController::class, 'updateScheduleEntry'])->name('attendance.schedule-entry-update');
    Route::delete('/api/schedule/{teacherId}/{entryId}', [\App\Http\Controllers\AttendanceController::class, 'destroyScheduleEntry'])->name('attendance.schedule-entry-destroy');
    Route::delete('/api/schedule/{teacherId}/all', [\App\Http\Controllers\AttendanceController::class, 'destroyScheduleAll'])->name('attendance.schedule-all-destroy');

    Route::get('/api/attendance-settings', [\App\Http\Controllers\AttendanceController::class, 'getSettings'])->name('attendance.settings');
    Route::post('/api/attendance-settings', [\App\Http\Controllers\AttendanceController::class, 'storeSettings'])->name('attendance.settings-store');

    Route::get('/api/attendance-events/calendar', [\App\Http\Controllers\AttendanceController::class, 'getCalendarEvents'])->name('attendance.calendar');
    Route::post('/api/attendance-events/calendar', [\App\Http\Controllers\AttendanceController::class, 'storeCalendarEvent'])->name('attendance.calendar-store');
    Route::put('/api/attendance-events/calendar/{id}', [\App\Http\Controllers\AttendanceController::class, 'updateCalendarEvent'])->name('attendance.calendar-update');
    Route::delete('/api/attendance-events/calendar/{id}', [\App\Http\Controllers\AttendanceController::class, 'destroyCalendarEvent'])->name('attendance.calendar-destroy');

    Route::get('/api/attendance-events/quarterly', [\App\Http\Controllers\AttendanceController::class, 'getQuarterlyEvents'])->name('attendance.quarterly');
    Route::post('/api/attendance-events/quarterly', [\App\Http\Controllers\AttendanceController::class, 'storeQuarterlyEvent'])->name('attendance.quarterly-store');
    Route::put('/api/attendance-events/quarterly/{id}', [\App\Http\Controllers\AttendanceController::class, 'updateQuarterlyEvent'])->name('attendance.quarterly-update');
    Route::delete('/api/attendance-events/quarterly/{id}', [\App\Http\Controllers\AttendanceController::class, 'destroyQuarterlyEvent'])->name('attendance.quarterly-destroy');
});

Route::middleware(['auth', 'verified', 'role.student'])->prefix('student')->name('student.')->group(function () {
    Route::get('/dashboard', [StudentController::class, 'dashboard'])->name('dashboard');
    Route::get('/quizzes', [StudentController::class, 'quizzes'])->name('quizzes.index');
    Route::get('/seatworks', [StudentController::class, 'seatworks'])->name('seatworks.index');
    Route::get('/practicals', [StudentController::class, 'practicals'])->name('practicals.index');
    Route::get('/exams', [StudentController::class, 'exams'])->name('exams.index');
    Route::get('/quizzes/{quiz}/take', [StudentController::class, 'take'])->name('quizzes.take');
    Route::post('/quizzes/{quiz}/submit', [StudentController::class, 'submit'])->name('quizzes.submit');
    Route::get('/quizzes/{attempt}/result', [StudentController::class, 'result'])->name('quizzes.result');
    Route::get('/results', [StudentController::class, 'results'])->name('results');
    Route::get('/practicals/{practical}/take', [PracticalController::class, 'take'])->name('practicals.take');
    Route::post('/practicals/{practical}/submit', [PracticalController::class, 'submit'])->name('practicals.submit');
    Route::get('/practicals/{attempt}/result', [PracticalController::class, 'result'])->name('practicals.result');
    Route::post('/practicals/{attempt}/close', [PracticalController::class, 'close'])->name('practicals.close');

    Route::get('/exams/{exam}/take', [ExamController::class, 'take'])->name('exams.take');
    Route::post('/exams/{exam}/submit', [ExamController::class, 'submit'])->name('exams.submit');
    Route::get('/exams/{attempt}/result', [ExamController::class, 'result'])->name('exams.result');

    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/read', [NotificationController::class, 'read'])->name('notifications.read');

    Route::get('/leaderboard', [StudentController::class, 'leaderboard'])->name('leaderboard');

    Route::get('/profile', function () {
        return \Inertia\Inertia::render('Student/Profile', [
            'gradeLevels' => \App\Models\GradeLevel::orderBy('name')->get(['id', 'name']),
            'sections' => \App\Models\Section::orderBy('name')->get(['id', 'name', 'grade_level_id']),
        ]);
    })->name('profile');

    Route::get('/messenger', [MessengerController::class, 'index'])->name('messenger');
    Route::get('/messenger/unread-count', [MessengerController::class, 'unreadCount'])->name('messenger.unread');
    Route::get('/messenger/{conversation}', [MessengerController::class, 'show'])->name('messenger.show');
    Route::post('/messenger/start', [MessengerController::class, 'store'])->name('messenger.start');
    Route::post('/messenger/{conversation}/send', [MessengerController::class, 'sendMessage'])->name('messenger.send');
    Route::get('/messenger/{conversation}/poll', [MessengerController::class, 'poll'])->name('messenger.poll');
    Route::delete('/messenger/{conversation}', [MessengerController::class, 'archive'])->name('messenger.archive');

    Route::get('/seatworks/{seatwork}/take', [SeatworkController::class, 'take'])->name('seatworks.take');
    Route::post('/seatworks/{seatwork}/submit', [SeatworkController::class, 'submit'])->name('seatworks.submit');
    Route::get('/seatworks/{attempt}/result', [SeatworkController::class, 'result'])->name('seatworks.result');
});

Route::middleware(['auth', 'verified'])->post('/leave-impersonation', [UserController::class, 'leaveImpersonation'])->name('users.leave-impersonation');

require __DIR__.'/settings.php';

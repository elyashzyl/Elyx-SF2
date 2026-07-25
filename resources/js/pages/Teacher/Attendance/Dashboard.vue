<template>
    <Head title="Attendance" />
    <div>
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold" style="color: #1B2231">Attendance</h2>
            <div class="flex gap-2">
                <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
                    class="px-4 py-2 text-sm rounded-lg transition font-medium"
                    :class="activeTab === tab.key ? 'text-white' : 'text-gray-600 hover:bg-gray-200'"
                    :style="activeTab === tab.key ? { background: '#1D3557' } : {}">
                    {{ tab.label }}
                </button>
            </div>
        </div>

        <!-- Daily Attendance -->
        <div v-if="activeTab === 'daily'" class="card p-6">
            <div class="flex items-center gap-3 mb-4 flex-wrap">
                <input v-model="dailyDate" type="date" class="px-3 py-2 border rounded-lg text-sm" />
                <select v-model="dailyGrade" class="px-3 py-2 border rounded-lg text-sm">
                    <option value="">Grade</option>
                    <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
                <select v-model="dailySection" class="px-3 py-2 border rounded-lg text-sm">
                    <option value="">Section</option>
                    <option v-for="s in filteredSections" :key="s.id" :value="s.name">{{ s.name }}</option>
                </select>
                <button @click="loadDaily" class="px-4 py-2 text-white text-sm rounded-lg" style="background: #1D3557">Load</button>
                <button @click="saveDaily" class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Save</button>
                <span v-if="dailySaved" class="text-green-600 text-sm">Saved!</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm border-collapse">
                    <thead>
                        <tr class="border-b-2">
                            <th class="p-2 text-left font-medium text-gray-500 min-w-[160px] sticky left-0 bg-white">Student</th>
                            <th class="p-2 text-center font-medium text-gray-500 min-w-[50px]">Gender</th>
                            <th v-for="p in periods" :key="p" class="p-2 text-center font-medium text-gray-500">{{ p }}</th>
                            <th class="p-2 text-center font-medium text-gray-500">Reason</th>
                            <th class="p-2 text-center font-medium text-gray-500">Exc</th>
                            <th class="p-2 text-center font-medium text-gray-500">Unex</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="entry in dailyEntries" :key="entry.studentId" class="border-b hover:bg-gray-50">
                            <td class="p-2 font-medium sticky left-0 bg-white">{{ entry.name }}</td>
                            <td class="p-2 text-center text-xs text-gray-500">{{ entry.gender || '—' }}</td>
                            <td v-for="p in periods" :key="p" class="p-2 text-center">
                                <select v-model="entry.periods[p]"
                                    class="w-14 text-xs px-1 py-1 border rounded text-center"
                                    :class="{ 'bg-green-100': entry.periods[p] === '✓', 'bg-red-100': entry.periods[p] && entry.periods[p] !== '✓' }">
                                    <option value=""></option>
                                    <option value="✓">✓</option>
                                    <option value="L">L</option>
                                    <option value="A">A</option>
                                </select>
                            </td>
                            <td class="p-2 text-center"><input v-model="entry.reason" class="w-20 px-1 py-1 border rounded text-xs" /></td>
                            <td class="p-2 text-center"><input type="checkbox" v-model="entry.excused" class="w-4 h-4" /></td>
                            <td class="p-2 text-center"><input type="checkbox" v-model="entry.unexcused" class="w-4 h-4" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Monthly Records -->
        <div v-if="activeTab === 'monthly'" class="card p-6">
            <div class="flex items-center gap-3 mb-4 flex-wrap">
                <select v-model="monthlyMonth" class="px-3 py-2 border rounded-lg text-sm">
                    <option v-for="(m, i) in months" :key="i" :value="i + 1">{{ m }}</option>
                </select>
                <select v-model="monthlyYear" class="px-3 py-2 border rounded-lg text-sm">
                    <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </select>
                <select v-model="monthlyGrade" class="px-3 py-2 border rounded-lg text-sm">
                    <option value="">Grade</option>
                    <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
                <select v-model="monthlySection" class="px-3 py-2 border rounded-lg text-sm">
                    <option value="">Section</option>
                    <option v-for="s in filteredSections" :key="s.id" :value="s.name">{{ s.name }}</option>
                </select>
                <button @click="loadMonthly" class="px-4 py-2 text-white text-sm rounded-lg" style="background: #1D3557">Load</button>
                <button @click="saveMonthly" class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg">Save</button>
                <button v-if="monthlyRecord" @click="exportMonthly" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Export PDF</button>
                <span v-if="monthlySaved" class="text-green-600 text-sm">Saved!</span>
            </div>
            <div v-if="monthlyRecord">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-sm font-medium">Excluded Dates:</span>
                    <input v-model="excludedDateInput" placeholder="e.g. 1,15,25" class="px-2 py-1 border rounded text-sm w-48" />
                    <button @click="saveExcludedDates" class="text-xs px-2 py-1 bg-gray-100 rounded">Save</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs border-collapse">
                        <thead>
                            <tr class="border-b-2">
                                <th class="p-1.5 text-left font-medium text-gray-500 min-w-[140px] sticky left-0 bg-white">Student</th>
                                <th v-for="d in monthDays" :key="d" class="p-1.5 text-center font-medium text-gray-500"
                                    :class="isExcluded(d) ? 'text-orange-400' : ''">
                                    {{ d }}
                                </th>
                                <th class="p-1.5 text-center font-medium text-gray-500">P</th>
                                <th class="p-1.5 text-center font-medium text-gray-500">A</th>
                                <th class="p-1.5 text-center font-medium text-gray-500">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="e in monthlyEntries" :key="e.studentId" class="border-b hover:bg-gray-50">
                                <td class="p-1.5 font-medium sticky left-0 bg-white">{{ e.name }}</td>
                                <td v-for="d in monthDays" :key="d" class="p-1 text-center"
                                    :class="isExcluded(d) ? 'bg-orange-50' : ''">
                                    <select v-if="!isExcluded(d)" v-model="e.days[d]" @change="onMonthlyDayChange(e, d)"
                                        class="w-9 text-center px-0.5 py-0.5 border rounded text-xs"
                                        :class="getDayClass(e.days[d])">
                                        <option value=""></option>
                                        <option value="✓">✓</option>
                                        <option value="A">A</option>
                                        <option value="◢">◢</option>
                                        <option value="H">H</option>
                                        <option value="E">E</option>
                                    </select>
                                </td>
                                <td class="p-1.5 text-center font-medium text-green-600">{{ e.present }}</td>
                                <td class="p-1.5 text-center font-medium text-red-600">{{ e.absent }}</td>
                                <td class="p-1.5 text-center">
                                    <input v-model="e.remarks" @change="onRemarksChange(e)" class="w-20 px-1 py-0.5 border rounded text-xs" placeholder="Remarks" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div v-else class="text-center py-8 text-gray-400 text-sm">Select month, year, grade, and section then click Load</div>
        </div>

        <!-- Students -->
        <div v-if="activeTab === 'students'" class="card p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold" style="color: #1B2231">Students</h3>
            </div>
            <div class="flex gap-3 mb-4">
                <select v-model="studentFilter.grade" class="px-3 py-1.5 border rounded-lg text-sm">
                    <option value="">Grade</option>
                    <option v-for="g in gradeLevels" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
                <select v-model="studentFilter.section" class="px-3 py-1.5 border rounded-lg text-sm">
                    <option value="">Section</option>
                    <option v-for="s in gradeLevels.flatMap((g: any) => allSections.filter((sec: any) => String(sec.grade_level_id) === String(g.id)))" :key="s.id" :value="s.name">{{ s.name }}</option>
                </select>
                <button @click="fetchStudents" class="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">Filter</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b text-left">
                            <th class="pb-2 font-medium text-gray-500">Name</th>
                            <th class="pb-2 font-medium text-gray-500">Grade</th>
                            <th class="pb-2 font-medium text-gray-500">Section</th>
                            <th class="pb-2 font-medium text-gray-500">Gender</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="s in students" :key="s.id" class="border-b last:border-0">
                            <td class="py-2 font-medium">{{ s.name }}</td>
                            <td class="py-2">{{ s.grade_level?.name || s.grade }}</td>
                            <td class="py-2">{{ s.section?.name || s.section }}</td>
                            <td class="py-2">{{ s.gender || '—' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Head, usePage } from '@inertiajs/vue3';
import { ref, computed, onMounted } from 'vue';

const page = usePage();
const gradeLevels = (page.props as any).gradeLevels as { id: number; name: string }[] || [];
const allSections = (page.props as any).allSections as { id: number; name: string; grade_level_id: number }[] || [];

const activeTab = ref('daily');
const tabs = [
    { key: 'daily', label: 'Daily' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'students', label: 'Students' },
];


const periods = ['AM1', 'AM2', 'AM3', 'AM4', 'AM5', 'AM6', 'PM1', 'PM2', 'PM3', 'PM4'];
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

// Daily
const dailyDate = ref(new Date().toISOString().split('T')[0]);
const dailyGrade = ref('');
const dailySection = ref('');
const dailyEntries = ref<any[]>([]);
const dailySaved = ref(false);
const currentRecordId = ref<string | null>(null);

// Monthly
const monthlyMonth = ref(new Date().getMonth() + 1);
const monthlyYear = ref(new Date().getFullYear());
const monthlyGrade = ref('');
const monthlySection = ref('');
const monthlyRecord = ref<any>(null);
const monthlyEntries = ref<any[]>([]);
const monthlySaved = ref(false);
const excludedDateInput = ref('');

// Students
const students = ref<any[]>([]);
const studentFilter = ref({ grade: '', section: '' });

const monthDays = computed(() => {
    const dim = new Date(monthlyYear.value, monthlyMonth.value, 0).getDate();
    return Array.from({ length: dim }, (_, i) => i + 1);
});

const filteredSections = computed(() => {
    const gradeId = dailyGrade.value || monthlyGrade.value;
    if (!gradeId) return allSections;
    return allSections.filter((s: any) => String(s.grade_level_id) === String(gradeId));
});

function isWeekend(d: number) { return new Date(monthlyYear.value, monthlyMonth.value - 1, d).getDay() === 0 || new Date(monthlyYear.value, monthlyMonth.value - 1, d).getDay() === 6; }
function isExcluded(d: number) { return monthlyRecord.value?.excluded_dates?.includes(d); }
function getDayClass(val: string) {
    if (!val) return '';
    if (val === '✓') return 'bg-green-100';
    if (val === 'A') return 'bg-red-100';
    if (val === '◢' || val === 'H') return 'bg-yellow-100';
    if (val === 'E') return 'bg-blue-100';
    return '';
}

function gradeName(id: string | number): string {
    const g = gradeLevels.find((g: any) => String(g.id) === String(id));
    return g ? g.name.replace('Grade ', '') : String(id);
}

async function api(url: string, options: any = {}) {
    const res = await fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', ...options.headers },
        ...options,
    });
    return res.json();
}

// Daily Attendance
async function loadDaily() {
    if (!dailyDate.value || !dailyGrade.value || !dailySection.value) return;
    dailySaved.value = false;
    const data = await api(`/teacher/api/attendance?date=${dailyDate.value}&grade=${gradeName(dailyGrade.value)}&section=${dailySection.value}`);
    if (data?.entries) {
        currentRecordId.value = data.id;
        dailyEntries.value = data.entries.map((e: any) => ({
            studentId: e.student_id, name: e.name, gender: e.gender || '',
            periods: { AM1: e.am1, AM2: e.am2, AM3: e.am3, AM4: e.am4, AM5: e.am5, AM6: e.am6, PM1: e.pm1, PM2: e.pm2, PM3: e.pm3, PM4: e.pm4 },
            reason: e.reason || '', excused: !!e.excused, unexcused: !!e.unexcused,
        }));
    } else {
        currentRecordId.value = null;
        const all = await api(`/teacher/api/students?grade_level_id=${dailyGrade.value}&section=${dailySection.value}`);
        dailyEntries.value = all.map((s: any) => ({
            studentId: s.id, name: s.name, gender: s.gender || '',
            periods: { AM1: '', AM2: '', AM3: '', AM4: '', AM5: '', AM6: '', PM1: '', PM2: '', PM3: '', PM4: '' },
            reason: '', excused: false, unexcused: false,
        }));
    }
}

async function saveDaily() {
    const result = await api('/teacher/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: dailyDate.value, grade: gradeName(dailyGrade.value), section: dailySection.value,
            adviser: '', entries: dailyEntries.value,
        }),
    });
    currentRecordId.value = result.id;
    dailySaved.value = true;
    setTimeout(() => dailySaved.value = false, 2000);
}

// Monthly
async function loadMonthly() {
    if (!monthlyGrade.value || !monthlySection.value) return;
    monthlySaved.value = false;
    const data = await api(`/teacher/api/monthly?month=${monthlyMonth.value}&year=${monthlyYear.value}&grade=${gradeName(monthlyGrade.value)}&section=${monthlySection.value}`);
    if (data?.entries) {
        monthlyRecord.value = data;
        monthlyEntries.value = data.entries.map((e: any) => ({
            studentId: e.student_id, name: e.student_name,
            days: e.days || {}, present: e.present, absent: e.absent,
            remarks: e.remarks || '',
        }));
        excludedDateInput.value = (data.excluded_dates || []).join(',');
    } else {
        monthlyRecord.value = { id: null, excluded_dates: [] };
        excludedDateInput.value = '';
        const all = await api(`/teacher/api/students?grade_level_id=${monthlyGrade.value}&section=${monthlySection.value}`);
        monthlyEntries.value = all.map((s: any) => ({
            studentId: s.id, name: s.name,
            days: {}, present: 0, absent: 0, remarks: '',
        }));
    }
}

async function saveMonthly() {
        const all = await api(`/teacher/api/students?grade_level_id=${monthlyGrade.value}&section=${monthlySection.value}`);
        const entries = all.map((s: any) => {
            const existing = monthlyEntries.value.find((e: any) => e.studentId === s.id);
            return { studentId: s.id, name: s.name.toUpperCase(), days: existing?.days || {}, present: existing?.present || 0, absent: existing?.absent || 0, remarks: existing?.remarks || '' };
        });
    const result = await api('/teacher/api/monthly', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthlyMonth.value, year: monthlyYear.value, grade: gradeName(monthlyGrade.value), section: monthlySection.value, adviser: '', entries }),
    });
    monthlyRecord.value = result.record;
    monthlyEntries.value = entries;
    monthlySaved.value = true;
    setTimeout(() => monthlySaved.value = false, 2000);
}

async function onMonthlyDayChange(entry: any, day: number) {
    if (!monthlyRecord.value) return;
    await api(`/teacher/api/monthly/${monthlyRecord.value.id}/entry`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: entry.studentId, day, status: entry.days[day] || '' }),
    });
    loadMonthly();
}

function exportMonthly() {
    if (!monthlyRecord.value) return;
    window.open(`/teacher/api/monthly/${monthlyRecord.value.id}/export`, '_blank');
}

async function onRemarksChange(entry: any) {
    if (!monthlyRecord.value) return;
    await api(`/teacher/api/monthly/${monthlyRecord.value.id}/remarks`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: entry.studentId, remarks: entry.remarks }),
    });
}

async function saveExcludedDates() {
    if (!monthlyRecord.value) return;
    const dates = excludedDateInput.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
    await api(`/teacher/api/monthly/${monthlyRecord.value.id}/excluded-dates`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excluded_dates: dates }),
    });
    loadMonthly();
}

// Students
async function fetchStudents() {
    const params = new URLSearchParams();
    if (studentFilter.value.grade) params.set('grade_level_id', studentFilter.value.grade);
    if (studentFilter.value.section) params.set('section', studentFilter.value.section);
    students.value = await api('/teacher/api/students?' + params.toString());
}

onMounted(() => {
    fetchStudents();
});
</script>

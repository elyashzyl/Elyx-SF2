<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Monthly Attendance Record</title>
    <style>
        @page { margin: 20mm 15mm; }
        body { font-family: 'Courier New', monospace; font-size: 10pt; color: #000; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { font-size: 14pt; margin: 0 0 4px; }
        .header p { margin: 2px 0; font-size: 10pt; }
        .info { margin-bottom: 12px; font-size: 9pt; }
        .info table { width: 100%; }
        .info td { padding: 1px 4px; }
        table.grid { width: 100%; border-collapse: collapse; font-size: 8pt; }
        table.grid th, table.grid td { border: 1px solid #333; padding: 2px 3px; text-align: center; }
        table.grid th { background: #e0e0e0; font-weight: bold; }
        table.grid td.name { text-align: left; font-weight: bold; }
        td.present { color: #006600; }
        td.absent { color: #cc0000; }
        .footer { margin-top: 30px; font-size: 9pt; }
        .footer table { width: 100%; }
        .footer td { padding: 2px 10px; }
        .sig-line { border-top: 1px solid #333; margin-top: 30px; padding-top: 4px; width: 200px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MONTHLY ATTENDANCE RECORD</h1>
        <p>For the Month of {{ \Carbon\Carbon::create()->month($record->month)->format('F Y') }}</p>
    </div>

    <div class="info">
        <table>
            <tr>
                <td width="120"><strong>Grade Level:</strong></td>
                <td width="200">{{ $record->grade }}</td>
                <td width="100"><strong>Section:</strong></td>
                <td width="200">{{ $record->section }}</td>
            </tr>
            <tr>
                <td><strong>Adviser:</strong></td>
                <td>{{ $record->adviser ?? '________________________' }}</td>
                <td><strong>School Head:</strong></td>
                <td>{{ $record->school_head ?? '________________________' }}</td>
            </tr>
            <tr>
                <td><strong>Total Enrolled:</strong></td>
                <td>{{ count($entries) }}</td>
                <td><strong>School Year:</strong></td>
                <td>{{ $record->year - 1 }}-{{ $record->year }}</td>
            </tr>
        </table>
    </div>

    <table class="grid">
        <thead>
            <tr>
                <th rowspan="2" width="180" style="text-align: left;">STUDENT NAME</th>
                <th colspan="{{ count($days) }}">Day of the Month</th>
                <th rowspan="2" width="30">P</th>
                <th rowspan="2" width="30">A</th>
                @if($showTardy)
                <th rowspan="2" width="30">T</th>
                @endif
                <th rowspan="2" width="120">Remarks</th>
            </tr>
            <tr>
                @foreach($days as $d)
                    <th width="18" style="font-size: 7pt;">{{ $d }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($entries as $entry)
                @php
                    $rowDays = $entry->days ?? [];
                @endphp
                <tr>
                    <td class="name">{{ $entry->student_name }}</td>
                    @foreach($days as $d)
                        @php
                            $val = $rowDays[(string)$d] ?? '';
                        @endphp
                        <td class="{{ $val === '✓' ? 'present' : ($val === 'A' ? 'absent' : '') }}">
                            {{ $val }}
                        </td>
                    @endforeach
                    <td>{{ $entry->present }}</td>
                    <td>{{ $entry->absent }}</td>
                    @if($showTardy)
                    <td>{{ $entry->tardy ?? 0 }}</td>
                    @endif
                    <td style="font-size: 7pt; text-align: left;">{{ $entry->remarks ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <table>
            <tr>
                <td width="50%">
                    <div class="sig-line">Prepared by: {{ $record->adviser ?? '________________________' }}</div>
                </td>
                <td width="50%">
                    <div class="sig-line">Noted by: {{ $record->school_head ?? '________________________' }}</div>
                </td>
            </tr>
        </table>
    </div>

    <script type="text/php">
        if (isset($pdf)) {
            $pdf->page_text(30, $pdf->get_height() - 20, 'Page {PAGE_NUM} of {PAGE_COUNT}', null, 8);
        }
    </script>
</body>
</html>

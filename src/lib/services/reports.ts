
import { DayRepository, SettingsRepository } from '../db';
import { format } from 'date-fns';

export const generateHtmlReport = async () => {
    const allDays = await DayRepository.getAll();
    const streak = await SettingsRepository.get('streak') || 0;

    let rows = '';

    for (const item of allDays) {
        const score = item.scarcityScore;
        rows += `
        <tr style="border-bottom: 1px solid #333;">
            <td style="padding: 10px; color: #fff;">${item.date}</td>
            <td style="padding: 10px; font-weight: bold; color: ${score >= 70 ? '#16a34a' : '#dc2626'};">${score}</td>
            <td style="padding: 10px; color: #a3a3a3; font-style: italic;">
                ${score >= 90 ? 'Acceptable obedience.' : (score >= 70 ? 'Weak effort.' : 'TOTAL FAILURE.')}
            </td>
            <td style="padding: 10px;">
                ${item.morningIgnition.completedAt ? '✅' : '❌'} / 
                ${item.middaySprint.completed ? '✅' : '❌'}
            </td>
        </tr>
        `;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ОТЧЁТ СОБСТВЕННОСТИ</title>
<style>
    body { background: #000; color: #ccc; font-family: 'Courier New', monospace; padding: 20px; }
    h1 { color: #dc2626; text-align: center; border-bottom: 2px solid #7f1d1d; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; padding: 10px; color: #7f1d1d; border-bottom: 2px solid #7f1d1d; }
    .watermark {
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 5vw; color: rgba(127, 29, 29, 0.15); pointer-events: none; white-space: nowrap; z-index: -1;
        font-weight: 900; text-transform: uppercase;
    }
</style>
</head>
<body>
    <div class="watermark">СОБСТВЕННОСТЬ ГОСПОДИНА<br>КЛЕЙМО: ПИДОР</div>
    <h1>ОТЧЁТ РАБА [${format(new Date(), 'yyyy-MM-dd')}]</h1>
    <p>ТЕКУЩИЙ СТРЕЙК: ${streak} ДНЕЙ</p>
    <table>
        <thead>
            <tr>
                <th>ДАТА</th>
                <th>БАЛЛЫ</th>
                <th>ВЕРДИКТ</th>
                <th>ПРОТОКОЛ</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.html`;
    a.click();
    URL.revokeObjectURL(url);
};

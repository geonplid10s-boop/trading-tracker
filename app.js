// Trading Tracker PWA - App Logic
const STORAGE_KEY = 'trading_data';
let currentDate = new Date();
let selectedDate = null;
let selectedType = null;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    setupEventListeners();
    requestNotificationPermission();
    scheduleNotificationCheck();
    document.getElementById('btnDelete').onclick = deleteEntry;
});

// Datos
function getData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDayKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + d;
}

// Calendario
function renderCalendar() {
    const cal = document.getElementById('calendar');
    const monthYear = document.getElementById('monthYear');
    
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    monthYear.textContent = monthNames[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
    
    cal.innerHTML = '';
    const data = getData();
    const days = getDaysInMonth(currentDate);
    
    days.forEach(date => {
        const key = getDayKey(date);
        const entry = data[key];
        const div = document.createElement('div');
        div.className = 'day-cell';
        
        if (entry) {
            div.classList.add(entry.isProfit ? 'profit' : 'loss');
        }
        
        let html = '<div class="day-number">' + date.getDate() + '</div>';
        if (entry) {
            html += '<div class="day-amount">€' + entry.amount.toFixed(2) + '</div>';
        }
        div.innerHTML = html;
        
        div.onclick = () => openEntryModal(date);
        cal.appendChild(div);
    });
}

function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dayOfWeek = date.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            days.push(date);
        }
    }
    return days;
}

// Navegación
document.getElementById('prevMonth').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

document.getElementById('nextMonth').onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

// Modal de entrada
function openEntryModal(date) {
    selectedDate = date;
    selectedType = null;
    const modal = document.getElementById('modalEntry');
    const modalDate = document.getElementById('modalDate');
    const amountSection = document.getElementById('amountSection');
    const deleteBtn = document.getElementById('btnDelete');
    
    const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    modalDate.textContent = dayNames[date.getDay()] + ', ' + date.getDate() + ' de ' + getMonthName(date.getMonth());
    
    document.getElementById('btnProfit').classList.remove('selected');
    document.getElementById('btnLoss').classList.remove('selected');
    amountSection.classList.add('hidden');
    document.getElementById('amountInput').value = '';
    
    const data = getData();
    const key = getDayKey(date);
    if (data[key]) {
        deleteBtn.classList.remove('hidden');
    } else {
        deleteBtn.classList.add('hidden');
    }
    
    modal.classList.add('active');
}

document.getElementById('btnProfit').onclick = () => {
    selectedType = 'profit';
    document.getElementById('btnProfit').classList.add('selected');
    document.getElementById('btnLoss').classList.remove('selected');
    document.getElementById('amountSection').classList.remove('hidden');
};

document.getElementById('btnLoss').onclick = () => {
    selectedType = 'loss';
    document.getElementById('btnLoss').classList.add('selected');
    document.getElementById('btnProfit').classList.remove('selected');
    document.getElementById('amountSection').classList.remove('hidden');
};

document.getElementById('btnSave').onclick = () => {
    const amount = parseFloat(document.getElementById('amountInput').value);
    if (!selectedType || isNaN(amount) || amount <= 0) {
        alert('Por favor selecciona un tipo e ingresa un monto válido');
        return;
    }
    
    const data = getData();
    const key = getDayKey(selectedDate);
    data[key] = { amount: amount, isProfit: selectedType === 'profit' };
    saveData(data);
    
    document.getElementById('modalEntry').classList.remove('active');
    renderCalendar();
};

function deleteEntry() {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    
    const data = getData();
    const key = getDayKey(selectedDate);
    delete data[key];
    saveData(data);
    
    document.getElementById('modalEntry').classList.remove('active');
    renderCalendar();
}

document.getElementById('btnCloseModal').onclick = () => {
    document.getElementById('modalEntry').classList.remove('active');
};

// Balance mensual
document.getElementById('btnBalance').onclick = () => {
    const modal = document.getElementById('modalBalance');
    const content = document.getElementById('balanceContent');
    const data = getData();
    
    let totalProfit = 0, totalLoss = 0;
    
    const days = getDaysInMonth(currentDate);
    days.forEach(date => {
        const key = getDayKey(date);
        const entry = data[key];
        if (entry) {
            if (entry.isProfit) totalProfit += entry.amount;
            else totalLoss += entry.amount;
        }
    });
    
    const total = totalProfit - totalLoss;
    let html = '<div class="balance-row"><span>Ganancias</span><span class="profit-text">€' + totalProfit.toFixed(2) + '</span></div>';
    html += '<div class="balance-row"><span>Pérdidas</span><span class="loss-text">€' + totalLoss.toFixed(2) + '</span></div>';
    html += '<div class="balance-row total"><span>BALANCE TOTAL</span><span class="' + (total >= 0 ? 'profit-text' : 'loss-text') + '">€' + total.toFixed(2) + '</span></div>';
    content.innerHTML = html;
    
    modal.classList.add('active');
};

document.getElementById('btnCloseBalance').onclick = () => {
    document.getElementById('modalBalance').classList.remove('active');
};

// Exportar Excel (HTML con diseño bonito)
document.getElementById('btnExport').onclick = function() {
    var data = getData();
    var monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    var monthName = monthNames[currentDate.getMonth()];
    var year = currentDate.getFullYear();
    
    var title = 'TRADING TRACKER - ' + monthName.toUpperCase() + ' ' + year;
    
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office">';
    html += '<head><meta charset="utf-8"><title>Trading Tracker</title>';
    html += '<style>';
    html += 'body { font-family: Calibri, Arial; margin: 0; padding: 30px; background: #f5f5f5; }';
    html += 'table { border-collapse: collapse; width: 100%; border-radius: 10px; overflow: hidden; box-shadow: 0 0 30px rgba(0,0,0,0.15); }';
    html += 'td, th { border: 1px solid #ddd; padding: 18px; text-align: left; font-size: 16px; }';
    html += 'th { background: #0F3460; color: white; font-size: 20px; font-weight: bold; padding: 22px; }';
    html += '.title-row td { background: #16213E; color: white; font-size: 28px; font-weight: bold; padding: 35px; text-align: center; letter-spacing: 3px; }';
    html += '.profit { color: #27ae60; font-weight: bold; font-size: 18px; background: #eafaf1; }';
    html += '.loss { color: #c0392b; font-weight: bold; font-size: 18px; background: #fdedec; }';
    html += '.total-profit { background: #145a32; color: #2ecc71; font-weight: bold; font-size: 22px; padding: 25px; }';
    html += '.total-loss { background: #641e16; color: #e74c3c; font-weight: bold; font-size: 22px; padding: 25px; }';
    html += '.balance-row td { background: #0F3460; color: white; font-size: 26px; font-weight: bold; padding: 30px; }';
    html += '.date-col { font-size: 17px; color: #2c3e50; font-weight: 600; }';
    html += '</style></head><body>';
    html += '<table>';
    
    // Título
    html += '<tr class="title-row"><td colspan="3">' + title + '</td></tr>';
    html += '<tr><td colspan="3" style="padding:15px;background:#ecf0f1;"></td></tr>';
    
    // Headers
    html += '<tr><th>Fecha</th><th>Tipo</th><th>Cantidad (€)</th></tr>';
    
    var totalProfit = 0, totalLoss = 0;
    var days = getDaysInMonth(currentDate);
    
    days.forEach(function(date) {
        var key = getDayKey(date);
        var entry = data[key];
        if (entry) {
            var dName = dayNames[date.getDay()];
            var dNum = date.getDate();
            var mNum = date.getMonth() + 1;
            var dateStr = dName + ' ' + dNum + '/' + mNum;
            var type = entry.isProfit ? 'GANANCIA' : 'PERDIDA';
            var cssClass = entry.isProfit ? 'profit' : 'loss';
            var amount = '€' + entry.amount.toFixed(2);
            
            html += '<tr><td class="date-col">' + dateStr + '</td><td class="' + cssClass + '">' + type + '</td><td class="' + cssClass + '">' + amount + '</td></tr>';
            
            if (entry.isProfit) totalProfit += entry.amount;
            else totalLoss += entry.amount;
        }
    });
    
    html += '<tr><td colspan="3" style="padding:15px;background:#ecf0f1;"></td></tr>';
    html += '<tr class="total-profit"><td colspan="2">TOTAL GANANCIAS</td><td>€' + totalProfit.toFixed(2) + '</td></tr>';
    html += '<tr class="total-loss"><td colspan="2">TOTAL PERDIDAS</td><td>€' + totalLoss.toFixed(2) + '</td></tr>';
    
    var balanceTotal = totalProfit - totalLoss;
    html += '<tr class="balance-row"><td colspan="2">BALANCE TOTAL</td><td>€' + balanceTotal.toFixed(2) + '</td></tr>';
    
    html += '</table></body></html>';
    
    var blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Trading_' + monthName + '_' + year + '.xls';
    link.click();
};

// Notificaciones
function requestNotificationPermission() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
        Notification.requestPermission();
    }
}

function scheduleNotificationCheck() {
    setInterval(() => {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        if (day >= 1 && day <= 5 && hour === 17 && minute === 0) {
            showNotification();
        }
    }, 60000);
}

function showNotification() {
    var basePath = window.location.pathname.includes('/trading-tracker/') ? '/trading-tracker' : '';
    if (Notification.permission === 'granted') {
        new Notification('Trading Tracker', {
            body: 'Debes registrar los datos del día de hoy',
            icon: basePath + '/icons/icon-192.png',
            badge: basePath + '/icons/icon-192.png'
        });
    }
    
    if (document.visibilityState === 'visible') {
        alert('¡Recuerda registrar tus datos de trading de hoy!');
    }
}

// Service Worker para PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/trading-tracker/sw.js').catch(err => console.log('SW error:', err));
}

// Utilidades
function getMonthName(month) {
    const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return names[month];
}

function setupEventListeners() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

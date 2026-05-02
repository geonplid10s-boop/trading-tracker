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
});

// Datos
function getData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDayKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

// Calendario
function renderCalendar() {
    const cal = document.getElementById('calendar');
    const monthYear = document.getElementById('monthYear');
    
    const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    monthYear.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
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
        
        div.innerHTML = `
            <div class="day-number">${date.getDate()}</div>
            ${entry ? `<div class="day-amount">€${entry.amount.toFixed(2)}</div>` : ''}
        `;
        
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
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
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
    
    const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    modalDate.textContent = `${dayNames[date.getDay()]}, ${date.getDate()} de ${getMonthName(date.getMonth())}`;
    
    document.getElementById('btnProfit').classList.remove('selected');
    document.getElementById('btnLoss').classList.remove('selected');
    amountSection.classList.add('hidden');
    document.getElementById('amountInput').value = '';
    
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
    content.innerHTML = `
        <div class="balance-row"><span>Ganancias</span><span class="profit-text">€${totalProfit.toFixed(2)}</span></div>
        <div class="balance-row"><span>Pérdidas</span><span class="loss-text">€${totalLoss.toFixed(2)}</span></div>
        <div class="balance-row total"><span>BALANCE TOTAL</span><span class="${total >= 0 ? 'profit-text' : 'loss-text'}">€${total.toFixed(2)}</span></div>
    `;
    
    modal.classList.add('active');
};

document.getElementById('btnCloseBalance').onclick = () => {
    document.getElementById('modalBalance').classList.remove('active');
};

// Exportar Excel (CSV)
document.getElementById('btnExport').onclick = () => {
    const data = getData();
    const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    
    let csv = `"TRADING TRACKER - ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}"\n\n`;
    csv += `"Fecha","Tipo","Cantidad (€)"\n`;
    
    let totalProfit = 0, totalLoss = 0;
    const days = getDaysInMonth(currentDate);
    
    days.forEach(date => {
        const key = getDayKey(date);
        const entry = data[key];
        if (entry) {
            const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
            const dateStr = `${dayNames[date.getDay()]} ${date.getDate()}/${date.getMonth()+1}`;
            const type = entry.isProfit ? 'GANANCIA' : 'PÉRDIDA';
            csv += `"${dateStr}","${type}","€${entry.amount.toFixed(2)}"\n`;
            
            if (entry.isProfit) totalProfit += entry.amount;
            else totalLoss += entry.amount;
        }
    });
    
    csv += `\n"TOTAL GANANCIAS","","€${totalProfit.toFixed(2)}"\n`;
    csv += `"TOTAL PÉRDIDAS","","€${totalLoss.toFixed(2)}"\n`;
    csv += `"BALANCE TOTAL","","€${(totalProfit - totalLoss).toFixed(2)}"\n`;
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Trading_${monthNames[currentDate.getMonth()]}_${currentDate.getFullYear()}.csv`;
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
    }, 60000); // Revisar cada minuto
}

function showNotification() {
    const basePath = window.location.pathname.includes('/trading-tracker/') ? '/trading-tracker' : '';
    if (Notification.permission === 'granted') {
        new Notification('Trading Tracker', {
            body: 'Debes registrar los datos del día de hoy',
            icon: basePath + '/icons/icon-192.png',
            badge: basePath + '/icons/icon-192.png'
        });
    }
    
    // También alert nativo si la app está abierta
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
    // Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

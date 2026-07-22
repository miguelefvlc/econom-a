const amountInput = document.getElementById('amount');
const conceptInput = document.getElementById('concept');
const btnIncome = document.getElementById('btnIncome');
const btnExpense = document.getElementById('btnExpense');
const statusMessage = document.getElementById('statusMessage');

// Custom Dropdown Logic
const dropdownHeader = document.getElementById('dropdownHeader');
const dropdownList = document.getElementById('dropdownList');
const selectedConceptText = document.getElementById('selectedConceptText');
const chevron = dropdownHeader.querySelector('.chevron');
const headerIconContainer = dropdownHeader.querySelector('.header-content i');

dropdownHeader.addEventListener('click', () => {
    dropdownList.classList.toggle('hidden');
    chevron.style.transform = dropdownList.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('#customConceptDropdown')) {
        dropdownList.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
    }
});

const dropdownItems = document.querySelectorAll('.dropdown-item');
dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
        const value = item.getAttribute('data-value');
        const iconName = item.getAttribute('data-icon');
        const isBold = item.classList.contains('bold-text');
        
        conceptInput.value = value;
        selectedConceptText.textContent = value.includes(' - ') ? value.split(' - ')[1] : value;
        
        if (isBold) {
            selectedConceptText.classList.add('bold-text');
            selectedConceptText.classList.remove('italic-text');
        } else {
            selectedConceptText.classList.remove('bold-text');
            selectedConceptText.classList.add('italic-text');
        }

        headerIconContainer.setAttribute('data-lucide', iconName);
        lucide.createIcons();
        
        dropdownList.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
    });
});

btnIncome.addEventListener('click', () => addTransaction('Ingreso'));
btnExpense.addEventListener('click', () => addTransaction('Gasto'));

async function addTransaction(type) {
    const amountStr = amountInput.value.trim();
    const amount = parseFloat(amountStr.replace(',', '.'));
    const concept = conceptInput.value;

    if (!amountStr || isNaN(amount) || amount <= 0) {
        showStatus('Por favor, introduce una cantidad válida.', 'error');
        return;
    }

    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateString = `${year}-${month}-${day}`;
    
    const payload = {
        date: dateString,
        concept: concept,
        amount: amount.toFixed(2),
        type: type
    };

    // Since we are running via Live Server without a backend, we cannot write to a file automatically.
    // We will just show a simulation success message for now, and warn the user.
    showStatus('Simulación: Modo Live Server no permite guardar CSV localmente.', 'success');
    
    // Simular que se guarda reseteando el form
    amountInput.value = '';
    conceptInput.value = 'Concepto';
    selectedConceptText.textContent = 'Concepto';
    headerIconContainer.setAttribute('data-lucide', 'help-circle');
    lucide.createIcons();
    selectedConceptText.classList.remove('bold-text');
    selectedConceptText.classList.add('italic-text');
    
    // Recargar datos si es del año actual
    if (yearSelector.value == new Date().getFullYear()) {
        loadDashboardData();
    }
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message show';
    
    if (type === 'success') statusMessage.classList.add('status-success');
    else if (type === 'error') statusMessage.classList.add('status-error');

    setTimeout(() => {
        if (statusMessage.textContent === message) {
            statusMessage.classList.remove('show');
            setTimeout(() => statusMessage.textContent = '', 300);
        }
    }, 4000);
}

// Inicializar iconos Lucide
lucide.createIcons();

// --- Slider Logic ---
const sliderWrapper = document.getElementById('sliderWrapper');
const dots = document.querySelectorAll('.dot');
let currentSlide = 0;

function goToSlide(index) {
    currentSlide = index;
    sliderWrapper.style.transform = `translateX(-${index * 50}%)`;
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    if (index === 1) {
        loadDashboardData();
    }
}

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
});

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    const threshold = 50; 
    if (touchEndX < touchStartX - threshold) {
        if (currentSlide === 0) goToSlide(1);
    }
    if (touchEndX > touchStartX + threshold) {
        if (currentSlide === 1) goToSlide(0);
    }
}


// --- Tabs Logic ---
let currentTab = 'mes';
const tabBtns = document.querySelectorAll('.tab-btn');
const monthSelector = document.getElementById('monthSelector');

const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
months.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = (i + 1).toString().padStart(2, '0');
    opt.textContent = m;
    monthSelector.appendChild(opt);
});
monthSelector.value = String(new Date().getMonth() + 1).padStart(2, '0');
monthSelector.addEventListener('change', loadDashboardData);

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
                loadDashboardData();
    });
});

// --- Dashboard Logic ---
let balanceChartInstance = null;
const yearSelector = document.getElementById('yearSelector');

async function loadAvailableYears() {
    yearSelector.innerHTML = '';
    const startYear = 2021;
    const currentYear = new Date().getFullYear();
    
    // Add years from current down to 2020
    for (let y = currentYear; y >= startYear; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearSelector.appendChild(option);
    }
    
    yearSelector.addEventListener('change', () => {
        loadDashboardData();
    });
}

async function loadDashboardData() {
    try {
        let lines = [];
        
        if (currentTab === 'historico') {
            const startYear = 2021;
            const currentYear = new Date().getFullYear();
            for (let y = currentYear; y >= startYear; y--) {
                try {
                    const res = await fetch(`data/transacciones_${y}.csv`);
                    if (res.ok) {
                        const text = await res.text();
                        const fileLines = text.trim().split('\n');
                        if (fileLines.length > 0 && fileLines[0].includes('Concepto')) fileLines.shift();
                        lines = lines.concat(fileLines);
                    }
                } catch(e) {}
            }
        } else {
            const selectedYear = yearSelector.value || new Date().getFullYear();
            const response = await fetch(`data/transacciones_${selectedYear}.csv`);
            if (response.ok) {
                const text = await response.text();
                lines = text.trim().split('\n');
                if (lines.length > 0 && lines[0].includes('Concepto')) lines.shift();
            }
        }
        
        if (lines.length === 0) {
            if (balanceChartInstance) balanceChartInstance.destroy();
            document.querySelector('.balance-amount').textContent = '0 €';
            document.querySelector('.balance-amount').classList.remove('negative');
            document.getElementById('historyList').innerHTML = '<div style="text-align:center; padding: 20px; color: #64748b;">No hay datos</div>';
            return; 
        }
        
        let totalIncome = 0;
        let totalExpense = 0;
        let expensesByCategory = {};
        let historyHTML = '';
        
        const selMonth = monthSelector.value;
        
        for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            if (!line) continue;
            
            const parts = line.split(',');
            if (parts.length < 4) continue;
            
            const date = parts[0];
            
            // Filter by month if tab is 'mes'
            if (currentTab === 'mes') {
                const rowMonth = date.split('-')[1];
                if (rowMonth !== selMonth) continue;
            }
            
            const conceptFull = parts[1].replace(/"/g, '');
            const amount = parseFloat(parts[2]);
            const type = parts[3].trim();
            
            let parentConcept = conceptFull.includes(' - ') ? conceptFull.split(' - ')[0] : conceptFull;
            let iconName = getIconForConcept(parentConcept);
            
            if (type === 'Ingreso') {
                totalIncome += amount;
            } else if (type === 'Gasto') {
                totalExpense += amount;
                expensesByCategory[parentConcept] = (expensesByCategory[parentConcept] || 0) + amount;
            }
            
            const isIncome = type === 'Ingreso';
            const sign = isIncome ? '+' : '-';
            const amountClass = isIncome ? 'amount-income' : 'amount-expense';
            
            const amtParts = amount.toFixed(0);
            const formattedAmount = amtParts.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            
            historyHTML += `
                <div class="history-item">
                    <div class="history-item-left">
                        <div class="history-icon">
                            <i data-lucide="${iconName}"></i>
                        </div>
                        <div class="history-details">
                            <span class="history-title">${conceptFull}</span>
                            <span class="history-date">${date}</span>
                        </div>
                    </div>
                    <span class="history-amount ${amountClass}">${sign}${formattedAmount} €</span>
                </div>
            `;
        }
        
        const balance = totalIncome - totalExpense;
        const formattedBalance = balance.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const balanceEl = document.getElementById('totalBalanceOverlay');
        balanceEl.textContent = `${formattedBalance} €`;
        
        if (balance < 0) {
            balanceEl.classList.add('negative');
        } else {
            balanceEl.classList.remove('negative');
        }
        
        document.getElementById('historyList').innerHTML = historyHTML;
        
        lucide.createIcons();
        updateChart(expensesByCategory);
        
    } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
    }
}

function getIconForConcept(concept) {
    const icons = {
        'Nómina': 'briefcase',
        'Transporte': 'car',
        'Plataformas digitales': 'monitor-play',
        'Compras': 'shopping-bag',
        'Viajes': 'plane',
        'Deporte': 'dumbbell',
        'Formación': 'graduation-cap',
        'Impuestos': 'landmark',
        'Regalo': 'gift',
        'Ocio': 'coffee',
        'Hogar': 'home'
    };
    return icons[concept] || 'circle';
}

function updateChart(expensesByCategory) {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);
    
    const colors = [
        '#00f0ff', /* Cyan neon */
        '#ff0055', /* Magenta neon */
        '#b000ff', /* Purple neon */
        '#00ff9d', /* Green neon */
        '#0055ff', /* Deep blue */
        '#ffaa00', /* Orange neon */
        '#ff00ea', /* Pink neon */
        '#00ffea', /* Aqua neon */
        '#ffff00', /* Yellow neon */
        '#7700ff'  /* Violet neon */
    ];
    
    if (balanceChartInstance) {
        balanceChartInstance.destroy();
    }
    
    if (data.length === 0) {
        balanceChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sin gastos'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['rgba(255,255,255,0.05)'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '88%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
        return;
    }
    
    balanceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '88%',
            elements: {
                arc: {
                    borderWidth: 0,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0,0,0,0.5)'
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw.toFixed(0)} €`;
                        }
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadAvailableYears();
    loadDashboardData();
});

const amountInput = document.getElementById('amount');
const conceptInput = document.getElementById('concept');
const btnIncome = document.getElementById('btnIncome');
const btnExpense = document.getElementById('btnExpense');
const statusMessage = document.getElementById('statusMessage');

// GitHub API config
const GH_OWNER = 'miguelefvlc';
const GH_REPO = 'econom-a';

// Modal Elements
const btnSettings = document.getElementById('btnSettings');
const settingsModal = document.getElementById('settingsModal');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const ghTokenInput = document.getElementById('ghToken');
const settingsStatus = document.getElementById('settingsStatus');

// Load token
if (ghTokenInput) {
    ghTokenInput.value = localStorage.getItem('gh_pat') || '';
}

if (btnSettings) {
    btnSettings.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
}

if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        settingsStatus.textContent = '';
        settingsStatus.classList.remove('show');
    });
}

if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
        const token = ghTokenInput.value.trim();
        if (token) {
            localStorage.setItem('gh_pat', token);
            settingsStatus.textContent = 'Token guardado en este navegador.';
            settingsStatus.className = 'status-message show status-success';
            setTimeout(() => {
                settingsModal.classList.add('hidden');
                settingsStatus.textContent = '';
                settingsStatus.classList.remove('show');
            }, 1500);
        } else {
            localStorage.removeItem('gh_pat');
            settingsStatus.textContent = 'Token borrado.';
            settingsStatus.className = 'status-message show status-success';
        }
    });
}

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
const headerContent = dropdownHeader.querySelector('.header-content');

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

        // Reemplazar el icono SVG viejo por un nuevo <i> y volver a renderizarlo
        const oldIcon = headerContent.querySelector('svg, i');
        if (oldIcon) oldIcon.remove();
        
        const newIcon = document.createElement('i');
        newIcon.setAttribute('data-lucide', iconName);
        headerContent.insertBefore(newIcon, selectedConceptText);
        lucide.createIcons();
        
        dropdownList.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
    });
});

btnIncome.addEventListener('click', () => addTransaction('Ingreso'));
btnExpense.addEventListener('click', () => addTransaction('Gasto'));

async function addTransaction(type) {
    const amountStr = amountInput.value.trim();
    // Redondear para quitar decimales como pidió el usuario
    const amount = Math.round(parseFloat(amountStr.replace(',', '.')));
    const concept = conceptInput.value;

    if (!amountStr || isNaN(amount) || amount <= 0) {
        showStatus('Por favor, introduce una cantidad válida.', 'error');
        return;
    }

    const token = localStorage.getItem('gh_pat');
    if (!token) {
        showStatus('Configura tu Token de GitHub primero.', 'error');
        settingsModal.classList.remove('hidden');
        return;
    }

    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateString = `${year}-${month}-${day}`;
    
    // Guardamos sin decimales
    const newLine = `\n${dateString},"${concept}",${amount},${type}`;

    showStatus('Guardando en GitHub...', 'success'); 

    try {
        const filePath = `data/transacciones_${year}.csv`;
        const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}`;
        
        let getRes = await fetch(apiUrl, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });
        
        let sha = null;
        let content = '';
        
        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
            content = decodeURIComponent(escape(atob(data.content)));
        } else if (getRes.status === 404) {
            content = "Fecha,Concepto,Cantidad,Tipo";
        } else {
            const errData = await getRes.json().catch(() => ({}));
            throw new Error(errData.message || 'Error al conectar con GitHub para leer el archivo.');
        }
        
        // Limpiamos los saltos de línea finales del archivo original para no crear espacios en blanco
        content = content.replace(/[\r\n]+$/, '');
        content += newLine;
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        const putRes = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Nueva transacción: ${concept} (${type})`,
                content: encodedContent,
                sha: sha
            })
        });
        
        if (!putRes.ok) {
            const errData = await putRes.json().catch(() => ({}));
            throw new Error(errData.message || 'Error al guardar archivo en GitHub.');
        }
        
        showStatus('¡Guardado correctamente!', 'success');
        
        amountInput.value = '';
        conceptInput.value = 'Nómina';
        selectedConceptText.textContent = 'Nómina';
        headerIconContainer.setAttribute('data-lucide', 'briefcase');
        lucide.createIcons();
        selectedConceptText.classList.add('bold-text');
        selectedConceptText.classList.remove('italic-text');
        
        if (yearSelector.value == year) {
            loadDashboardData();
        }
        if (currentSlide === 2) {
            loadBudgetsData();
        }
        
    } catch (error) {
        console.error(error);
        showStatus('Error: ' + error.message, 'error');
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
    sliderWrapper.style.transform = `translateX(-${index * 33.3333}%)`;
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    if (index === 1) {
        loadDashboardData();
    }
    if (index === 2) {
        loadBudgetsData();
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
        if (currentSlide < 2) goToSlide(currentSlide + 1);
    }
    if (touchEndX > touchStartX + threshold) {
        if (currentSlide > 0) goToSlide(currentSlide - 1);
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

async function fetchCSV(year) {
    const token = localStorage.getItem('gh_pat');
    
    // Si tenemos token, intentamos leer la versión más reciente directamente de GitHub
    if (token) {
        // Añadimos un parámetro ?t= para evitar que el navegador guarde el archivo en caché
        const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/data/transacciones_${year}.csv?t=${Date.now()}`;
        try {
            const res = await fetch(apiUrl, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3.raw' // Pide el archivo crudo, sin base64
                },
                cache: 'no-store'
            });
            if (res.ok) {
                return await res.text();
            }
        } catch(e) {
            console.warn("Fallo al leer de GitHub API, intentando archivo local", e);
        }
    }
    
    // Fallback: leer el archivo local o de GitHub Pages (añadimos timestamp para evitar caché)
    try {
        const res = await fetch(`data/transacciones_${year}.csv?t=${Date.now()}`);
        if (res.ok) {
            return await res.text();
        }
    } catch(e) {}
    
    return null;
}

async function loadDashboardData() {
    try {
        let lines = [];
        
        if (currentTab === 'historico') {
            const startYear = 2021;
            const currentYear = new Date().getFullYear();
            for (let y = currentYear; y >= startYear; y--) {
                const text = await fetchCSV(y);
                if (text) {
                    const fileLines = text.trim().split('\n');
                    if (fileLines.length > 0 && fileLines[0].includes('Concepto')) fileLines.shift();
                    lines = lines.concat(fileLines);
                }
            }
        } else {
            const selectedYear = yearSelector.value || new Date().getFullYear();
            const text = await fetchCSV(selectedYear);
            if (text) {
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
            let line = lines[i];
            if (!line) continue;
            
            // Limpieza robusta por si se edita con Excel y envuelve la línea en comillas
            if (line.startsWith('"') && line.endsWith('"')) {
                line = line.substring(1, line.length - 1).replace(/""/g, '"');
            }
            
            const parts = line.split(',');
            if (parts.length < 4) continue;
            
            const date = parts[0].replace(/"/g, '');
            
            // Filter by month if tab is 'mes'
            if (currentTab === 'mes') {
                const rowMonth = date.split('-')[1];
                if (rowMonth !== selMonth) continue;
            }
            
            const conceptFull = parts[1].replace(/"/g, '');
            const amount = parseFloat(parts[2].replace(/"/g, ''));
            const type = parts[3].replace(/"/g, '').trim();
            
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
        'Plataformas': 'monitor-play',
        'Compras': 'shopping-bag',
        'Viajes': 'plane',
        'Deporte': 'dumbbell',
        'Formación': 'graduation-cap',
        'Impuestos y Renta': 'landmark',
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

// --- Budgets (Topes) Logic ---
async function loadTopes() {
    const token = localStorage.getItem('gh_pat');
    let topes = {};
    const fallbackTopes = {
        'Hogar': 500, 'Ocio': 200, 'Compras': 150, 'Transporte': 70,
        'Deporte': 70, 'Viajes': 70, 'Regalo': 40, 'Impuestos y Renta': 40, 'Plataformas': 20
    };
    
    try {
        let text = null;
        if (token) {
            const apiUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/data/topes.csv?t=${Date.now()}`;
            try {
                const res = await fetch(apiUrl, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3.raw' },
                    cache: 'no-store'
                });
                if (res.ok) text = await res.text();
            } catch(e) {}
        }
        
        if (!text) {
            const res = await fetch(`data/topes.csv?t=${Date.now()}`);
            if (res.ok) text = await res.text();
        }
        
        if (text) {
            const lines = text.trim().split('\n');
            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',');
                if (parts.length >= 2) {
                    topes[parts[0].trim()] = parseFloat(parts[1].trim());
                }
            }
        }
    } catch (e) {
        console.error("Error loading topes", e);
    }
    
    if (Object.keys(topes).length === 0) topes = fallbackTopes;
    return topes;
}

async function loadBudgetsData() {
    try {
        const topes = await loadTopes();
        let lines = [];
        const startYearBudget = 2026;
        const currentYear = new Date().getFullYear();
        const currentMonthNum = new Date().getMonth() + 1; // 1-12
        
        for (let y = currentYear; y >= startYearBudget; y--) {
            const text = await fetchCSV(y);
            if (text) {
                const fileLines = text.trim().split('\n');
                if (fileLines.length > 0 && fileLines[0].includes('Concepto')) fileLines.shift();
                lines = lines.concat(fileLines);
            }
        }
        
        // Inicio desde Enero (1) de 2026
        let activeMonths = (currentYear - 2026) * 12 + currentMonthNum;
        if (activeMonths < 1) activeMonths = 1;
        
        let expensesSinceStart = {};
        let expensesCurrentMonth = {};
        
        const currentMonthStr = String(currentMonthNum).padStart(2, '0');
        const currentYearStr = String(currentYear);
        
        for (let line of lines) {
            if (!line) continue;
            if (line.startsWith('"') && line.endsWith('"')) {
                line = line.substring(1, line.length - 1).replace(/""/g, '"');
            }
            const parts = line.split(',');
            if (parts.length < 4) continue;
            
            const date = parts[0].replace(/"/g, ''); // YYYY-MM-DD
            const rowYear = date.split('-')[0];
            const rowMonth = date.split('-')[1];
            
            if (rowYear < '2026') continue;
            
            const conceptFull = parts[1].replace(/"/g, '');
            const amount = parseFloat(parts[2].replace(/"/g, ''));
            const type = parts[3].replace(/"/g, '').trim();
            
            if (type !== 'Gasto') continue;
            
            let parentConcept = conceptFull.includes(' - ') ? conceptFull.split(' - ')[0] : conceptFull;
            
            expensesSinceStart[parentConcept] = (expensesSinceStart[parentConcept] || 0) + amount;
            
            if (rowYear === currentYearStr && rowMonth === currentMonthStr) {
                expensesCurrentMonth[parentConcept] = (expensesCurrentMonth[parentConcept] || 0) + amount;
            }
        }
        
        let html = '';
        let sortedCats = Object.keys(topes).sort((a,b) => topes[b] - topes[a]);
        
        for (const cat of sortedCats) {
            const tope = topes[cat];
            const totalSpent = expensesSinceStart[cat] || 0;
            const currentSpent = expensesCurrentMonth[cat] || 0;
            const totalBudget = tope * activeMonths;
            const accum = totalBudget - totalSpent;
            
            const iconName = getIconForConcept(cat);
            const accumClass = accum >= 0 ? 'positive' : 'negative';
            const accumSign = accum > 0 ? '+' : '';
            
            html += `
                <div class="budget-item">
                    <div class="budget-col-cat budget-cat-name">
                        <i data-lucide="${iconName}"></i>
                        ${cat}
                    </div>
                    <div class="budget-col-limit budget-val">${tope} €</div>
                    <div class="budget-col-spent budget-val">${currentSpent} €</div>
                    <div class="budget-col-accum budget-val ${accumClass}">${accumSign}${accum.toFixed(0)} €</div>
                </div>
            `;
        }
        
        document.getElementById('budgetsList').innerHTML = html;
        lucide.createIcons();
        
    } catch (err) {
        console.error('Error cargando presupuestos:', err);
        document.getElementById('budgetsList').innerHTML = '<div style="text-align:center; padding: 20px; color: #ff0055;">Error al cargar presupuestos.</div>';
    }
}


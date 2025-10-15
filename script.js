(() => {
    const CONSTANTS = { STORAGE_KEYS: { INPUTS: 'energyInputs', HISTORY: 'energyHistory', LAST_VIEW: 'energyAppLastView', ONBOARDED: 'energyAppOnboarded' }, CONSUMPTION_ALERT_THRESHOLD: 1.15 };
    const DOM = {
        goalInput: document.getElementById('goal-input'),
        goalCard: document.getElementById('goal-card'),
        goalCardTitle: document.getElementById('goal-card-title'),
        goalCurrentText: document.getElementById('goal-current-text'),
        goalTargetText: document.getElementById('goal-target-text'),
        goalProgressBar: document.getElementById('goal-progress-bar'),
        lastRegisteredReading: document.getElementById('last-registered-reading'),
        goalKwhConsumed: document.getElementById('goal-kwh-consumed'),
        comparisonLastMonthValue: document.getElementById('comparison-last-month-value'),
        comparisonLastMonthIndicator: document.getElementById('comparison-last-month-indicator'),
        historyTableContainer: document.getElementById('history-table-container'),
        pastBillModalTitle: document.getElementById('past-bill-modal-title'),
        editingBillId: document.getElementById('editing-bill-id'),
        inputView: document.getElementById('input-view'),
        dashboardView: document.getElementById('dashboard-view'),
        historyView: document.getElementById('history-view'),
        bottomNav: document.getElementById('bottom-nav'),
        headerSubtitle: document.getElementById('header-subtitle'),
        inputCard: document.getElementById('input-card'),
        energyForm: document.getElementById('energy-form'),
        lastReadingDateEl: document.getElementById('last-reading-date'),
        nextReadingDateEl: document.getElementById('next-reading-date'),
        lastReadingValueEl: document.getElementById('last-reading-value'),
        currentReadingValueEl: document.getElementById('current-reading-value'),
        kwhPriceEl: document.getElementById('kwh-price'),
        formError: document.getElementById('form-error'),
        calculateBtn: document.getElementById('calculate-btn'),
        editDataBtn: document.getElementById('edit-data-btn'),
        saveBtn: document.getElementById('save-reading-btn'),
        predictedBillMainEl: document.getElementById('predicted-bill-main'),
        predictedConsumptionEl: document.getElementById('predicted-consumption'),
        dailyUpdateValueEl: document.getElementById('daily-update-value'),
        currentBillEl: document.getElementById('current-bill'),
        dailyAvgEl: document.getElementById('daily-avg'),
        daysLeftEl: document.getElementById('days-left'),
        alertCard: document.getElementById('alert-card'),
        alertMessage: document.getElementById('alert-message'),
        historyCard: document.getElementById('history-card'),
        addPastBillBtn: document.getElementById('add-past-bill-btn'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        historyChartCanvas: document.getElementById('history-chart').getContext('2d'),
        pastBillModal: document.getElementById('past-bill-modal'),
        pastBillMonthEl: document.getElementById('past-bill-month'),
        pastBillValueEl: document.getElementById('past-bill-value'),
        pastBillKwhEl: document.getElementById('past-bill-kwh'),
        modalError: document.getElementById('modal-error'),
        savePastBillBtn: document.getElementById('save-past-bill-btn'),
        cancelModalBtn: document.getElementById('cancel-modal-btn'),
        confirmModal: document.getElementById('confirm-modal'),
        confirmMessage: document.getElementById('confirm-message'),
        confirmOkBtn: document.getElementById('confirm-ok-btn'),
        confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
        notification: document.getElementById('notification'),
        notificationMessage: document.getElementById('notification-message'),
        infoModal: document.getElementById('info-modal'),
        infoModalTitle: document.getElementById('info-modal-title'),
        infoModalText: document.getElementById('info-modal-text'),
        infoModalCloseBtn: document.getElementById('info-modal-close-btn'),
        exportDataBtn: document.getElementById('export-data-btn'),
        importDataBtn: document.getElementById('import-data-btn'),
        importFileInput: document.getElementById('import-file-input'),
        historyContent: document.getElementById('history-content'),
        historyEmptyState: document.getElementById('history-empty-state'),
        addFirstBillBtn: document.getElementById('add-first-bill-btn'),
        onboardingModal: document.getElementById('onboarding-modal'),
        onboardingCloseBtn: document.getElementById('onboarding-close-btn'),
    };

    let state = { historyChart: null, currentPredictedBill: 0, currentPartialBill: 0, notificationTimeout: null, confirmCallback: null, focusedElementBeforeModal: null, previousValues: { bill: 0, partial: 0, avg: 0, days: 0, reading: 0 } };
    
    const Utils = { 
        getStoredData: (key, defaultValue = "") => { 
            try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) : defaultValue; } 
            catch (e) { console.error("Erro ao ler do localStorage:", e); return defaultValue; }
        }, 
        setStoredData: (key, data) => {
            try { localStorage.setItem(key, JSON.stringify(data)); } 
            catch (e) { console.error("Erro ao salvar no localStorage:", e); showNotification("Não foi possível salvar os dados. O armazenamento pode estar cheio ou desativado.", true); }
        }, 
        formatCurrency: (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
        daysBetween: (dateStr1, dateStr2) => {
            const d1 = new Date(dateStr1);
            const d2 = new Date(dateStr2);
            d1.setUTCHours(0, 0, 0, 0);
            d2.setUTCHours(0, 0, 0, 0);
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.round((d2.getTime() - d1.getTime()) / oneDay);
        },
    };
    
    const showInfoModal = (infoKey) => { let title = '', text = ''; const inputs = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.INPUTS, {}); switch (infoKey) { case 'previsao': title = "Como a Previsão é Calculada?"; text = `A previsão é uma estimativa do valor total da sua fatura.\n\nÉ calculada multiplicando seu Consumo Médio Diário (${DOM.dailyAvgEl.textContent} kWh) pelo total de dias no seu ciclo de faturamento.`; break; case 'meta': title = "Acompanhamento da Meta"; text = `Esta barra compara seu Gasto Parcial atual com a meta de ${Utils.formatCurrency(parseFloat(inputs.goal) || 0)} que você definiu.\n\nA cor muda para te alertar: Verde (seguro), Amarelo (atenção, >90%) e Vermelho (meta estourada!).`; break; case 'fatura_parcial': title = "O que é a Fatura Parcial?"; text = `Este é o valor gasto desde o início do ciclo (${new Date(inputs.lastReadingDate + 'T00:00:00').toLocaleDateString('pt-BR')}) até a data da sua última leitura registrada.`; break; case 'ultima_leitura': title = "Última Leitura Registrada"; let dateText = "Ainda não registrada."; if (inputs.currentReadingTimestamp) { dateText = `Registrado em: ${new Date(inputs.currentReadingTimestamp).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})}`; } text = `Este é o último valor do medidor (${DOM.lastRegisteredReading.textContent}) que você inseriu no aplicativo.\n\n${dateText}`; break; case 'media_diaria': title = "Como a Média Diária é Calculada?"; text = "Calculamos o total de kWh consumidos até agora e dividimos pelo número de dias que se passaram desde o início do ciclo."; break; case 'dias_restantes': title = "Dias Restantes no Ciclo"; text = `Este é o número de dias que faltam até a data da sua próxima leitura, programada para ${new Date(inputs.nextReadingDate + 'T00:00:00').toLocaleDateString('pt-BR')}.`; break; } if (title) { DOM.infoModalTitle.textContent = title; DOM.infoModalText.textContent = text; openModal(DOM.infoModal); } };
    const navigateTo = (viewId) => { [DOM.dashboardView, DOM.historyView].forEach(v => v.classList.add('hidden')); document.getElementById(viewId).classList.remove('hidden'); document.querySelectorAll('#bottom-nav .nav-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.view === viewId); }); Utils.setStoredData(CONSTANTS.STORAGE_KEYS.LAST_VIEW, viewId); };
    
    const switchView = (viewName) => { 
        if (viewName === 'dashboard') { 
            DOM.inputView.classList.add('hidden'); 
            DOM.bottomNav.classList.remove('hidden'); 
            navigateTo('dashboard-view'); 
            Utils.setStoredData(CONSTANTS.STORAGE_KEYS.LAST_VIEW, 'dashboard-view'); 
        } else { 
            DOM.inputView.classList.remove('hidden'); 
            DOM.dashboardView.classList.add('hidden'); 
            DOM.historyView.classList.add('hidden'); 
            DOM.bottomNav.classList.add('hidden');
            Utils.setStoredData(CONSTANTS.STORAGE_KEYS.LAST_VIEW, 'input-view'); 
        } 
    };

    const updateGoalCard = (consumedKwh = 0) => {
    const inputs = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.INPUTS, {});
    const goal = parseFloat(inputs.goal);
    const partialBill = state.currentPartialBill;

    if (!goal || isNaN(goal) || goal <= 0) {
        DOM.goalCard.classList.add('hidden');
        return;
    }

    DOM.goalCard.classList.remove('hidden');
    DOM.goalCurrentText.textContent = `Gasto Atual: ${Utils.formatCurrency(partialBill)}`;
    DOM.goalTargetText.textContent = `Meta: ${Utils.formatCurrency(goal)}`;
    
    DOM.goalKwhConsumed.textContent = `Consumo: ${consumedKwh.toFixed(1)} kWh`;

    const percentage = (partialBill / goal) * 100;
    DOM.goalCardTitle.textContent = `Progresso da Meta (${percentage.toFixed(0)}%)`;

    const progressBarPercentage = Math.min(100, percentage);
    DOM.goalProgressBar.style.width = `${progressBarPercentage}%`;

    DOM.goalProgressBar.classList.remove('bg-green-500', 'bg-yellow-500', 'bg-red-500');
    if (percentage >= 100) {
        DOM.goalProgressBar.classList.add('bg-red-500');
    } else if (percentage > 90) {
        DOM.goalProgressBar.classList.add('bg-yellow-500');
    } else {
        DOM.goalProgressBar.classList.add('bg-green-500');
    }
};
    
    const totalDaysInCycle = nextDateStr ? Math.max(1, Utils.daysBetween(lastDateStr, nextDateStr)) : 30;

        // --- CORREÇÃO DEFINITIVA DA CONTAGEM DE DIAS ---
        
        // Esta variável calcula o número REAL de dias completos que se passaram.
        // No primeiro dia, o valor será 0. No segundo, 1, e assim por diante.
        const daysDiff = Utils.daysBetween(lastDateStr, todayStr);

        // Para calcular a MÉDIA, precisamos que o primeiro dia conte como 1 (para não dividir por zero).
        // Usamos uma variável separada para isso.
        const daysForAvgCalc = daysDiff <= 0 ? 1 : daysDiff;
        const daysPassed = Math.min(daysForAvgCalc, totalDaysInCycle);

        // Agora, os cálculos da fatura...
        const consumedKwh = (currentReading >= lastReading) ? currentReading - lastReading : 0;
        const currentBill = consumedKwh * kwhPrice;
        const dailyAvgKwh = (consumedKwh > 0 && daysPassed > 0) ? consumedKwh / daysPassed : 0;
        const predictedKwh = dailyAvgKwh * totalDaysInCycle;
        const predictedBill = predictedKwh * kwhPrice;

        // E para os DIAS RESTANTES, usamos a variável com o valor real de dias passados (daysDiff).
        const daysLeft = Math.max(0, totalDaysInCycle - daysDiff);
        
        // --- FIM DA CORREÇÃO ---
        
        state.currentPredictedBill = predictedBill;
        state.currentPartialBill = currentBill;
        
        updateUI(currentBill, predictedBill, dailyAvgKwh, daysLeft, currentReading || lastReading, predictedKwh);
        checkConsumptionAlert();
        updateDashboardComparisons();
        updateGoalCard(consumedKwh);
    };

    const loadInitialData = () => { const savedInputs = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.INPUTS, {}); DOM.lastReadingDateEl.value = savedInputs.lastReadingDate || ''; DOM.nextReadingDateEl.value = savedInputs.nextReadingDate || ''; DOM.lastReadingValueEl.value = savedInputs.lastReadingValue || ''; DOM.currentReadingValueEl.value = savedInputs.currentReadingValue || ''; DOM.kwhPriceEl.value = savedInputs.kwhPrice || ''; DOM.goalInput.value = savedInputs.goal || ''; renderAllHistory(); const lastView = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.LAST_VIEW, 'input-view'); const canShowDashboard = DOM.lastReadingDateEl.value && DOM.lastReadingValueEl.value && DOM.kwhPriceEl.value; if (lastView !== 'input-view' && canShowDashboard) { calculate(true); DOM.inputView.classList.add('hidden'); DOM.bottomNav.classList.remove('hidden'); navigateTo(lastView); } else { switchView('input'); } };
    const saveInputData = (isDailyUpdate = false) => { const inputs = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.INPUTS, {}); const inputData = { lastReadingDate: DOM.lastReadingDateEl.value, nextReadingDate: DOM.nextReadingDateEl.value, lastReadingValue: DOM.lastReadingValueEl.value, currentReadingValue: DOM.currentReadingValueEl.value, kwhPrice: DOM.kwhPriceEl.value, goal: DOM.goalInput.value }; if (isDailyUpdate && DOM.currentReadingValueEl.value) { inputData.currentReadingTimestamp = new Date().toISOString(); } else { inputData.currentReadingTimestamp = inputs.currentReadingTimestamp || null; } Utils.setStoredData(CONSTANTS.STORAGE_KEYS.INPUTS, inputData); };
    
    const animateValue = (element, start, end, duration, formatFn) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentValue = progress * (end - start) + start;
            element.textContent = formatFn(currentValue);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    };

    const updateUI = (currentBill, predictedBill, dailyAvgKwh, daysLeft, lastReading, predictedKwh) => {
        const {bill, partial, avg, days, reading} = state.previousValues;
        animateValue(DOM.predictedBillMainEl, bill, predictedBill, 500, val => Utils.formatCurrency(val));
        animateValue(DOM.currentBillEl, partial, currentBill, 500, val => Utils.formatCurrency(val));
        animateValue(DOM.dailyAvgEl, avg, dailyAvgKwh, 500, val => val.toFixed(1));
        animateValue(DOM.daysLeftEl, days, daysLeft, 500, val => Math.round(val));

        DOM.predictedConsumptionEl.textContent = `Estimativa de ${predictedKwh.toFixed(0)} kWh no ciclo`;
        DOM.lastRegisteredReading.textContent = lastReading ? `${lastReading} kWh` : '-';
        
        state.previousValues = { bill: predictedBill, partial: currentBill, avg: dailyAvgKwh, days: daysLeft, reading: lastReading };
    };

    const validateInputs = () => {
        const { lastReadingDateEl, nextReadingDateEl, lastReadingValueEl, currentReadingValueEl, kwhPriceEl, formError } = DOM;
        
        const allFields = [lastReadingDateEl, nextReadingDateEl, lastReadingValueEl, currentReadingValueEl, kwhPriceEl];
        allFields.forEach(el => el.classList.remove('border-red-500'));
        formError.textContent = '';

        const fields = [
            { el: lastReadingDateEl, name: 'Data da Última Leitura', check: val => val, msg: 'é obrigatória.' },
            { el: nextReadingDateEl, name: 'Data da Próxima Leitura', check: val => val, msg: 'é obrigatória.' },
            { el: lastReadingValueEl, name: 'Última Leitura', check: val => val && !isNaN(parseFloat(val)) && parseFloat(val) >= 0, msg: 'deve ser um número válido e positivo.' },
            { el: currentReadingValueEl, name: 'Sua Leitura Mais Recente', check: val => val && !isNaN(parseFloat(val)) && parseFloat(val) >= 0, msg: 'deve ser um número válido e positivo.' },
            { el: kwhPriceEl, name: 'Valor do kWh', check: val => val && !isNaN(parseFloat(val)) && parseFloat(val) > 0, msg: 'deve ser maior que zero.' },
        ];
        
        for (const field of fields) {
            if (!field.check(field.el.value)) {
                formError.textContent = `O campo "${field.name}" ${field.msg}`;
                field.el.classList.add('border-red-500');
                field.el.focus();
                return false;
            }
        }
        
        if (parseFloat(currentReadingValueEl.value) < parseFloat(lastReadingValueEl.value)) {
            formError.textContent = 'A leitura atual não pode ser menor que a última.';
            currentReadingValueEl.classList.add('border-red-500');
            lastReadingValueEl.classList.add('border-red-500');
            return false;
        }
        
        if (new Date(nextReadingDateEl.value) <= new Date(lastReadingDateEl.value)) {
            formError.textContent = 'A data da próxima leitura deve ser posterior à última.';
            nextReadingDateEl.classList.add('border-red-500');
            return false;
        }

        return true;
    };

    const renderHistoryTable = () => { const history = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []); if (history.length === 0) { DOM.historyContent.classList.add('hidden'); DOM.historyEmptyState.classList.remove('hidden'); return; } DOM.historyContent.classList.remove('hidden'); DOM.historyEmptyState.classList.add('hidden'); DOM.historyTableContainer.innerHTML = ''; const table = document.createElement('table'); table.className = 'history-table'; table.innerHTML = `<thead><tr><th>Mês</th><th>Valor</th><th>Consumo</th><th>Ações</th></tr></thead><tbody>${history.map(item => `<tr class="border-gray-700"><td data-label="Mês">${item.label.replace('-', '/')}</td><td data-label="Valor">${Utils.formatCurrency(item.value)}</td><td data-label="Consumo">${item.kwh} kWh</td><td><button class="action-btn edit-btn" data-id="${item.label}">Editar</button><button class="action-btn delete-btn" data-id="${item.label}">Excluir</button></td></tr>`).join('')}</tbody>`; DOM.historyTableContainer.appendChild(table); };
    const checkConsumptionAlert = () => { const history = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []); if (history.length < 1) { DOM.alertCard.classList.add('hidden'); return; } history.sort((a, b) => a.label.localeCompare(b.label)); const lastBill = history[history.length - 1]; if (state.currentPredictedBill > lastBill.value * CONSTANTS.CONSUMPTION_ALERT_THRESHOLD) { const percentageDiff = ((state.currentPredictedBill / lastBill.value) - 1) * 100; DOM.alertMessage.textContent = `Sua previsão está ${percentageDiff.toFixed(0)}% maior que sua última fatura (${Utils.formatCurrency(lastBill.value)}).`; DOM.alertCard.classList.remove('hidden'); } else { DOM.alertCard.classList.add('hidden'); } };
    
    const updateDashboardComparisons = () => {
        const history = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []);
        history.sort((a, b) => a.label.localeCompare(b.label));
        const prediction = state.currentPredictedBill;

        if (prediction === 0 || history.length < 1) {
            DOM.comparisonLastMonthValue.textContent = 'N/A';
            DOM.comparisonLastMonthIndicator.textContent = 'Faltam dados';
            DOM.comparisonLastMonthIndicator.className = '';
            return;
        };

        const lastMonthBill = history[history.length - 1];
        DOM.comparisonLastMonthValue.textContent = Utils.formatCurrency(lastMonthBill.value);
        const diff = ((prediction / lastMonthBill.value) - 1) * 100;

        if (Math.abs(diff) < 1) {
            DOM.comparisonLastMonthIndicator.className = 'indicator';
            DOM.comparisonLastMonthIndicator.innerHTML = `<span>↔️</span> Estável`;
        } else if (diff > 0) {
            DOM.comparisonLastMonthIndicator.className = 'indicator indicator-up';
            DOM.comparisonLastMonthIndicator.innerHTML = `<span>↑</span> ${diff.toFixed(0)}% maior`;
        } else {
            DOM.comparisonLastMonthIndicator.className = 'indicator indicator-down';
            DOM.comparisonLastMonthIndicator.innerHTML = `<span>↓</span> ${Math.abs(diff).toFixed(0)}% menor`;
        }
    };

    const renderAllHistory = () => { renderHistoryChart(); renderHistoryTable(); };
    const resetPastBillModal = () => { DOM.pastBillModalTitle.textContent = 'Adicionar Fatura Passada'; DOM.editingBillId.value = ''; DOM.pastBillMonthEl.value = ''; DOM.pastBillValueEl.value = ''; DOM.pastBillKwhEl.value = ''; DOM.pastBillMonthEl.disabled = false; DOM.modalError.textContent = ''; };
    
    const renderHistoryChart = () => {
        const history = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []);
        const inputs = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.INPUTS, {});
        const goal = parseFloat(inputs.goal);

        if (!history) return;
        history.sort((a, b) => a.label.localeCompare(b.label));
        const chartLabels = history.map(item => item.label.replace(/-/g, '/'));
        const chartData = history.map(item => item.value);
        
        const allKwh = history.map(h => parseFloat(h.kwh)).filter(k => !isNaN(k) && k > 0);
        const avgKwh = allKwh.length > 0 ? allKwh.reduce((a, b) => a + b, 0) / allKwh.length : 0;
        const maxKwh = allKwh.length > 0 ? Math.max(...allKwh) : 0;
        const backgroundColors = history.map(item => { const kwh = parseFloat(item.kwh); if (isNaN(kwh) || kwh <= 0 || avgKwh === 0) return 'rgba(156, 163, 175, 0.6)'; if (allKwh.length === 1) return 'rgba(34, 197, 94, 0.6)'; if (kwh >= maxKwh - 0.01) return 'rgba(239, 68, 68, 0.6)'; if (kwh > avgKwh * 1.15) return 'rgba(245, 158, 11, 0.6)'; return 'rgba(34, 197, 94, 0.6)'; });
        const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: (value) => Utils.formatCurrency(value) } } },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (context) => `Fatura: ${Utils.formatCurrency(context.parsed.y)}`, afterLabel: (context) => `Consumo: ${history[context.dataIndex].kwh || 'N/A'} kWh` } },
                annotation: { annotations: {} }
            }
        };
        
        if (goal && !isNaN(goal) && goal > 0) {
            chartOptions.plugins.annotation.annotations.goalLine = {
                type: 'line',
                yMin: goal,
                yMax: goal,
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 2,
                borderDash: [6, 6],
                label: { content: `Meta: ${Utils.formatCurrency(goal)}`, position: 'end', backgroundColor: 'rgba(239, 68, 68, 0.8)', font: { weight: 'bold' }, display: true }
            };
        }

        if (state.historyChart) state.historyChart.destroy();
        state.historyChart = new Chart(DOM.historyChartCanvas, { type: 'bar', data: { labels: chartLabels, datasets: [{ label: 'Valor da Fatura (R$)', data: chartData, backgroundColor: backgroundColors, borderColor: borderColors, borderWidth: 1, borderRadius: 8, }] }, options: chartOptions });
    };
    
    const handleTrapFocus = (e) => { const modal = e.currentTarget; const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); const firstElement = focusableElements[0]; const lastElement = focusableElements[focusableElements.length - 1]; const isTabPressed = e.key === 'Tab' || e.keyCode === 9; if (!isTabPressed) return; if (e.shiftKey) { if (document.activeElement === firstElement) { lastElement.focus(); e.preventDefault(); } } else { if (document.activeElement === lastElement) { firstElement.focus(); e.preventDefault(); } } };
    const openModal = (modal, triggerElement = null) => { state.focusedElementBeforeModal = triggerElement || document.activeElement; const overlay = modal.querySelector('.modal-overlay'); const content = modal.querySelector('.modal-content'); modal.classList.remove('hidden'); setTimeout(() => { overlay.classList.remove('opacity-0'); content.classList.remove('scale-95', 'opacity-0'); modal.addEventListener('keydown', handleTrapFocus); const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (firstFocusable) firstFocusable.focus(); }, 10); };
    const closeModal = (modal) => { const overlay = modal.querySelector('.modal-overlay'); const content = modal.querySelector('.modal-content'); overlay.classList.add('opacity-0'); content.classList.add('scale-95', 'opacity-0'); modal.removeEventListener('keydown', handleTrapFocus); setTimeout(() => { modal.classList.add('hidden'); if (modal.id === 'past-bill-modal') resetPastBillModal(); if (state.focusedElementBeforeModal) state.focusedElementBeforeModal.focus(); }, 300); };
    const showNotification = (message, isError = false) => { clearTimeout(state.notificationTimeout); DOM.notificationMessage.textContent = message; DOM.notification.className = 'fixed top-5 right-5 text-white py-3 px-5 rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out'; DOM.notification.classList.add(isError ? 'bg-red-500' : 'bg-green-500'); DOM.notification.classList.remove('translate-x-[150%]'); state.notificationTimeout = setTimeout(() => DOM.notification.classList.add('translate-x-[150%]'), 3000); };
    const showConfirm = (message, onConfirm) => { DOM.confirmMessage.textContent = message; state.confirmCallback = onConfirm; openModal(DOM.confirmModal); };
    const hideConfirm = () => { closeModal(DOM.confirmModal); state.confirmCallback = null; };
    
    function handleExport() { const dataToExport = { inputs: Utils.getStoredData(CONSTANTS.STORAGE_KEYS.INPUTS), history: Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY) }; const dataStr = JSON.stringify(dataToExport, null, 2); const blob = new Blob([dataStr], {type: "application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dados-energia.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); showNotification('Dados exportados com sucesso!'); }
    function handleImport(event) { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const importedData = JSON.parse(e.target.result); if (!importedData.inputs || !importedData.history) throw new Error("Formato de arquivo inválido."); showConfirm("Importar estes dados irá sobrescrever todas as informações atuais. Deseja continuar?", () => { Utils.setStoredData(CONSTANTS.STORAGE_KEYS.INPUTS, importedData.inputs); Utils.setStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, importedData.history); loadInitialData(); showNotification("Dados importados com sucesso!"); }); } catch (error) { showNotification(`Erro ao importar o arquivo: ${error.message}`, true); } finally { DOM.importFileInput.value = ''; } }; reader.readAsText(file); }

    function setupEventListeners() {
        DOM.calculateBtn.addEventListener('click', () => { if (validateInputs()) { saveInputData(true); calculate(); switchView('dashboard'); } else { DOM.inputCard.classList.add('shake-error'); setTimeout(() => DOM.inputCard.classList.remove('shake-error'), 500); } });
        DOM.editDataBtn.addEventListener('click', () => switchView('input'));
        DOM.dailyUpdateValueEl.addEventListener('input', () => { DOM.currentReadingValueEl.value = DOM.dailyUpdateValueEl.value; saveInputData(true); calculate(true); });
        [DOM.goalInput, DOM.lastReadingDateEl, DOM.nextReadingDateEl, DOM.lastReadingValueEl, DOM.kwhPriceEl].forEach(el => el.addEventListener('input', () => saveInputData(false)));
        
        DOM.saveBtn.addEventListener('click', () => {
            if (!validateInputs()) {
                showNotification('Por favor, preencha todos os dados corretamente antes de salvar.', true);
                switchView('input');
                return;
            }

            const closingDate = new Date(DOM.nextReadingDateEl.value + 'T00:00:00');
            const label = (closingDate.getFullYear() + '-' + ("0" + (closingDate.getMonth() + 1)).slice(-2));
            
            const saveAction = () => { 
                const history = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []); 
                const finalReading = parseFloat(DOM.currentReadingValueEl.value); 
                const lastReading = parseFloat(DOM.lastReadingValueEl.value); 
                const kwhPrice = parseFloat(DOM.kwhPriceEl.value); 
                const totalValue = (finalReading - lastReading) * kwhPrice; 
                const totalKwh = finalReading - lastReading; 
                const newItem = { label, value: totalValue, kwh: parseFloat(totalKwh.toFixed(2)) }; 
                const existingIndex = history.findIndex(item => item.label === label); 
                if (existingIndex > -1) { 
                    history[existingIndex] = newItem; 
                } else { 
                    history.push(newItem); 
                } 
                Utils.setStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, history); 
                const newLastReadingDate = DOM.nextReadingDateEl.value; 
                const newNextReadingDate = new Date(newLastReadingDate + 'T00:00:00'); 
                newNextReadingDate.setMonth(newNextReadingDate.getMonth() + 1); 
                DOM.lastReadingDateEl.value = newLastReadingDate; 
                DOM.nextReadingDateEl.value = newNextReadingDate.toISOString().split('T')[0]; 
                DOM.lastReadingValueEl.value = finalReading; 
                DOM.currentReadingValueEl.value = ''; 
                saveInputData(true); 
                switchView('input'); 
                showNotification(`Fatura de ${label.replace(/-/g, '/')} salva!`); 
            }; 
            
            const history = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []); 
            const existingIndex = history.findIndex(item => item.label === label); 
            if (existingIndex > -1) { 
                showConfirm(`Já existe um registro para ${label.replace(/-/g, '/')}. Deseja sobrescrevê-lo?`, saveAction); 
            } else { 
                saveAction(); 
            } 
        });

        DOM.clearHistoryBtn.addEventListener('click', (e) => showConfirm('Tem certeza que deseja apagar todo o histórico?', () => { Utils.setStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []); renderAllHistory(); checkConsumptionAlert(); updateDashboardComparisons(); showNotification('Histórico apagado.', true); }, e.target));
        DOM.addPastBillBtn.addEventListener('click', (e) => { resetPastBillModal(); openModal(DOM.pastBillModal, e.target); });
        DOM.addFirstBillBtn.addEventListener('click', (e) => { resetPastBillModal(); openModal(DOM.pastBillModal, e.target); });
        DOM.cancelModalBtn.addEventListener('click', () => closeModal(DOM.pastBillModal));
        document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.addEventListener('click', (e) => closeModal(e.target.closest('.modal'))));
        DOM.savePastBillBtn.addEventListener('click', () => { const editingId = DOM.editingBillId.value; const month = DOM.pastBillMonthEl.value; const value = parseFloat(DOM.pastBillValueEl.value); const kwh = parseFloat(DOM.pastBillKwhEl.value); if (!month || isNaN(value) || value <= 0 || isNaN(kwh) || kwh <= 0) { DOM.modalError.textContent = 'Preencha todos os campos com valores válidos.'; return; } DOM.modalError.textContent = ''; let history = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []); if (editingId) { const index = history.findIndex(item => item.label === editingId); if (index > -1) { history[index].value = value; history[index].kwh = kwh; } showNotification('Fatura atualizada com sucesso!'); } else { const newItem = { label: month, value, kwh }; const existingIndex = history.findIndex(item => item.label === month); if (existingIndex > -1) { showConfirm(`Já existe uma fatura para ${month.replace(/-/g, '/')}. Deseja sobrescrevê-la?`, () => { history[existingIndex] = newItem; Utils.setStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, history); renderAllHistory(); checkConsumptionAlert(); closeModal(DOM.pastBillModal); showNotification('Fatura sobrescrita com sucesso!'); }); return; } history.push(newItem); showNotification('Fatura adicionada com sucesso!'); } Utils.setStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, history); renderAllHistory(); checkConsumptionAlert(); updateDashboardComparisons(); closeModal(DOM.pastBillModal); });
        DOM.historyTableContainer.addEventListener('click', (event) => { const target = event.target; const billId = target.dataset.id; if (!billId) return; if (target.classList.contains('edit-btn')) { const history = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []); const billToEdit = history.find(item => item.label === billId); if (billToEdit) { resetPastBillModal(); DOM.pastBillModalTitle.textContent = 'Editar Fatura'; DOM.editingBillId.value = billId; DOM.pastBillMonthEl.value = billToEdit.label; DOM.pastBillMonthEl.disabled = true; DOM.pastBillValueEl.value = billToEdit.value; DOM.pastBillKwhEl.value = billToEdit.kwh; openModal(DOM.pastBillModal, target); } } else if (target.classList.contains('delete-btn')) { showConfirm(`Tem certeza que deseja excluir a fatura de ${billId.replace('-', '/')}?`, () => { let history = Utils.getStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, []); const updatedHistory = history.filter(item => item.label !== billId); Utils.setStoredData(CONSTANTS.STORAGE_KEYS.HISTORY, updatedHistory); renderAllHistory(); checkConsumptionAlert(); updateDashboardComparisons(); showNotification('Fatura excluída com sucesso.', true); }); } });
        DOM.confirmCancelBtn.addEventListener('click', hideConfirm);
        DOM.confirmOkBtn.addEventListener('click', () => { if (state.confirmCallback) state.confirmCallback(); hideConfirm(); });
        DOM.bottomNav.addEventListener('click', (event) => { const navButton = event.target.closest('.nav-btn'); if (navButton) { navigateTo(navButton.dataset.view); } });
        DOM.infoModalCloseBtn.addEventListener('click', () => closeModal(DOM.infoModal));
        DOM.onboardingCloseBtn.addEventListener('click', () => { closeModal(DOM.onboardingModal); Utils.setStoredData(CONSTANTS.STORAGE_KEYS.ONBOARDED, true); });
        DOM.dashboardView.addEventListener('click', (event) => { const infoTrigger = event.target.closest('[data-info]'); if (infoTrigger) { showInfoModal(infoTrigger.dataset.info); } });
        DOM.exportDataBtn.addEventListener('click', handleExport);
        DOM.importDataBtn.addEventListener('click', () => DOM.importFileInput.click());
        DOM.importFileInput.addEventListener('change', handleImport);
    }

    function init() {
        setupEventListeners();
        loadInitialData();

        if (!Utils.getStoredData(CONSTANTS.STORAGE_KEYS.ONBOARDED)) {
            openModal(DOM.onboardingModal);
        }
    }
    document.addEventListener('DOMContentLoaded', init);
})();

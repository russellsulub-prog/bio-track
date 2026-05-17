// ---------- GESTIÓN LOCALSTORAGE ----------
let pacientes = [];
let editandoId = null;
let pacienteActualModal = null;
let charts = {};

function cargarPacientesStorage() {
    const stored = localStorage.getItem("pacientes_antropo");
    if(stored) pacientes = JSON.parse(stored);
    else pacientes = [];
}

function guardarPacientesStorage() {
    localStorage.setItem("pacientes_antropo", JSON.stringify(pacientes));
}

// Fórmulas de composición corporal
function calcularComposicion(datos) {
    const { sexo, edad, peso, estatura, cintura, triceps, suprailiaco, musloPliegue } = datos;
    const estaturaM = estatura / 100;
    const imc = peso / (estaturaM * estaturaM);
    let grasaPorcentaje = 0;
    const suma = (triceps || 0) + (suprailiaco || 0) + (musloPliegue || 0);
    if(sexo === 'hombre') {
        if(suma > 0) {
            let densidad = 1.10938 - (0.0008267 * suma) + (0.0000016 * suma*suma) - (0.0002574 * edad);
            grasaPorcentaje = (495 / densidad) - 450;
        } else grasaPorcentaje = 18;
    } else {
        if(suma > 0) {
            let densidad = 1.099421 - (0.0009929 * suma) + (0.0000023 * suma*suma) - (0.0001392 * edad);
            grasaPorcentaje = (495 / densidad) - 450;
        } else grasaPorcentaje = 25;
    }
    grasaPorcentaje = Math.min(Math.max(grasaPorcentaje, 5), 55);
    const grasaKg = (grasaPorcentaje / 100) * peso;
    const masaLibreGrasa = peso - grasaKg;
    const masaMuscularKg = masaLibreGrasa * 0.5;
    const porcentajeMusculo = (masaMuscularKg / peso) * 100;
    const aguaKg = masaLibreGrasa * 0.6;
    const porcentajeAgua = (aguaKg / peso) * 100;
    let grasaVisceral = 0;
    if(cintura && sexo === 'hombre') grasaVisceral = (cintura - 70) * 0.5;
    else if(cintura && sexo === 'mujer') grasaVisceral = (cintura - 65) * 0.45;
    grasaVisceral = Math.max(0, Math.min(grasaVisceral, 20));
    return { grasaPorcentaje, grasaKg, masaLibreGrasa, masaMuscularKg, porcentajeMusculo, aguaKg, porcentajeAgua, grasaVisceral, imc };
}

function renderizarResultados(datosPaciente) {
    const comp = calcularComposicion(datosPaciente);
    const statsDiv = document.getElementById('statsOutput');
    statsDiv.innerHTML = `
        <div class="stat-card">📊 IMC: ${comp.imc.toFixed(1)} kg/m²</div>
        <div class="stat-card">🧴 Grasa corporal: ${comp.grasaPorcentaje.toFixed(1)}% (${comp.grasaKg.toFixed(1)} kg)</div>
        <div class="stat-card">💪 Masa muscular: ${comp.porcentajeMusculo.toFixed(1)}% (${comp.masaMuscularKg.toFixed(1)} kg)</div>
        <div class="stat-card">💧 Agua corporal: ${comp.porcentajeAgua.toFixed(1)}% (${comp.aguaKg.toFixed(1)} kg)</div>
        <div class="stat-card">🏋️ Masa libre grasa: ${comp.masaLibreGrasa.toFixed(1)} kg</div>
    `;
    document.getElementById('grasaVisceralInfo').innerHTML = `⚠️ Grasa visceral estimada: nivel ${comp.grasaVisceral.toFixed(1)} (índice)`;
    if(charts.grasaChart) charts.grasaChart.data.datasets[0].data = [comp.grasaPorcentaje, 100 - comp.grasaPorcentaje];
    if(charts.musculoChart) charts.musculoChart.data.datasets[0].data = [comp.porcentajeMusculo, 100 - comp.porcentajeMusculo];
    if(charts.aguaChart) charts.aguaChart.data.datasets[0].data = [comp.porcentajeAgua, 100 - comp.porcentajeAgua];
    if(charts.grasaChart) charts.grasaChart.update();
    if(charts.musculoChart) charts.musculoChart.update();
    if(charts.aguaChart) charts.aguaChart.update();
    return comp;
}

function getFormData() {
    return {
        nombre: document.getElementById('nombre').value,
        sexo: document.getElementById('sexo').value,
        edad: parseFloat(document.getElementById('edad').value),
        peso: parseFloat(document.getElementById('peso').value),
        estatura: parseFloat(document.getElementById('estatura').value),
        pecho: parseFloat(document.getElementById('pecho').value) || 0,
        cintura: parseFloat(document.getElementById('cintura').value) || 0,
        abdomen: parseFloat(document.getElementById('abdomen').value) || 0,
        cadera: parseFloat(document.getElementById('cadera').value) || 0,
        brazo: parseFloat(document.getElementById('brazo').value) || 0,
        muslo: parseFloat(document.getElementById('muslo').value) || 0,
        pantorrilla: parseFloat(document.getElementById('pantorrilla').value) || 0,
        muneca: parseFloat(document.getElementById('muneca').value) || 0,
        triceps: parseFloat(document.getElementById('triceps').value) || 0,
        biceps: parseFloat(document.getElementById('biceps').value) || 0,
        subescapular: parseFloat(document.getElementById('subescapular').value) || 0,
        suprailiaco: parseFloat(document.getElementById('suprailiaco').value) || 0,
        abdominalPliegue: parseFloat(document.getElementById('abdominalPliegue').value) || 0,
        musloPliegue: parseFloat(document.getElementById('musloPliegue').value) || 0,
    };
}

function setFormData(p) {
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('sexo').value = p.sexo;
    document.getElementById('edad').value = p.edad;
    document.getElementById('peso').value = p.peso;
    document.getElementById('estatura').value = p.estatura;
    document.getElementById('pecho').value = p.pecho;
    document.getElementById('cintura').value = p.cintura;
    document.getElementById('abdomen').value = p.abdomen;
    document.getElementById('cadera').value = p.cadera;
    document.getElementById('brazo').value = p.brazo;
    document.getElementById('muslo').value = p.muslo;
    document.getElementById('pantorrilla').value = p.pantorrilla;
    document.getElementById('muneca').value = p.muneca;
    document.getElementById('triceps').value = p.triceps;
    document.getElementById('biceps').value = p.biceps;
    document.getElementById('subescapular').value = p.subescapular;
    document.getElementById('suprailiaco').value = p.suprailiaco;
    document.getElementById('abdominalPliegue').value = p.abdominalPliegue;
    document.getElementById('musloPliegue').value = p.musloPliegue;
}

function limpiarForm() {
    document.getElementById('pacienteForm').reset();
    editandoId = null;
    document.getElementById('btnGuardar').style.display = 'inline-block';
    document.getElementById('btnActualizar').style.display = 'none';
    document.getElementById('btnCancelarEdit').style.display = 'none';
}

function guardarPaciente() {
    const data = getFormData();
    if(!data.nombre || !data.edad || !data.peso || !data.estatura) {
        alert("Complete nombre, edad, peso, estatura");
        return false;
    }
    if(editandoId !== null) {
        const index = pacientes.findIndex(p => p.id === editandoId);
        if(index !== -1) {
            pacientes[index] = { ...data, id: editandoId, fecha: new Date().toISOString() };
            guardarPacientesStorage();
            alert("Paciente actualizado");
            limpiarForm();
            renderizarListaHistorial();
            if(pacienteActualModal && pacienteActualModal.id === editandoId) {
                mostrarModalReporte(pacientes[index]);
            }
        }
    } else {
        const nuevoId = Date.now();
        pacientes.push({ ...data, id: nuevoId, fecha: new Date().toISOString() });
        guardarPacientesStorage();
        alert("Paciente guardado");
        limpiarForm();
        renderizarListaHistorial();
    }
    renderizarResultados(data);
    return true;
}

function cargarPacienteParaEditar(paciente) {
    setFormData(paciente);
    editandoId = paciente.id;
    document.getElementById('btnGuardar').style.display = 'none';
    document.getElementById('btnActualizar').style.display = 'inline-block';
    document.getElementById('btnCancelarEdit').style.display = 'inline-block';
    renderizarResultados(paciente);
    document.querySelector('.tab-btn[data-tab="tab-captura"]').click();
    cerrarModal();
}

function eliminarPaciente(id) {
    if(confirm("¿Eliminar paciente?")) {
        pacientes = pacientes.filter(p => p.id !== id);
        guardarPacientesStorage();
        renderizarListaHistorial();
        if(editandoId === id) limpiarForm();
        if(pacienteActualModal && pacienteActualModal.id === id) cerrarModal();
    }
}

// Generar reporte HTML
async function generarReporteHTML(paciente) {
    const comp = calcularComposicion(paciente);
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);
    
    const canvasGrasa = document.createElement('canvas');
    canvasGrasa.width = 150; canvasGrasa.height = 150;
    const canvasMusculo = document.createElement('canvas');
    canvasMusculo.width = 150; canvasMusculo.height = 150;
    const canvasAgua = document.createElement('canvas');
    canvasAgua.width = 150; canvasAgua.height = 150;
    tempDiv.appendChild(canvasGrasa);
    tempDiv.appendChild(canvasMusculo);
    tempDiv.appendChild(canvasAgua);
    
    new Chart(canvasGrasa, { type: 'doughnut', data: { labels: ['Grasa', 'Libre Grasa'], datasets: [{ data: [comp.grasaPorcentaje, 100-comp.grasaPorcentaje], backgroundColor: ['#e53e3e','#48bb78'], borderWidth: 0 }] } });
    new Chart(canvasMusculo, { type: 'doughnut', data: { labels: ['Músculo', 'Otros'], datasets: [{ data: [comp.porcentajeMusculo, 100-comp.porcentajeMusculo], backgroundColor: ['#ed8936','#a0aec0'], borderWidth: 0 }] } });
    new Chart(canvasAgua, { type: 'doughnut', data: { labels: ['Agua', 'Sólidos'], datasets: [{ data: [comp.porcentajeAgua, 100-comp.porcentajeAgua], backgroundColor: ['#3182ce','#cbd5e0'], borderWidth: 0 }] } });
    
    await new Promise(r => setTimeout(r, 150));
    const imgGrasa = canvasGrasa.toDataURL();
    const imgMusculo = canvasMusculo.toDataURL();
    const imgAgua = canvasAgua.toDataURL();
    tempDiv.remove();
    
    return `
        <div class="printable-report">
            <div class="report-header-custom">
                <div class="report-header-left">
                    <img src="https://cdn-icons-png.flaticon.com/512/3125/3125713.png" alt="Logo Bio-Track">
                    <h2>Bio-Track Evolution</h2>
                </div>
                <div class="report-header-right">
                    <img src="https://cdn-icons-png.flaticon.com/512/2997/2997580.png" alt="Icono salud">
                    <img src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png" alt="Icono cuerpo">
                </div>
            </div>
            <div class="report-subheader">
                INFORME ANTROPOMÉTRICO CLÍNICO | Fecha: ${new Date().toLocaleString()} | ID: ${paciente.id}
            </div>
            
            <div class="three-columns">
                <div class="col">
                    <h3>🩺 DATOS GENERALES</h3>
                    <div class="datos-paciente">
                        <p><strong>Nombre:</strong> ${paciente.nombre}</p>
                        <p><strong>Sexo:</strong> ${paciente.sexo === 'hombre' ? 'Hombre' : 'Mujer'}</p>
                        <p><strong>Edad:</strong> ${paciente.edad} años</p>
                        <p><strong>Peso:</strong> ${paciente.peso} kg</p>
                        <p><strong>Estatura:</strong> ${paciente.estatura} cm</p>
                        <p><strong>IMC:</strong> ${comp.imc.toFixed(1)} kg/m²</p>
                    </div>
                </div>
                <div class="col">
                    <h3>📐 CIRCUNFERENCIAS (cm)</h3>
                    <div class="medida-item"><strong>Pecho:</strong> ${paciente.pecho} cm</div>
                    <div class="medida-item"><strong>Cintura:</strong> ${paciente.cintura} cm</div>
                    <div class="medida-item"><strong>Abdomen:</strong> ${paciente.abdomen} cm</div>
                    <div class="medida-item"><strong>Cadera:</strong> ${paciente.cadera} cm</div>
                    <div class="medida-item"><strong>Brazo:</strong> ${paciente.brazo} cm</div>
                    <div class="medida-item"><strong>Muslo:</strong> ${paciente.muslo} cm</div>
                    <div class="medida-item"><strong>Pantorrilla:</strong> ${paciente.pantorrilla} cm</div>
                    <div class="medida-item"><strong>Muñeca:</strong> ${paciente.muneca} cm</div>
                </div>
                <div class="col">
                    <h3>📏 PLIEGUES CUTÁNEOS (mm)</h3>
                    <div class="medida-item"><strong>Tríceps:</strong> ${paciente.triceps} mm</div>
                    <div class="medida-item"><strong>Bíceps:</strong> ${paciente.biceps} mm</div>
                    <div class="medida-item"><strong>Subescapular:</strong> ${paciente.subescapular} mm</div>
                    <div class="medida-item"><strong>Suprailíaco:</strong> ${paciente.suprailiaco} mm</div>
                    <div class="medida-item"><strong>Abdominal:</strong> ${paciente.abdominalPliegue} mm</div>
                    <div class="medida-item"><strong>Muslo:</strong> ${paciente.musloPliegue} mm</div>
                </div>
            </div>
            
            <div class="composicion-section">
                <h3>⚙️ COMPOSICIÓN CORPORAL</h3>
                <div class="composicion-grid">
                    <div class="composicion-datos">
                        <p>🧴 Grasa corporal: ${comp.grasaPorcentaje.toFixed(1)}% (${comp.grasaKg.toFixed(1)} kg)</p>
                        <p>💪 Masa muscular: ${comp.porcentajeMusculo.toFixed(1)}% (${comp.masaMuscularKg.toFixed(1)} kg)</p>
                        <p>💧 Agua corporal: ${comp.porcentajeAgua.toFixed(1)}% (${comp.aguaKg.toFixed(1)} kg)</p>
                        <p>🏋️ Masa libre de grasa: ${comp.masaLibreGrasa.toFixed(1)} kg</p>
                        <p>⚠️ Grasa visceral estimada: nivel ${comp.grasaVisceral.toFixed(1)}</p>
                    </div>
                    <div class="charts-report">
                        <div class="chart-mini"><img src="${imgGrasa}" width="100" height="100"><p>% Grasa</p></div>
                        <div class="chart-mini"><img src="${imgMusculo}" width="100" height="100"><p>% Músculo</p></div>
                        <div class="chart-mini"><img src="${imgAgua}" width="100" height="100"><p>% Agua</p></div>
                    </div>
                </div>
            </div>
            <footer>
                Reporte generado por Bio-Track Evolution - Datos capturados en consulta. Este documento es válido como registro.
            </footer>
        </div>
    `;
}

async function mostrarModalReporte(paciente) {
    pacienteActualModal = paciente;
    const html = await generarReporteHTML(paciente);
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalReporte').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modalReporte').classList.remove('active');
    pacienteActualModal = null;
}

function imprimirReporteModal() {
    const contenido = document.getElementById('modalContent').innerHTML;
    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html>
        <head>
            <title>Bio-Track Evolution - Reporte ${pacienteActualModal?.nombre || ''}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 1.2cm; background: white; }
                .printable-report { max-width: 100%; margin: auto; }
                .report-header-custom {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 15px;
                    border-bottom: 2px solid #2b6cb0;
                    padding-bottom: 15px;
                }
                .report-header-left {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .report-header-left img {
                    width: 55px;
                    height: 55px;
                    object-fit: contain;
                }
                .report-header-left h2 {
                    font-size: 1.5rem;
                    margin: 0;
                    color: #1e3c72;
                }
                .report-header-right {
                    display: flex;
                    gap: 12px;
                }
                .report-header-right img {
                    width: 45px;
                    height: 45px;
                    object-fit: contain;
                    border-radius: 10px;
                    background: #f0f4f8;
                    padding: 6px;
                }
                .report-subheader {
                    text-align: center;
                    margin-bottom: 20px;
                    color: #4a5568;
                    font-size: 12px;
                }
                .three-columns {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                }
                .col {
                    flex: 1;
                    min-width: 200px;
                    background: #f9f9ff;
                    padding: 12px;
                    border-radius: 12px;
                }
                .col h3 {
                    background: #2c5282;
                    color: white;
                    padding: 8px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    text-align: center;
                    margin-bottom: 12px;
                }
                .medida-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                    border-bottom: 1px solid #ddd;
                    font-size: 11px;
                }
                .datos-paciente p {
                    margin: 5px 0;
                    font-size: 12px;
                }
                .composicion-section {
                    margin-top: 20px;
                    background: #f0f4f8;
                    padding: 15px;
                    border-radius: 16px;
                }
                .composicion-section h3 {
                    background: #1e3c72;
                    color: white;
                    padding: 8px;
                    border-radius: 20px;
                    text-align: center;
                    margin-bottom: 15px;
                }
                .composicion-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    justify-content: space-between;
                }
                .composicion-datos {
                    flex: 1;
                }
                .composicion-datos p {
                    background: white;
                    padding: 6px 10px;
                    border-radius: 12px;
                    margin: 6px 0;
                    font-size: 12px;
                }
                .charts-report {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                .chart-mini {
                    text-align: center;
                    background: white;
                    border-radius: 12px;
                    padding: 8px;
                    width: 130px;
                }
                .chart-mini img {
                    width: 90px;
                    height: 90px;
                }
                footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 9px;
                    color: gray;
                    border-top: 1px solid #ccc;
                    padding-top: 8px;
                }
                @media print {
                    body { padding: 0.8cm; }
                }
            </style>
        </head>
        <body>${contenido}</body>
        </html>
    `);
    ventana.document.close();
    ventana.print();
}

function editarDesdeModal() {
    if(pacienteActualModal) {
        cargarPacienteParaEditar(pacienteActualModal);
    }
}

function renderizarListaHistorial() {
    const contenedor = document.getElementById('listaPacientes');
    if(!pacientes.length) { contenedor.innerHTML = "<p>No hay pacientes registrados.</p>"; return; }
    contenedor.innerHTML = pacientes.map(p => `
        <div class="patient-item">
            <div><strong>${p.nombre}</strong> | ${p.sexo === 'hombre'?'Hombre':'Mujer'} | ${p.edad} años | Peso:${p.peso}kg</div>
            <div class="patient-actions">
                <button class="btn-secondary" onclick='window.abrirReporteModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>📄 Ver/Reporte</button>
                <button onclick='window.cargarPacienteParaEditar(${JSON.stringify(p).replace(/'/g, "&#39;")})'>✏️ Editar</button>
                <button class="btn-warning" onclick='window.eliminarPaciente(${p.id})'>🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

function initCharts() {
    charts.grasaChart = new Chart(document.getElementById('grasaChart'), { type: 'doughnut', data: { labels: ['Grasa', 'Libre Grasa'], datasets: [{ data: [25,75], backgroundColor: ['#e53e3e','#48bb78'], borderWidth: 0 }] } });
    charts.musculoChart = new Chart(document.getElementById('musculoChart'), { type: 'doughnut', data: { labels: ['Músculo', 'Otros'], datasets: [{ data: [30,70], backgroundColor: ['#ed8936','#a0aec0'], borderWidth: 0 }] } });
    charts.aguaChart = new Chart(document.getElementById('aguaChart'), { type: 'doughnut', data: { labels: ['Agua', 'Sólidos'], datasets: [{ data: [55,45], backgroundColor: ['#3182ce','#cbd5e0'], borderWidth: 0 }] } });
}

// Exponer funciones globales
window.abrirReporteModal = mostrarModalReporte;
window.cargarPacienteParaEditar = cargarPacienteParaEditar;
window.eliminarPaciente = eliminarPaciente;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarPacientesStorage();
    initCharts();
    
    // Event listeners
    document.getElementById('pacienteForm').addEventListener('submit', (e) => { e.preventDefault(); guardarPaciente(); });
    document.getElementById('btnActualizar').addEventListener('click', () => guardarPaciente());
    document.getElementById('btnCancelarEdit').addEventListener('click', () => limpiarForm());
    document.getElementById('refreshHistorial').addEventListener('click', () => renderizarListaHistorial());
    document.getElementById('btnCerrarModal').addEventListener('click', () => cerrarModal());
    document.getElementById('btnImprimirReporte').addEventListener('click', () => imprimirReporteModal());
    document.getElementById('btnEditarPacienteModal').addEventListener('click', () => editarDesdeModal());
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(btn.getAttribute('data-tab')).classList.add('active');
            if(btn.getAttribute('data-tab') === 'tab-historial') renderizarListaHistorial();
        });
    });
    
    // Paciente demo
    if(pacientes.length === 0) {
        const demo = { nombre: "Ana López", sexo: "mujer", edad: 32, peso: 62, estatura: 164, pecho: 88, cintura: 72, abdomen: 78, cadera: 94, brazo: 28, muslo: 52, pantorrilla: 35, muneca: 16, triceps: 18, biceps: 12, subescapular: 16, suprailiaco: 19, abdominalPliegue: 22, musloPliegue: 24, id: 1001, fecha: new Date().toISOString() };
        pacientes.push(demo);
        guardarPacientesStorage();
    }
    renderizarListaHistorial();
});
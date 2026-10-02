# BALANCE - App de Economía Personal

## 📖 Descripción General
**BALANCE** es una Aplicación Web Progresiva (PWA) construida para gestionar las finanzas personales. Destaca por su arquitectura **"serverless" y sin base de datos tradicional**: toda la información (ingresos, gastos y presupuestos) se almacena en crudo en archivos `.csv` alojados directamente en este repositorio de GitHub. 

La app se conecta mediante la API de GitHub para leer y escribir estos archivos en tiempo real, permitiendo tener una app de finanzas sincronizada en la nube de forma totalmente gratuita.

## 🛠️ Tecnologías y Arquitectura
- **Frontend**: HTML5, CSS3, y JavaScript (Vanilla, sin frameworks pesados).
- **Visualización de Datos**: [Chart.js](https://www.chartjs.org/) para los gráficos tipo "doughnut" con estética neón.
- **Iconografía**: [Lucide Icons](https://lucide.dev/).
- **Almacenamiento**: Archivos `.csv` consumidos y actualizados a través de la **API REST de GitHub** (`https://api.github.com/repos/miguelefvlc/econom-a/contents/`).
- **Capacidad PWA**: Cuenta con `manifest.json` y Service Worker (`sw.js`) para ser instalable en dispositivos móviles con experiencia de app nativa.

## 📂 Estructura del Proyecto

* **`/` (Raíz)**:
  * `index.html`: Única vista de la aplicación (Single Page).
  * `manifest.json`, `sw.js`, `icon.svg`: Archivos de configuración para la PWA.
  * `subir_github.bat` y `bajar_github.bat`: Scripts locales para forzar sincronizaciones manuales con git.
* **`/js`**: 
  * `app.js`: El "cerebro" de la aplicación. Maneja el slider, autenticación de GitHub, lectura/escritura de CSV, filtrado de datos y renderizado del dashboard y presupuestos.
* **`/css`**: 
  * `style.css`: Estilos visuales. Diseño dark-mode con detalles de color muy vibrantes.
* **`/data`**: Base de datos de la app.
  * `transacciones_{AÑO}.csv`: Histórico de los movimientos (columnas: Fecha, Concepto, Cantidad, Tipo).
  * `topes.csv`: Configuración de los presupuestos (categoría y límite mensual).
* **`/.github/workflows`**:
  * `gastos_fijos.yml`: Acción de GitHub (GitHub Actions) configurada para insertar automáticamente gastos recurrentes en el archivo de datos sin necesidad de abrir la app.

## 🚀 Funcionalidades Principales (Slides)

La app está dividida en un carrusel de tres pantallas (slides):

### 1. Nuevo Movimiento
- Formulario de entrada rápida. Permite seleccionar una categoría (agrupadas en subcategorías como Hogar, Transporte, Ocio, Compras...) y marcar la transacción como **Ingreso** o **Gasto**.
- Configuración de Token (botón de usuario): Guarda el **GitHub Personal Access Token (PAT)** en el `localStorage` del navegador, necesario para realizar commits automáticos vía API.

### 2. Balance (Dashboard)
- Resumen financiero que puede filtrarse por **Mes**, **Año** o **Histórico**.
- Muestra el saldo neto calculado (Ingresos - Gastos).
- Gráfico circular reactivo (Chart.js) que desglosa el gasto por categorías con colores neón.
- Lista cronológica del historial de movimientos.

### 3. Presupuestos
- Compara los gastos del mes en curso con los topes establecidos en `data/topes.csv`.
- Calcula automáticamente el **Acumulado Anual**. Es decir, si el presupuesto mensual es de 50€ y el mes actual se gastaron 30€, suma el saldo a favor para ver cómo evoluciona la macroeconomía anual por categoría.

## 🔒 Funcionamiento de Guardado
1. Al pulsar "Ingreso/Gasto", la app consulta el token guardado localmente.
2. Descarga el CSV del año actual llamando a la API de GitHub (usando `?t=timestamp` para burlar la caché).
3. Añade la nueva transacción y codifica todo el archivo en Base64.
4. Envía una petición `PUT` a la API de GitHub para hacer un commit directo sobre el archivo, guardando la información en la nube.

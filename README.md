# Ruleta de Premios Local

Aplicacion local (sin internet) que sirve una ruleta tipo tragamonedas. Los premios se leen y escriben desde archivos CSV: no hay base de datos ni dependencias externas.

## Requisitos
- Node.js 18 o superior
- npm (incluido con Node)

## Instalacion y uso
1) Instala dependencias:
```bash
npm install
```
2) Inicia el servidor:
```bash
npm start
```
La app queda en http://localhost:3000 y sirve el frontend desde `public/`.

## Datos en CSV
- `data/premios.csv`: fuente de verdad de premios disponibles. Columnas con encabezados obligatorios: `id,nombre,descripcion,valor`.
- `data/premios_ganados.csv`: historial de premios ya entregados. Columnas: `id,nombre,descripcion,valor,fechaHora`.
- La disponibilidad se calcula como `premios.csv` menos los IDs presentes en `premios_ganados.csv`.

### Editar `data/premios.csv`
- Mantener los encabezados; IDs deben ser unicos.
- Puedes editar con Excel/Numbers o un editor de texto. Guarda siempre en CSV (UTF-8).
- Ejemplo de fila: `P016,Termo personalizado,Acero con tapa hermetica,280`

### Borrar o respaldar `data/premios_ganados.csv`
- Haz respaldo antes de limpiar el historial.
- Windows (PowerShell):
```powershell
Copy-Item data/premios_ganados.csv data/premios_ganados_backup.csv
"id,nombre,descripcion,valor,fechaHora" | Set-Content -NoNewline data/premios_ganados.csv
```
- macOS/Linux (Terminal):
```bash
cp data/premios_ganados.csv data/premios_ganados_backup.csv
echo "id,nombre,descripcion,valor,fechaHora" > data/premios_ganados.csv
```

## Funcionalidad
- Boton **Girar ruleta**: el backend elige un premio disponible y lo marca como usado en `premios_ganados.csv`. No se repiten IDs.
- Historial: tabla en pantalla leyendo `premios_ganados.csv`.
- Imprimir: boton **Imprimir** abre `public/print.html` con el reporte listo para `window.print()`.
- Cuando se acaban los premios, el boton de giro se deshabilita y se muestra un aviso.

## Endpoints
- `GET /api/premios`: premios disponibles.
- `POST /api/girar`: selecciona un premio aleatorio disponible, lo registra en `premios_ganados.csv` y lo devuelve.
- `GET /api/ganados`: historial de premios ganados.
- `GET /print`: reporte imprimible.

## Notas tecnicas
- Concurrencia: `POST /api/girar` esta protegido con un lock en memoria para evitar dobles escrituras si se presiona rapido.
- Fuentes de datos: solo CSV en `data/`; no hay BD ni llamadas externas.
- Scripts disponibles:
  - `npm start`: inicia el servidor en `3000` (usa `PORT` para cambiarlo).

## Docker y Docker Compose
- Construir la imagen manualmente:
  ```bash
  docker build -t tombola-hacs .
  ```
- Ejecutar montando la carpeta `data` para persistir los CSV:
  - Windows (PowerShell):
    ```powershell
    docker run --rm --name tombola-hacs -p 3000:3000 -v "${PWD}/data:/app/data" tombola-hacs
    ```
  - macOS/Linux:
    ```bash
    docker run --rm --name tombola-hacs -p 3000:3000 -v "$(pwd)/data:/app/data" tombola-hacs
    ```
- Docker Compose (autoarranque):
  ```bash
  docker compose up -d
  ```
  - Detener: `docker compose down`
  - Logs: `docker compose logs -f`
  - Rebuild al cambiar codigo: `docker compose build --no-cache` y luego `docker compose up -d`
  - El servicio usa `restart: always`, asi que tras reiniciar Windows se levantara solo, siempre que Docker Desktop/Engine arranque al inicio. Ajusta el puerto editando `ports` en `docker-compose.yml` o exportando `PORT`.
- La app queda en `http://localhost:3000`. Si cambias el puerto, usa `-p <host_port>:3000` o modifica `PORT` dentro del contenedor.

# Seliniyarn

Seliniyarn es un proyecto full stack para una tienda de peluches y accesorios artesanales. Combina una tienda online para clientes con herramientas administrativas para mantener el catálogo y el inventario, organizar eventos presenciales y consultar sus resultados.

El proyecto está planteado como una aplicación de aprendizaje y proyecto final: separa la interfaz, la API y la persistencia, y permite seguir el recorrido de los datos desde un formulario de React hasta los controladores de Express y los modelos de MongoDB.

## Esquema visual y alcance

El esquema de referencia de las páginas y los flujos administrativos está en [`plan.excalidraw`](./plan.excalidraw). Muestra dos áreas principales:

- **Tienda:** inicio, catálogo y categorías, ficha de cada producto, cuenta de usuario, carrito, contacto e información de la marca.
- **Administración:** calendario de eventos, inventario, informe de ventas y gastos de cada evento e histórico de ventas.

El esquema representa la intención funcional del producto. Algunas funciones todavía son una maqueta o están pendientes de conectar a una lógica real; se indican en la sección [Estado y límites actuales](#estado-y-límites-actuales).

## Tecnologías

### Frontend

- React y React DOM.
- Vite como servidor de desarrollo y herramienta de compilación.
- React Router para navegación del lado del cliente y protección de páginas administrativas.
- Axios para las peticiones HTTP.
- CSS propio para el diseño adaptable y los temas pastel claro y oscuro.

### Backend

- Node.js y Express para la API REST.
- MongoDB y Mongoose para los datos persistentes.
- JSON Web Token (JWT) para autenticar solicitudes.
- bcrypt para guardar contraseñas cifradas.
- Multer y Cloudinary para la carga de imágenes.
- CORS para permitir solicitudes desde el frontend local.

## Estructura del proyecto

```text
Seliniyarn/
├── plan.excalidraw                 # Esquema visual del producto y sus páginas
├── README.md
├── Backend/
│   ├── index.js                    # Configuración e inicio de Express
│   ├── package.json
│   ├── .env.example                # Plantilla de variables del backend
│   └── src/
│       ├── api/
│       │   ├── controllers/        # Lógica de usuarios, productos y eventos
│       │   ├── models/             # Esquemas de Mongoose
│       │   └── routes/             # Endpoints de la API
│       ├── config/                 # Conexiones a MongoDB y Cloudinary
│       ├── data/                   # CSV del catálogo usado por el sembrado
│       ├── middleware/             # Autenticación, roles y carga de imágenes
│       └── utils/                  # JWT, eliminación de imágenes y seed
└── Frontend/
    ├── package.json
    ├── .env.example                # Plantilla de la URL de la API
    ├── vite.config.js
    └── src/
        ├── App.jsx                 # Diseño global, sesión, tema y estado del carrito
        ├── App.css                 # Componentes y estilos de páginas
        ├── index.css               # Estilos base y variables de tema
        ├── main.jsx                # Router y relación entre rutas y páginas
        ├── components/             # Tarjetas, carruseles, búsqueda y acceso admin
        ├── pages/                  # Páginas de la tienda
        │   └── admin/              # Calendario, inventario e informes
        ├── services/               # Cliente Axios compartido con JWT
        └── assets/                 # Recursos estáticos, como el logo
```

## Funcionamiento general

1. El navegador carga la aplicación React desde Vite.
2. `Frontend/src/main.jsx` configura `BrowserRouter` y define las URL disponibles.
3. `App.jsx` es el marco común: mantiene la cabecera, navegación, pie, sesión, carrito y tema. Las páginas se muestran dentro de un `<Outlet>`.
4. Las páginas realizan solicitudes HTTP al backend con Axios.
5. Express monta las rutas bajo `/api/v1`. Los controladores validan la solicitud y usan los modelos de Mongoose para consultar o actualizar MongoDB.
6. Las rutas administrativas comprueban el token y el rol en el backend antes de ejecutar operaciones protegidas.

El frontend usa `VITE_API_URL` como dirección base de la API y, si no se define, usa `http://localhost:3000/api/v1`. El backend acepta los orígenes enumerados en `FRONTEND_URL`, separados por comas; localmente el valor por defecto es `http://localhost:5173`.

## Tienda

### Inicio y catálogo

- La página principal obtiene el catálogo del backend y elige aleatoriamente hasta 20 productos para cada carrusel: peluches (Pequeño, Normal, Mediano y Grande), llaveros y minis.
- La página general carga el catálogo y permite buscar por nombre.
- La página de categoría recibe la categoría como parámetro de consulta, por ejemplo `?category=Pequeño`, y solicita esa categoría a la API.
- `PlushieCard` es reutilizable y enlaza cada tarjeta con la ficha `/Plushie/:id`.
- La ficha de producto consulta el producto por identificador y muestra sus características y disponibilidad.

### Cuentas y sesión

- El registro envía nombre, correo y contraseña. El backend asigna el rol `user` y el modelo cifra la contraseña con bcrypt antes de guardarla.
- El registro no inicia sesión automáticamente: después de crear la cuenta, redirige al formulario de acceso.
- El inicio de sesión devuelve un JWT y los datos del usuario sin contraseña. La aplicación guarda el token y usuario en `localStorage`.
- El token tiene una duración de 30 días. Las peticiones protegidas lo envían en la cabecera `Authorization: Bearer <token>`.
- El menú de usuario permite cerrar la sesión o solicitar el borrado de la cuenta.
- El enlace de administración solo se muestra a una sesión cuyo usuario guardado tiene `rol: "admin"`.

La comprobación de rol en React sirve para controlar la navegación y la interfaz. La autorización efectiva la realiza el backend con `isAdminAuth`, que vuelve a obtener el usuario a partir del token.

### Carrito, contacto y temas

- El carrito se mantiene en `localStorage`, se puede editar y limita las cantidades al stock que conoce el cliente.
- El botón de pago abre un aviso indicando que el pago está en desarrollo; no se procesa una tarjeta ni se crea un pedido.
- El formulario de contacto es demostrativo: valida el correo, limpia los campos y muestra confirmación, pero no envía ni almacena el mensaje.
- El tema claro/oscuro se guarda en `localStorage` y se aplica mediante `data-theme` en el elemento raíz del documento.

## Administración

Todas las rutas del panel se agrupan bajo `AdminRoute` en el frontend. Si no hay sesión, se redirige a Login; si el usuario no tiene rol de administrador, se le devuelve a la página principal. El backend mantiene una protección independiente para los endpoints sensibles.

### Calendario y eventos

La página `InventoryManagement` presenta un calendario mensual, permite navegar entre meses, crear eventos con nombre y fechas, iniciar eventos planificados y abrir sus informes. También enlaza al inventario y al histórico.

Los eventos usan estos estados:

- `scheduled`: planificado; todavía se puede eliminar.
- `open`: activo; se pueden registrar ventas y gastos.
- `closing`: el backend está aplicando el cierre.
- `closed`: finalizado; el informe queda como histórico y ya no se modifica.

Solo puede haber un evento abierto a la vez. El backend lo controla con un índice único parcial sobre `activeLock`, además de comprobarlo antes de iniciar un evento.

Al iniciar un evento, el backend guarda una instantánea del stock y de los datos de producto (incluido el precio en ese momento). Esa instantánea fija el máximo que se puede registrar como vendido en el evento y conserva la información para el informe aunque cambie el catálogo posteriormente.

El informe permite:

- Consultar las ventas de todos los días o filtrar por un día concreto.
- Registrar ventas por producto y día.
- Corregir las cantidades de un día mientras el evento está abierto.
- Añadir un ajuste de ventas para “Todos los días”, que requiere un motivo.
- Registrar gastos asociados a un día o a un ajuste global.
- Consultar unidades, ingresos, gastos y beneficio neto.
- Cerrar el evento; el backend descuenta del inventario las unidades vendidas y bloquea ediciones posteriores.

Los importes de ventas y gastos se almacenan como céntimos enteros para evitar errores de precisión decimal. La interfaz los muestra en euros.

### Inventario

La página `Inventory` permite consultar el stock agrupado por categoría, buscar productos por nombre, color, colección o categoría, editar los datos de un producto, añadirlo y eliminarlo.

El resumen superior calcula el valor de venta estimado del inventario actual:

```text
valor por categoría = suma(precio del producto × unidades disponibles)
valor total          = suma de los valores por categoría
```

Este importe no es una valoración del coste de fabricación ni dinero ingresado: es el valor potencial de venta de las unidades actualmente disponibles.

### Histórico de ventas

La página `SalesHistoric` resume los eventos cerrados y permite abrir cada informe. Actualmente muestra datos de eventos; no puede presentar ventas online porque aún no existe un modelo ni un flujo real de pedidos online.

## Modelos de datos principales

### Usuario (`user`)

Incluye nombre, correo, contraseña cifrada, rol e imagen de perfil. El esquema añade fechas de creación y actualización.

### Peluche (`plushie`)

Incluye nombre, categoría, colección (`collection1`), imagen, precio, medidas, peso, disponibilidad y color. El campo del modelo para peso es `Weight`. El catálogo de ejemplo está en `Backend/src/data/BBDD_Seliniyarn.csv`.

### Evento (`event`)

Incluye:

- Nombre y fechas de inicio/fin.
- Estado y bloqueo de evento activo.
- Instantánea de los productos disponibles al iniciar.
- Ventas agrupadas por día, con referencia al producto, datos históricos, precio y cantidad.
- Nota para ajustes de ventas globales.
- Gastos con concepto, fecha o ámbito global e importe en céntimos.
- Fechas de inicio y cierre.

## API disponible

El backend se inicia en `http://localhost:3000`. Las rutas de eventos requieren JWT de administrador.

### Usuarios: `/api/v1/users`

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `POST` | `/register` | Público | Registrar usuario |
| `POST` | `/login` | Público | Iniciar sesión y obtener JWT |
| `POST` | `/rolChange` | Administrador | Cambiar el rol de una cuenta |
| `GET` | `/getUsers` | Administrador | Listar usuarios sin contraseñas |
| `PUT` | `/updateUser/:id` | Propietario o administrador | Actualizar un perfil |
| `DELETE` | `/deleteUser/:id` | Propietario o administrador | Borrar cuenta |

### Productos: `/api/v1/music`

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| `GET` | `/getPlushie` | Público | Listar catálogo |
| `GET` | `/getPlushiesByCategory?category=...` | Público | Filtrar por categoría |
| `GET` | `/getAPlushieByName?name=...` | Público | Buscar por nombre |
| `GET` | `/:id` | Público | Obtener detalle por ID |
| `POST` | `/addPlushie` | Administrador | Crear producto |
| `PUT` | `/updatePlushie/:id` | Administrador | Actualizar producto |
| `DELETE` | `/deletePlushie/:id` | Administrador | Eliminar producto |

### Eventos: `/api/v1/events`

Todas estas rutas requieren `Authorization: Bearer <token>` con rol `admin`.

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/` | Listar eventos |
| `GET` | `/:id` | Consultar un evento |
| `POST` | `/` | Crear evento planificado |
| `DELETE` | `/:id` | Eliminar evento planificado |
| `POST` | `/:id/open` | Iniciar evento y capturar inventario |
| `POST` | `/:id/sales` | Añadir venta |
| `PUT` | `/:id/sales` | Reemplazar ventas de un día o ajuste global |
| `POST` | `/:id/expenses` | Añadir gasto |
| `DELETE` | `/:id/expenses/:expenseId` | Eliminar gasto mientras está abierto |
| `POST` | `/:id/close` | Cerrar el evento y descontar ventas del inventario |

Ejemplo de creación de un evento:

```json
{
  "name": "Feria artesanal",
  "startDate": "2026-11-14",
  "endDate": "2026-11-15"
}
```

Ejemplo de venta:

```json
{
  "day": "2026-11-14",
  "items": [
    {
      "plushieId": "ID_DE_MONGODB",
      "quantity": 2
    }
  ]
}
```

Para un ajuste con `day: "all"`, se debe enviar también `note` con el motivo. Los gastos reciben `amountCents` como entero; por ejemplo, 12,50 € se representa como `1250`.

## Instalación y ejecución local

Se necesitan Node.js, npm y una base MongoDB accesible. Las dependencias se instalan de forma independiente en cada aplicación:

```powershell
cd Backend
npm install

cd ..\Frontend
npm install
```

### Variables de entorno

Copia `Backend/.env.example` a `Backend/.env` y sustituye los valores locales. No compartas ni subas sus valores:

```dotenv
DB_URL=<URL_DE_CONEXION_MONGODB>
JWT_SECRET=<SECRETO_LARGO_Y_ALEATORIO>
CLOUDINARY_cloud_name=<NOMBRE_DE_CLOUDINARY>
CLOUDINARY_api_key=<API_KEY_DE_CLOUDINARY>
CLOUDINARY_api_secret=<API_SECRET_DE_CLOUDINARY>
```

El backend permite localmente el origen `http://localhost:5173` y escucha en el puerto `3000`. Render define `PORT` automáticamente y en producción los orígenes permitidos se configuran mediante `FRONTEND_URL`.

### Arrancar el backend

```powershell
cd Backend
npm start
```

El servidor espera a que MongoDB conecte y crea/asegura el índice de bloqueo de eventos antes de escuchar en el puerto 3000.

### Arrancar el frontend

En otra terminal:

```powershell
cd Frontend
npm run dev
```

Abre la URL que muestra Vite, normalmente `http://localhost:5173`.

El cliente HTTP común se encuentra en `Frontend/src/services/api.js`. Todas las llamadas —incluidas las de login, catálogo y administración— usan la URL base definida por `VITE_API_URL`. El interceptor añade el token JWT si hay una sesión iniciada.

## Despliegue en Render

El proyecto está preparado para desplegar el backend como **Web Service** y el frontend como **Static Site**, ambos conectados al mismo repositorio de GitHub. MongoDB y Cloudinary son servicios externos: Render ejecuta la API, pero no sustituye la base de datos ni el almacenamiento de imágenes.

### Web Service del backend

1. Sube el repositorio a GitHub.
2. En Render, crea un **New Web Service** y conecta ese repositorio.
3. Configura:
   - **Root Directory:** `Backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. En **Environment**, configura las variables reales:
   - `DB_URL`: cadena de conexión de MongoDB Atlas.
   - `JWT_SECRET`: secreto aleatorio, largo y privado.
   - `CLOUDINARY_cloud_name`, `CLOUDINARY_api_key`, `CLOUDINARY_api_secret`: credenciales de Cloudinary.
   - `FRONTEND_URL`: origen público del frontend, por ejemplo `https://seliniyarn-frontend.onrender.com`.
5. Render configura `PORT` automáticamente; no lo fijes a un número en el panel. El backend escucha en ese puerto y ofrece `GET /health` para comprobar que está iniciado.

Guarda la URL pública resultante de la API, por ejemplo `https://seliniyarn-api.onrender.com`. La API pública queda bajo `/api/v1`.

### Static Site del frontend

1. Crea un **New Static Site** conectado al mismo repositorio.
2. Configura:
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Añade la variable de entorno de compilación `VITE_API_URL` con la URL del backend seguida de `/api/v1`, por ejemplo `https://seliniyarn-api.onrender.com/api/v1`.
4. Añade una regla de rewrite para que las rutas de React Router funcionen al actualizar o abrir un enlace directamente:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
5. Después del despliegue, copia el origen público del Static Site (solo esquema y dominio, sin rutas) y actualiza `FRONTEND_URL` en el Web Service. Si la página se sirve desde varios dominios, sepáralos con comas. Guarda los cambios y vuelve a desplegar el backend.

Después de configurar `VITE_API_URL`, cualquier cambio en esa variable requiere reconstruir y volver a desplegar el frontend, ya que Vite la incorpora durante el build.

### Desarrollo local después de preparar Render

Copia `Frontend/.env.example` a `Frontend/.env.local`. Su valor inicial apunta a la API local:

```dotenv
VITE_API_URL=http://localhost:3000/api/v1
```

En Render no se usa el `.env.local`: allí `VITE_API_URL` se configura en el panel del Static Site. Para producción, el backend debe estar disponible mediante HTTPS, y `FRONTEND_URL` debe coincidir exactamente con el origen público del frontend. No incluyas secretos en variables `VITE_`; las variables con ese prefijo quedan visibles en el código descargado por los visitantes.

Los servicios gratuitos de Render pueden entrar en reposo cuando no reciben tráfico y tardar en despertar. Consulta las condiciones y límites vigentes de Render antes de la entrega.

### Sembrar el catálogo inicial

El backend contiene un CSV y el comando:

```powershell
cd Backend
npm run seed
```

**Precaución:** el sembrado elimina todos los documentos actuales de la colección de peluches antes de cargar el CSV. No lo ejecutes contra una base con datos que quieras conservar. No modifica usuarios ni eventos.

## Comandos de desarrollo

En `Frontend/`:

```powershell
npm run dev       # Servidor local Vite
npm run lint      # ESLint
npm run build     # Compilación de producción
npm run preview   # Servir localmente la compilación
```

En `Backend/`:

```powershell
npm start         # Iniciar API Express
npm run seed      # Reemplazar el catálogo con el CSV
```

## Seguridad y consideraciones

- Nunca publiques `Backend/.env`, credenciales de MongoDB, JWT o Cloudinary.
- Los permisos de administrador se validan en los controladores protegidos del backend, no solo ocultando enlaces o protegiendo rutas en React.
- El frontend guarda el JWT en `localStorage`. Es adecuado para el alcance didáctico actual, pero las aplicaciones de producción deben evaluar cuidadosamente el almacenamiento frente a riesgos como XSS y considerar cookies seguras `HttpOnly`.
- El estado de rol guardado en el navegador sirve para mostrar la interfaz, pero no debe considerarse fuente de autorización.
- El índice parcial de eventos activos se construye al iniciar el servidor. Si una base ya tiene eventos con `activeLock: true` duplicados, MongoDB no podrá crear ese índice hasta resolver esos registros.
- CORS permite el origen local por defecto y los indicados en `FRONTEND_URL`; al desplegar, configura el dominio real del frontend en el servicio backend.

## Estado y límites actuales

- El pago es una demostración: no se integra una pasarela, no se cobran tarjetas y no se crean órdenes.
- El histórico administrativo refleja eventos cerrados, no compras de la tienda online.
- El formulario de contacto no transmite sus datos al servidor.
- La imagen de producto se puede almacenar con Cloudinary desde el endpoint que acepta carga de archivos; el formulario actual de inventario usa un campo URL y no ofrece selector de archivo.
- Al iniciar un evento se captura todo el stock actual como límite de ventas. Esa captura no reserva físicamente unidades ni sincroniza ventas online. El cierre vuelve a comprobar el inventario; si ya no quedan suficientes unidades, devuelve un error y no completa el cierre.
- No existe todavía una pantalla para recuperar contraseña, ni una interfaz administrativa dedicada para crear la primera cuenta admin. La promoción inicial de una cuenta a `admin` debe hacerse de forma controlada desde la base de datos o con un administrador ya existente.

## Licencia y uso

Este repositorio es un proyecto de desarrollo. Antes de desplegarlo públicamente, revisa seguridad, variables de entorno, reglas de acceso, configuración de imágenes, persistencia de pedidos y el flujo real de pago.

# Backend para Plataforma de IPTV

Este repositorio contiene el código fuente del backend para una plataforma de IPTV, desarrollado con Node.js y Express. El backend gestiona la autenticación de usuarios, los canales, las suscripciones y mucho más.

## Características Principales

- **API RESTful:** Endpoints para la gestión de usuarios, canales, suscripciones y pagos.
- **Autenticación con JWT:** Sistema de autenticación seguro basado en JSON Web Tokens.
- **Roles de Usuario:** Distinción entre usuarios administradores y clientes, con permisos específicos para cada rol.
- **Gestión de Canales:** Operaciones CRUD para canales, incluyendo la asignación de categorías.
- **Pasarela de Pagos:** Integración con sistemas de pago para la gestión de suscripciones.
- **Panel de Administración:** Rutas para obtener estadísticas y gestionar la plataforma.

## Tecnologías Utilizadas

- **Backend:** Node.js, Express
- **Base de Datos:** MySQL
- **Autenticación:** JSON Web Token (JWT), bcrypt
- **Middleware:** Cors, Multer

## Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    cd tu-repositorio
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables:
    ```
    PORT=5000
    DB_HOST=localhost
    DB_USER=tu_usuario_db
    DB_PASSWORD=tu_contraseña_db
    DB_NAME=tu_nombre_db
    JWT_SECRET=tu_secreto_jwt
    ```

4.  **Iniciar el servidor:**
    ```bash
    npm start
    ```

## Endpoints de la API

A continuación se describen los principales endpoints de la API:

### Autenticación

- `POST /api/auth/register`: Registrar un nuevo usuario.
- `POST /api/auth/login`: Iniciar sesión.
- `GET /api/auth/me`: Obtener información del usuario autenticado.

### Canales

- `GET /api/channels`: Obtener todos los canales.
- `GET /api/channels/:id`: Obtener un canal por su ID.
- `POST /api/channels`: Crear un nuevo canal (solo administradores).
- `PUT /api/channels/:id`: Actualizar un canal (solo administradores).
- `DELETE /api/channels/:id`: Eliminar un canal (solo administradores).

### Suscripciones

- `GET /api/subscriptions`: Obtener todas las suscripciones.
- `POST /api/subscriptions`: Crear una nueva suscripción.

... (y así sucesivamente con los demás endpoints)

## Contribuciones

Las contribuciones son bienvenidas. Si quieres mejorar este proyecto, por favor, abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia ISC.

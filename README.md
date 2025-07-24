# 🎬 Backend para Plataforma IPTV

Este repositorio contiene el backend de una plataforma IPTV desarrollada con **Node.js** y **Express.js**. Proporciona un conjunto completo de funcionalidades para gestionar usuarios, canales, suscripciones, pagos y estadísticas de uso.

## 🚀 Características Principales

- ✅ **API RESTful**: Endpoints estructurados para la gestión de usuarios, canales, suscripciones y pagos.  
- 🔐 **Autenticación Segura**: Login con **JWT (JSON Web Tokens)** y cifrado de contraseñas con **bcrypt**.  
- 👥 **Sistema de Roles**: Soporte para usuarios con permisos de **administrador** y **cliente**.  
- 📺 **Gestión de Canales IPTV**: CRUD de canales, incluyendo clasificación por categorías.  
- 💳 **Pasarela de Pagos**: Integración con sistemas de suscripción y control de pagos.  
- 📊 **Panel de Administración**: Rutas protegidas para estadísticas y control total de la plataforma.

## 🛠️ Tecnologías Utilizadas

| Tecnología    | Uso                                   |
|---------------|----------------------------------------|
| **Node.js**   | Motor principal del backend            |
| **Express.js**| Framework para rutas y middlewares     |
| **MySQL**     | Base de datos relacional               |
| **JWT**       | Autenticación basada en tokens         |
| **bcrypt**    | Encriptación de contraseñas            |
| **Multer**    | Manejo de archivos y formularios       |
| **Cors**      | Seguridad para solicitudes externas    |

## ⚙️ Instalación

Sigue estos pasos para ejecutar el proyecto localmente:

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/tu-repositorio.git
   cd tu-repositorio
Instalar dependencias

npm install
Configurar variables de entorno
Crea un archivo .env en la raíz del proyecto con el siguiente contenido:

env
Copiar
Editar
PORT=5000
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_contraseña_db
DB_NAME=tu_nombre_db
JWT_SECRET=tu_secreto_jwt
Iniciar el servidor

npm start
📡 Endpoints de la API
🔐 Autenticación
POST /api/auth/register → Registro de nuevo usuario

POST /api/auth/login → Inicio de sesión

GET /api/auth/me → Perfil del usuario autenticado

📺 Canales
GET /api/channels → Listar todos los canales

GET /api/channels/:id → Detalles de un canal

POST /api/channels → Crear canal (admin)

PUT /api/channels/:id → Actualizar canal (admin)

DELETE /api/channels/:id → Eliminar canal (admin)

💳 Suscripciones
GET /api/subscriptions → Listar suscripciones

POST /api/subscriptions → Crear nueva suscripción

📝 La documentación completa de los endpoints estará disponible próximamente en Swagger o Postman.

🤝 Contribuciones
¡Toda ayuda es bienvenida! Si deseas colaborar:

Haz un fork del repositorio.

Crea una rama con tu funcionalidad (git checkout -b feature/nombre).

Haz commit de tus cambios (git commit -m 'Añadir nueva funcionalidad').

Haz push a tu rama (git push origin feature/nombre).

Abre un Pull Request.

👨‍💻 Programadores
Elvis Da Silva

Hugo Senior

📄 Licencia
Distribuido bajo la Licencia ISC. Consulta el archivo LICENSE para más detalles.

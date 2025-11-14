# Aska Flow

Aska Flow es un generador de automatizaciones con IA integrada, centrado en la creación de flujos de trabajo [n8n](https://n8n.io) listos para ejecutar. Desde la interfaz se puede solicitar workflows, inspeccionar el JSON generado, copiarlo y/o enviarlo directamente a una instancia propia de n8n.

## Stack Tecnológico

- [Next.js 15](https://nextjs.org/) (App Router, Server/Client Components)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui para estilos
- Clerk para autenticación
- OpenRouter para LLMs
- Turso/libSQL para base de datos

## Pre-requisitos

- Node.js y npm
- Cuenta y base de datos de Turso/libSQL
- Cuenta y credenciales de Clerk
- API key de OpenRouter
- (Opcional pero recomendado): instancia auto-alojada de n8n con su API key

## Instalación

1. **Instalar dependencias**
   ```bash
   npm install
   ```
2. **Crear un archivo para las variables de entorno** 
   Crear `.env.local` con las variables que se describen más abajo.
3. **Ejecutar el esquema de la base de datos**
   ```bash
   npm run db:migrate
   ```
4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```
5. **Abrir la página** 
   En el navegador abrir: [http://localhost:3000](http://localhost:3000).

### Variables de Entorno

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
`CLERK_SECRET_KEY`
`OPENROUTER_API_KEY`
`TURSO_DATABASE_URL`
`TURSO_AUTH_TOKEN`

## Uso

1. Registrate e inicia sesión para ser redireccionado a la pantalla principal.
2. Comienza describiendo la automatización que quieres conseguir.
3. Al recibir el workflow puedes:
   - Copiar el JSON al portapapeles.
   - Ejecutar el workflow directamente en n8n (deberás proveer la URL de tu instancia de n8n y tu API key).
4. Revisa, renombra o elimina conversaciones pasadas desde el panel lateral.

## Autora
   Milagros Maza [text](https://github.com/MiliMaza)

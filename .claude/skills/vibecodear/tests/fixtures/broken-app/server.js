// Falla al arrancar: la variable DATABASE_URL es obligatoria y no está definida
if (!process.env.DATABASE_URL) {
  console.error('Error: falta la variable de entorno DATABASE_URL')
  process.exit(1)
}

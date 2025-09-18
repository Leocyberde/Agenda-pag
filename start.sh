#!/bin/bash

echo "Executando migrações..."
node migrate.js

if [ $? -eq 0 ]; then
  echo "Migrações concluídas com sucesso. Iniciando a aplicação..."
  # Substitua 'node dist/index.js' pelo comando real para iniciar sua aplicação
  # Por exemplo, se for um projeto TypeScript que precisa ser compilado primeiro:
  # npm run build && node dist/index.js
  # Ou se for um projeto Node.js puro:
  node dist/index.js
else
  echo "Falha nas migrações. A aplicação não será iniciada."
  exit 1
fi

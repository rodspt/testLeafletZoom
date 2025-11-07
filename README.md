# Mapa de Imóveis - Laravel + Next.js

Aplicação para visualização de milhões de geometrias de imóveis usando Laravel (backend) e Next.js com React-Leaflet (frontend).

## Estrutura

- **Backend**: Laravel 11 com PHP 8.2 e PostgreSQL
- **Frontend**: Next.js 14 com React-Leaflet
- **Infraestrutura**: Docker Compose

## Requisitos

- Docker
- Docker Compose

## Configuração

### 1. Clone o repositório

### 2. Configure as variáveis de ambiente

O backend já está configurado para conectar ao banco de dados:
- Host: 192.168.0.25
- Porta: 5431
- Database: postgres
- Usuário: postgres
- Senha: postres

### 3. Inicie os containers

```bash
docker-compose up -d --build
```

### 4. Instale as dependências do Laravel

```bash
docker-compose exec backend composer install
docker-compose exec backend php artisan key:generate
```

### 5. Instale as dependências do Next.js

```bash
docker-compose exec frontend npm install
```

## Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api

## Endpoints da API

- `GET /api/estados` - Retorna todos os estados com geometrias e quantidade de imóveis
- `GET /api/municipios/{ufId}` - Retorna municípios de um estado específico
- `GET /api/imoveis/{municipioId}` - Retorna imóveis de um município específico

## Funcionamento

1. **Nível Estado**: Ao abrir o mapa, são carregados os estados (dw.dm_uf) com:
   - MultiLineString do contorno do estado
   - Ponto central com a quantidade de imóveis

2. **Nível Município**: Ao clicar em um estado, são carregados os municípios (dw.dm_municipio):
   - Geometrias dos municípios
   - Pontos centrais com quantidade de imóveis
   - Remove o foco do estado

3. **Nível Imóvel**: Ao clicar em um município, são carregados os imóveis (dw.dm_sicar):
   - MultiPolygon de cada imóvel
   - Código do imóvel

## Estrutura do Banco de Dados

### dw.dm_uf
- id
- nm_uf
- geojson (MultiLineString)
- quantidade

### dw.dm_municipio
- id
- uf_id
- nm_municipio
- geojson
- quantidade

### dw.dm_sicar
- id
- cod_imovel
- municipio_id
- geojson (MultiPolygon)

## Desenvolvimento

Para desenvolvimento local:

```bash
cd frontend
npm run dev
```

```bash
cd backend
php artisan serve
```

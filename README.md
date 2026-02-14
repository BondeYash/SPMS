# Production Tracking System Backend

This is a production-ready backend system for tracking worker sheet production, built with Node.js, Express, TypeScript, MySQL, and TypeORM.

## Features

-   **Worker Management**: Create and list workers.
-   **Sheet Type Management**: Define different sheet types with specific prices.
-   **Production Entry**:
    -   Allows workers to submit their daily production.
    -   **Strict Constraint**: A worker can only submit **one entry per day**.
    -   Supports multiple sheet types in a single daily submission.
-   **Analytics**:
    -   Daily Stats: Total sheets produced and total earnings for the day.
    -   Monthly Stats: Total earnings for a specific worker in a given month.

## Tech Stack

-   **Node.js & Express.js**
-   **TypeScript**
-   **MySQL** (Database)
-   **TypeORM** (ORM)
-   **class-validator** (DTO Validation)

## Setup & Run

### 1. Prerequisites

-   Node.js installed.
-   MySQL Server running.
-   Create a database named `production_db` (or update `.env`).

### 2. Installation

```bash
npm install
```

### 3. Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=yourpassword
DB_NAME=production_db
```

### 4. Run Locally

```bash
# Development Mode (with hot reload)
npm run dev

# Build and Start
npm run build
npm start
```

## API Documentation & Example Payloads

### 1. Create a Worker
**POST** `/api/workers`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

### 2. Create a Sheet Type
**POST** `/api/sheets`
```json
{
  "name": "Type A",
  "price": 2.50
}
```

### 3. Submit Daily Production
**POST** `/api/production`
**Note**: This fails if the worker has already submitted for the provided `date`.
```json
{
  "workerId": "uuid-of-worker",
  "date": "2023-10-27",
  "entries": [
    { "sheetTypeId": "uuid-of-type-a", "quantity": 100 },
    { "sheetTypeId": "uuid-of-type-b", "quantity": 50 }
  ]
}
```

### 4. Get Daily Stats
**GET** `/api/production/stats/daily?date=2023-10-27`

### 5. Get Monthly Worker Salary/Earnings
**GET** `/api/production/stats/monthly/:workerId/2023/10`

## Logic Implementation

### Duplicate Prevention
The system enforces "One Entry Per Day" using a check in `ProductionService.ts`. Before saving, it queries the database for any existing entry for the given `workerId` and `date`. If found, it throws an error, preventing double counting.

### Salary Calculation
Earnings are calculated dynamically:
-   **Daily**: Sum of `(quantity * sheet_price)` for all entries on a specific day.
-   **Monthly**: Sum of `(quantity * sheet_price)` for all entries by a specific worker within the start and end dates of the month.

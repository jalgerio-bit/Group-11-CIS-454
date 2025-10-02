
# Restaurant DB (MySQL)

This package includes:
- `restaurant.sql` — schema + dummy data
- `docker-compose.yml` — optional local MySQL runner (auto-loads the SQL)

## Local (Docker)

1) Install Docker Desktop.
2) Put both files in the same folder, open a terminal there.
3) Run:
   docker compose up -d
4) Connect with a client (DBeaver, MySQL Workbench) to:
   host: 127.0.0.1
   port: 3306
   user: root
   pass: root
   database: restaurant

## AWS RDS (MySQL)

1) Create an RDS MySQL instance (free tier ok), allow your IP in the security group, note the **Endpoint**.
2) From your machine:
   mysql -h <RDS-ENDPOINT> -u admin -p < /path/to/restaurant.sql
3) Or open MySQL Workbench and run the contents of `restaurant.sql` after connecting.

## Google Cloud SQL (MySQL)

1) Create a Cloud SQL instance (MySQL), add your IP in **Connections → Networking**.
2) Use the public IP to connect, then run:
   mysql -h <PUBLIC-IP> -u root -p < /path/to/restaurant.sql

## Useful Queries

Total sales per order:
```sql
SELECT o.order_id,
       c.name AS customer,
       SUM(oi.line_total) AS order_total
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.order_id, c.name
ORDER BY o.order_id;
```

Top 5 menu items by revenue:
```sql
SELECT m.name,
       SUM(oi.quantity) AS qty_sold,
       SUM(oi.line_total) AS revenue
FROM order_items oi
JOIN menu_items m ON m.item_id = oi.item_id
GROUP BY m.name
ORDER BY revenue DESC
LIMIT 5;
```

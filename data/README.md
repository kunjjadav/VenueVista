# Data Directory

Place CSV data files here for import.

## Supported files
- `restaurants_with_inferred_cuisine.csv`
- `places_nearby.csv`

## Import command
```bash
docker compose exec backend python manage.py import_csv --file /app/data/restaurants_with_inferred_cuisine.csv
```

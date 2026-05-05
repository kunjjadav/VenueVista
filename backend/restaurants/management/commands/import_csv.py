import csv
import logging
from django.core.management.base import BaseCommand, CommandError
from django.contrib.gis.geos import Point
from restaurants.models import Restaurant, CuisineType

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Import restaurant data from a CSV file into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            required=True,
            help="Path to the CSV file to import.",
        )
        parser.add_argument(
            "--update",
            action="store_true",
            default=False,
            help="Update existing records if they match by name + coordinates.",
        )

    def handle(self, *args, **options):
        file_path = options["file"]
        update_existing = options["update"]

        self.stdout.write(f"📂 Importing from: {file_path}")

        try:
            with open(file_path, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
        except UnicodeDecodeError:
            with open(file_path, "r", encoding="latin-1") as f:
                content = f.read()
                if content.startswith("\xef\xbb\xbf"):
                    content = content[3:]
                import io
                reader = csv.DictReader(io.StringIO(content))
                rows = list(reader)
        except FileNotFoundError:
            raise CommandError(f"File not found: {file_path}")
        except Exception as e:
            raise CommandError(f"Error reading CSV: {e}")

        cleaned_rows = []
        for row in rows:
            cleaned = {k.strip().lstrip("\ufeff"): v for k, v in row.items() if k}
            cleaned_rows.append(cleaned)
        rows = cleaned_rows

        self.stdout.write(f"📊 Found {len(rows)} rows in CSV")

        created = 0
        updated = 0
        skipped = 0
        errors = 0

        for i, row in enumerate(rows):
            try:
                name = (
                    row.get("Name")
                    or row.get("name")
                    or row.get("Restaurant Name")
                    or ""
                ).strip()

                lat_raw = (
                    row.get("Latitude")
                    or row.get("latitude")
                    or row.get("lat")
                    or "0"
                )
                lng_raw = (
                    row.get("Longitude")
                    or row.get("longitude")
                    or row.get("lng")
                    or row.get("lon")
                    or "0"
                )
                try:
                    lat = float(lat_raw)
                    lng = float(lng_raw)
                except (ValueError, TypeError):
                    skipped += 1
                    continue

                if not name or lat == 0 or lng == 0:
                    skipped += 1
                    continue

                address = (
                    row.get("Address")
                    or row.get("address")
                    or ""
                ).strip()

                rating_raw = (
                    row.get("Rating")
                    or row.get("rating")
                    or None
                )
                try:
                    rating = float(rating_raw) if rating_raw else None
                except (ValueError, TypeError):
                    rating = None

                reviews_raw = (
                    row.get("Total Reviews")
                    or row.get("total_reviews")
                    or row.get("User Ratings Total")
                    or "0"
                )
                try:
                    reviews = int(float(reviews_raw))
                except (ValueError, TypeError):
                    reviews = 0

                cuisine = (
                    row.get("Inferred_Cuisine")
                    or row.get("inferred_cuisine")
                    or row.get("Cuisine")
                    or row.get("cuisine")
                    or row.get("Cuisine Type")
                    or row.get("cuisine_type")
                    or ""
                ).strip().lower()

                price_raw = (
                    row.get("Price Level")
                    or row.get("price_level")
                    or None
                )
                try:
                    price_level = int(float(price_raw)) if price_raw else None
                except (ValueError, TypeError):
                    price_level = None

                google_id = (
                    row.get("Google_Place_ID")
                    or row.get("google_place_id")
                    or row.get("Place_ID")
                    or f"csv_import_{i}_{name[:30].replace(' ', '_')}"
                )

                point = Point(lng, lat, srid=4326)

                if update_existing:
                    obj, was_created = Restaurant.objects.update_or_create(
                        google_place_id=google_id,
                        defaults={
                            "name": name,
                            "location": point,
                            "address": address,
                            "rating": rating,
                            "user_ratings_total": reviews,
                            "price_level": price_level,
                            "inferred_cuisine": cuisine,
                            "is_from_csv": True,
                        },
                    )
                    if was_created:
                        created += 1
                    else:
                        updated += 1
                else:
                    if Restaurant.objects.filter(google_place_id=google_id).exists():
                        skipped += 1
                        continue

                    Restaurant.objects.create(
                        google_place_id=google_id,
                        name=name,
                        location=point,
                        address=address,
                        rating=rating,
                        user_ratings_total=reviews,
                        price_level=price_level,
                        inferred_cuisine=cuisine,
                        is_from_csv=True,
                    )
                    created += 1

                if cuisine:
                    from django.utils.text import slugify
                    cuisine_obj, _ = CuisineType.objects.get_or_create(
                        slug=slugify(cuisine),
                        defaults={"name": cuisine.title()},
                    )
                    if update_existing:
                        obj.cuisines.add(cuisine_obj)
                    else:
                        try:
                            restaurant = Restaurant.objects.get(google_place_id=google_id)
                            restaurant.cuisines.add(cuisine_obj)
                        except Restaurant.DoesNotExist:
                            pass

            except Exception as e:
                errors += 1
                if errors <= 10:
                    self.stderr.write(f"  ⚠ Row {i + 1} error: {e}")

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Import complete!"
            f"\n   Created: {created}"
            f"\n   Updated: {updated}"
            f"\n   Skipped: {skipped}"
            f"\n   Errors:  {errors}"
        ))

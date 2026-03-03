CarQuest4U Static Website

RUN LOCALLY (recommended):
- Python: python -m http.server 8080
- Open: http://localhost:8080

EDIT INVENTORY:
- data/cars.json
- To FEATURE a car on the homepage, set: "featured": true
- For photos, use image URLs or place files under assets/ and reference them like "assets/mycar1.jpg"

NOTES:
- Contact/newsletter forms submit to Formspree endpoint configured in assets/app.js.

ADMIN PANEL:
- Open: /admin/
- CMS: /admin/cms.html (manage cars, upload images, publish workflow)
- Focus Tool: /admin/focus-tool.html (visual crop focus editor)
- NOTE: update admin/config.yml with your real GitHub repo before using CMS publish.

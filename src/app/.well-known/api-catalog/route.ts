import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const catalog = {
    "linkset": [
      {
        "anchor": "https://datosbizi.com/api/",
        "rel": [
          "service-desc",
          "service-doc",
          "status"
        ],
        "href": {
          "service-desc": "/api/openapi.json",
          "service-doc": "/docs/api",
          "status": "/api/health/live"
        }
      }
    ]
  };

  return NextResponse.json(catalog, {
    headers: {
      'Content-Type': 'application/linkset+json',
    },
  });
}
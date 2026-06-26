# Doubao Seedream Generate Page Design

## Goal

Connect the `/generate` page to Doubao-Seedream-4.5 image generation while keeping the visual experience aligned with the existing cinematic landing page.

## Boundaries

- Do not modify the landing homepage structure or copy.
- Use the homepage only as the visual source: black stage, silver typography, cold highlights, fine borders, film grain, large poster-like canvas.
- Implement only the creation page, server API route, and focused tests.

## Experience

The generate page becomes a cinematic director's desk. The left side contains compact creative controls: image type, style mood, aspect/quality, subject brief, and a generate action. The right side is a large dark preview frame that starts as a projector-like placeholder and becomes the generated artwork once the API returns an image.

## API

The client posts to `/api/generate-image`. The server reads `ARK_API_KEY`, builds a Doubao-Seedream-4.5 request with model `doubao-seedream-4-5-251128`, and calls the Ark-compatible image generation endpoint. If the key is missing or the provider fails, the page shows a polished in-product error state instead of crashing.

## Testing

Tests cover prompt/payload building, response parsing, missing-key and provider-success API states, and the `/generate` page rendering the new studio instead of the placeholder.

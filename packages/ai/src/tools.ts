import type Anthropic from "@anthropic-ai/sdk";

export const tools: Anthropic.Tool[] = [
  {
    name: "search_flights",
    description:
      "Search flights between two cities. Returns ranked offers from real providers. Call this BEFORE recommending any flight.",
    input_schema: {
      type: "object" as const,
      required: ["origin", "destination", "departDate"],
      properties: {
        origin:      { type: "string", description: "City name or IATA code (e.g. RUH, Tokyo)" },
        destination: { type: "string", description: "City name or IATA code" },
        departDate:  { type: "string", description: "Departure date in YYYY-MM-DD format" },
        returnDate:  { type: "string", description: "Return date YYYY-MM-DD (omit for one-way)" },
        paxAdult:    { type: "integer", description: "Number of adult passengers", default: 1 },
        cabin:       { type: "string", enum: ["economy", "premium", "business", "first"], default: "economy" },
      },
    },
  },
  {
    name: "search_hotels",
    description:
      "Search hotels in a destination for given dates. Returns ranked options. Call this BEFORE recommending any hotel.",
    input_schema: {
      type: "object" as const,
      required: ["destination", "checkIn", "checkOut"],
      properties: {
        destination: { type: "string", description: "City name or destination" },
        checkIn:     { type: "string", description: "Check-in date YYYY-MM-DD" },
        checkOut:    { type: "string", description: "Check-out date YYYY-MM-DD" },
        guests:      { type: "integer", default: 1 },
        maxPriceUsd: { type: "integer", description: "Max price per night in USD" },
      },
    },
  },
  {
    name: "search_activities",
    description:
      "Search tours and activities in a destination for a given date. Call this BEFORE recommending any activity.",
    input_schema: {
      type: "object" as const,
      required: ["destination", "date"],
      properties: {
        destination: { type: "string" },
        date:        { type: "string", description: "Date YYYY-MM-DD" },
        category:    { type: "string", description: "e.g. food, culture, adventure, nature" },
        maxPriceUsd: { type: "integer" },
      },
    },
  },
  {
    name: "get_destination_info",
    description:
      "Get practical info about a destination: weather, visa requirements, currency, transport tips. Use once per destination.",
    input_schema: {
      type: "object" as const,
      required: ["destination"],
      properties: {
        destination: { type: "string" },
        month:       { type: "integer", description: "Travel month (1-12) for weather context" },
      },
    },
  },
  {
    name: "save_itinerary",
    description:
      "Save the final day-by-day itinerary to the user's trip. Call this ONCE when the plan is complete. Do NOT print the itinerary in prose — the UI renders it from this payload.",
    input_schema: {
      type: "object" as const,
      required: ["tripId", "days"],
      properties: {
        tripId: { type: "string", description: "The trip ID to save the itinerary to" },
        days: {
          type: "array",
          items: {
            type: "object",
            required: ["date", "items"],
            properties: {
              date:  { type: "string", description: "YYYY-MM-DD" },
              label: { type: "string", description: "Optional day label e.g. 'Arrival day'" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  required: ["type", "title", "startsAt"],
                  properties: {
                    type:     { type: "string", enum: ["FLIGHT", "LODGING", "ACTIVITY", "TRANSFER", "FOOD", "NOTE"] },
                    title:    { type: "string" },
                    startsAt: { type: "string", description: "ISO datetime" },
                    endsAt:   { type: "string", description: "ISO datetime" },
                    payload:  { type: "object" },
                  },
                },
              },
            },
          },
        },
        summary: { type: "string", description: "3-5 sentence summary shown to the user" },
        totalEstimatedCents: { type: "integer", description: "Estimated total cost in cents USD" },
      },
    },
  },
];

export type ToolName = "search_flights" | "search_hotels" | "search_activities" | "get_destination_info" | "save_itinerary";

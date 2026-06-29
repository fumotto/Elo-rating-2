#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(repoRoot, "docs/api/openapi.yaml");

const spec = `openapi: 3.0.3
info:
  title: Elo Rating Manager API
  version: 1.0.0
  description: >
    Frontend-to-backend request catalogue for the Supabase-backed Elo Rating Manager.
    The operations below reflect the requests issued by the Vite frontend client.
servers:
  - url: https://<supabase-project>.supabase.co
    description: Supabase project endpoint
tags:
  - name: Auth
    description: Discord OAuth and session management
  - name: Profiles
    description: User profile reads and updates
  - name: Players
    description: Player registration, editing and deletion
  - name: Matches
    description: Match registration and rollback operations
  - name: Settings
    description: K-factor and application configuration
paths:
  /auth/v1/authorize:
    get:
      tags: [Auth]
      summary: Start Discord OAuth sign-in
      description: Invoked from the frontend when the user clicks the Discord sign-in action.
      parameters:
        - in: query
          name: provider
          required: true
          schema:
            type: string
            enum: [discord]
      responses:
        '302':
          description: Redirect to the Discord OAuth flow.
  /auth/v1/logout:
    post:
      tags: [Auth]
      summary: Sign the user out
      description: Clears the current Supabase session from the frontend.
      responses:
        '200':
          description: Sign-out completed.
  /rpc/ensure_user_profile:
    post:
      tags: [Profiles]
      summary: Ensure the current user profile exists
      description: Called after authentication to create or sync the profile row in Supabase.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Profile ensured.
  /rest/v1/user_profiles:
    get:
      tags: [Profiles]
      summary: Load the current user profile
      description: Reads the authenticated user's profile from the user_profiles table.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Profile data returned.
  /rest/v1/user_profiles/{id}:
    patch:
      tags: [Profiles]
      summary: Update a user's role
      description: Used by admins to change a user's role in the profile table.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Role updated.
  /rest/v1/players:
    get:
      tags: [Players]
      summary: List all players
      description: Returns the player roster ordered by name.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Player list returned.
    post:
      tags: [Players]
      summary: Create a player
      description: Inserts a new player row with initial ratings.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '201':
          description: Player created.
  /rest/v1/players/{id}:
    patch:
      tags: [Players]
      summary: Update a player
      description: Updates player metadata such as name, steam ID, or rating values.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Player updated.
  /rpc/delete_player_safe:
    post:
      tags: [Players]
      summary: Delete a player safely
      description: Deletes a player through the protected RPC wrapper.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Player deletion result returned.
  /rpc/get_ranking:
    post:
      tags: [Matches]
      summary: Get the current Elo ranking
      description: Computes the ranking from the stored player rates.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Ranking data returned.
  /rpc/get_match_history:
    post:
      tags: [Matches]
      summary: Get recent match history
      description: Returns recent match records for the UI history view.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Match history returned.
  /rpc/register_match:
    post:
      tags: [Matches]
      summary: Register a completed match
      description: Stores a match result and updates ratings through the server-side RPC.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Match registered.
  /rpc/rollback_last_match:
    post:
      tags: [Matches]
      summary: Roll back the last match
      description: Reverts the most recent match and rating change.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Match rolled back.
  /rpc/reset_rankings:
    post:
      tags: [Matches]
      summary: Reset all rankings
      description: Resets player ratings to their initial values.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Rankings reset.
  /rest/v1/app_settings:
    get:
      tags: [Settings]
      summary: Load app settings
      description: Reads the K-factor setting currently configured by the application.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Settings value returned.
  /rpc/set_k_factor:
    post:
      tags: [Settings]
      summary: Update the K-factor setting
      description: Updates the K-factor exposed to the UI and used by rating calculations.
      x-source: vite/src/lib/api.ts
      security:
        - bearerAuth: []
      responses:
        '200':
          description: K-factor updated.
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, spec, "utf8");
console.log(`Generated API docs at ${path.relative(repoRoot, outputPath)}`);

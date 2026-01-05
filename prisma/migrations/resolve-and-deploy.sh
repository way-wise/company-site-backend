#!/bin/bash
set -e

# Resolve failed migration using Prisma CLI
npx prisma migrate resolve --rolled-back 20260103115533_change_assigned_members_to_string || true

# Deploy migrations
npx prisma migrate deploy


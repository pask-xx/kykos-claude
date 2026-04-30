-- Add WITHDRAWN status to VolunteerStatus enum
ALTER TYPE "VolunteerStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';
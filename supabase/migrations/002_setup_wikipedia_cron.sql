
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run Wikipedia celebrity lookup daily at 6:00 AM UTC
-- This will automatically lookup biographical information for celebrities from user picks
SELECT cron.schedule(
    'daily-wikipedia-celebrity-lookup',
    '0 6 * * *', -- Run daily at 6:00 AM UTC
    $$
    SELECT
        net.http_post(
            url := 'https://wxttrmfhatmgelvyjuip.supabase.co/functions/v1/lookup-celebrity-wikipedia',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4dHRybWZoYXRtZ2VsdnlqdWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODI3NjkzOSwiZXhwIjoyMDYzODUyOTM5fQ.example-service-role-key"}'::jsonb,
            body := '{"scheduled": true}'::jsonb
        ) as request_id;
    $$
);

-- To check the status of cron jobs, you can run:
-- SELECT * FROM cron.job;

-- To remove the cron job if needed, you can run:
-- SELECT cron.unschedule('daily-wikipedia-celebrity-lookup');

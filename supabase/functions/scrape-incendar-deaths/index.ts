
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CelebrityDeath {
  name: string;
  dateOfDeath: string;
  age?: number;
  cause?: string;
}

async function scrapeIncendarDeaths(): Promise<CelebrityDeath[]> {
  try {
    console.log('Fetching from Incendar deaths page...');
    const response = await fetch('https://incendar.com/deathclock-recent-high-profile-media-famous-deaths-in-us-united-states.php');
    const html = await response.text();
    
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const deaths: CelebrityDeath[] = [];
    
    // Look for death entries - this may need adjustment based on the actual HTML structure
    const deathElements = doc.querySelectorAll('tr, .death-entry, .celebrity-death');
    
    for (const element of deathElements) {
      try {
        const text = element.textContent || '';
        
        // Try to extract name, date, and age from text patterns
        // Look for patterns like "Name, Age, Date" or similar
        const nameMatch = text.match(/^([^,]+)/);
        const ageMatch = text.match(/age (\d+)|(\d+) years old/i);
        const dateMatch = text.match(/\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\w+ \d{1,2}, \d{4})\b/);
        
        if (nameMatch && dateMatch) {
          const name = nameMatch[1].trim();
          const dateStr = dateMatch[1];
          const age = ageMatch ? parseInt(ageMatch[1] || ageMatch[2]) : undefined;
          
          // Parse date to standard format
          let dateOfDeath: string;
          try {
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              dateOfDeath = parsedDate.toISOString().split('T')[0];
            } else {
              continue;
            }
          } catch {
            continue;
          }
          
          // Only include deaths from 2025
          if (dateOfDeath.startsWith('2025')) {
            deaths.push({
              name,
              dateOfDeath,
              age,
              cause: undefined
            });
          }
        }
      } catch (error) {
        console.error('Error parsing death element:', error);
        continue;
      }
    }
    
    console.log(`Found ${deaths.length} deaths from Incendar`);
    return deaths;
  } catch (error) {
    console.error('Error scraping Incendar:', error);
    return [];
  }
}

async function processDeaths(supabase: any, deaths: CelebrityDeath[], logId: string) {
  let deathsAdded = 0;
  let picksScored = 0;

  for (const death of deaths) {
    if (!death.age) continue; // Skip if no age available

    // Check if already exists
    const { data: existing } = await supabase
      .from('deceased_celebrities')
      .select('id')
      .eq('canonical_name', death.name)
      .eq('date_of_death', death.dateOfDeath)
      .single();
    
    if (!existing) {
      // Calculate additional fields
      const dateOfDeath = new Date(death.dateOfDeath);
      const gameYear = dateOfDeath.getFullYear();
      
      // Insert new death record
      const { data: newDeath, error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: death.name,
          date_of_death: death.dateOfDeath,
          age_at_death: death.age,
          cause_of_death_category: 'Unknown',
          cause_of_death_details: death.cause || null,
          game_year: gameYear,
          source_url: 'https://incendar.com/deathclock-recent-high-profile-media-famous-deaths-in-us-united-states.php',
          died_on_birthday: false,
          died_on_major_holiday: false,
          died_during_public_event: false,
          died_in_extreme_sport: false,
          is_first_death_of_year: false,
          is_last_death_of_year: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting death:', error);
      } else {
        console.log(`Inserted death record for ${death.name}`);
        deathsAdded++;
        
        // Update any matching picks
        const scored = await updateMatchingPicks(supabase, death.name, gameYear, newDeath);
        picksScored += scored;
      }
    }
  }

  // Update log with results
  await supabase
    .from('fetch_logs')
    .update({
      deaths_added: deathsAdded,
      picks_scored: picksScored
    })
    .eq('id', logId);

  return { deathsAdded, picksScored };
}

async function updateMatchingPicks(supabase: any, celebrityName: string, gameYear: number, deceased: any): Promise<number> {
  // Find matching picks (case-insensitive)
  const { data: picks } = await supabase
    .from('celebrity_picks')
    .select('*')
    .ilike('celebrity_name', celebrityName)
    .eq('game_year', gameYear)
    .eq('is_hit', false);
  
  if (picks && picks.length > 0) {
    const points = calculatePoints(deceased);
    
    // Update picks and user scores
    for (const pick of picks) {
      await supabase
        .from('celebrity_picks')
        .update({
          is_hit: true,
          points_awarded: points
        })
        .eq('id', pick.id);
      
      // Update user total score
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_score')
        .eq('id', pick.user_id)
        .single();
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_score: profile.total_score + points
          })
          .eq('id', pick.user_id);
      }
    }
    
    return picks.length;
  }
  
  return 0;
}

function calculatePoints(deceased: any): number {
  let points = 0;
  const age = deceased.age_at_death;
  const cause = deceased.cause_of_death_category;
  
  // Base points
  points += (100 - age);
  
  // Cause bonuses
  switch (cause) {
    case 'Natural':
      points += age >= 80 ? 5 : 10;
      break;
    case 'Accidental':
      points += age >= 80 ? 15 : 25;
      break;
    case 'Violent':
      points += age >= 80 ? 30 : 50;
      break;
    case 'Suicide':
      points += age >= 80 ? 20 : 40;
      break;
    case 'RareOrUnusual':
      points += 50;
      break;
    case 'PandemicOrOutbreak':
      points += age >= 80 ? 20 : 35;
      break;
    default:
      points += 5; // Unknown cause gets minimal bonus
      break;
  }
  
  // Special bonuses
  if (deceased.died_on_birthday) points += 15;
  if (deceased.died_on_major_holiday) points += 10;
  if (deceased.died_during_public_event) points += 25;
  if (deceased.died_in_extreme_sport) points += 30;
  if (deceased.is_first_death_of_year) points += 10;
  if (deceased.is_last_death_of_year) points += 10;
  
  return Math.max(points, 0);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create log entry
    const { data: logEntry } = await supabaseClient
      .from('fetch_logs')
      .insert({
        status: 'running',
        deaths_found: 0,
        deaths_added: 0,
        picks_scored: 0
      })
      .select()
      .single();

    console.log('Starting Incendar death scrape process...');
    
    // Scrape deaths from Incendar
    const deaths = await scrapeIncendarDeaths();
    
    console.log(`Found ${deaths.length} deaths from Incendar`);
    
    // Update log with deaths found
    await supabaseClient
      .from('fetch_logs')
      .update({
        deaths_found: deaths.length
      })
      .eq('id', logEntry.id);
    
    // Process and store deaths
    const { deathsAdded, picksScored } = await processDeaths(supabaseClient, deaths, logEntry.id);
    
    // Complete the log
    await supabaseClient
      .from('fetch_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', logEntry.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        totalDeaths: deaths.length,
        deathsAdded,
        picksScored,
        source: 'Incendar',
        message: 'Celebrity deaths scraped successfully from Incendar' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in scrape-incendar-deaths function:', error);
    
    // Update log with error
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    await supabaseClient
      .from('fetch_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message
      })
      .eq('status', 'running')
      .order('started_at', { ascending: false })
      .limit(1);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

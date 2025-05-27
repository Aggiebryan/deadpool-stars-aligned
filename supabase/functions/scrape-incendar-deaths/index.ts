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
  field?: string;
  generation?: string;
}

async function scrapeIncendarDeaths(): Promise<CelebrityDeath[]> {
  try {
    console.log('Fetching from Incendar deaths page...');
    const response = await fetch('https://incendar.com/deathclock-recent-high-profile-media-famous-deaths-in-us-united-states.php');
    const html = await response.text();
    
    console.log('HTML length:', html.length);
    
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const deaths: CelebrityDeath[] = [];
    
    // Target the specific table rows containing death data
    const tableRows = doc.querySelectorAll('tbody tr, table tr');
    console.log(`Found ${tableRows.length} table rows`);
    
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      const text = row.textContent || '';
      
      // Skip header rows or very short text
      if (text.length < 15 || text.includes('Date') || text.includes('Name')) {
        console.log(`Skipping row ${i}: ${text.substring(0, 50)}`);
        continue;
      }
      
      console.log(`Processing row ${i}: ${text.substring(0, 100)}`);
      
      try {
        const death = parseIncendarRow(text);
        if (death) {
          deaths.push(death);
          console.log('Successfully parsed death:', death);
        }
      } catch (error) {
        console.log(`Failed to parse row ${i}:`, error.message);
        continue;
      }
    }
    
    console.log(`Total deaths parsed: ${deaths.length}`);
    return deaths;
  } catch (error) {
    console.error('Error scraping Incendar:', error);
    return [];
  }
}

function parseIncendarRow(text: string): CelebrityDeath | null {
  // Clean up the text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  console.log('Parsing text:', cleanText);
  
  // Look for the date pattern at the beginning (YYYY-MM-DD)
  const dateMatch = cleanText.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) {
    console.log('No date found at beginning of text');
    return null;
  }
  
  const dateOfDeath = dateMatch[1];
  console.log('Found date:', dateOfDeath);
  
  // Remove the date from the beginning
  let remainingText = cleanText.substring(10).trim();
  
  // Look for the 🔎 emoji which separates name from other data
  const emojiIndex = remainingText.indexOf('🔎');
  if (emojiIndex === -1) {
    console.log('No 🔎 emoji found');
    return null;
  }
  
  const name = remainingText.substring(0, emojiIndex).trim();
  const afterEmoji = remainingText.substring(emojiIndex + 1).trim();
  
  console.log('Found name:', name);
  console.log('After emoji:', afterEmoji);
  
  if (!name || name.length < 2) {
    console.log('Invalid name');
    return null;
  }
  
  // Parse age from the beginning of the afterEmoji text
  const ageMatch = afterEmoji.match(/^(\d+)/);
  const age = ageMatch ? parseInt(ageMatch[1]) : undefined;
  
  if (!age || age < 1 || age > 120) {
    console.log('Invalid age:', age);
    return null;
  }
  
  console.log('Found age:', age);
  
  // Extract generation, field, and cause from the remaining text
  const afterAge = afterEmoji.substring(ageMatch[1].length).trim();
  const parts = afterAge.split(/\s+/);
  
  let generation = '';
  let field = '';
  let cause = '';
  
  // Try to identify patterns in the remaining text
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Common generations
    if (['Silent', 'Boomer', 'GenX', 'Millennial', 'Zoomer', 'Greatest'].includes(part)) {
      generation = part;
    }
    // Common fields
    else if (['Music', 'Actor', 'Actress', 'Sports', 'TV', 'Politics', 'CEO', 'Illuminati'].includes(part)) {
      field = part;
    }
    // Potential causes (often in quotes or specific terms)
    else if (part.includes('"') || ['Cancer', 'Stroke', 'Suicide', 'Pneumonia', 'Cardiac', 'Diabetes', 'Fall', 'Fire', 'Overdose'].includes(part)) {
      cause = part.replace(/"/g, '');
    }
  }
  
  console.log('Parsed generation:', generation, 'field:', field, 'cause:', cause);
  
  return {
    name,
    dateOfDeath,
    age,
    cause: cause || 'Unknown',
    field,
    generation
  };
}

async function processDeaths(supabase: any, deaths: CelebrityDeath[], logId: string) {
  let deathsAdded = 0;
  let picksScored = 0;

  for (const death of deaths) {
    if (!death.age) continue;

    // Check if already exists
    const { data: existing } = await supabase
      .from('deceased_celebrities')
      .select('id')
      .eq('canonical_name', death.name)
      .eq('date_of_death', death.dateOfDeath)
      .single();
    
    if (!existing) {
      const dateOfDeath = new Date(death.dateOfDeath);
      const gameYear = dateOfDeath.getFullYear();
      
      // Map cause to category
      let causeCategory = 'Unknown';
      const cause = death.cause?.toLowerCase() || '';
      
      if (cause.includes('cancer')) causeCategory = 'Natural';
      else if (cause.includes('suicide')) causeCategory = 'Suicide';
      else if (cause.includes('accident') || cause.includes('fall') || cause.includes('fire')) causeCategory = 'Accidental';
      else if (cause.includes('murder') || cause.includes('homicide')) causeCategory = 'Violent';
      else if (cause.includes('overdose')) causeCategory = 'RareOrUnusual';
      else if (cause.includes('stroke') || cause.includes('cardiac') || cause.includes('pneumonia')) causeCategory = 'Natural';
      
      // Insert new death record
      const { data: newDeath, error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: death.name,
          date_of_death: death.dateOfDeath,
          age_at_death: death.age,
          cause_of_death_category: causeCategory,
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
        
        const scored = await updateMatchingPicks(supabase, death.name, gameYear, newDeath);
        picksScored += scored;
      }
    }
  }

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
  const { data: picks } = await supabase
    .from('celebrity_picks')
    .select('*')
    .ilike('celebrity_name', celebrityName)
    .eq('game_year', gameYear)
    .eq('is_hit', false);
  
  if (picks && picks.length > 0) {
    const points = calculatePoints(deceased);
    
    for (const pick of picks) {
      await supabase
        .from('celebrity_picks')
        .update({
          is_hit: true,
          points_awarded: points
        })
        .eq('id', pick.id);
      
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
  
  points += (100 - age);
  
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
      points += 5;
      break;
  }
  
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
    
    // Process and store deaths (include both 2024 and 2025)
    const recentDeaths = deaths.filter(death => {
      const deathYear = new Date(death.dateOfDeath).getFullYear();
      return deathYear >= 2024;
    });
    
    console.log(`Filtered to ${recentDeaths.length} recent deaths (2024+)`);
    
    const { deathsAdded, picksScored } = await processDeaths(supabaseClient, recentDeaths, logEntry.id);
    
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
        recentDeaths: recentDeaths.length,
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

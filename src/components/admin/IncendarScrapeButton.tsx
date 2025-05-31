import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CelebrityDeath {
  canonical_name: string;
  date_of_death: string;
  age_at_death?: number;
  cause_of_death_category: string;
  cause_of_death_details?: string;
}

async function scrapeIncendarDeathsTable(): Promise<CelebrityDeath[]> {
  try {
    console.log('Fetching from Incendar deaths table...');
    const response = await fetch('https://incendar.com/deathclock-recent-high-profile-media-famous-deaths-in-us-united-states.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('HTML fetched, length:', html.length);
    
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const deaths: CelebrityDeath[] = [];
    
    // Look for tables containing death data
    const tables = doc.querySelectorAll('table');
    console.log(`Found ${tables.length} tables on page`);
    
    for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
      const table = tables[tableIndex];
      const rows = table.querySelectorAll('tr');
      console.log(`Table ${tableIndex}: ${rows.length} rows`);
      
      // Skip if table has too few rows to be the deaths table
      if (rows.length < 5) continue;
      
      // Look for header row to identify the correct table
      let isDeathTable = false;
      let dateColumnIndex = -1;
      let nameColumnIndex = -1;
      let ageColumnIndex = -1;
      let causeColumnIndex = -1;
      
      // Check first few rows for headers
      for (let i = 0; i < Math.min(3, rows.length); i++) {
        const headerRow = rows[i];
        const cells = headerRow.querySelectorAll('th, td');
        
        for (let j = 0; j < cells.length; j++) {
          const cellText = cells[j].textContent?.toLowerCase().trim() || '';
          
          if (cellText.includes('date') || cellText.includes('when')) {
            dateColumnIndex = j;
            isDeathTable = true;
          }
          if (cellText.includes('name') || cellText.includes('who')) {
            nameColumnIndex = j;
            isDeathTable = true;
          }
          if (cellText.includes('age')) {
            ageColumnIndex = j;
            isDeathTable = true;
          }
          if (cellText.includes('cause') || cellText.includes('how')) {
            causeColumnIndex = j;
            isDeathTable = true;
          }
        }
        
        if (isDeathTable) break;
      }
      
      // If we can't identify columns, try to parse by position
      if (!isDeathTable) {
        // Look for rows that might contain death data
        for (let i = 1; i < Math.min(5, rows.length); i++) {
          const row = rows[i];
          const cells = row.querySelectorAll('td');
          
          if (cells.length >= 3) {
            const firstCellText = cells[0].textContent?.trim() || '';
            const secondCellText = cells[1].textContent?.trim() || '';
            
            // Check if first cell looks like a date (YYYY-MM-DD or MM/DD/YYYY format)
            if (firstCellText.match(/^\d{4}-\d{2}-\d{2}$/) || firstCellText.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              dateColumnIndex = 0;
              nameColumnIndex = 1;
              if (cells.length > 2) ageColumnIndex = 2;
              if (cells.length > 3) causeColumnIndex = 3;
              isDeathTable = true;
              break;
            }
            
            // Check if second cell looks like a date
            if (secondCellText.match(/^\d{4}-\d{2}-\d{2}$/) || secondCellText.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              nameColumnIndex = 0;
              dateColumnIndex = 1;
              if (cells.length > 2) ageColumnIndex = 2;
              if (cells.length > 3) causeColumnIndex = 3;
              isDeathTable = true;
              break;
            }
          }
        }
      }
      
      if (!isDeathTable) {
        console.log(`Table ${tableIndex}: Not identified as death table`);
        continue;
      }
      
      console.log(`Table ${tableIndex}: Death table found. Date col: ${dateColumnIndex}, Name col: ${nameColumnIndex}, Age col: ${ageColumnIndex}, Cause col: ${causeColumnIndex}`);
      
      // Parse data rows
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        
        if (cells.length < 2) continue;
        
        try {
          const death = parseTableRow(cells, dateColumnIndex, nameColumnIndex, ageColumnIndex, causeColumnIndex);
          if (death) {
            deaths.push(death);
            console.log('Successfully parsed death:', death);
          }
        } catch (error) {
          console.log(`Error parsing row ${i}:`, error.message);
          continue;
        }
      }
      
      // If we found deaths in this table, we're probably done
      if (deaths.length > 0) {
        console.log(`Found ${deaths.length} deaths in table ${tableIndex}`);
        break;
      }
    }
    
    console.log(`Total deaths parsed: ${deaths.length}`);
    return deaths;
  } catch (error) {
    console.error('Error scraping Incendar:', error);
    throw error;
  }
}

function parseTableRow(
  cells: any[], 
  dateColumnIndex: number, 
  nameColumnIndex: number, 
  ageColumnIndex: number, 
  causeColumnIndex: number
): CelebrityDeath | null {
  
  // Extract date
  let dateText = '';
  if (dateColumnIndex >= 0 && dateColumnIndex < cells.length) {
    dateText = cells[dateColumnIndex].textContent?.trim() || '';
  }
  
  // Extract name
  let nameText = '';
  if (nameColumnIndex >= 0 && nameColumnIndex < cells.length) {
    nameText = cells[nameColumnIndex].textContent?.trim() || '';
  }
  
  // Extract age
  let ageText = '';
  if (ageColumnIndex >= 0 && ageColumnIndex < cells.length) {
    ageText = cells[ageColumnIndex].textContent?.trim() || '';
  }
  
  // Extract cause
  let causeText = '';
  if (causeColumnIndex >= 0 && causeColumnIndex < cells.length) {
    causeText = cells[causeColumnIndex].textContent?.trim() || '';
  }
  
  console.log('Parsing row:', { dateText, nameText, ageText, causeText });
  
  // Validate and parse date
  let dateOfDeath = '';
  if (dateText.match(/^\d{4}-\d{2}-\d{2}$/)) {
    dateOfDeath = dateText;
  } else if (dateText.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    // Convert MM/DD/YYYY to YYYY-MM-DD
    const [month, day, year] = dateText.split('/');
    dateOfDeath = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } else {
    console.log('Invalid date format:', dateText);
    return null;
  }
  
  // Validate name
  if (!nameText || nameText.length < 2) {
    console.log('Invalid name:', nameText);
    return null;
  }
  
  // Clean up name
  const canonical_name = nameText.replace(/[^\w\s'-]/g, '').trim();
  
  // Parse age
  let age_at_death: number | undefined;
  if (ageText) {
    const ageMatch = ageText.match(/(\d+)/);
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      if (age > 0 && age <= 120) {
        age_at_death = age;
      }
    }
  }
  
  // Map cause to category
  let cause_of_death_category = 'Unknown';
  const causeLower = causeText.toLowerCase();
  
  if (causeLower.includes('cancer') || causeLower.includes('heart') || causeLower.includes('natural')) {
    cause_of_death_category = 'Natural';
  } else if (causeLower.includes('suicide')) {
    cause_of_death_category = 'Suicide';
  } else if (causeLower.includes('accident') || causeLower.includes('crash') || causeLower.includes('fall')) {
    cause_of_death_category = 'Accidental';
  } else if (causeLower.includes('murder') || causeLower.includes('shot') || causeLower.includes('killed') || causeLower.includes('homicide')) {
    cause_of_death_category = 'Violent';
  } else if (causeLower.includes('overdose') || causeLower.includes('drug')) {
    cause_of_death_category = 'RareOrUnusual';
  } else if (causeLower.includes('covid') || causeLower.includes('pandemic')) {
    cause_of_death_category = 'PandemicOrOutbreak';
  }
  
  return {
    canonical_name,
    date_of_death: dateOfDeath,
    age_at_death,
    cause_of_death_category,
    cause_of_death_details: causeText || undefined
  };
}

async function processDeaths(supabase: any, deaths: CelebrityDeath[], logId: string) {
  let deathsAdded = 0;
  let picksScored = 0;

  for (const death of deaths) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('deceased_celebrities')
      .select('id')
      .eq('canonical_name', death.canonical_name)
      .eq('date_of_death', death.date_of_death)
      .single();
    
    if (!existing) {
      const dateOfDeath = new Date(death.date_of_death);
      const gameYear = dateOfDeath.getFullYear();
      
      // Insert new death record with all other fields set to false/null as requested
      const { data: newDeath, error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: death.canonical_name,
          date_of_birth: null, // Will be pulled from different source
          date_of_death: death.date_of_death,
          age_at_death: death.age_at_death || null,
          cause_of_death_category: death.cause_of_death_category,
          cause_of_death_details: death.cause_of_death_details || null,
          game_year: gameYear,
          source_url: 'https://incendar.com/deathclock-recent-high-profile-media-famous-deaths-in-us-united-states.php',
          died_on_birthday: false,
          died_on_major_holiday: false,
          died_during_public_event: false,
          died_in_extreme_sport: false,
          is_first_death_of_year: false,
          is_last_death_of_year: false,
          is_approved: false // Requires admin approval
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting death:', error);
      } else {
        console.log(`Inserted death record for ${death.canonical_name}`);
        deathsAdded++;
        
        // Score matching picks
        const scored = await updateMatchingPicks(supabase, death.canonical_name, gameYear, newDeath);
        picksScored += scored;
      }
    } else {
      console.log(`Death already exists: ${death.canonical_name}`);
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
  const age = deceased.age_at_death || 75; // Default age if missing
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

    console.log('Starting Incendar death table scrape process...');
    
    // Scrape deaths from Incendar table
    const deaths = await scrapeIncendarDeathsTable();
    
    console.log(`Found ${deaths.length} deaths from Incendar table`);
    
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
        source: 'Incendar Table',
        message: 'Celebrity deaths scraped successfully from Incendar table' 
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
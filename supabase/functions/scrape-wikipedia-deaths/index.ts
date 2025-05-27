
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
  description: string;
  sourceUrl: string;
}

async function scrapeWikipediaDeaths(year: number, month: string): Promise<CelebrityDeath[]> {
  try {
    const url = `https://en.wikipedia.org/wiki/Deaths_in_${month}_${year}`;
    console.log(`Fetching Wikipedia deaths from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DeadpoolGameBot/1.0 (Celebrity Death Tracking)'
      }
    });
    
    if (!response.ok) {
      console.log(`HTTP error ${response.status} for ${url}`);
      return [];
    }
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    const deaths: CelebrityDeath[] = [];
    const contentDiv = doc.querySelector('div.mw-parser-output');
    
    if (!contentDiv) {
      console.log('Could not find main content div');
      return [];
    }
    
    // Find all list items in the content
    const listItems = contentDiv.querySelectorAll('li');
    console.log(`Found ${listItems.length} list items to process`);
    
    let currentDay = 1;
    
    for (let i = 0; i < listItems.length; i++) {
      const li = listItems[i];
      const text = li.textContent || '';
      
      // Check if this li is immediately after a day heading
      const prevElement = li.parentElement?.previousElementSibling;
      if (prevElement?.tagName === 'H3') {
        const dayMatch = prevElement.textContent?.match(/(\d{1,2})/);
        if (dayMatch) {
          currentDay = parseInt(dayMatch[1]);
        }
      }
      
      // Look for name links (first link is usually the person)
      const nameLink = li.querySelector('a[href^="/wiki/"]:not([href*="Deaths_in"])');
      if (!nameLink) continue;
      
      const name = nameLink.textContent?.trim();
      if (!name || name.length < 2) continue;
      
      console.log(`Processing: ${name} from day ${currentDay}`);
      
      // Try to extract age from the text
      const ageMatch = text.match(/,\s*(\d{1,3}),/);
      const age = ageMatch ? parseInt(ageMatch[1]) : undefined;
      
      // Extract description (everything after name and age)
      let description = text;
      if (ageMatch) {
        const afterAge = text.split(ageMatch[0])[1];
        description = afterAge ? afterAge.trim() : text;
      }
      
      // Basic cause of death extraction
      let cause = 'Unknown';
      const descLower = description.toLowerCase();
      
      if (descLower.includes('cancer')) cause = 'Natural';
      else if (descLower.includes('heart attack') || descLower.includes('cardiac')) cause = 'Natural';
      else if (descLower.includes('stroke')) cause = 'Natural';
      else if (descLower.includes('covid') || descLower.includes('pneumonia')) cause = 'Natural';
      else if (descLower.includes('accident') || descLower.includes('crash')) cause = 'Accidental';
      else if (descLower.includes('suicide')) cause = 'Suicide';
      else if (descLower.includes('murder') || descLower.includes('shot') || descLower.includes('killed')) cause = 'Violent';
      else if (descLower.includes('overdose') || descLower.includes('drug')) cause = 'RareOrUnusual';
      
      // Check if this person seems notable (has occupation keywords)
      const notableKeywords = [
        'actor', 'actress', 'musician', 'singer', 'politician', 'author', 'artist', 
        'athlete', 'director', 'producer', 'writer', 'composer', 'dancer', 'comedian',
        'journalist', 'broadcaster', 'chef', 'designer', 'model', 'activist'
      ];
      
      const isNotable = notableKeywords.some(keyword => descLower.includes(keyword));
      
      if (isNotable && age && age > 0 && age < 120) {
        const dateOfDeath = `${year}-${month === 'January' ? '01' : 
                                     month === 'February' ? '02' :
                                     month === 'March' ? '03' :
                                     month === 'April' ? '04' :
                                     month === 'May' ? '05' :
                                     month === 'June' ? '06' :
                                     month === 'July' ? '07' :
                                     month === 'August' ? '08' :
                                     month === 'September' ? '09' :
                                     month === 'October' ? '10' :
                                     month === 'November' ? '11' : '12'}-${currentDay.toString().padStart(2, '0')}`;
        
        deaths.push({
          name,
          dateOfDeath,
          age,
          cause,
          description: description.substring(0, 500), // Limit description length
          sourceUrl: url
        });
        
        console.log(`Added death: ${name}, ${age}, ${dateOfDeath}`);
      }
    }
    
    console.log(`Extracted ${deaths.length} notable deaths from Wikipedia`);
    return deaths;
    
  } catch (error) {
    console.error('Error scraping Wikipedia:', error);
    return [];
  }
}

async function processDeaths(supabase: any, deaths: CelebrityDeath[], logId: string) {
  let deathsAdded = 0;
  let picksScored = 0;

  for (const death of deaths) {
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
      let causeCategory = death.cause || 'Unknown';
      
      // Insert new death record
      const { data: newDeath, error } = await supabase
        .from('deceased_celebrities')
        .insert({
          canonical_name: death.name,
          date_of_death: death.dateOfDeath,
          age_at_death: death.age,
          cause_of_death_category: causeCategory,
          cause_of_death_details: death.description,
          game_year: gameYear,
          source_url: death.sourceUrl,
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
  const age = deceased.age_at_death || 75;
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

    console.log('Starting Wikipedia death scrape process...');
    
    // Get current year and recent months
    const currentYear = new Date().getFullYear();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    let allDeaths: CelebrityDeath[] = [];
    
    // Scrape current year and previous year
    for (const year of [currentYear - 1, currentYear]) {
      for (const month of months) {
        const deaths = await scrapeWikipediaDeaths(year, month);
        allDeaths = allDeaths.concat(deaths);
        
        // Small delay to be polite to Wikipedia
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Filter for recent deaths (2024+)
    const recentDeaths = allDeaths.filter(death => {
      const deathYear = new Date(death.dateOfDeath).getFullYear();
      return deathYear >= 2024;
    });
    
    console.log(`Found ${recentDeaths.length} recent deaths from Wikipedia`);
    
    // Update log with deaths found
    await supabaseClient
      .from('fetch_logs')
      .update({
        deaths_found: recentDeaths.length
      })
      .eq('id', logEntry.id);
    
    // Process and store deaths
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
        totalDeaths: recentDeaths.length,
        deathsAdded,
        picksScored,
        source: 'Wikipedia',
        message: 'Celebrity deaths scraped successfully from Wikipedia' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in scrape-wikipedia-deaths function:', error);
    
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

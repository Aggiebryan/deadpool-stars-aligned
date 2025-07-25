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

async function scrapeWikipediaDeaths(year: number, month: string, day?: number): Promise<CelebrityDeath[]> {
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
    
    let currentDay = 1;
    
    // Look for day headers (h3 elements with day numbers)
    const dayHeaders = contentDiv.querySelectorAll('h3');
    
    for (const header of dayHeaders) {
      const headerText = header.textContent?.trim() || '';
      const dayMatch = headerText.match(/^(\d{1,2})$/);
      
      if (dayMatch) {
        currentDay = parseInt(dayMatch[1]);
        
        // If we're looking for a specific day, skip others
        if (day && currentDay !== day) {
          continue;
        }
        
        // Get the next sibling elements until we hit another h3 or h2
        let nextElement = header.nextElementSibling;
        
        while (nextElement && !['H2', 'H3'].includes(nextElement.tagName)) {
          if (nextElement.tagName === 'UL') {
            const listItems = nextElement.querySelectorAll('li');
            
            for (const li of listItems) {
              const nameLink = li.querySelector('a[href^="/wiki/"]:not([href*="Deaths_in"])');
              if (!nameLink) continue;
              
              const name = nameLink.textContent?.trim();
              if (!name || name.length < 2) continue;
              
              const text = li.textContent || '';
              
              // Extract age - look for pattern like ", 75,"
              const ageMatch = text.match(/,\s*(\d{1,3}),/);
              const age = ageMatch ? parseInt(ageMatch[1]) : undefined;
              
              // Skip if no valid age or age is unrealistic
              if (!age || age < 10 || age > 120) continue;
              
              // Extract description
              let description = text;
              if (ageMatch) {
                const afterAge = text.split(ageMatch[0])[1];
                description = afterAge ? afterAge.trim() : text;
              }
              
              // Basic cause of death mapping
              let cause = 'Natural';
              const descLower = description.toLowerCase();
              
              if (descLower.includes('cancer') || descLower.includes('heart') || descLower.includes('stroke')) {
                cause = 'Natural';
              } else if (descLower.includes('accident') || descLower.includes('crash')) {
                cause = 'Accidental';
              } else if (descLower.includes('suicide')) {
                cause = 'Suicide';
              } else if (descLower.includes('murder') || descLower.includes('shot') || descLower.includes('killed')) {
                cause = 'Violent';
              } else if (descLower.includes('overdose') || descLower.includes('drug')) {
                cause = 'RareOrUnusual';
              }
              
              // Check if notable - look for occupation keywords
              const notableKeywords = [
                'actor', 'actress', 'musician', 'singer', 'politician', 'author', 'artist', 
                'athlete', 'director', 'producer', 'writer', 'composer', 'dancer', 'comedian',
                'journalist', 'broadcaster', 'chef', 'designer', 'model', 'activist', 'judge',
                'governor', 'senator', 'representative', 'mayor', 'scientist', 'professor'
              ];
              
              const isNotable = notableKeywords.some(keyword => descLower.includes(keyword));
              
              if (isNotable) {
                const monthNum = {
                  'January': '01', 'February': '02', 'March': '03', 'April': '04',
                  'May': '05', 'June': '06', 'July': '07', 'August': '08',
                  'September': '09', 'October': '10', 'November': '11', 'December': '12'
                }[month] || '01';
                
                const dateOfDeath = `${year}-${monthNum}-${currentDay.toString().padStart(2, '0')}`;
                
                deaths.push({
                  name,
                  dateOfDeath,
                  age,
                  cause,
                  description: description.substring(0, 500),
                  sourceUrl: url
                });
                
                console.log(`Added death: ${name}, ${age}, ${dateOfDeath}`);
              }
            }
          }
          nextElement = nextElement.nextElementSibling;
        }
      }
    }
    
    console.log(`Extracted ${deaths.length} notable deaths from ${month} ${year}${day ? ` day ${day}` : ''}`);
    return deaths;
    
  } catch (error) {
    console.error(`Error scraping ${month} ${year}:`, error);
    return [];
  }
}

async function processDeaths(supabase: any, deaths: CelebrityDeath[], logId: string) {
  let deathsAdded = 0;
  let picksScored = 0;

  for (const death of deaths) {
    try {
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
        
        // Insert new death record (not approved by default)
        const { data: newDeath, error } = await supabase
          .from('deceased_celebrities')
          .insert({
            canonical_name: death.name,
            date_of_death: death.dateOfDeath,
            age_at_death: death.age,
            cause_of_death_category: death.cause,
            cause_of_death_details: death.description,
            game_year: gameYear,
            source_url: death.sourceUrl,
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
          console.log(`Inserted death record for ${death.name} (pending approval)`);
          deathsAdded++;
        }
      }
    } catch (error) {
      console.error(`Error processing death ${death.name}:`, error);
    }
  }

  // Update log with progress
  await supabase
    .from('fetch_logs')
    .update({
      deaths_added: deathsAdded,
      picks_scored: picksScored
    })
    .eq('id', logId);

  return { deathsAdded, picksScored };
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

    // Parse request body for target date
    let targetDate = null;
    try {
      const body = await req.json();
      targetDate = body?.targetDate;
    } catch {
      // No body or invalid JSON, use default behavior
    }

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

    console.log(`Starting Wikipedia death scrape${targetDate ? ` for ${targetDate}` : ''}...`);
    
    let allDeaths: CelebrityDeath[] = [];
    
    if (targetDate) {
      // Scrape specific date
      const date = new Date(targetDate);
      const year = date.getFullYear();
      const month = date.toLocaleString('en-US', { month: 'long' });
      const day = date.getDate();
      
      console.log(`Scraping ${month} ${day}, ${year}...`);
      const deaths = await scrapeWikipediaDeaths(year, month, day);
      allDeaths = deaths;
    } else {
      // Default behavior - scrape current and previous month
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      const monthsToScrape = [];
      
      // Add current month
      monthsToScrape.push({ year: currentYear, month: monthNames[currentMonth] });
      
      // Add previous month (handling year boundary)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      monthsToScrape.push({ year: prevYear, month: monthNames[prevMonth] });
      
      console.log(`Scraping ${monthsToScrape.length} months`);
      
      for (const { year, month } of monthsToScrape) {
        console.log(`Scraping ${month} ${year}...`);
        const deaths = await scrapeWikipediaDeaths(year, month);
        allDeaths = allDeaths.concat(deaths);
        
        // Small delay to be polite
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Found ${allDeaths.length} total deaths from Wikipedia`);
    
    // Update log with deaths found
    await supabaseClient
      .from('fetch_logs')
      .update({
        deaths_found: allDeaths.length
      })
      .eq('id', logEntry.id);
    
    // Process and store deaths
    const { deathsAdded, picksScored } = await processDeaths(supabaseClient, allDeaths, logEntry.id);
    
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
        totalDeaths: allDeaths.length,
        deathsAdded,
        picksScored,
        source: 'Wikipedia',
        message: `Celebrity deaths scraped successfully${targetDate ? ` for ${targetDate}` : ` from recent months`}` 
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
        status: 500,
      },
    )
  }
})
